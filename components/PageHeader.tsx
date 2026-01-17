"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    breadcrumb: { label: string; href?: string }[];
    action?: ReactNode;
}

export function PageHeader({ title, breadcrumb, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-5 mb-10 animate-enter">
            {/* Breadcrumb Row */}
            <div className="flex items-center gap-2 text-[15px] font-medium text-[#71717A]">
                {breadcrumb.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        {i > 0 && <span className="text-[#A1A1AA] select-none">/</span>}
                        {item.href ? (
                            <Link href={item.href} className="hover:text-black transition-colors">
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-black">{item.label}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Title Row */}
            <div className="flex items-end justify-between">
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
                    {title}
                </h1>
                {action && (
                    <div className="pb-1">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}
