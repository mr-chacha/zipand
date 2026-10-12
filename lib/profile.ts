import type { Office, Profile } from "@/types";

/** 사무소 이름 없이 가입하면 가입 트리거가 넣는 기본값 (supabase/migrations의 handle_new_user와 일치) */
export const DEFAULT_OFFICE_NAME = "내 중개사무소";

/** 이름 없이 가입하면 이메일 앞부분이 이름으로 들어간다 */
export function hasDefaultName(profile: Pick<Profile, "name" | "email">) {
  return profile.name === profile.email.split("@")[0];
}

export function hasDefaultOfficeName(office: Pick<Office, "name">) {
  return office.name === DEFAULT_OFFICE_NAME;
}