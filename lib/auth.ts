import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** 로그인 사용자·프로필·사무소. 요청 단위로 캐시된다. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, office:offices(*)")
    .eq("id", userId)
    .single();

  if (!profile || !profile.office || !profile.active) {
    await supabase.auth.signOut();
    redirect("/login?error=profile");
  }

  const { office, ...rest } = profile;
  return { supabase, profile: rest, office };
});

export async function requireOwner() {
  const session = await getSession();
  if (session.profile.role !== "owner") {
    throw new Error("대표만 사용할 수 있는 기능입니다.");
  }
  return session;
}
