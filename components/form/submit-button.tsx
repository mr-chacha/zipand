"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingText,
  pending: pendingProp,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & { pendingText?: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && <Loader2 data-icon="inline-start" className="animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
