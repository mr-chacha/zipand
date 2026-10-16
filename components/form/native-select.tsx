import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NativeSelectProps extends React.ComponentProps<"select"> {
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  selectClassName?: string;
}

/** 폼 제출(FormData)에 바로 쓰는 네이티브 select */
export function NativeSelect({
  options,
  placeholder,
  className,
  selectClassName,
  ...props
}: NativeSelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "h-8 w-full appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 app:h-11 app:border-foreground/30 app:pl-3 app:text-base app:focus-visible:border-ring dark:bg-input/30",
          selectClassName,
        )}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const { value, label } = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
