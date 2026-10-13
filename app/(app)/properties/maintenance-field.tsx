"use client";

import { useState } from "react";
import { NativeSelect } from "@/components/form/native-select";
import { MoneyInput } from "@/components/form/number-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAINTENANCE_ITEMS, MAINTENANCE_STATUSES } from "@/lib/constants";

const PRESETS: readonly string[] = MAINTENANCE_ITEMS;

/** 관리비 유무 + 포함 항목(복수 선택, 직접 입력) */
export function MaintenanceField({
  status: initialStatus,
  fee,
  items: initialItems = [],
}: {
  status?: string | null;
  fee?: number | null;
  items?: string[];
}) {
  const [status, setStatus] = useState(initialStatus ?? "");
  const [checked, setChecked] = useState(() => initialItems.filter((i) => PRESETS.includes(i)));
  const initialCustom = initialItems.filter((i) => !PRESETS.includes(i)).join(", ");
  const [customOn, setCustomOn] = useState(initialCustom !== "");
  const [custom, setCustom] = useState(initialCustom);

  const toggle = (item: string, on: boolean) =>
    setChecked((c) => (on ? PRESETS.filter((p) => p === item || c.includes(p)) : c.filter((x) => x !== item)));

  return (
    <div className="space-y-3 sm:col-span-2">
      {/* space-y는 마지막이 아닌 자식에 아래 여백을 주므로 hidden input은 맨 앞에 둔다 */}
      {status === "있음" &&
        checked.map((item) => <input key={item} type="hidden" name="maintenance_items" value={item} />)}
      {status === "있음" && customOn && <input type="hidden" name="maintenance_custom" value={custom} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maintenance_status">관리비</Label>
          <NativeSelect
            id="maintenance_status"
            name="maintenance_status"
            options={MAINTENANCE_STATUSES}
            placeholder="선택 안 함"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
        {status === "있음" && (
          <div className="space-y-2">
            <Label htmlFor="maintenance_fee">관리비 금액 (만원)</Label>
            <MoneyInput id="maintenance_fee" name="maintenance_fee" defaultValue={fee} placeholder="예) 25" />
          </div>
        )}
      </div>

      {status === "있음" && (
        <div className="space-y-2 rounded-lg bg-muted/40 p-3">
          <p className="text-sm font-medium">포함 항목</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2.5">
            {PRESETS.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <Checkbox checked={checked.includes(item)} onCheckedChange={(on) => toggle(item, on)} />
                {item}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={customOn} onCheckedChange={setCustomOn} />
              직접 입력
            </label>
          </div>
          {customOn && (
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="예) 엘리베이터, 경비 (쉼표로 구분)"
              aria-label="관리비 포함 항목 직접 입력"
              autoFocus={!initialCustom}
            />
          )}
        </div>
      )}
    </div>
  );
}
