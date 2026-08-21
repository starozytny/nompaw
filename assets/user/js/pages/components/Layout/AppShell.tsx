import * as React from "react"
import { useEffect, useRef } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@shadcnComponents/ui/breadcrumb"
import { Separator } from "@shadcnComponents/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@shadcnComponents/ui/sidebar"
import { AppSidebar } from "@userPages/Layout/AppSidebar"
import type { MenuItem } from "@userPages/Layout/NavMain"
import type { NompawUser } from "@userPages/Layout/NavUser"

const MAIN_CONTENT_SOURCE_ID = "main-content-source"
const FOOTER_ID = "app-footer"

export function AppShell({
  menu,
  menuSecondary,
  activeRoute,
  pageTitle,
  homePath,
  logoPath,
  user,
  profilePath,
  logoutPath,
}: {
  menu: MenuItem[]
  menuSecondary: MenuItem[]
  activeRoute: string
  pageTitle: string
  homePath: string
  logoPath: string
  user: NompawUser
  profilePath: string
  logoutPath: string
}) {
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const source = document.getElementById(MAIN_CONTENT_SOURCE_ID)
    const target = mainRef.current

    if (source && target) {
      source.classList.remove("hidden")
      target.appendChild(source)
    }

    document.getElementById(FOOTER_ID)?.classList.remove("hidden")
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar
        menu={menu}
        menuSecondary={menuSecondary}
        activeRoute={activeRoute}
        homePath={homePath}
        logoPath={logoPath}
        user={user}
        profilePath={profilePath}
        logoutPath={logoutPath}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div ref={mainRef} className="flex flex-1 flex-col" />
      </SidebarInset>
    </SidebarProvider>
  )
}
