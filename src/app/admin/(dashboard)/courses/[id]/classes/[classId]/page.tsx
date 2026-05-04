"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  GraduationCap,
  Link as LinkIcon,
  Mail,
  MoreVertical,
  Pencil,
  Users,
  Video,
  CheckCircle2,
  Clock3,
  Archive,
  UserCheck,
  Building2,
} from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/axios"
import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Skeleton } from "@/components/ui/skeleton"
import { useClassStore } from "@/store/class-store"

// Types based on API response
interface Teacher {
  id: number | string
  name: string
  avatar?: string
  email?: string
}

interface Student {
  id: number | string
  name: string
  avatar?: string
  email?: string
}

interface ClassSchedule {
  id: number | string
  day_of_week: number | string
  start_time: string
  end_time: string
}

interface ClassDetail {
  id: number
  class_code: string
  start_day: string
  end_day: string
  max_student: number
  meeting_url: string
  status: "draft" | "published" | "archived" | string
  teachers: Teacher[]
  students: Student[]
  class_schedules: ClassSchedule[]
}

const dayMap: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  0: "Chủ nhật"
}

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ")

const getStatusConfig = (status: string) => {
  switch (status?.toLowerCase()) {
    case "published":
      return {
        label: "Đã xuất bản",
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
        tooltip: "Lớp học đã được công khai và có thể bắt đầu",
      }
    case "draft":
      return {
        label: "Bản nháp",
        color: "bg-slate-500/10 text-slate-600 border-slate-200",
        icon: <Clock3 className="w-3.5 h-3.5 mr-1" />,
        tooltip: "Lớp học đang trong quá trình chuẩn bị",
      }
    case "archived":
      return {
        label: "Lưu trữ",
        color: "bg-rose-500/10 text-rose-600 border-rose-200",
        icon: <Archive className="w-3.5 h-3.5 mr-1" />,
        tooltip: "Lớp học đã kết thúc hoặc bị tạm dừng",
      }
    default:
      return {
        label: status || "N/A",
        color: "bg-primary/10 text-primary border-primary/20",
        icon: null,
        tooltip: "Trạng thái không xác định",
      }
  }
}

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền
  React.useEffect(() => {
    if (!hasPermission("class_detail")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.back()
    }
  }, [hasPermission, router])

  const { classDetail: data, setClassDetail: setData } = useClassStore()
  const [isLoading, setIsLoading] = React.useState(!data || String(data.id) !== String(params.classId))
  const [error, setError] = React.useState<string | null>(null)


  const fetchClassDetail = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get(`/admin/classes/${params.classId}`)
      const result = response.data
      if (response.status === 200 && result.success) {
        setData(result.data)
      } else {
        const errMsg = result.message || "Không thể tải thông tin lớp học"
        setError(errMsg)
        toast.error(errMsg)
      }
    } catch (err) {
      console.error("Fetch error:", err)
      setError("Có lỗi kết nối đến máy chủ. Vui lòng thử lại sau.")
      toast.error("Lỗi kết nối API")
    } finally {
      setIsLoading(false)
    }
  }, [params.classId, setData])

  React.useEffect(() => {
    if (params.classId) {
      // If no data or data is for a different class, fetch fresh data
      if (!data || String(data.id) !== String(params.classId)) {
        fetchClassDetail()
      } else {
        setIsLoading(false)
      }
    }
  }, [fetchClassDetail, params.classId, data])

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A"
    // Handle HH:mm:ss format
    return timeString.split(":").slice(0, 2).join(":")
  }

  const handleCopyLink = () => {
    if (data?.meeting_url) {
      navigator.clipboard.writeText(data.meeting_url)
      toast.success("Đã sao chép link học tập")
    }
  }

  const handleBack = () => {
    if (params.id) {
      router.push(`/admin/courses/${params.id}/classes`)
    } else {
      router.back()
    }
  }

  if (isLoading) {
    return <ClassDetailSkeleton />
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="size-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <Archive className="size-8" />
        </div>
        <h2 className="text-xl font-semibold">{error || "Không tìm thấy dữ liệu"}</h2>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    )
  }

  const statusConfig = getStatusConfig(data.status)

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {data.class_code}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className={`cursor-default ${statusConfig.color} px-2 py-0.5 border`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{statusConfig.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-sm text-muted-foreground">• ID: {data.id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-dashed" onClick={handleCopyLink} disabled={!data.meeting_url}>
            <Copy className="mr-2 h-4 w-4" /> Copy link học
          </Button>
          <Can permission="class_edit">
            <Link href={`/admin/courses/${params.id}/classes/${params.classId}/edit`}>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
              </Button>
            </Link>
          </Can>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information Card */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary transition-all group-hover:w-2" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Thông tin chung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                      <p className="font-semibold">{formatDate(data.start_day)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ngày kết thúc</p>
                      <p className="font-semibold">{formatDate(data.end_day)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Users className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Số lượng tối đa</p>
                      <p className="font-semibold">{data.max_student} học viên</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Video className="size-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm text-muted-foreground">Link học trực tuyến</p>
                      {data.meeting_url ? (
                        <a
                          href={data.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary hover:underline flex items-center gap-1 group/link truncate"
                        >
                          {data.meeting_url}
                          <ExternalLink className="size-3 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                        </a>
                      ) : (
                        <p className="text-muted-foreground italic">Chưa có link</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 transition-all group-hover:w-2" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Lịch học
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.class_schedules?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.class_schedules
                    .slice()
                    .sort((a, b) => {
                      const dayA = a.day_of_week === 0 ? 7 : Number(a.day_of_week);
                      const dayB = b.day_of_week === 0 ? 7 : Number(b.day_of_week);
                      return dayA - dayB;
                    })
                    .map((schedule, idx) => {
                    const dayLabel = dayMap[schedule.day_of_week as number] || String(schedule.day_of_week)
                    return (
                      <div
                        key={schedule.id || idx}
                        className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-background transition-colors group/item"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-sm">
                            {dayLabel.replace("Thứ ", "T").replace("Chủ nhật", "CN")}
                          </div>
                          <div>
                            <p className="font-semibold">{dayLabel}</p>
                            <p className="text-xs text-muted-foreground">Cố định hàng tuần</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground italic border-2 border-dashed rounded-xl flex flex-col items-center gap-2">
                  <Clock3 className="size-10 opacity-20" />
                  <p>Chưa thiết lập lịch học cho lớp này</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students Card */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transition-all group-hover:w-2" />
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  Danh sách học viên
                </CardTitle>
                <CardDescription>
                  {data.students?.length || 0} học viên đã đăng ký
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {data.students?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.students.map((student) => (
                    <div
                      key={student.id}
                      className="inline-flex items-center gap-2 p-1.5 pr-3 rounded-lg border bg-background/50 hover:border-blue-200 transition-all hover:shadow-sm group/student"
                    >
                      <Avatar className="size-8 border">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-[10px]">
                          {student.name?.substring(0, 2).toUpperCase() || "ST"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground whitespace-nowrap group-hover/student:text-blue-600 transition-colors">
                        {student.name || "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl space-y-2">
                  <Users className="size-10 opacity-20" />
                  <p>Chưa có học viên nào tham gia lớp này</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Teacher & Side info */}
        <div className="space-y-8">
          {/* Teachers Section */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 transition-all group-hover:w-2" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-500" />
                Giáo viên phụ trách
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.teachers?.length > 0 ? (
                data.teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center gap-4 p-3 rounded-xl border bg-background/50 hover:border-emerald-200 transition-all hover:shadow-md"
                  >
                    <Avatar className="size-12 border-2 border-emerald-100">
                      <AvatarImage src={teacher.avatar} alt={teacher.name} />
                      <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold">
                        {teacher.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{teacher.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="size-3" />
                        {teacher.email || "teacher@goedu.vn"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-muted-foreground italic border-2 border-dashed rounded-xl">
                  Chưa phân công giáo viên
                </div>
              )}


            </CardContent>
          </Card>

          {/* Quick Actions / Stats */}
          <Card className="border-none shadow-xl bg-primary text-primary-foreground overflow-hidden group">
            <CardHeader>
              <CardTitle className="text-lg">Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-primary-foreground/70 text-sm">Tỷ lệ lấp đầy</p>
                  <h3 className="text-3xl font-bold">
                    {Math.round(((data.students?.length || 0) / (data.max_student || 1)) * 100)}%
                  </h3>
                </div>
                <Users className="size-10 opacity-20" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>{data.students?.length || 0} / {data.max_student} học viên</span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-1000"
                    style={{ width: `${Math.min(100, ((data.students?.length || 0) / (data.max_student || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-lg text-center">
                  <p className="text-[10px] text-primary-foreground/70 uppercase font-bold tracking-wider">Trạng thái</p>
                  <p className="font-semibold capitalize text-sm">{data.status}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg text-center">
                  <p className="text-[10px] text-primary-foreground/70 uppercase font-bold tracking-wider">Lịch học</p>
                  <p className="font-semibold text-sm">{data.class_schedules?.length || 0} buổi/tuần</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ClassDetailSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[250px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
