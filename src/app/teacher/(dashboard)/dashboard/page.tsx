"use client"

import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  Video
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { useAuthStore } from "@/store/auth-store"
import Link from "next/link"

interface DashboardStats {
  total_classes: number;
  total_students: number;
  sessions_per_week: number;
  attendance_rate: number;
}

interface ScheduleItem {
  id: number;
  class_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  class_code: string;
  meeting_url: string;
}



export default function TeacherDashboard() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [dailySchedule, setDailySchedule] = React.useState<ScheduleItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [scheduleLoading, setScheduleLoading] = React.useState(true)
  const { user } = useAuthStore()

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/teacher/dashboard/stats")
        // Check if response data is wrapped in a 'data' field or success property as seen in schedule page
        if (response.data) {
          // If the backend returns directly or wrapped
          setStats(response.data.data || response.data)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchDailySchedule = async () => {
      try {
        const response = await api.get("/teacher/schedules/day")
        if (response.data?.success) {
          setDailySchedule(response.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch daily schedule:", error)
      } finally {
        setScheduleLoading(false)
      }
    }

    fetchStats()
    fetchDailySchedule()
  }, [])

  const statCards = [
    {
      title: "Tổng số lớp",
      value: stats?.total_classes ?? "0",
      description: "Đang được phân công",
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-100/50",
    },
    {
      title: "Học sinh",
      value: stats?.total_students ?? "0",
      description: "Tổng số học sinh quản lý",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100/50",
    },
    {
      title: "Tiết học (Tuần)",
      value: stats?.sessions_per_week ?? "0",
      description: "Số tiết trong tuần này",
      icon: Calendar,
      color: "text-orange-600",
      bg: "bg-orange-100/50",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            {user?.name ? `Chào buổi sáng, ${user.name}! 👋` : "Chào buổi sáng! 👋"}
          </h2>
          <p className="text-muted-foreground font-medium">Bảng điều khiển giáo viên - Quản lý lớp học và lịch giảng dạy chuyên nghiệp.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/20">
          <Clock className="size-3" />
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-background/60 backdrop-blur-sm transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${stat.bg} opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-500`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg} relative z-10`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium flex items-center gap-1">
                    {stat.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/10 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <Clock className="size-4" />
              </div>
              Lịch dạy hôm nay
            </CardTitle>
            <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Danh sách các tiết dạy trong ngày</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {scheduleLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border/20 bg-muted/5">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-4">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))
            ) : dailySchedule.length > 0 ? (
              dailySchedule.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border/20 bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group">
                  <div className="space-y-1">
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">Lớp {item.class_code}</p>
                    <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3 text-primary/60" /> {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3 text-primary/60" /> {item.date}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === 'scheduled' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                      {item.status === 'scheduled' ? 'Sắp diễn ra' : item.status}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.meeting_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-[11px] font-bold border-primary/20 hover:bg-primary/5 text-primary gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(item.meeting_url, '_blank');
                          }}
                        >
                          <Video className="size-3.5" />
                          VÀO LỚP HỌC
                        </Button>
                      )}
                      <Link
                        href={`/teacher/sessions/${item.id}/attendance`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          className="h-8 px-3 text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5"
                        >
                          <CheckCircle2 className="size-3.5" />
                          ĐIỂM DANH
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-lg border border-dashed border-border/40">
                <Calendar className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Không có lịch dạy cho ngày hôm nay</p>
              </div>
            )}
            {/* <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/5 gap-2 text-xs font-bold uppercase tracking-widest h-10 border border-primary/5 mt-2">
              <Link href="/schedule">
                Xem toàn bộ lịch dạy <ArrowRight className="size-4" />
              </Link>
            </Button> */}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
          <CardHeader className="border-b border-border/10 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-2 rounded-md bg-orange-100 text-orange-600">
                <Users className="size-4" />
              </div>
              Thông báo mới
            </CardTitle>
            <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Thông tin quan trọng từ hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20 group hover:border-blue-400/30 transition-colors cursor-pointer">
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Hệ thống</p>
              <p className="text-sm font-bold mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Cập nhật giáo trình Toán 12</p>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">Hệ thống vừa cập nhật các bài giảng và bài tập trắc nghiệm mới cho chương trình Toán 12 Tập 2...</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20 group hover:border-emerald-400/30 transition-colors cursor-pointer">
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Tin nhắn</p>
              <p className="text-sm font-bold mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Phụ huynh em Nguyễn Văn B</p>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">&quot;Chào thầy, gia đình muốn xin phép cho em B nghỉ học ngày mai vì lý do sức khỏe...&quot;</p>
            </div>
            <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-widest h-10 border-muted-foreground/10 hover:bg-muted/10">
              Xem tất cả thông báo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
