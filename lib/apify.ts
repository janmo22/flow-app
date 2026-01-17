export interface ApifyCompetitorData {
    username: string;
    fullName: string;
    followers: number;
    biography: string;
    postsCount: number;
    profilePicUrl: string;
    topPosts: {
        id: string;
        url: string;
        type: 'Image' | 'Video' | 'Sidecar';
        likesCount: number;
        commentsCount: number;
        caption: string;
        timestamp: string;
        thumbnailUrl: string;
    }[];
}

// Mock Apify Client
export const apifyClient = {
    scraper: {
        async scrapeInstagramProfile(url: string): Promise<ApifyCompetitorData> {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 2500));

            // Return mock data
            return {
                username: "mock_competitor",
                fullName: "Competitor Name",
                followers: 125000,
                biography: "Helping entrepreneurs scale their business 🚀 | CEO @ Company",
                postsCount: 450,
                profilePicUrl: "https://ui-avatars.com/api/?name=C+N&background=random",
                topPosts: [
                    {
                        id: "1",
                        url: "https://instagram.com/p/123",
                        type: "Video",
                        likesCount: 15400,
                        commentsCount: 342,
                        caption: "3 Tips to duplicate your productivity...",
                        timestamp: new Date().toISOString(),
                        thumbnailUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    },
                    {
                        id: "2",
                        url: "https://instagram.com/p/456",
                        type: "Video",
                        likesCount: 12100,
                        commentsCount: 150,
                        caption: "How I started my journey...",
                        timestamp: new Date().toISOString(),
                        thumbnailUrl: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    },
                    {
                        id: "3",
                        url: "https://instagram.com/p/789",
                        type: "Image",
                        likesCount: 8900,
                        commentsCount: 80,
                        caption: "Motivation Monday 💡",
                        timestamp: new Date().toISOString(),
                        thumbnailUrl: "https://images.unsplash.com/photo-1516251193000-18e6e0075d09?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    },
                    {
                        id: "4",
                        url: "https://instagram.com/p/101",
                        type: "Video",
                        likesCount: 25000,
                        commentsCount: 800,
                        caption: "The secret to marketing in 2024...",
                        timestamp: new Date().toISOString(),
                        thumbnailUrl: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    }
                ]
            };
        }
    }
};
