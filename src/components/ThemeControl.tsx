import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useThemeMode, type ThemeMode } from "@/lib/theme";

const modes: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Laptop },
];

export function ThemeControl() {
  const { mode, setMode } = useThemeMode();
  return (
    <div className="flex items-center rounded-md border border-nt-line bg-nt-surface p-0.5" aria-label="Theme">
      {modes.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          type="button"
          variant="ghost"
          size="icon-sm"
          title={`${label} theme`}
          aria-label={`${label} theme`}
          aria-pressed={mode === id}
          onClick={() => setMode(id)}
          className={cn("text-nt-muted", mode === id && "bg-nt-active text-nt-text")}
        >
          <Icon className="size-3.5" />
        </Button>
      ))}
    </div>
  );
}