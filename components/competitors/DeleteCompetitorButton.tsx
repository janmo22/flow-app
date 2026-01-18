"use client";

import { Trash2, Loader2 } from "lucide-react";
import { deleteCompetitor } from "@/app/actions/competitors";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteCompetitorButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de querer eliminar este competidor?")) return;

        setIsDeleting(true);
        try {
            await deleteCompetitor(id);
            router.refresh();
        } catch (error) {
            console.error("Error deleting competitor:", error);
            alert("No se pudo eliminar el competidor.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="text-zinc-300 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-50"
            disabled={isDeleting}
            title="Eliminar"
        >
            {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </button>
    );
}
