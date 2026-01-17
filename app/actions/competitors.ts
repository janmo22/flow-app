'use server'

import { createClient } from '@/lib/supabase-server'
import { ApifyClient } from 'apify-client'
import { revalidatePath } from 'next/cache'

// Apify Actors
const POST_SCRAPER_ACTOR_ID = 'nH2AHrwxeTRJoN5hX'
const PROFILE_SCRAPER_ACTOR_ID = 'dSCLg0C3YEZ83HzYX'

export async function addCompetitor(usernameOrUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Extract username from URL or plain text
    let username = usernameOrUrl.trim()
    try {
        if (username.includes('instagram.com/')) {
            const urlObj = new URL(username)
            const pathParts = urlObj.pathname.split('/').filter(p => p)
            username = pathParts[0]
        }
    } catch (e) {
        // Not a URL, assume it's a username
    }
    username = username.replace('@', '')

    // Check if limits reached or exists (basic check)
    // TODO: Add limit checks

    // Insert into DB
    const { data: competitor, error: insertError } = await supabase
        .from('competitors')
        .insert({
            user_id: user.id,
            name: username, // default to username until we get full name
            username: username,
            url: `https://www.instagram.com/${username}/`,
            status: 'pending_scrape'
        })
        .select()
        .single()

    if (insertError) {
        return { error: insertError.message }
    }

    // Trigger Apify Scrape (Async)
    // We don't await the result here to keep UI responsive, 
    // but in a real prod env we would use webhooks.
    // Here we'll fire and forget, relying on client-side polling or manual refresh later.
    // OR we can make it wait if we want instant gratification (runs can take 10-30s).
    // Let's try to wait for PROFILE first to populate the card quickly.

    try {
        const apifyClient = new ApifyClient({
            token: process.env.APIFY_API_TOKEN,
        })

        // Start Profile Scrape (Parallel but we await it for better UX if possible, else fire-forget)
        // Profile scraping is usually fast.
        const profileRun = await apifyClient.actor(PROFILE_SCRAPER_ACTOR_ID).start({
            usernames: [username]
        })

        // Start Post Scrape (Fire and forget largely, or concurrent)
        const postRun = await apifyClient.actor(POST_SCRAPER_ACTOR_ID).start({
            username: [username],
            resultsLimit: 12
        })

        // Note: In a robust system, we would save profileRun.id and postRun.id to the database 
        // to track status. For now we will rely on a separate "sync" action or webhooks.

        revalidatePath('/competitors')
        return { success: true, competitorId: competitor.id }

    } catch (err) {
        console.error('Apify Trigger Error:', err)
        // Return success=true because we added the competitor to DB, but maybe warn about scraping
        return { success: true, warning: 'Competitor added but scraping failed to start.', competitorId: competitor.id }
    }
}

export async function syncCompetitorData(competitorId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // fetching the competitor to get the username to look up runs (or we ideally stored run IDs)
    // For now we will list runs for this actor and username to find the latest one.
    const { data: competitor } = await supabase.from('competitors').select('username').eq('id', competitorId).single()

    if (!competitor?.username) return { error: 'Competitor not found' }

    try {
        const apifyClient = new ApifyClient({
            token: process.env.APIFY_API_TOKEN,
        })

        // 1. Sync Profile Data
        // Find latest successful run for this username on Profile Scraper
        const profileRuns = await apifyClient.actor(PROFILE_SCRAPER_ACTOR_ID).runs().list({
            desc: true,
            status: 'SUCCEEDED',
            limit: 1
        })

        if (profileRuns.items.length > 0) {
            const lastRun = profileRuns.items[0]
            const dataset = await apifyClient.dataset(lastRun.defaultDatasetId).listItems()
            // The dataset might contain multiple items if input had multiple usernames, find ours
            const profileData = dataset.items.find((item: any) => item.username === competitor.username)

            if (profileData) {
                await supabase.from('competitors').update({
                    full_name: profileData.fullName,
                    biography: profileData.biography,
                    profile_pic_url: profileData.profilePicUrlHD || profileData.profilePicUrl,
                    external_url: profileData.externalUrl,
                    is_verified: profileData.verified,
                    is_business_account: profileData.isBusinessAccount,
                    followers: profileData.followersCount,
                    follows_count: profileData.followsCount,
                    posts_count: profileData.postsCount,
                    last_scraped_at: new Date().toISOString(),
                    status: 'active',
                    raw_data: profileData // Save everything!
                }).eq('id', competitorId)
            }
        }

        // 2. Sync Posts Data
        const postRuns = await apifyClient.actor(POST_SCRAPER_ACTOR_ID).runs().list({
            desc: true,
            status: 'SUCCEEDED',
            limit: 1
        })

        if (postRuns.items.length > 0) {
            const lastPostRun = postRuns.items[0]
            const postDataset = await apifyClient.dataset(lastPostRun.defaultDatasetId).listItems()
            // Filter posts for this username just in case
            const posts = postDataset.items.filter((item: any) => item.ownerUsername === competitor.username)

            for (const post of posts) {
                // Upsert post
                const { error: postError } = await supabase.from('competitors_posts').upsert({
                    competitor_id: competitorId,
                    remote_id: post.id || post.shortCode, // ID fallback
                    short_code: post.shortCode,
                    type: post.type, // 'Image', 'Video', 'Sidecar'
                    caption: post.caption,
                    url: post.url,
                    display_url: post.displayUrl,
                    video_url: post.videoUrl, // Only for Videos/Reels
                    likes_count: post.likesCount,
                    comments_count: post.commentsCount,
                    views_count: post.videoViewCount || 0,
                    published_at: post.timestamp,
                    child_posts: post.childPosts || [], // Crucial for Sidecars
                    raw_data: post
                }, { onConflict: 'competitor_id, remote_id' }) // Make sure we have a unique constraint or composite key if we want to update

                if (postError) console.error('Error saving post:', postError)
            }

            // Update last_content_scrape
            await supabase.from('competitors').update({
                last_content_scrape: new Date().toISOString()
            }).eq('id', competitorId)
        }

        revalidatePath('/competencia')
        revalidatePath(`/competencia/${competitorId}`)
        return { success: true }

    } catch (e: any) {
        console.error('Sync Error:', e)
        return { error: e.message }
    }
}
