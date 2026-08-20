import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@shadcnComponents/ui/sidebar"
import { menuIcon } from "@userPages/Layout/icons"
import type { MenuItem } from "@userPages/Layout/NavMain"

export function NavSecondary({
  items,
  activeRoute,
  className,
}: {
  items: MenuItem[]
  activeRoute: string
  className?: string
}) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = menuIcon(item.icon)
            const isActive = item.matchRoute.includes(activeRoute)

            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild size="sm" isActive={isActive} tooltip={item.name}>
                  <a href={item.path}>
                    <Icon />
                    <span>{item.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
