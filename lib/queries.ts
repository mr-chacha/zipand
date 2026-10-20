import "server-only";
import { getSession } from "@/lib/auth";
import { kstDayStart, todayKst } from "@/lib/format";
import { signedUrls } from "@/lib/storage";

export async function getOfficeMembers() {
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, role, active")
    .eq("active", true)
    .order("created_at");
  return data ?? [];
}

export async function getPropertyOptions() {
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("properties")
    .select("id, title, deal_type, status")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getCustomerOptions() {
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("customers")
    .select("id, name, status")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** KST 기준 오늘 시작·내일 시작 시각 */
export function todayRange() {
  return { todayStart: kstDayStart(todayKst()), tomorrowStart: kstDayStart(todayKst(1)) };
}

/** 미완료 전체 + 오늘 이후 완료된 할 일 */
export async function getTasks(filter: { customerId?: string; assigneeId?: string } = {}) {
  const { supabase } = await getSession();
  const { todayStart } = todayRange();
  let query = supabase
    .from("tasks")
    .select(
      "id, title, type, due_at, done, property:properties(id, title), customer:customers(id, name), assignee:profiles!tasks_assignee_id_fkey(name)"
    )
    .or(`done.eq.false,due_at.gte.${todayStart}`)
    .order("due_at")
    .limit(100);
  if (filter.customerId) query = query.eq("customer_id", filter.customerId);
  if (filter.assigneeId) query = query.eq("assignee_id", filter.assigneeId);
  const { data } = await query;
  return data ?? [];
}

export interface PropertyListItem {
  id: string;
  title: string;
  address: string;
  region: string | null;
  building: string | null;
  unit: string | null;
  deal_type: string;
  property_type: string;
  status: string;
  price: number;
  monthly_rent: number | null;
  area_m2: number | null;
  floor: number | null;
  total_floors: number | null;
  direction: string | null;
  created_at: string;
  managerName: string | null;
  thumbUrl: string | null;
  documentCount: number;
  customerCount: number;
}

export async function getPropertyList(limit?: number): Promise<PropertyListItem[]> {
  const { supabase } = await getSession();
  let query = supabase
    .from("properties")
    .select(
      "id, title, address, region, building, unit, deal_type, property_type, status, price, monthly_rent, area_m2, floor, total_floors, direction, created_at, manager:profiles!properties_manager_id_fkey(name), property_photos(storage_path, sort_order), documents(count), customer_properties(count)"
    )
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  const rows = data ?? [];

  const coverPaths = rows
    .map((r) => [...r.property_photos].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path)
    .filter((p): p is string => Boolean(p));
  const urls = await signedUrls(supabase, "property-photos", coverPaths);

  return rows.map(({ manager, property_photos, documents, customer_properties, ...r }) => {
    const cover = [...property_photos].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path;
    return {
      ...r,
      area_m2: r.area_m2 === null ? null : Number(r.area_m2),
      managerName: manager?.name ?? null,
      thumbUrl: cover ? (urls[cover] ?? null) : null,
      documentCount: documents[0]?.count ?? 0,
      customerCount: customer_properties[0]?.count ?? 0,
    };
  });
}
