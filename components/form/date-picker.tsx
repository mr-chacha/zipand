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
  inputClassName?: string;
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

/** 숫자만 받아 YYYY. MM. DD. 형식으로 점 자동 삽입 (직접입력용) */
function formatDateDigitsTyping(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}. ${d.slice(4)}`;
  const body = `${d.slice(0, 4)}. ${d.slice(4, 6)}. ${d.slice(6)}`;
  return d.length === 8 ? `${body}.` : body;
}

/** 직접 입력 문자열을 YYYY-MM-DD / YYYY-MM-DDTHH:mm 으로 정규화. 실패 시 null */
function normalizeTyped(raw: string, withTime: boolean): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const dateMatch = trimmed.match(/^(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*[일.]?/);
  if (!dateMatch) {
    // YYYYMMDD
    const compact = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!compact) return null;
    return validateDateKey(`${compact[1]}-${compact[2]}-${compact[3]}`) ? `${compact[1]}-${compact[2]}-${compact[3]}` : null;
  }

  const y = Number(dateMatch[1]);
  const mo = Number(dateMatch[2]);
  const d = Number(dateMatch[3]);
  const key = toKey(y, mo, d);
  if (!validateDateKey(key)) return null;

  if (!withTime) return key;

  const rest = trimmed.slice(dateMatch[0].length).trim();
  if (!rest) return `${key}T09:00`;

  const ampm = rest.match(/(오전|오후)/);
  const hm = rest.match(/(\d{1,2})\s*[:시]\s*(\d{1,2})/);
  if (!hm) return `${key}T09:00`;
  let hour = Number(hm[1]);
  const minute = Number(hm[2]);
  if (ampm?.[1] === "오후" && hour < 12) hour += 12;
  if (ampm?.[1] === "오전" && hour === 12) hour = 0;
  if (!ampm && hour <= 23) {
    /* 24h */
  } else if (!ampm) {
    hour = hour % 12;
  }
  if (hour > 23 || minute > 59) return null;
  return `${key}T${pad(hour)}:${pad(minute)}`;
}

function validateDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d || m > 12 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** 확인·취소 버튼이 있는 날짜(·시간) 선택기. 입력칸 직접 입력 + 달력 버튼 */
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
  inputClassName,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [draft, setDraft] = useState(() => parse(current || todayKst()));
  const [view, setView] = useState(() => (current || todayKst()).slice(0, 7));
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minuteColRef = useRef<HTMLDivElement>(null);
  const display = focused ? text : current ? formatDisplay(current, withTime) : "";

  useEffect(() => {
    if (!open || !withTime) return;
    const frame = requestAnimationFrame(() => {
      for (const col of [hourColRef.current, minuteColRef.current]) {
        const cell = col?.querySelector<HTMLElement>("[data-selected=true]");
        if (col && cell) col.scrollTop = cell.offsetTop - col.offsetTop - (col.clientHeight - cell.offsetHeight) / 2;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [open, withTime]);

  const setValue = (next: string) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const openPicker = (next: boolean) => {
    if (next) {
      const base = current || (withTime ? `${todayKst()}T${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` : todayKst());
      setDraft(parse(base));
      setView(base.slice(0, 7));
    }
    setOpen(next);
  };

  const confirm = () => {
    if (!draft.date) return;
    const next = withTime ? `${draft.date}T${pad(draft.hour)}:${pad(draft.minute)}` : draft.date;
    setValue(next);
    setFocused(false);
    setOpen(false);
  };

  const commitText = () => {
    const normalized = normalizeTyped(text, withTime);
    if (normalized === null) {
      setFocused(false);
      return;
    }
    setValue(normalized);
    setFocused(false);
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
      <div className={cn("relative flex min-w-0 items-center gap-1", className)}>
        <input type="hidden" name={name} value={current} required={required} readOnly tabIndex={-1} />
        <input
          id={id}
          disabled={disabled}
          aria-label={ariaLabel ?? (withTime ? "날짜·시간" : "날짜")}
          placeholder={placeholder ?? (withTime ? "YYYY. MM. DD. 오전 9:00" : "YYYY. MM. DD.")}
          value={display}
          inputMode={withTime ? "text" : "numeric"}
          autoComplete="off"
          onFocus={() => {
            if (withTime) {
              setText(current ? current.replace("T", " ") : "");
            } else {
              setText(current ? formatDateDigitsTyping(current.replace(/-/g, "")) : "");
            }
            setFocused(true);
          }}
          onChange={(e) => {
            if (withTime) {
              setText(e.target.value);
              return;
            }
            // 날짜만: 한글·기호 무시, 숫자만 + 점 자동
            setText(formatDateDigitsTyping(e.target.value));
          }}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className={cn(
            "h-8 min-w-0 flex-1 rounded-md border-2 border-foreground/35 bg-background px-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/40 disabled:opacity-50 app:h-11 app:text-base",
            inputClassName,
          )}
        />
        <PopoverTrigger
          type="button"
          disabled={disabled}
          aria-label="달력에서 선택"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border-2 border-foreground/35 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/40 disabled:opacity-50 app:size-11"
        >
          <CalendarDays className="size-4 app:size-5" />
        </PopoverTrigger>
      </div>
      <PopoverContent
        align="start"
        positionerClassName="app:fixed! app:top-1/2! app:left-1/2! app:z-[60] app:[transform:translate(-50%,-50%)]!"
        className={cn("w-auto p-3 app:max-h-[calc(100dvh-2rem)] app:overflow-y-auto app:shadow-2xl app:ring-foreground/15", withTime && "max-w-[calc(100vw-1rem)]")}
      >
        <div className="flex gap-3 app:flex-col">
          <div className="w-64 app:w-[min(20rem,calc(100vw-4rem))]">
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
                    "flex h-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-muted app:h-10 app:text-base",
                    !c.inMonth && "text-muted-foreground/50",
                    c.key === today && "ring-1 ring-foreground/30 ring-inset",
                    c.key === draft.date && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                  )}
                >
                  {c.day}
                </button>
              ))}
            </div>
          </div>
          {withTime && (
            <div className="flex h-[17.5rem] gap-1 border-l pl-3 app:h-44 app:border-t app:border-l-0 app:pt-3 app:pl-0">
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
          <Button type="button" variant="outline" size="sm" className="app:flex-1" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button type="button" size="sm" className="app:flex-1" onClick={confirm} disabled={!draft.date}>
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
    <div ref={refEl} role="listbox" aria-label={label} className="flex w-12 flex-col gap-0.5 overflow-y-auto [scrollbar-width:none] app:flex-1">
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
        "flex h-8 shrink-0 items-center justify-center rounded-md text-sm transition-colors hover:bg-muted app:h-10 app:text-base",
        selected && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
      )}
    >
      {children}
    </button>
  );
}
