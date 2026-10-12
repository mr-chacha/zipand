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
  /** AI·앱 연동 등 서비스 준비중 메뉴 */
  comingSoon?: boolean;
}

export const navItems: NavItem[] = [
  { title: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { title: "매물 관리", href: "/properties", icon: Building2 },
  { title: "고객 및 상담", href: "/customers", icon: Users },
  { title: "문서 관리", href: "/documents", icon: FileSearch },
  { title: "계약 준비", href: "/contracts", icon: FileSignature },
  { title: "AI 실무 도우미", href: "/assistant", icon: Bot, comingSoon: true },
];

export const bottomNavItems: NavItem[] = [{ title: "설정", href: "/settings", icon: Settings }];
