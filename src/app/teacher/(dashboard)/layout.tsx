"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TeacherSidebar } from "@/components/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher-header"
import { useAuthStore } from "@/store/auth-store"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const token = useAuthStore((state) => state.token)

  React.useEffect(() => {
    setMounted(true)

    // Kiểm tra cookie trực tiếp (đã bỏ qua bước đồng bộ từ localStorage vì đã chuyển hoàn toàn sang cookie)
    const hasToken = document.cookie.includes('access_token')

    if (!hasToken) {
      router.replace('/login')
    }
  }, [router])

  // Tránh render nội dung khi chưa mounted hoặc không có token
  if (!mounted) return null

  const hasToken = typeof window !== 'undefined' ? document.cookie.includes('access_token') : false
  if (!hasToken) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc]/50 dark:bg-zinc-950/50">
        <TeacherSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <TeacherHeader />
          <main className="flex-1 p-6 overflow-auto">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-3 duration-500">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
