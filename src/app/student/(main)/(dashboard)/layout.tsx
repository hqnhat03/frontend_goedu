"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { StudentSidebar } from "@/components/student-sidebar"
import { Separator } from "@/components/ui/separator"
import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [mounted, setMounted] = React.useState(false)
    const { user } = useAuthStore()

    React.useEffect(() => {
        setMounted(true)

        // Check for auth token (simple check for now, matching admin pattern)
        const hasToken = document.cookie.includes('access_token')

        if (!hasToken) {
            router.replace('/student/login')
        }
    }, [router])

    // Avoid flash of unauthenticated content
    if (!mounted) return null

    const hasToken = typeof window !== 'undefined' ? document.cookie.includes('access_token') : false
    if (!hasToken) return null

    return (
        <div className="mx-auto w-full max-w-7xl border">
            <SidebarProvider style={{ "--sidebar-width": "14rem" } as React.CSSProperties}>
                <StudentSidebar />
                <SidebarInset className="bg-slate-50/50 overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}
