"use client"

import { usePermission } from "@/hooks/use-permission"
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import React from "react"
import { toast } from "sonner"

import { GrowthChart } from "@/components/dashboard-charts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { AxiosError } from "axios"

interface DashboardData {
  total_teacher: number
  total_student: number
  total_course: number
  total_new_student: number
  student_growth: Array<{ label: string; count: number }>
}

export default function DashboardPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền truy cập dashboard
  React.useEffect(() => {
    if (!hasPermission("dashboard")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin/profile")
    }
  }, [hasPermission, router])

  const [data, setData] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true)
      try {
        const response = await api.get("/admin/dashboard")

        if (response.data.success) {
          setData(response.data.data)
        } else {
          toast.error(response.data.message || "Đã có lỗi xảy ra")
        }
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message || "Không thể kết nối với máy chủ API")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const stats = [
    {
      title: "Số lượng giáo viên",
      value: data?.total_teacher ?? 0,
      description: "Đội ngũ chuyên gia",
      icon: Users,
      color: "primary",
      bg: "primary/10",
    },
    {
      title: "Số lượng khóa học",
      value: data?.total_course ?? 0,
      description: "Nội dung đào tạo",
      icon: BookOpen,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Số lượng học sinh",
      value: data?.total_student?.toLocaleString() ?? 0,
      description: "Học viên đang học",
      icon: GraduationCap,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Số lượng học sinh mới",
      value: data?.total_new_student ?? 0,
      description: "Gia tăng tháng này",
      icon: UserPlus,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chào mừng trở lại, Quản trị viên!</h2>
        <p className="text-muted-foreground">
          Dưới đây là tổng quan về hệ thống GoEdu của bạn hôm nay.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="size-3 text-green-500" />
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Biểu đồ tăng trưởng</CardTitle>
            <CardDescription>
              Số lượng học sinh đăng ký mới trong 6 tháng qua.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {isLoading ? (
              <div className="h-full w-full flex flex-col gap-4">
                <div className="flex-1 flex items-end gap-2 px-10">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className={`flex-1`} style={{ height: `${20 + i * 10}%` }} />
                  ))}
                </div>
                <div className="h-4 flex gap-2 px-10">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="flex-1 h-full" />
                  ))}
                </div>
              </div>
            ) : data?.student_growth ? (
              <GrowthChart data={data.student_growth} />
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg">
                <span className="text-muted-foreground">Không có dữ liệu biểu đồ</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Các sự kiện mới nhất trên hệ thống.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                    {i}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Học sinh mới đăng ký
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {i * 2} phút trước
                    </p>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
