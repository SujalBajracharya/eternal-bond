import { Check, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  required?: boolean;
  hint?: string;
}

interface Props {
  items: ChecklistItem[];
  className?: string;
}

const ProfileChecklist = ({ items, className }: Props) => {
  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const missingRequired = items.filter((i) => i.required && !i.done).length;

  return (
    <aside
      className={cn(
        "rounded-3xl bg-card/85 backdrop-blur-xl border border-border/60 shadow-soft p-6",
        className,
      )}
    >
      <header className="mb-5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-serif text-xl tracking-tight">Profile completion</h3>
          <span className="font-serif text-2xl text-primary">{pct}%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {completed} of {total} complete
          {missingRequired > 0 && ` · ${missingRequired} required`}
        </p>
        {/* gradient bar */}
        <div className="mt-3 h-2 rounded-full bg-secondary/60 overflow-hidden">
          <div
            className="h-full bg-gradient-sunset transition-all duration-500 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item.key}
            className={cn(
              "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
              item.done
                ? "bg-primary/5"
                : item.required
                  ? "bg-destructive/5 hover:bg-destructive/10"
                  : "hover:bg-secondary/40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid place-items-center w-5 h-5 rounded-full shrink-0 transition-all",
                item.done
                  ? "bg-gradient-sunset text-primary-foreground shadow-soft"
                  : item.required
                    ? "border border-destructive/40 text-destructive"
                    : "border border-border text-muted-foreground",
              )}
            >
              {item.done ? (
                <Check className="w-3 h-3" strokeWidth={3} />
              ) : item.required ? (
                <AlertCircle className="w-3 h-3" />
              ) : (
                <Circle className="w-2 h-2 fill-current" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm leading-tight",
                  item.done
                    ? "text-foreground/60 line-through decoration-primary/40"
                    : "text-foreground font-medium",
                )}
              >
                {item.label}
                {item.required && !item.done && (
                  <span className="ml-1.5 text-[10px] uppercase tracking-wider text-destructive font-semibold">
                    required
                  </span>
                )}
              </p>
              {item.hint && !item.done && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default ProfileChecklist;
