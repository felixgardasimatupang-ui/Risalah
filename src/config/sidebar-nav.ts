import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  FileText,
  Sparkles,
  BarChart3,
  Settings,
  Upload,
  MessageSquare,
  Search,
  Bell,
  Radio,
  Download,
  Users,
  Shield,
  Puzzle,
  Trash2,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface SidebarNavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  tKey: string;
}

export const sidebarNavItems: SidebarNavItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/overview", tKey: "nav.overview" },
  { icon: Calendar, label: "Meetings", href: "/meetings", tKey: "nav.meetings" },
  { icon: CalendarDays, label: "Calendar", href: "/calendar", tKey: "nav.calendar" },
  { icon: Upload, label: "Upload", href: "/upload", tKey: "nav.upload" },
  { icon: Radio, label: "Live Meeting", href: "/live-meeting", tKey: "nav.liveMeeting" },
  { icon: MessageSquare, label: "AI Chat", href: "/chat", tKey: "nav.aiChat" },
  { icon: FileText, label: "Transcripts", href: "/transcripts", tKey: "nav.transcripts" },
  { icon: Sparkles, label: "Summary", href: "/summary", tKey: "nav.summary" },
  { icon: Download, label: "Export", href: "/export", tKey: "nav.export" },
  { icon: Users, label: "Speaker", href: "/speaker", tKey: "nav.speaker" },
  { icon: Search, label: "Search", href: "/search", tKey: "nav.search" },
  { icon: BarChart3, label: "Analytics", href: "/analytics", tKey: "nav.analytics" },
  { icon: Activity, label: "System Health", href: "/system-health", tKey: "nav.systemHealth" },
  { icon: Shield, label: "Audit Log", href: "/audit", tKey: "nav.auditLog" },
  { icon: Puzzle, label: "Integrations", href: "/integrations", tKey: "nav.integrations" },
  { icon: Bell, label: "Notifications", href: "/notifications", tKey: "nav.notifications" },
  { icon: Shield, label: "Data Retention", href: "/data-retention", tKey: "nav.dataRetention" },
  { icon: Trash2, label: "Trash", href: "/trash", tKey: "nav.trash" },
  { icon: Settings, label: "Settings", href: "/settings", tKey: "nav.settings" },
];
