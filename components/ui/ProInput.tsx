import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";
import { LucideIcon } from "lucide-react";

interface ProInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
    containerClassName?: string;
}

export const ProInput = forwardRef<HTMLInputElement, ProInputProps>(
    ({ className, label, icon: Icon, error, containerClassName, ...props }, ref) => {
        return (
            <div className={cn("space-y-2", containerClassName)}>
                {label && (
                    <label className="pro-label block">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {Icon && (
                        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-tertiary)] group-focus-within:text-[var(--color-brand)] transition-colors duration-200" />
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-primary)] placeholder:text-[var(--color-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-4 focus:ring-blue-500/5 transition-all duration-200 shadow-sm",
                            Icon && "pl-11",
                            error && "border-red-300 focus:border-red-500 focus:ring-red-500/5",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-[11px] font-bold text-red-500 ml-1">{error}</p>
                )}
            </div>
        );
    }
);

ProInput.displayName = "ProInput";
