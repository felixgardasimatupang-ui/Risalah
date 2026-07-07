"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { sidebarNavItems } from "@/config/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Bell, ChevronDown, Building2 } from "lucide-react";
import { useOrgStore } from "@/stores/org-store";
import { useTranslation } from "@/hooks/use-translation";

export function Header() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const currentPage = sidebarNavItems.find((item) => item.href === pathname);
  const { activeOrg } = useOrgStore();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-surface-container bg-surface/80 px-6 backdrop-blur-[12px]">
      <div className="flex items-center gap-3">
        <h1 className="font-headline text-headline-md text-on-surface">
          {currentPage ? t(currentPage.tKey as any) : "Dashboard"}
        </h1>
        {activeOrg && (
          <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-0.5 text-label-xs text-on-surface-variant">
            <Building2 className="h-3 w-3" />
            {activeOrg.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link href="/search">
          <Button variant="ghost" size="icon" className="text-on-surface-variant">
            <Search className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="text-on-surface-variant">
            <Bell className="h-5 w-5" />
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary-container text-xs text-on-primary-container">
                  SA
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-on-surface-variant" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t("common.viewAll" as any)}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/settings">{t("settings.profile" as any)}</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/settings">{t("nav.settings" as any)}</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-error">{t("auth.logout" as any)}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
