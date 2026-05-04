"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import api from "@/lib/axios"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Award, ChevronDown, LogOut, User } from "lucide-react"
import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  React.useEffect(() => {
    setMounted(true)

    const hasToken = document.cookie.includes('access_token')

    if (!hasToken) {
      router.replace('/login')
      return;
    }

    // Fetch user profile to get permissions
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
            const userData = response.data.data;
            // Map data backend sang User interface của frontend
            const userRole = userData.roles?.[0] || 'admin'; // Lấy role đầu tiên
            
            useAuthStore.getState().setUser({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userRole,
                avatar: userData.avatar,
                permissions: userData.permissions
            });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, [router])

  // Tránh render nội dung khi chưa mounted hoặc không có token
  if (!mounted) return null

  const hasToken = typeof window !== 'undefined' ? document.cookie.includes('access_token') : false
  if (!hasToken) return null

  return (
    <SidebarProvider style={{ "--sidebar-width": "13rem" } as React.CSSProperties}>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold">Admin Panel</h1>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" className="relative flex items-center gap-2 h-auto py-1.5 px-2 rounded-full border-2 border-primary/20 p-0 overflow-hidden hover:border-primary/40 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop"} alt={user?.name || "Teacher"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user?.name ? user.name.substring(0, 2).toUpperCase() : "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start pr-1 text-left">
                      <span className="text-xs font-bold leading-none">{user?.name || "Quản trị viên"}</span>
                      <span className="text-[10px] text-muted-foreground leading-none mt-1 uppercase tracking-wider font-medium">
                        {user?.role === "admin" ? "Super Admin" : user?.role || "Administrator"}
                      </span>
                    </div>
                    <ChevronDown className="size-3 text-muted-foreground mr-1" />
                  </Button>
                }>

                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1 p-2">
                        <p className="text-sm font-semibold leading-none">{user?.name || "Giảng viên"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email || "teacher@goedu.edu.vn"}</p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="opacity-50" />
                  <DropdownMenuItem className="cursor-pointer py-2 px-3 focus:bg-primary/5 focus:text-primary transition-colors">
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="mr-3 h-4 w-4" />
                      <span className="font-medium">Thông tin cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-2 px-3 focus:bg-primary/5 focus:text-primary transition-colors">
                    <Award className="mr-3 h-4 w-4" />
                    <span className="font-medium">Chứng chỉ</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="opacity-50" />
                  <DropdownMenuItem
                    className="cursor-pointer py-2 px-3 text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
