"use client";

import { usePathname } from "next/navigation";
import { sidebarNavItems } from "@/config/sidebar-nav";
import { SidebarItem } from "./sidebar-item";
import { APP_NAME } from "@/config/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { OrgSwitcher } from "@/components/org-switcher";
import { useTranslation } from "@/hooks/use-translation";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-surface-container px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-on-primary">
          S
        </div>
        <span className="font-headline text-lg font-semibold text-on-surface">
          {APP_NAME}
        </span>
      </div>

      <div className="border-b border-surface-container px-2 py-2">
        <OrgSwitcher />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarNavItems.map((item) => (
          <SidebarItem
            key={item.href}
            icon={item.icon}
            label={t(item.tKey as any)}
            href={item.href}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      <div className="border-t border-surface-container p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary-container text-xs text-on-primary-container">
              SA
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-on-surface">Admin</span>
            <span className="text-xs text-on-surface-variant">admin@sekneg.go.id</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-surface-container bg-surface lg:flex">
        {sidebarContent}
      </aside>

      <Sheet>
        <SheetTrigger asChild className="fixed left-4 top-3 z-40 lg:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-surface p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
