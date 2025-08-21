"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  Briefcase,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/tracker",
    label: "Time Tracker",
    icon: Timer,
  },
  {
    href: "/materials",
    label: "Materials",
    icon: Package,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: FileText,
  },
  {
    href: "/admin",
    label: "Admin",
    icon: Settings,
  },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar className="border-r">
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Briefcase className="w-8 h-8 text-primary" />
              <div className="flex flex-col">
                <h2 className="text-lg font-bold tracking-tight text-primary">
                  Fence-It
                </h2>
                <p className="text-xs text-muted-foreground">Supply Co.</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 text-sm">
              <Bot className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">AI Features Enabled</span>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center h-16 px-4 bg-background/80 backdrop-blur-sm border-b md:hidden">
            <SidebarTrigger />
            <h2 className="ml-4 text-lg font-semibold tracking-tight">Fence-It Supply</h2>
          </header>
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
