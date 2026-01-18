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

    // Extract username/name
    let username = usernameOrUrl.trim()
    let url = usernameOrUrl.trim()

    // Simple URL check
    if (!username.startsWith('http')) {
        url = `https://instagram.com/${username}`
    } else {
        try {
            const urlObj = new URL(username)
            const pathParts = urlObj.pathname.split('/').filter(p => p)
            if (pathParts.length > 0) {
                username = pathParts[0]
            }
        } catch (e) {
            // keep as is
        }
    }
    username = username.replace('@', '').replace('https://', '').replace('www.', '').replace('instagram.com/', '').split('/')[0]

    // Insert into DB (Simple Manual Entry)
    const { data: competitor, error: insertError } = await supabase
        .from('competitors')
        .insert({
            user_id: user.id,
            name: username,
            username: username,
            url: url,
            status: 'manual', // No 'pending_scrape'
            // Default empty stats to avoid null issues if displayed
            followers: 0,
            posts_count: 0,
            profile_pic_url: null
        })
        .select()
        .single()

    if (insertError) {
        return { error: insertError.message }
    }

    revalidatePath('/competencia')
    return { success: true, competitorId: competitor.id }
}

export async function deleteCompetitor(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('competitors')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/competencia')
    return { success: true }
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
