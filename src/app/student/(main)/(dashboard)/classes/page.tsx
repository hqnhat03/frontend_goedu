"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import {
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  Users
} from "lucide-react"
import Link from "next/link"
import React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

interface Teacher {
  id: number;
  name: string;
  avatar: string | null;
}

interface Schedule {
  id: string;
  class_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface StudentClass {
  id: number;
  class_code: string;
  status: string;
  teachers: Teacher[];
  schedules: Schedule[];
}

const formatTime = (time: string) => {
  return time.substring(0, 5);
};

const getShortDayName = (day: number) => {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return days[day];
};

const groupSchedulesByTime = (schedules: Schedule[]) => {
  const groups: Record<string, number[]> = {};
  schedules.forEach((s) => {
    const timeKey = `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`;
    if (!groups[timeKey]) groups[timeKey] = [];
    groups[timeKey].push(s.day_of_week);
  });

  return Object.entries(groups).map(([time, days]) => ({
    time,
    days: days.sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)),
  }));
};

export default function MyClassesPage() {
  const [data, setData] = React.useState<StudentClass[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/student/classes");
        setData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Lớp học của tôi</h1>
        </div>
        <p className="text-slate-500 text-lg">Quản lý và theo dõi tiến độ các lớp học bạn đang tham gia.</p>
      </div>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">Chưa có lớp học nào</h3>
          <p className="text-slate-500">Bạn chưa đăng ký tham gia lớp học nào trong hệ thống.</p>
          <Button className="mt-6 bg-blue-600 hover:bg-blue-700">Khám phá khóa học</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((cls) => {
            const groupedSchedules = groupSchedulesByTime(cls.schedules);

            return (
              <Card key={cls.id} className="group relative overflow-hidden transition-all duration-300 border-slate-200 bg-white flex flex-col h-full">
                <CardHeader className="p-6 pb-4 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate">
                        {cls.class_code}
                      </h3>
                    </div>
                    <Badge variant={cls.status === "published" ? "default" : "secondary"} className={`
                      shrink-0
                      ${cls.status === "published" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-200 text-slate-700"}
                      px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter
                    `}>
                      {cls.status === "published" ? "Đang học" : cls.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3 overflow-hidden shrink-0">
                      {cls.teachers.slice(0, 2).map((teacher) => (
                        <Avatar key={teacher.id} className="border-2 border-white h-10 w-10 ring-2 ring-slate-50">
                          <AvatarImage src={teacher.avatar || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-[10px]">
                            {teacher.name.substring(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {cls.teachers.length > 2 && (
                        <div className="relative z-10 flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 border-2 border-white text-[10px] font-bold text-slate-600 ring-2 ring-slate-50">
                          +{cls.teachers.length - 2}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="cursor-help min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {cls.teachers[0]?.name}
                                {cls.teachers.length > 1 && (
                                  <span className="text-blue-500 font-medium"> +{cls.teachers.length - 1} khác</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tight">
                                <Users className="h-2.5 w-2.5 text-blue-500/50" /> Giáo viên
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-slate-900 text-white border-none p-3 shadow-xl max-w-xs">
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 pb-1 mb-2">Đội ngũ giảng viên</p>
                              {cls.teachers.map(t => (
                                <div key={t.id} className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                  <span className="text-xs font-medium">{t.name}</span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-6 flex-1 flex flex-col">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Lịch học trong tuần
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {groupedSchedules.length > 0 ? (
                        groupedSchedules.map((group, idx) => (
                          <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl bg-blue-50/50 transition-colors border border-blue-100">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1 flex-wrap">
                                {group.days.map(day => (
                                  <Badge key={day} variant="outline" className={`text-[10px] px-1.5 py-0 border-none font-bold ${day === 0 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                                    {getShortDayName(day)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-500 italic">Thời gian:</span>
                              <span className="text-sm font-mono font-bold text-slate-700">
                                {group.time}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400 italic text-center py-2">Chưa cập nhật lịch học</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 mt-auto">
                    <Link href={`/classes/${cls.class_code}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-bold group/btn shadow-lg shadow-blue-200">
                        Vào lớp học
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  )
}
