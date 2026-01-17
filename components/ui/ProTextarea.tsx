import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface ProTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const ProTextarea = forwardRef<HTMLTextAreaElement, ProTextareaProps>(
    ({ className, label, error, containerClassName, ...props }, ref) => {
        return (
            <div className={cn("space-y-2", containerClassName)}>
                {label && (
                    <label className="pro-label block">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={cn(
                        "w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-5 py-4 text-sm text-[var(--color-primary)] placeholder:text-[var(--color-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-4 focus:ring-blue-500/5 transition-all duration-200 resize-none shadow-sm min-h-[120px]",
                        error && "border-red-300 focus:border-red-500 focus:ring-red-500/5",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-[11px] font-bold text-red-500 ml-1">{error}</p>
                )}
            </div>
        );
    }
);

ProTextarea.displayName = "ProTextarea";
