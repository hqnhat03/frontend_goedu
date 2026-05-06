"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { AxiosError } from "axios"
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  GraduationCap,
  Tag,
  Users
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Teacher {
  id: number
  name: string
  avatar: string | null
}

interface Schedule {
  day_of_week: number
  start_time: string
  end_time: string
}

interface Classroom {
  id: number
  class_code: string
  start_day: string
  end_day: string
  is_full: boolean
  teachers: Teacher[]
  schedules: Schedule[]
}

interface Subject {
  id: number
  name: string
  category: string
}

interface CourseDetail {
  id: number
  name: string
  slug: string
  description: string
  is_full: boolean
  target_student: string
  price: string
  full_price?: string
  lesson_count: number
  completion_time: number
  image_url: string
  level_id: number
  subject_id: number
  class_rooms_count: number
  enrolled_students_count: number
  class_rooms: Classroom[]
  subject: Subject
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const DAY_NAMES: Record<number, string> = {
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
  7: "Chủ Nhật",
}

function formatCurrency(amount: string | number): string {
  const num = Number(amount)
  if (num === 0) return "Miễn phí"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num)
}

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function formatDate(date: string): string {
  if (!date) return "—"
  const d = new Date(date)
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatBadge({
  icon: Icon,
  label,
  className,
}: {
  icon: React.ElementType
  label: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground",
        className
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </div>
  )
}

function ClassroomCard({ room }: { room: Classroom }) {
  const allTeachers = room.teachers
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 bg-muted/40 border-b cursor-pointer hover:bg-muted/60 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Lớp học: {room.class_code}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(room.start_day)} – {formatDate(room.end_day)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={room.is_full ? "destructive" : "default"}
            className="capitalize text-xs"
          >
            {room.is_full ? "Lớp đã đầy" : "Đang mở"}
          </Badge>
          <ChevronDown
            className={cn("size-5 text-muted-foreground transition-transform duration-200", {
              "rotate-180": isOpen
            })}
          />
        </div>
      </div>

      {isOpen && (
        <div className="p-5 flex flex-col gap-5 animate-in slide-in-from-top-2 fade-in duration-200">
          {/* Teachers */}
          {allTeachers.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Giáo viên
              </p>
              <div className="flex flex-col gap-2">
                {allTeachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center gap-3">
                    <Avatar className="size-8 border-2 border-background">
                      <AvatarImage src={teacher.avatar ?? undefined} alt={teacher.name} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                        {teacher.name?.[0]?.toUpperCase() ?? "T"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{teacher.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allTeachers.length > 0 && room.schedules.length > 0 && <Separator />}

          {/* Schedules */}
          {room.schedules.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Lịch học
              </p>
              <div className="flex flex-col gap-2">
                {room.schedules.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="size-4 text-primary" />
                      <span>{DAY_NAMES[s.day_of_week] ?? `Ngày ${s.day_of_week}`}</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">
                      {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allTeachers.length === 0 && room.schedules.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Chưa có thông tin giáo viên và lịch học.</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeleton loading state                                              */
/* ------------------------------------------------------------------ */

function CourseDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Skeleton className="h-5 w-40 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Skeleton className="w-full aspect-video rounded-2xl" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <div className="flex gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRegDialog, setShowRegDialog] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const { user } = useAuthStore()

  useEffect(() => {
    if (user && showRegDialog) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }))
    }
  }, [user, showRegDialog])


  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Vui lòng điền đầy đủ thông tin.")
      return
    }

    try {
      setIsRegistering(true)
      const res = await api.post(`/student/courses/${course?.id}/register`, formData)

      if (res.data.success) {
        toast.success("Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn để hoàn tất thủ tục.", {
          description: "Cảm ơn bạn đã quan tâm đến khóa học.",
        })
        setShowRegDialog(false)
        setFormData({ name: "", email: "", phone: "" }) // Reset form
      } else {
        toast.error(res.data.message || "Đăng ký thất bại. Vui lòng thử lại.")
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Không thể thực hiện đăng ký lúc này.")
      }
    } finally {
      setIsRegistering(false)
    }
  }

  useEffect(() => {
    if (!slug) return
    const fetchCourse = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await api.get(`/student/courses/${slug}`)
        if (res.data.success) {
          setCourse(res.data.data)
        } else {
          setError(res.data.message ?? "Không thể tải dữ liệu khóa học.")
        }
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại.")
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchCourse()
  }, [slug])

  if (isLoading) return <CourseDetailSkeleton />

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-7xl text-center">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-destructive/10 mb-4">
          <BookOpen className="size-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy khóa học</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.back()}>
          <ChevronLeft data-icon="inline-start" />
          Quay lại
        </Button>
      </div>
    )
  }

  const isFree = Number(course.price) === 0
  const allTeachers = Array.from(
    new Map(
      course.class_rooms.flatMap((r) => r.teachers).map((t) => [t.id, t])
    ).values()
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
        <Link href="/courses" className="hover:text-foreground transition-colors">
          Khóa học
        </Link>
        <ChevronLeft className="size-4 rotate-180" />
        <span className="text-foreground font-medium truncate max-w-xs">{course.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ── Left: Main content ── */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Hero Section with Portrait Image */}
          <div className="flex flex-col md:flex-row gap-8 bg-card rounded-2xl p-6 border shadow-sm overflow-hidden">
            <div className="w-full md:w-64 shrink-0 mx-auto">
              <div className="aspect-[3/4] relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-border bg-muted group">
                {/* Glassmorphism Background for handling any image ratio */}
                <div
                  className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                  style={{ backgroundImage: `url(${course.image_url})` }}
                />
                <Image
                  src={course.image_url || "https://placehold.co/600x800.png?text=No+Image"}
                  alt={course.name}
                  className="relative object-contain w-full h-full transition-transform duration-700 group-hover:scale-105"
                  width={400}
                  height={533}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-wider shadow-lg">
                    {course.subject?.name ?? "Chung"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center py-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest">
                  <Tag className="size-3" />
                  <span>{course.subject?.category || "Khóa học"}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  {course.name}
                </h1>

                <div className="flex flex-wrap gap-3 mt-4">
                  <StatBadge icon={BookOpen} label={`${course.lesson_count} bài học`} className="bg-primary/5 text-primary border border-primary/10" />
                  <StatBadge icon={Clock} label={`${course.completion_time} giờ`} />
                  <StatBadge icon={Users} label={`${course.enrolled_students_count} học viên`} />
                </div>

                <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-dashed border-muted-foreground/20">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    &quot;Khám phá lộ trình học tập chuyên nghiệp cùng đội ngũ giáo viên tận tâm tại GoEdu. Khóa học được thiết kế tối ưu cho trình độ của bạn.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs: Mô tả / Lớp học */}
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">Mô tả khóa học</TabsTrigger>
              <TabsTrigger value="classrooms">
                Lớp học ({course.class_rooms.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {course.description ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
                    {course.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">Chưa có mô tả cho khóa học này.</p>
                )}
              </div>

              {/* Features */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  `${course.lesson_count} bài học chất lượng cao`,
                  `${course.completion_time} giờ học toàn bộ khóa`,
                  "Giáo viên kinh nghiệm, tận tâm",
                  "Lịch học linh hoạt theo lớp",
                  "Tài liệu học tập đầy đủ",
                  "Hỗ trợ học viên trực tiếp",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="classrooms" className="mt-6">
              {course.class_rooms.length === 0 ? (
                <div className="py-12 text-center border border-dashed rounded-xl">
                  <GraduationCap className="size-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Chưa có lớp học nào được mở.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {course.class_rooms.map((room) => (
                    <ClassroomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right: Sidebar / CTA ── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          {/* Price card */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-6 flex flex-col gap-5">
              {/* Price */}
              <div>
                {course.full_price && (
                  <div className="text-sm text-muted-foreground mb-2 font-medium flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-bold uppercase tracking-wider border-primary/30 text-primary">Trọn khóa</Badge>
                    <span className="text-base">{formatCurrency(course.full_price)}</span>
                  </div>
                )}
                <div
                  className={cn(
                    "text-3xl font-extrabold tracking-tight",
                    isFree ? "text-emerald-500" : "text-primary"
                  )}
                >
                  {formatCurrency(course.price)}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full font-semibold text-base"
                onClick={() => setShowRegDialog(true)}
                disabled={course.is_full}
              >
                {course.is_full ? "Lớp đã đầy" : "Đăng ký ngay"}
              </Button>

              <Separator />

              {/* Quick info */}
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <BookOpen className="size-4" /> Bài học
                  </span>
                  <span className="font-medium">{course.lesson_count} bài</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="size-4" /> Thời lượng
                  </span>
                  <span className="font-medium">{course.completion_time} giờ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="size-4" /> Môn học
                  </span>
                  <span className="font-medium">{course.subject?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="size-4" /> Lớp học
                  </span>
                  <span className="font-medium">{course.class_rooms_count} lớp</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="size-4" /> Học viên
                  </span>
                  <span className="font-medium">{course.enrolled_students_count}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Teachers quick card */}
          {allTeachers.length > 0 && (
            <div className="rounded-2xl border bg-card shadow-sm p-5">
              <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
                Đội ngũ giáo viên
              </h3>
              <div className="flex flex-col gap-3">
                {allTeachers.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <Avatar className="size-10 border-2 border-background">
                      <AvatarImage src={t.avatar ?? undefined} alt={t.name} />
                      <AvatarFallback className="text-sm bg-primary/10 text-primary font-bold">
                        {t.name?.[0]?.toUpperCase() ?? "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{t.name}</p>
                      <p className="text-xs text-muted-foreground">Giáo viên</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={showRegDialog} onOpenChange={setShowRegDialog}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="size-6 text-primary" />
                Đăng ký nhận tư vấn
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground">
                Khóa học: <span className="text-foreground">{course.name}</span>
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={onRegister} className="p-6 flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold"> Họ và tên <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Nguyễn Văn A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold"> Địa chỉ Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold"> Số điện thoại <span className="text-destructive">*</span></Label>
              <Input
                id="phone"
                type="tel"
                placeholder="09xx xxx xxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="h-11 rounded-lg"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl active:scale-95"
                disabled={isRegistering || course.is_full}
              >
                {isRegistering ? "Đang xử lý..." : (course.is_full ? "Lớp đã đầy" : "Đăng ký học")}
              </Button>
            </div>
          </form>

          <div className="p-4 bg-muted/30 border-t flex items-center gap-3">
            <div className="size-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Users className="size-4 text-orange-600" />
            </div>
            <p className="text-[12px] text-muted-foreground italic">
              Thông tin của bạn sẽ được bảo mật tuyệt đối. Chúng tôi sẽ gọi lại để tư vấn lộ trình phù hợp.
            </p>
          </div>

          {isRegistering && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-3">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-base font-semibold text-primary">Đang gửi yêu cầu...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
