"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, LayoutGrid, List, Search, Users } from "lucide-react";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { PropertyStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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
import { formatPrice, toPyeong } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DealType, Property, PropertyStatus, PropertyType } from "@/types";

const ALL = "전체";
const dealTypes: (DealType | typeof ALL)[] = [ALL, "매매", "전세", "월세"];
const propertyTypes: (PropertyType | typeof ALL)[] = [ALL, "아파트", "오피스텔", "빌라", "원룸", "상가"];
const statuses: (PropertyStatus | typeof ALL)[] = [ALL, "임장 전", "광고 중", "계약 진행", "계약 완료", "보류"];

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="min-w-28" aria-label={label}>
        <span className="text-muted-foreground">{label}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PropertyList({ properties }: { properties: Property[] }) {
  const [view, setView] = useState<"table" | "card">("table");
  const [query, setQuery] = useState("");
  const [dealType, setDealType] = useState<DealType | typeof ALL>(ALL);
  const [propertyType, setPropertyType] = useState<PropertyType | typeof ALL>(ALL);
  const [status, setStatus] = useState<PropertyStatus | typeof ALL>(ALL);

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) =>
          (dealType === ALL || p.dealType === dealType) &&
          (propertyType === ALL || p.propertyType === propertyType) &&
          (status === ALL || p.status === status) &&
          (query === "" || `${p.title} ${p.address}`.includes(query))
      ),
    [properties, dealType, propertyType, status, query]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="매물명 또는 주소 검색"
            className="bg-background pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="거래" value={dealType} options={dealTypes} onChange={setDealType} />
          <FilterSelect label="유형" value={propertyType} options={propertyTypes} onChange={setPropertyType} />
          <FilterSelect label="상태" value={status} options={statuses} onChange={setStatus} />
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
                  <TableRow key={p.id} className="cursor-pointer">
                    <TableCell className="pl-4">
                      <Link href={`/properties/${p.id}`} className="flex items-center gap-3">
                        <PropertyThumbnail type={p.propertyType} className="size-10 shrink-0 rounded-md" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{p.address}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {p.propertyType} · {p.dealType}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">{formatPrice(p)}</TableCell>
                    <TableCell className="tabular-nums">
                      {p.areaM2}㎡ <span className="text-muted-foreground">({toPyeong(p.areaM2)}평)</span>
                    </TableCell>
                    <TableCell>
                      <PropertyStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>{p.manager}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Users className="size-3.5" />
                          {p.linkedCustomers}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <FileText className="size-3.5" />
                          {p.documentsCount}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-muted-foreground tabular-nums">{p.registeredAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
              view === "table" && "md:hidden"
            )}
          >
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
              >
                <PropertyThumbnail type={p.propertyType} className="aspect-[16/9]" />
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <PropertyStatusBadge status={p.status} />
                    <span className="text-xs text-muted-foreground">{p.registeredAt}</span>
                  </div>
                  <div>
                    <p className="truncate font-semibold">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.address}</p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    <span className="mr-1.5 text-sm font-medium text-foreground">{p.dealType}</span>
                    {formatPrice(p)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.propertyType} · {p.areaM2}㎡ ({toPyeong(p.areaM2)}평) · {p.floor}/{p.totalFloors}층 · {p.direction}
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
