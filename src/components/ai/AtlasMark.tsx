import { Boxes } from "lucide-react";

export function AtlasMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex size-9 items-center justify-center rounded-md bg-ai text-ai-foreground ${className}`}>
      <Boxes className="size-5" strokeWidth={1.8} />
    </span>
  );
}