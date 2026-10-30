"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { BUSY_LABELS, useBusy } from "@/lib/busy";

export function SubmitButton({
  children,
  pendingText,
  pending: pendingProp,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & { pendingText?: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  useBusy(pending, pendingText ?? BUSY_LABELS.save);
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {children}
    </Button>
  );
}
