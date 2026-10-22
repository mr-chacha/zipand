import type { ConsultationDraft, PropertyMatch } from "@/lib/ai/types";

type PropertyRow = {
  id: string;
  title: string;
  deal_type: string;
  region: string | null;
  address: string | null;
  price: number | null;
  monthly_rent: number | null;
  status: string;
};

export function matchPropertiesForDraft(properties: PropertyRow[], draft: ConsultationDraft, limit = 5): PropertyMatch[] {
  const regions = (draft.regions ?? "")
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const scored = properties
    .filter((p) => p.status === "광고 중" || p.status === "임장 전")
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];
      if (draft.deal_type && p.deal_type === draft.deal_type) {
        score += 3;
        reasons.push(p.deal_type);
      }
      if (regions.length) {
        const hay = `${p.region ?? ""} ${p.address ?? ""}`;
        const hit = regions.find((r) => hay.includes(r));
        if (hit) {
          score += 3;
          reasons.push(hit);
        }
      }
      if (draft.budget_max != null && p.price != null && p.price > 0 && p.price <= draft.budget_max) {
        score += 2;
        reasons.push("예산 이하");
      } else if (draft.budget_min != null && p.price != null && p.price >= draft.budget_min) {
        score += 1;
      }
      return { p, score, reasons };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ p, reasons }) => ({
    id: p.id,
    title: p.title,
    deal_type: p.deal_type,
    region: p.region,
    price: p.price,
    monthly_rent: p.monthly_rent,
    reason: reasons.join(" · ") || "조건 근접",
  }));
}
