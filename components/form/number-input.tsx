"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatDecimalInput, formatNumberInput, manwonToHangul, m2ToPyeongText } from "@/lib/money";

type NumberInputProps = Omit<React.ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange"> & {
  defaultValue?: number | string | null;
};

/** 입력값을 정리(format)하고 입력 끝에 보조 표기(hint)를 보여주는 숫자 입력 */
function HintNumberInput({
  defaultValue,
  disabled,
  format,
  hint,
  inputMode,
  ...props
}: NumberInputProps & { format: (v: string) => string; hint: (v: string) => string }) {
  const initial = format(String(defaultValue ?? ""));
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  const hintText = disabled ? "" : hint(value);

  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onReset = () => setValue(initial);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [initial]);

  return (
    <div className="relative">
      <Input
        ref={ref}
        inputMode={inputMode}
        autoComplete="off"
        value={disabled ? "" : value}
        onChange={(e) => setValue(format(e.target.value))}
        disabled={disabled}
        style={hintText ? { paddingRight: `calc(${hintText.length * 0.7}rem + 1.25rem)` } : undefined}
        {...props}
      />
      {hintText && (
        <span
          aria-live="polite"
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground tabular-nums"
        >
          {hintText}
        </span>
      )}
    </div>
  );
}

/** 만원 단위 금액. 천 단위 쉼표 + 한글 금액(10,000 → 일억원) */
export function MoneyInput(props: NumberInputProps) {
  return (
    <HintNumberInput
      inputMode="numeric"
      format={formatNumberInput}
      hint={(v) => manwonToHangul(Number(v.replace(/,/g, "")))}
      {...props}
    />
  );
}

/** ㎡ 면적. 입력 끝에 평수(소수 둘째 자리) */
export function AreaInput(props: NumberInputProps) {
  return <HintNumberInput inputMode="decimal" format={formatDecimalInput} hint={m2ToPyeongText} {...props} />;
}
