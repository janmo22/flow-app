import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { SyncCompetitorButton } from "@/components/competitors/SyncCompetitorButton";
import { Users, LayoutGrid, Heart, MessageCircle, Play, Layers } from "lucide-react";

export default async function CompetitorDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    // Fetch Competitor
    const { data: competitor } = await supabase
        .from('competitors')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!competitor) notFound();

    // Fetch Posts
    const { data: posts } = await supabase
        .from('competitors_posts')
        .select('*')
        .eq('competitor_id', params.id)
        .order('published_at', { ascending: false });

    return (
        <div className="max-w-[1400px] mx-auto pt-10 pb-24 px-8">
            <PageHeader
                title={`Análisis: ${competitor.username}`}
                breadcrumb={[
                    { label: 'Zona Investigar', href: '#' },
                    { label: 'Competencia', href: '/competencia' },
                    { label: competitor.username }
                ]}
                action={<SyncCompetitorButton competitorId={competitor.id} />}
            />

            {/* Profile Header */}
            <div className="bg-white border border-zinc-200 rounded-xl p-8 mb-8 flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                    {competitor.profile_pic_url ? (
                        <img
                            src={competitor.profile_pic_url}
                            alt={competitor.username}
                            className="w-32 h-32 rounded-full border-4 border-zinc-50 shadow-lg"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-zinc-100 flex items-center justify-center text-4xl font-bold text-zinc-400">
                            {competitor.username[0].toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="flex-grow space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {competitor.full_name}
                            {competitor.is_verified && <span className="text-blue-500" title="Verificado">✓</span>}
                        </h1>
                        <a
                            href={`https://instagram.com/${competitor.username}`}
                            target="_blank"
                            className="text-zinc-500 hover:text-blue-600 hover:underline"
                        >
                            @{competitor.username}
                        </a>
                    </div>

                    <p className="text-zinc-700 whitespace-pre-wrap max-w-2xl">{competitor.biography}</p>

                    <div className="flex gap-6 pt-2">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Seguidores</span>
                            <span className="text-xl font-bold">{competitor.followers?.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Seguidos</span>
                            <span className="text-xl font-bold">{competitor.follows_count?.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Posts</span>
                            <span className="text-xl font-bold">{competitor.posts_count?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Últimas Publicaciones
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts?.map((post) => (
                    <a
                        href={`https://instagram.com/p/${post.short_code}`}
                        target="_blank"
                        key={post.id}
                        className="group relative aspect-[4/5] bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200"
                    >
                        {post.display_url ? (
                            <img
                                src={post.display_url}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300">No Image</div>
                        )}

                        {/* Type Icon */}
                        <div className="absolute top-2 right-2 text-white drop-shadow-md">
                            {post.type === 'Video' && <Play className="w-5 h-5 fill-white" />}
                            {post.type === 'Sidecar' && <Layers className="w-5 h-5 fill-white" />}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 p-4 text-center">
                            <div className="flex gap-4 font-bold">
                                <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" /> {post.likes_count}</span>
                                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" /> {post.comments_count}</span>
                            </div>
                            {post.views_count > 0 && <span className="text-xs opacity-80">{post.views_count.toLocaleString()} views</span>}
                            <p className="text-xs line-clamp-3 opacity-90 mt-2">{post.caption}</p>
                        </div>
                    </a>
                ))}
            </div>

            {(!posts || posts.length === 0) && (
                <div className="text-center py-20 text-zinc-400">
                    No hay publicaciones analizadas todavía. Pulsa el botón de sincronizar.
                </div>
            )}
        </div>
    )
}
