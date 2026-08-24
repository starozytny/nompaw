import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@shadcnComponents/ui/sidebar"
import { NavMain, type MenuItem } from "@userPages/Layout/NavMain"
import { NavSecondary } from "@userPages/Layout/NavSecondary"
import { NavUser, type NompawUser } from "@userPages/Layout/NavUser"

export function AppSidebar({
  menu,
  menuSecondary,
  activeRoute,
  homePath,
  logoPath,
  user,
  profilePath,
  logoutPath,
}: {
  menu: MenuItem[]
  menuSecondary: MenuItem[]
  activeRoute: string
  homePath: string
  logoPath: string
  user: NompawUser
  profilePath: string
  logoutPath: string
}) {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={homePath}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-sidebar-accent">
                  <img src={logoPath} alt="Nompaw" className="h-full w-full object-cover" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Nompaw</span>
                  <span className="truncate text-xs">Espace membre</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menu} activeRoute={activeRoute} />
        <NavSecondary items={menuSecondary} activeRoute={activeRoute} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} profilePath={profilePath} logoutPath={logoutPath} />
      </SidebarFooter>
    </Sidebar>
  )
}
