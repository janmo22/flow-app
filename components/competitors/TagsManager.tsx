"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { updateCompetitorTags } from "@/app/actions/competitor-tags";
import { useRouter } from "next/navigation";

interface TagsManagerProps {
    competitorId: string;
    initialTags: string[] | null;
}

export function TagsManager({ competitorId, initialTags }: TagsManagerProps) {
    const [tags, setTags] = useState<string[]>(initialTags || []);
    const [isAdding, setIsAdding] = useState(false);
    const [newTag, setNewTag] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    const handleAddTag = async () => {
        if (!newTag.trim()) {
            setIsAdding(false);
            return;
        }

        const updatedTags = [...tags, newTag.trim()];
        setTags(updatedTags);
        setNewTag("");
        setIsAdding(false);

        await updateCompetitorTags(competitorId, updatedTags);
        router.refresh();
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        const updatedTags = tags.filter(t => t !== tagToRemove);
        setTags(updatedTags);
        await updateCompetitorTags(competitorId, updatedTags);
        router.refresh();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddTag();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-100 group">
                    {tag}
                    <button
                        onClick={() => handleRemoveTag(tag)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-blue-100 rounded-full transition-all"
                    >
                        <X className="w-2.5 h-2.5" />
                    </button>
                </span>
            ))}

            {isAdding ? (
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-24 px-2 py-0.5 text-xs bg-white border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="Tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onBlur={handleAddTag}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-1 text-zinc-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"
                    title="Añadir etiqueta"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
