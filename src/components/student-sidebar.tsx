"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Settings,
  ChevronRight,
  GraduationCap,
  Bell,
  LogOut,
  User,
  ChevronLeft,
  Newspaper,
  ClipboardList,
  Info,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/auth-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    title: "Bảng điều khiển",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lớp học của tôi",
    url: "/classes",
    icon: BookOpen,
  },
  {
    title: "Lịch học",
    url: "/schedule",
    icon: Calendar,
  },
]

export function StudentSidebar() {
  const pathname = usePathname()
  const params = useParams()
  const { user, logout } = useAuthStore()

  const code = params?.code as string
  const isClassRoute = pathname.startsWith(`/classes/${code}`) && code

  const classNavItems = [
    {
      title: `${code}`,
      url: "/classes",
      icon: ChevronLeft,
      className: "font-bold text-slate-900 border-b border-slate-100 mb-2 pb-2 rounded-none hover:bg-transparent",
    },
    {
      title: "Bảng tin",
      url: `/classes/${code}`,
      icon: Newspaper,
    },
    {
      title: "Bài kiểm tra",
      url: `/classes/${code}/exams`,
      icon: ClipboardList,
    },
    {
      title: "Bài giảng",
      url: `/classes/${code}/lectures`,
      icon: BookOpen,
    },
    {
      title: "Thông tin chi tiết",
      url: `/classes/${code}/detail`,
      icon: Info,
    },
  ]

  const itemsToRender = isClassRoute ? classNavItems : navItems

  const handleLogout = () => {
    logout()
    window.location.href = "/student/login"
  }

  return (
    <Sidebar collapsible="icon" className="relative border-r border-slate-200">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1 p-2">
            {itemsToRender.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className={`h-11 rounded-lg transition-all duration-200 hover:bg-slate-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 data-[active=true]:font-semibold ${item.className || ""}`}
                >
                  <Link href={item.url} className="flex items-center gap-3 w-full">
                    <item.icon className="size-5 shrink-0" />
                    <span className="truncate text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
