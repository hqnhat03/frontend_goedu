"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ClassForm } from "./_components/class-form"
import { usePermission } from "@/hooks/use-permission"
import { toast } from "sonner"

export default function CreateClassPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền
  React.useEffect(() => {
    if (!hasPermission("class_create")) {
      toast.error("Bạn không có quyền thực hiện chức năng này")
      router.back()
    }
  }, [hasPermission, router])


  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10 
      animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full shadow-sm hover:bg-accent transition-colors"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Tạo lớp học mới
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Tạo lớp học mới và phân công giáo viên phụ trách
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <ClassForm />
    </div>
  )
}
