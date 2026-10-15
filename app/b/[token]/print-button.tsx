"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="bg-white">
      <Printer data-icon="inline-start" />
      인쇄 · PDF 저장
    </Button>
  );
}
