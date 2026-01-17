import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionProps {
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function Section({ children, className, noPadding = false }: SectionProps) {
    return (
        <div className={cn("pro-card bg-white overflow-hidden", className)}>
            <div className={cn(noPadding ? "p-0" : "p-6 md:p-8")}>
                {children}
            </div>
        </div>
    );
}
