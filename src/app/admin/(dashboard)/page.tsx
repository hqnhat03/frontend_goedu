"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { usePermission } from "@/hooks/use-permission"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export default function AdminRootPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const { hasPermission } = usePermission()
    const [checking, setChecking] = React.useState(true)

    React.useEffect(() => {
        if (hasPermission("dashboard")) {
            router.replace("/dashboard")
        } else {
            setChecking(false)
        }
    }, [hasPermission, router])

    if (checking) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-sm" />
                    <p className="text-muted-foreground animate-pulse font-medium">Đang điều hướng...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-[70vh] items-center justify-center p-6 animate-in fade-in zoom-in duration-700">
            <Card className="max-w-2xl w-full border-none shadow-2xl bg-gradient-to-br from-background via-muted/20 to-background overflow-hidden relative group">
                {/* Decorative Elements */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-700" />
                
                <CardContent className="p-12 flex flex-col items-center text-center gap-6 relative z-10">
                    <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner mb-2 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        <Sparkles className="size-10" />
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-indigo-500 to-primary bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent">
                            Xin chào, {user?.name || "Quản trị viên"}!
                        </h1>
                        <p className="text-balance text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                            Chúc bạn có một ngày làm việc hiệu quả và tràn đầy năng lượng tại hệ thống quản trị <span className="font-bold text-foreground">GoEdu</span>.
                        </p>
                    </div>

                    <div className="w-full max-w-[200px] h-px bg-gradient-to-r from-transparent via-border to-transparent mt-4" />
                    <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-50">
                        Admin Workspace
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
