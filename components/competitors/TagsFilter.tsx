"use client";

import { Filter, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TagsFilterProps {
    availableTags: string[];
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
}

export function TagsFilter({ availableTags, selectedTags, onTagsChange }: TagsFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            onTagsChange(selectedTags.filter(t => t !== tag));
        } else {
            onTagsChange([...selectedTags, tag]);
        }
    };

    return (
        <div className="relative" ref={filterRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all",
                    selectedTags.length > 0
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
            >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar por etiquetas</span>
                {selectedTags.length > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 ml-1 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                        {selectedTags.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 space-y-0.5">
                        {availableTags.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-zinc-400 text-center">
                                No hay etiquetas disponibles
                            </div>
                        ) : (
                            availableTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                                        selectedTags.includes(tag)
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                                    )}
                                >
                                    <span>{tag}</span>
                                    {selectedTags.includes(tag) && (
                                        <Check className="w-3.5 h-3.5 text-blue-600" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                    {selectedTags.length > 0 && (
                        <div className="border-t border-zinc-100 p-2">
                            <button
                                onClick={() => {
                                    onTagsChange([]);
                                    setIsOpen(false);
                                }}
                                className="w-full px-3 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-600 uppercase tracking-wider transition-colors text-center"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
