import * as React from "react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@shadcnComponents/ui/sidebar"
import { menuIcon } from "@userPages/Layout/icons"

export type MenuItem = {
  name: string
  icon: string
  path: string
  matchRoute: string[]
}

export function NavMain({
  items,
  activeRoute,
}: {
  items: MenuItem[]
  activeRoute: string
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = menuIcon(item.icon)
          const isActive = item.matchRoute.includes(activeRoute)

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                <a href={item.path}>
                  <Icon />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
