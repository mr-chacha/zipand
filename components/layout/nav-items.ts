import {
  Bot,
  Building2,
  FileSearch,
  FileSignature,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** MVP 이후 단계 메뉴 */
  comingSoon?: boolean;
}

export const navItems: NavItem[] = [
  { title: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { title: "매물 관리", href: "/properties", icon: Building2 },
  { title: "AI 문서 분석", href: "/documents", icon: FileSearch },
  { title: "고객 및 상담", href: "/customers", icon: Users, comingSoon: true },
  { title: "계약 준비", href: "/contracts", icon: FileSignature, comingSoon: true },
  { title: "AI 실무 도우미", href: "/assistant", icon: Bot, comingSoon: true },
];

export const bottomNavItems: NavItem[] = [
  { title: "구독 및 설정", href: "/settings", icon: Settings, comingSoon: true },
];
