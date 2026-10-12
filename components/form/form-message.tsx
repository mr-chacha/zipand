import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ActionState } from "@/types";

export function FormMessage({ state }: { state: ActionState | null | undefined }) {
  if (!state?.error && !state?.message) return null;
  if (state.error) {
    return (
      <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        {state.error}
      </p>
    );
  }
  return (
    <p className="flex items-start gap-1.5 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      {state.message}
    </p>
  );
}
