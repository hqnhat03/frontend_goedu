"use client"

import { usePermission } from "@/hooks/use-permission"
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
  SidebarRail
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard",
  },
  {
    title: "Quản lý khóa học",
    url: "/admin/courses",
    icon: BookOpen,
    permission: "course_list",
  },
  {
    title: "Quản lý giáo viên",
    url: "/admin/teachers",
    icon: Users,
    permission: "teacher_list",
  },
  {
    title: "Quản lý học sinh",
    url: "/admin/students",
    icon: GraduationCap,
    permission: "student_list",
  },
  {
    title: "Quản lý phụ huynh",
    url: "/admin/guardians",
    icon: UserCheck,
    permission: "guardian_list",
  },
  {
    title: "Quản lý quản trị viên",
    url: "/admin/admins",
    icon: ShieldCheck,
    permission: "admin_list",
  },
  {
    title: "Phân quyền màn hình",
    url: "/admin/permissions",
    icon: ShieldCheck,
    permission: "permission_manage",
  },
  {
    title: "Quản lý chung",
    icon: Settings,
    items: [
      {
        title: "Quản lý môn học",
        url: "/admin/subjects",
        permission: "subject_list",
      },
      {
        title: "Quản lý trình độ",
        url: "/admin/levels",
        permission: "level_list",
      },
      {
        title: "Quản lý vai trò",
        url: "/admin/roles",
        permission: "role_list",
      },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { hasPermission } = usePermission()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center py-2 px-5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center transition-all duration-300">
        <Link href="/admin" className="flex items-center gap-3 font-bold text-xl group-data-[collapsible=icon]:gap-0">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0 transition-transform hover:scale-105 active:scale-95">
            G
          </div>
          <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden">
            <span className="text-lg">GoEdu</span>
            <span className="text-xs text-muted-foreground font-medium">Dashboard</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              // Nếu mục này yêu cầu permission mà user không có thì ẩn
              if (item.permission && !hasPermission(item.permission)) return null;

              // Đối với menu lồng nhau (Quản lý chung)
              if (item.items) {
                const visibleSubItems = item.items.filter(
                  (sub) => !sub.permission || hasPermission(sub.permission)
                );

                // Nếu không có sub-item nào hiển thị thì ẩn luôn menu cha
                if (visibleSubItems.length === 0) return null;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className="hover:bg-accent hover:text-accent-foreground"
                    >
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {visibleSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.url}>
                          <SidebarMenuSubButton
                            render={<Link href={subItem.url} />}
                            isActive={pathname === subItem.url}
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                );
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url!} />}
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="hover:bg-accent hover:text-accent-foreground"
                  >
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {/* User profile or logout can go here */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
