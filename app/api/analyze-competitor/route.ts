import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("🔍 API /analyze-competitor called with:", body);
        const { competitorId, url, action } = body;

        if (!competitorId || !url) {
            console.error("❌ Missing params:", { competitorId, url });
            return NextResponse.json({ error: 'Missing competitorId or url' }, { status: 400 });
        }

        const client = new ApifyClient({
            token: process.env.APIFY_API_TOKEN,
        });

        // Clean Username
        // Handles: https://www.instagram.com/username/ -> username
        const username = url.split('instagram.com/')[1]?.replace(/\/$/, '').split('?')[0];

        if (!username) {
            return NextResponse.json({ error: 'Invalid Instagram URL' }, { status: 400 });
        }

        // ---------------------------------------------------------
        // ACTION: PROFILE (Run on creation/update)
        // Agent: dSCLg0C3YEZ83HzYX (Instagram Profile Scraper)
        // ---------------------------------------------------------
        if (action === 'profile') {
            console.log("🚀 STARTING PROFILE SCRAPE (dSCLg0C3YEZ83HzYX) for:", username);

            const run = await client.actor("dSCLg0C3YEZ83HzYX").call({
                "usernames": [username]
            });
            console.log("✅ Profile Actor Run Finished. Dataset ID:", run.defaultDatasetId);

            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            console.log(`📦 Retrieved ${items.length} profile items.`);
            const profileData = items[0] || {};

            if (!profileData || (!profileData.username && !profileData.ownerUsername)) {
                console.error("❌ No valid profile data found in Apify response");
                throw new Error("No profile data found from Apify.");
            }

            // CRITICAL: We store EVERYTHING returned by Apify.
            // + We add normalized fields for our UI to use easily.
            const structuredProfile = {
                ...profileData, // <--- SAVES ALL RAW DATA (hd_profile_pic_url_info, biography_with_entities, etc.)

                // Normalized keys for Frontend Consistency
                username: profileData.username || profileData.ownerUsername || username,
                fullName: profileData.fullName || profileData.ownerFullName,
                biography: profileData.biography || profileData.biography,
                followersCount: profileData.followersCount || profileData.followers || 0,
                followsCount: profileData.followsCount || profileData.follows || 0,
                profilePicUrl: profileData.profilePicUrlHD || profileData.profilePicUrl || profileData.profile_pic_url,
                isVerified: profileData.isVerified || profileData.verified || false,
                externalUrl: profileData.externalUrl || profileData.external_url,
                private: profileData.isPrivate || profileData.is_private || false,

                scraped_at: new Date().toISOString()
            };

            const supabase = await createClient();

            const { data: currentData } = await supabase
                .from('competitors')
                .select('analysis_data')
                .eq('id', competitorId)
                .single();

            const existingPosts = currentData?.analysis_data?.posts || [];

            const updatePayload = {
                followers: structuredProfile.followersCount, // Update root column for sorting
                analysis_data: {
                    profile: structuredProfile,
                    posts: existingPosts
                },
                last_scraped_at: new Date().toISOString()
            };

            const { error: dbError } = await supabase
                .from('competitors')
                .update(updatePayload)
                .eq('id', competitorId);

            if (dbError) throw dbError;

            console.log("✅ Profile DB Update Success!");
            return NextResponse.json({ success: true, type: 'profile', data: structuredProfile });
        }

        // ---------------------------------------------------------
        // ACTION: CONTENT (Run on "Analyze" button)
        // Agent: nH2AHrwxeTRJoN5hX (Instagram Post Scraper)
        // ---------------------------------------------------------
        if (action === 'content') {
            console.log("🚀 STARTING CONTENT SCRAPE (nH2AHrwxeTRJoN5hX) for:", url);

            const run = await client.actor("nH2AHrwxeTRJoN5hX").call({
                "usernames": [username],
                "resultsType": "posts",
                "resultsLimit": 20, // Requesting 20 items to ensure we get enough reels/posts
            });
            console.log("✅ Content Actor Run Finished. Dataset ID:", run.defaultDatasetId);

            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            console.log(`📦 Retrieved ${items.length} content items.`);

            // Map Content Items
            const posts = items.map((item: any) => ({
                ...item, // <--- SAVES ALL RAW DATA (music info, tagged users, dimensions, etc.)

                // Normalized keys for Frontend Consistency
                id: item.id,
                type: item.type, // 'Image', 'Video', 'Reel', 'Sidecar'
                shortCode: item.shortCode,
                caption: item.caption,
                url: item.url || item.postUrl || `https://instagram.com/p/${item.shortCode}/`,
                displayUrl: item.displayUrl || item.imageUrl || item.thumbnailUrl,

                // Video Specifics
                videoUrl: item.videoUrl,
                videoViewCount: item.videoViewCount || item.videoViews || item.viewCount || 0,
                videoPlayCount: item.videoPlayCount || item.playCount || 0,

                // Engagement
                likesCount: item.likesCount || item.likes || 0,
                commentsCount: item.commentsCount || item.comments || 0,

                timestamp: item.timestamp,
            })).slice(0, 20);

            const supabase = await createClient();

            const { data: currentData } = await supabase
                .from('competitors')
                .select('analysis_data')
                .eq('id', competitorId)
                .single();

            const existingProfile = currentData?.analysis_data?.profile || {};

            const updatePayload = {
                analysis_data: {
                    profile: existingProfile,
                    posts: posts,
                    last_content_scrape: new Date().toISOString() // Track specifically when content was last pulled
                },
                last_scraped_at: new Date().toISOString()
            };

            const { error: dbError } = await supabase
                .from('competitors')
                .update(updatePayload)
                .eq('id', competitorId);

            if (dbError) throw dbError;

            console.log("✅ Content DB Update Success!");
            return NextResponse.json({ success: true, type: 'content', count: posts.length, data: posts });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('❌ Apify Integration Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
