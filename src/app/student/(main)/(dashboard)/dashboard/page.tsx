"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { useAuthStore } from "@/store/auth-store"
import {
  ArrowRight,
  Clock,
  PlayCircle,
  Users
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Teacher {
  id: number;
  name: string;
  avatar: string | null;
}

interface Schedule {
  id: string | number;
  class_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface StudentClass {
  id: number;
  class_code: string;
  status: string;
  course_name: string;
  image_url: string;
  subject_name: string;
  teachers: Teacher[];
  schedules: Schedule[];
}

interface DailySchedule {
  id: number;
  class_id: number;
  date: string;
  start_time: string;
  end_time: string;
  class_code: string;
  meeting_url: string | null;
  course_name: string;
}

const getShortDayName = (day: number) => {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return days[day];
};

const formatTime = (time: string) => {
  return time.substring(0, 5);
};

export default function StudentDashboardPage() {
  const { user } = useAuthStore()
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [dailySchedules, setDailySchedules] = useState<DailySchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [classesRes, schedulesRes] = await Promise.all([
          api.get('/student/classes'),
          api.get('/student/schedules/day')
        ])

        if (classesRes.data.success) {
          setClasses(classesRes.data.data)
        }
        if (schedulesRes.data.success) {
          setDailySchedules(schedulesRes.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Chào mừng trở lại, {user?.name}! 👋</h1>
        <p className="text-slate-500 mt-2">
          {dailySchedules.length > 0
            ? `Hôm nay bạn có ${dailySchedules.length} buổi học cần tham gia.`
            : "Hôm nay bạn không có lịch học nào."}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Classes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Lớp học hiện tại</h2>
            <Link href="/dashboard/my-classes">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    <Skeleton className="w-full md:w-48 h-32 shrink-0 rounded-none" />
                    <div className="p-5 flex-1 space-y-3">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : classes.length === 0 ? (
              <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Chưa có lớp học nào</h3>
                  <p className="text-sm text-slate-500 max-w-[200px] mt-1">Bạn chưa tham gia lớp học nào trong thời gian này.</p>
                  <Link href="/courses" className="mt-4">
                    <Button size="sm" variant="outline">Khám phá khóa học</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              classes.map((cls) => (
                <Card key={cls.id} className="group border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    <div className="w-full md:w-48 h-32 relative shrink-0">
                      <Image
                        src={cls.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300&auto=format&fit=crop"}
                        alt={cls.course_name}
                        width={300}
                        height={300}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="text-white size-10" />
                      </div>
                    </div>
                    <div className="p-5 flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{cls.subject_name || "Khóa học"}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cls.class_code}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {cls.course_name}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {cls.schedules.map(s => getShortDayName(s.day_of_week)).join(", ")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {cls.teachers[0]?.name || "Giảng viên"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Link href={`/classes/${cls.class_code}`}>
                          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 font-bold group/btn">
                            Vào lớp học
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Schedule Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Lịch học tiếp theo</h2>
            <Link href="/schedule">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                Chi tiết
              </Button>
            </Link>
          </div>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b bg-blue-50/50">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Hôm nay</span>
              </div>
              <div className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="p-4 flex items-start gap-4">
                      <Skeleton className="h-5 w-12 shrink-0" />
                      <div className="h-10 w-[2px] bg-slate-100 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : dailySchedules.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-500">Hôm nay bạn không có lịch học nào.</p>
                  </div>
                ) : (
                  dailySchedules.map((item, i) => (
                    <Link key={i} href={`/classes/${item.class_code}`}>
                      <div className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="text-sm font-bold text-slate-900 shrink-0 w-12">
                          {formatTime(item.start_time)}
                        </div>
                        <div className="h-10 w-[2px] bg-blue-200 shrink-0"></div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 leading-tight truncate">{item.course_name}</p>
                          <p className="text-xs text-slate-500 mt-1 truncate">{item.class_code}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
