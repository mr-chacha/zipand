"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, FileText, LayoutGrid, List, Plus, Search, Users } from "lucide-react";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { PropertyStatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEAL_TYPES, PROPERTY_STATUSES, PROPERTY_TYPES } from "@/lib/constants";
import { formatDate, formatPrice, toPyeong } from "@/lib/format";
import type { PropertyListItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

const ALL = "전체";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger className="min-w-28 bg-background" aria-label={label}>
        <span className="text-muted-foreground">{label}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[ALL, ...options].map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PropertyList({
  properties,
  initialQuery,
}: {
  properties: PropertyListItem[];
  initialQuery: string;
}) {
  const [view, setView] = useState<"table" | "card">("table");
  const [query, setQuery] = useState(initialQuery);
  const [dealType, setDealType] = useState(ALL);
  const [propertyType, setPropertyType] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) =>
          (dealType === ALL || p.deal_type === dealType) &&
          (propertyType === ALL || p.property_type === propertyType) &&
          (status === ALL || p.status === status) &&
          (query === "" || `${p.title} ${p.address} ${p.region ?? ""}`.includes(query))
      ),
    [properties, dealType, propertyType, status, query]
  );

  if (properties.length === 0) {
    return (
      <Card className="items-center gap-4 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Building2 className="size-6" />
        </span>
        <div>
          <p className="font-medium">아직 등록된 매물이 없어요</p>
          <p className="text-sm text-muted-foreground">첫 매물을 등록하고 임장 기록을 남겨보세요.</p>
        </div>
        <Link href="/properties/new" className={buttonVariants()}>
          <Plus data-icon="inline-start" />
          매물 등록
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="매물명, 주소, 지역 검색"
            className="bg-background pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="거래" value={dealType} options={DEAL_TYPES} onChange={setDealType} />
          <FilterSelect label="유형" value={propertyType} options={PROPERTY_TYPES} onChange={setPropertyType} />
          <FilterSelect label="상태" value={status} options={PROPERTY_STATUSES} onChange={setStatus} />
          <div className="ml-auto hidden rounded-lg border bg-background p-0.5 md:flex">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setView("table")}
              aria-label="테이블 보기"
            >
              <List />
            </Button>
            <Button
              variant={view === "card" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setView("card")}
              aria-label="카드 보기"
            >
              <LayoutGrid />
            </Button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="items-center py-16 text-center text-sm text-muted-foreground">
          조건에 맞는 매물이 없어요.
        </Card>
      ) : (
        <>
          <Card className={cn("py-0", view === "table" ? "hidden md:flex" : "hidden")}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">매물</TableHead>
                  <TableHead>거래</TableHead>
                  <TableHead>가격 (만원)</TableHead>
                  <TableHead>면적</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>연결</TableHead>
                  <TableHead className="pr-4">등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-4">
                      <Link href={`/properties/${p.id}`} className="flex items-center gap-3 hover:underline">
                        <PropertyThumbnail
                          type={p.property_type}
                          src={p.thumbUrl}
                          className="size-10 shrink-0 rounded-md"
                        />
                        <div className="min-w-0">
                          <p className="max-w-64 truncate font-medium">{p.title}</p>
                          <p className="max-w-64 truncate text-xs text-muted-foreground">{p.address}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {p.property_type} · {p.deal_type}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">{formatPrice(p)}</TableCell>
                    <TableCell className="tabular-nums">
                      {p.area_m2 ? (
                        <>
                          {p.area_m2}㎡ <span className="text-muted-foreground">({toPyeong(p.area_m2)}평)</span>
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <PropertyStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>{p.managerName ?? "-"}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5" title="연결 고객">
                          <Users className="size-3.5" />
                          {p.customerCount}
                        </span>
                        <span className="flex items-center gap-0.5" title="서류">
                          <FileText className="size-3.5" />
                          {p.documentCount}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-muted-foreground tabular-nums">{formatDate(p.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", view === "table" && "md:hidden")}>
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
              >
                <PropertyThumbnail type={p.property_type} src={p.thumbUrl} className="aspect-[16/9] w-full" />
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <PropertyStatusBadge status={p.status} />
                    <span className="text-xs text-muted-foreground">{formatDate(p.created_at)}</span>
                  </div>
                  <div>
                    <p className="truncate font-semibold">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.address}</p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    <span className="mr-1.5 text-sm font-medium text-foreground">{p.deal_type}</span>
                    {formatPrice(p)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      p.property_type,
                      p.area_m2 && `${p.area_m2}㎡ (${toPyeong(p.area_m2)}평)`,
                      p.floor && `${p.floor}${p.total_floors ? `/${p.total_floors}` : ""}층`,
                      p.direction,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
