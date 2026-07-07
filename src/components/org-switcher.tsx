"use client";

import { useEffect, useState } from "react";
import { useOrgStore } from "@/stores/org-store";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function OrgSwitcher() {
  const { organizations, activeOrg, fetchOrganizations, setActiveOrg } = useOrgStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (organizations.length === 0) fetchOrganizations();
  }, [fetchOrganizations, organizations.length]);

  if (!activeOrg) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-container text-xs text-on-primary-container">
              {activeOrg.name.charAt(0)}
            </div>
            <span className="font-medium text-on-surface truncate">{activeOrg.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Organisasi</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => {
              setActiveOrg(org);
              setOpen(false);
            }}
            className="flex items-center gap-3"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-container-high text-xs">
              {org.name.charAt(0)}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium">{org.name}</p>
              <p className="text-xs text-on-surface-variant">{org.memberCount} anggota</p>
            </div>
            {activeOrg.id === org.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 text-primary">
          <Plus className="h-4 w-4" />
          Tambah Organisasi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
