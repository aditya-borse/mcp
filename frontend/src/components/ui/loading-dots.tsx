import { cn } from "@/lib/utils"

interface LoadingDotsProps {
    className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            <div
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: '0ms', animationDuration: '1000ms' }}
            />
            <div
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: '200ms', animationDuration: '1000ms' }}
            />
            <div
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: '400ms', animationDuration: '1000ms' }}
            />
        </div>
    )
} 