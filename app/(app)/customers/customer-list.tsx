"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { CustomerStatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CUSTOMER_STATUSES } from "@/lib/constants";
import { formatBudget, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string | null;
  deal_type: string | null;
  regions: string | null;
  budget_min: number | null;
  budget_max: number | null;
  move_in_date: string | null;
  status: string;
  updated_at: string;
  managerName: string | null;
  propertyCount: number;
  consultationCount: number;
}

export function CustomerList({ customers }: { customers: CustomerListItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("진행 중");

  const filtered = useMemo(() => {
    const q = query.trim();
    return customers.filter(
      (c) =>
        (!status || c.status === status) &&
        (!q || c.name.includes(q) || c.phone?.includes(q) || c.regions?.includes(q))
    );
  }, [customers, query, status]);

  if (customers.length === 0) {
    return (
      <Card className="items-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Users className="size-5 text-muted-foreground" />
        </span>
        <p className="font-medium">등록된 고객이 없어요</p>
        <p className="text-sm text-muted-foreground">고객 조건을 기록하면 맞는 매물을 추천해 드려요.</p>
        <Link href="/customers/new" className={buttonVariants({ size: "sm" })}>
          고객 등록
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름, 연락처, 지역 검색" className="pl-8" />
        </div>
        <div className="flex flex-wrap gap-1">
          {["", ...CUSTOMER_STATUSES].map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s || "전체"} ({s ? customers.filter((c) => c.status === s).length : customers.length})
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <Link key={c.id} href={`/customers/${c.id}`} className="space-y-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.phone ?? "연락처 없음"}</p>
              </div>
              <CustomerStatusBadge status={c.status} />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">희망 거래</dt>
                <dd>{c.deal_type ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">예산</dt>
                <dd>{formatBudget(c.budget_min, c.budget_max)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">희망 지역</dt>
                <dd className="truncate">{c.regions ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">입주 희망</dt>
                <dd>{formatDate(c.move_in_date)}</dd>
              </div>
            </dl>
            <p className="border-t pt-2 text-xs text-muted-foreground">
              상담 {c.consultationCount} · 연결 매물 {c.propertyCount}
              {c.managerName && ` · 담당 ${c.managerName}`}
            </p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">조건에 맞는 고객이 없어요.</p>
        )}
      </div>
    </div>
  );
}
