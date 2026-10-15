"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, ExternalLink, Link2, Loader2, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { NativeSelect } from "@/components/form/native-select";
import { useOfficeGuard, type GateInfo } from "@/components/office-gate";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { PropertyStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPropertyList, deletePropertyList } from "@/lib/actions/property-lists";
import { DEAL_TYPES, PROPERTY_TYPES } from "@/lib/constants";
import { formatBudget, formatDate, formatPrice, toPyeong } from "@/lib/format";
import type { PropertyListItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface CustomerOption {
  id: string;
  name: string;
  deal_type: string | null;
  regions: string | null;
  budget_min: number | null;
  budget_max: number | null;
}

interface SharedList {
  id: string;
  title: string;
  token: string;
  expires_at: string;
  view_count: number;
  created_at: string;
  customerName: string | null;
  count: number;
  expired: boolean;
}

interface Filters {
  dealType: string;
  propertyType: string;
  region: string;
  min: string;
  max: string;
  includeClosed: boolean;
}

const EMPTY_FILTERS: Filters = { dealType: "", propertyType: "", region: "", min: "", max: "", includeClosed: false };
const CLOSED_STATUSES = ["계약 진행", "계약 완료"];

function filtersFor(customer: CustomerOption | undefined): Filters {
  if (!customer) return EMPTY_FILTERS;
  return {
    ...EMPTY_FILTERS,
    dealType: customer.deal_type ?? "",
    region: customer.regions ?? "",
    min: customer.budget_min?.toString() ?? "",
    max: customer.budget_max?.toString() ?? "",
  };
}

const defaultTitle = (customer: CustomerOption | undefined) => (customer ? `${customer.name}님께 추천드리는 매물` : "추천 매물 리스트");

export function ListBuilder({
  properties,
  customers,
  defaultCustomerId,
  lists,
  siteUrl,
  gate,
}: {
  properties: PropertyListItem[];
  customers: CustomerOption[];
  defaultCustomerId: string | null;
  lists: SharedList[];
  siteUrl: string;
  gate: GateInfo;
}) {
  const officeGuard = useOfficeGuard("briefing", gate);
  const initialCustomer = customers.find((c) => c.id === defaultCustomerId);
  const [customerId, setCustomerId] = useState(initialCustomer?.id ?? "");
  const [filters, setFilters] = useState<Filters>(() => filtersFor(initialCustomer));
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState(defaultTitle(initialCustomer));
  const [comment, setComment] = useState("");
  const [days, setDays] = useState("14");
  const [pending, startTransition] = useTransition();

  const customer = customers.find((c) => c.id === customerId);
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }));

  const matched = useMemo(() => {
    const regions = filters.region
      .split(/[,\s]+/)
      .map((r) => r.trim())
      .filter(Boolean);
    const min = Number(filters.min.replace(/,/g, "")) || null;
    const max = Number(filters.max.replace(/,/g, "")) || null;
    return properties.filter((p) => {
      if (!filters.includeClosed && CLOSED_STATUSES.includes(p.status)) return false;
      if (filters.dealType && p.deal_type !== filters.dealType) return false;
      if (filters.propertyType && p.property_type !== filters.propertyType) return false;
      if (regions.length && !regions.some((r) => `${p.region ?? ""} ${p.address} ${p.title}`.includes(r))) return false;
      if (min !== null && p.price < min) return false;
      if (max !== null && p.price > max) return false;
      return true;
    });
  }, [properties, filters]);

  const byId = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const toggle = (id: string, on: boolean) => setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)));
  const allMatchedSelected = matched.length > 0 && matched.every((p) => selected.includes(p.id));

  const linkUrl = (token: string) => `${typeof window !== "undefined" ? window.location.origin : siteUrl}/l/${token}`;
  const copy = async (token: string) => {
    await navigator.clipboard.writeText(linkUrl(token));
    toast.success("링크를 복사했어요. 고객에게 메시지로 보내주세요.");
  };

  const create = () =>
    startTransition(async () => {
      const result = await createPropertyList({ title, comment, customerId: customerId || null, propertyIds: selected, days: Number(days) });
      if (result.error || !result.token) {
        toast.error(result.error ?? "링크를 만들지 못했어요.");
        return;
      }
      await copy(result.token).catch(() => toast.success(result.message));
      setSelected([]);
      setComment("");
    });

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {officeGuard.dialog}
      <div className="space-y-4 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>조건으로 찾기</CardTitle>
            <CardDescription>고객을 고르면 고객의 희망 조건(거래 유형·지역·예산)이 채워져요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="list_customer">고객</Label>
                <NativeSelect
                  id="list_customer"
                  value={customerId}
                  placeholder="고객 선택 안 함"
                  options={customers.map((c) => ({ value: c.id, label: c.name }))}
                  onChange={(e) => {
                    const next = customers.find((c) => c.id === e.target.value);
                    setCustomerId(e.target.value);
                    setFilters(filtersFor(next));
                    setTitle(defaultTitle(next));
                  }}
                />
                {customer && (
                  <p className="text-xs text-muted-foreground">
                    {[customer.deal_type, customer.regions, formatBudget(customer.budget_min, customer.budget_max)].filter((v) => v && v !== "-").join(" · ") ||
                      "등록된 희망 조건이 없어요"}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="list_region">지역 · 키워드</Label>
                <Input
                  id="list_region"
                  value={filters.region}
                  onChange={(e) => setFilter("region", e.target.value)}
                  placeholder="예) 망원동, 합정 (쉼표로 여러 개)"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="list_deal_type">거래 유형</Label>
                <NativeSelect
                  id="list_deal_type"
                  value={filters.dealType}
                  placeholder="전체"
                  options={DEAL_TYPES}
                  onChange={(e) => setFilter("dealType", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="list_property_type">매물 유형</Label>
                <NativeSelect
                  id="list_property_type"
                  value={filters.propertyType}
                  placeholder="전체"
                  options={PROPERTY_TYPES}
                  onChange={(e) => setFilter("propertyType", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>금액 (만원 · 월세는 보증금 기준)</Label>
                <div className="flex items-center gap-2">
                  <Input inputMode="numeric" value={filters.min} onChange={(e) => setFilter("min", e.target.value)} placeholder="최소" aria-label="최소 금액" />
                  <span className="text-muted-foreground">~</span>
                  <Input inputMode="numeric" value={filters.max} onChange={(e) => setFilter("max", e.target.value)} placeholder="최대" aria-label="최대 금액" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={filters.includeClosed} onCheckedChange={(v) => setFilter("includeClosed", Boolean(v))} />
                계약 진행·완료 매물도 보기
              </label>
              <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                조건 초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-4" />
              조건에 맞는 매물 {matched.length}개
            </CardTitle>
            {matched.length > 0 && (
              <CardDescription>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() =>
                    setSelected((s) =>
                      allMatchedSelected ? s.filter((id) => !matched.some((p) => p.id === id)) : [...new Set([...s, ...matched.map((p) => p.id)])]
                    )
                  }
                >
                  {allMatchedSelected ? "모두 선택 해제" : "모두 선택"}
                </button>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {matched.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">조건에 맞는 매물이 없어요. 조건을 넓혀 보세요.</p>}
            {matched.map((p) => {
              const on = selected.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors",
                    on ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  <Checkbox checked={on} onCheckedChange={(v) => toggle(p.id, Boolean(v))} aria-label={`${p.title} 선택`} />
                  <PropertyThumbnail type={p.property_type} src={p.thumbUrl} className="size-14 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.property_type} · {p.region ?? "지역 미입력"}
                      {p.area_m2 ? ` · ${toPyeong(p.area_m2)}평` : ""}
                      {p.floor ? ` · ${p.floor}층` : ""}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {p.deal_type} {formatPrice(p)}
                    </p>
                  </div>
                  <PropertyStatusBadge status={p.status} />
                </label>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle>보낼 리스트 ({selected.length})</CardTitle>
            <CardDescription>담은 순서대로 고객에게 보여요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected.length === 0 ? (
              <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">왼쪽에서 매물을 골라 담아 주세요</p>
            ) : (
              <ol className="space-y-1.5">
                {selected.map((id, i) => {
                  const p = byId.get(id);
                  if (!p) return null;
                  return (
                    <li key={id} className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm">
                      <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{p.title}</span>
                      <button type="button" aria-label="빼기" onClick={() => toggle(id, false)} className="text-muted-foreground hover:text-foreground">
                        <X className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="list_title">리스트 제목</Label>
              <Input id="list_title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="list_comment">전달 메시지 (선택)</Label>
              <Textarea
                id="list_comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="예) 말씀하신 조건으로 골라봤어요. 마음에 드는 매물이 있으면 연락 주세요!"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="list_days">유효 기간</Label>
                <NativeSelect
                  id="list_days"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  options={[
                    { value: "3", label: "3일" },
                    { value: "7", label: "7일" },
                    { value: "14", label: "14일" },
                    { value: "30", label: "30일" },
                  ]}
                />
              </div>
              <Button onClick={() => officeGuard.guard(create)} disabled={pending || selected.length === 0}>
                {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Link2 data-icon="inline-start" />}
                링크 생성·복사
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>보낸 리스트</CardTitle>
            <CardDescription>링크는 만료일까지 누구나 열람할 수 있어요</CardDescription>
          </CardHeader>
          <CardContent>
            {lists.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">아직 만든 리스트가 없어요.</p>
            ) : (
              <div className="divide-y rounded-lg border">
                {lists.map((l) => (
                  <div key={l.id} className="flex items-center gap-1 px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.title}</p>
                      <p className="text-muted-foreground">
                        {l.customerName ? `${l.customerName} · ` : ""}매물 {l.count}개 · 조회 {l.view_count}회 · {formatDate(l.expires_at)}까지
                      </p>
                    </div>
                    {l.expired ? (
                      <Badge variant="outline">만료</Badge>
                    ) : (
                      <>
                        <Button size="icon-sm" variant="ghost" aria-label="링크 복사" onClick={() => copy(l.token)}>
                          <Copy />
                        </Button>
                        <a
                          href={`/l/${l.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                          aria-label="열기"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </>
                    )}
                    <ConfirmAction
                      action={() => deletePropertyList(l.id)}
                      title="공유 링크를 삭제할까요?"
                      description="삭제하면 이 링크로 더 이상 매물 리스트를 볼 수 없어요."
                      successMessage="링크를 삭제했어요."
                      trigger={
                        <Button size="icon-sm" variant="ghost" aria-label="링크 삭제">
                          <Trash2 />
                        </Button>
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
