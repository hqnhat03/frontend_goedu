"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthStore } from "@/store/auth-store"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  PlayCircle,
  Trophy,
  Users
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function StudentDashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Chào mừng trở lại, {user?.name}! 👋</h1>
        <p className="text-slate-500 mt-2">Hôm nay bạn có 2 buổi học cần tham gia.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Khóa học đang học", value: "3", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Giờ đã học", value: "48h", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { title: "Khóa học hoàn thành", value: "12", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { title: "Chứng chỉ đạt được", value: "5", icon: Trophy, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1 text-slate-900">{stat.value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Classes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Lớp học hiện tại</h2>
            <Link href="/student/dashboard/my-classes">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="group border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  <div className="w-full md:w-48 h-32 relative shrink-0">
                    <Image
                      src={`https://images.unsplash.com/photo-${i === 1 ? '1516321318423-f06f85e504b3' : '1501504905953-f83149be9900'}?q=80&w=300&auto=format&fit=crop`}
                      alt="Course thumbnail"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="text-white size-10" />
                    </div>
                  </div>
                  <div className="p-5 flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Tiếng Anh</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GĐ: 2/4</span>
                      </div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {i === 1 ? 'IELTS Intensive 6.5+' : 'Toeic Speaking Masterclass'}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={14} /> T2, T4, T6</span>
                        <span className="flex items-center gap-1"><Users size={14} /> 15 Học viên</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-[65%]"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600">65%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Schedule Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Lịch học tiếp theo</h2>
            <Link href="/student/schedule">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                Chi tiết
              </Button>
            </Link>
          </div>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b bg-blue-50/50">
                <span className="text-xs font-bold text-blue-700">Hôm nay, 22 Tháng 4</span>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { time: "18:30", name: "IELTS Intensive", room: "Phòng 302" },
                  { time: "20:00", name: "Toeic Speaking", room: "Online (Zoom)" }
                ].map((item, i) => (
                  <div key={i} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="text-sm font-bold text-slate-900 shrink-0 w-12">{item.time}</div>
                    <div className="h-10 w-[2px] bg-blue-200 shrink-0"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-xl shadow-md shadow-blue-200">
            Vào lớp học Online
          </Button>
        </div>
      </div>
    </div>
  )
}
