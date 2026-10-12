"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { todayKst } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

interface DatePickerProps {
  /** 폼 제출 이름. 값은 네이티브 입력과 같은 형식(YYYY-MM-DD / YYYY-MM-DDTHH:mm) */
  name?: string;
  withTime?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function parse(value: string) {
  const [date = "", time = ""] = value.split("T");
  const [hh, mm] = time.split(":").map(Number);
  return { date, hour: Number.isFinite(hh) ? hh : 9, minute: Number.isFinite(mm) ? mm : 0 };
}

function formatDisplay(value: string, withTime: boolean) {
  const { date, hour, minute } = parse(value);
  const [y, m, d] = date.split("-");
  if (!y) return "";
  const day = `${y}. ${m}. ${d}.`;
  if (!withTime) return day;
  return `${day} ${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${pad(minute)}`;
}

/** 확인·취소 버튼이 있는 날짜(·시간) 선택기 */
export function DatePicker({
  name,
  withTime = false,
  value,
  defaultValue = "",
  onChange,
  id,
  required,
  disabled,
  defaultOpen,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [draft, setDraft] = useState(() => parse(current || todayKst()));
  const [view, setView] = useState(() => (current || todayKst()).slice(0, 7));
  const inputRef = useRef<HTMLInputElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minuteColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => setInner(defaultValue);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [defaultValue]);

  const openPicker = (next: boolean) => {
    if (next) {
      const base = current || (withTime ? `${todayKst()}T${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` : todayKst());
      setDraft(parse(base));
      setView(base.slice(0, 7));
    }
    setOpen(next);
  };

  useEffect(() => {
    if (!open || !withTime) return;
    const frame = requestAnimationFrame(() => {
      for (const col of [hourColRef.current, minuteColRef.current]) {
        col?.querySelector<HTMLElement>("[data-selected=true]")?.scrollIntoView({ block: "center" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [open, withTime]);

  const confirm = () => {
    if (!draft.date) return;
    const next = withTime ? `${draft.date}T${pad(draft.hour)}:${pad(draft.minute)}` : draft.date;
    if (value === undefined) setInner(next);
    onChange?.(next);
    setOpen(false);
  };

  const [vy, vm] = view.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(vy, vm - 1, 1)).getUTCDay();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(Date.UTC(vy, vm - 1, 1 - firstWeekday + i));
    return { key: toKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()), day: d.getUTCDate(), inMonth: d.getUTCMonth() === vm - 1 };
  });
  const moveMonth = (delta: number) => {
    const d = new Date(Date.UTC(vy, vm - 1 + delta, 1));
    setView(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
  };
  const today = todayKst();
  const pm = draft.hour >= 12;
  const setHour12 = (h: number) => setDraft((s) => ({ ...s, hour: (h % 12) + (s.hour >= 12 ? 12 : 0) }));
  const setPm = (next: boolean) => setDraft((s) => ({ ...s, hour: (s.hour % 12) + (next ? 12 : 0) }));

  return (
    <Popover open={open} onOpenChange={openPicker}>
      <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        name={name}
        value={current}
        required={required}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 size-px opacity-0"
      />
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        className="flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"
      >
        <span className={cn("flex-1 truncate", !current && "text-muted-foreground")}>
          {current ? formatDisplay(current, withTime) : (placeholder ?? (withTime ? "날짜·시간 선택" : "날짜 선택"))}
        </span>
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      </div>
      <PopoverContent align="start" className={cn("w-auto p-3", withTime && "max-w-[calc(100vw-1rem)]")}>
        <div className="flex gap-3">
          <div className="w-64">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">
                {vy}년 {vm}월
              </span>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="이전 달" onClick={() => moveMonth(-1)}>
                  <ChevronLeft />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="다음 달" onClick={() => moveMonth(1)}>
                  <ChevronRight />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
              {WEEKDAYS.map((w, i) => (
                <span key={w} className={cn("py-1", i === 0 && "text-destructive", i === 6 && "text-primary")}>
                  {w}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setDraft((s) => ({ ...s, date: c.key }));
                    if (!c.inMonth) setView(c.key.slice(0, 7));
                  }}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-muted",
                    !c.inMonth && "text-muted-foreground/50",
                    c.key === today && "ring-1 ring-foreground/30 ring-inset",
                    c.key === draft.date && "bg-primary font-semibold text-primary-foreground hover:bg-primary"
                  )}
                >
                  {c.day}
                </button>
              ))}
            </div>
          </div>
          {withTime && (
            <div className="flex h-[17.5rem] gap-1 border-l pl-3">
              <TimeColumn refEl={hourColRef} label="시">
                {HOURS.map((h) => (
                  <TimeCell key={h} selected={draft.hour % 12 === h % 12} onClick={() => setHour12(h)}>
                    {pad(h)}
                  </TimeCell>
                ))}
              </TimeColumn>
              <TimeColumn refEl={minuteColRef} label="분">
                {MINUTES.map((m) => (
                  <TimeCell key={m} selected={draft.minute === m} onClick={() => setDraft((s) => ({ ...s, minute: m }))}>
                    {pad(m)}
                  </TimeCell>
                ))}
              </TimeColumn>
              <TimeColumn label="오전/오후">
                <TimeCell selected={!pm} onClick={() => setPm(false)}>
                  오전
                </TimeCell>
                <TimeCell selected={pm} onClick={() => setPm(true)}>
                  오후
                </TimeCell>
              </TimeColumn>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button type="button" size="sm" onClick={confirm} disabled={!draft.date}>
            확인
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  refEl,
  label,
  children,
}: {
  refEl?: React.Ref<HTMLDivElement>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div ref={refEl} role="listbox" aria-label={label} className="flex w-12 flex-col gap-0.5 overflow-y-auto [scrollbar-width:none]">
      {children}
    </div>
  );
}

function TimeCell({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      data-selected={selected}
      onClick={onClick}
      className={cn(
        "flex h-8 shrink-0 items-center justify-center rounded-md text-sm transition-colors hover:bg-muted",
        selected && "bg-primary font-semibold text-primary-foreground hover:bg-primary"
      )}
    >
      {children}
    </button>
  );
}
