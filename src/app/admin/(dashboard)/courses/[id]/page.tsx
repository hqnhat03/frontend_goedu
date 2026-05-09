"use client"

import {
  ArrowLeft,
  BookOpen,
  Edit,
  FileText,
  GraduationCap,
  Layers,
  LayoutGrid,
  Users
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"

import { Can } from "@/components/auth/can"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import Image from "next/image"
import { toast } from "sonner"

interface CourseDetail {
  id: number
  name: string
  slug: string
  description: string
  status: "draft" | "published" | "archived"
  image_url: string
  price: string
  level: string
  subject: string
  class_rooms_count: number
  student_count: number
  target_student: "all" | "student" | "employee"
  lesson_count: number
  completion_time: number
  course_materials: CourseMaterialType[]
}

interface CourseMaterialType {
  id: number
  name: string
  link_url: string
}

type StatusType = "draft" | "published" | "archived"


const targetStudentConfig: Record<string, { label: string; color: string }> = {
  all: { label: "Tất cả", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  student: { label: "Học sinh", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  employee: { label: "Nhân viên", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền
  React.useEffect(() => {
    if (!hasPermission("course_detail")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/courses")
    }
  }, [hasPermission, router])

  const [course, setCourse] = React.useState<CourseDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)


  const fetchCourseData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/admin/courses/${params.id}`)
      const result = response.data
      if (response.status === 200 && result.success) {
        setCourse(result.data)
      } else {
        toast.error(result.message || "Không thể tải thông tin khóa học")
        router.push("/courses")
      }
    } catch (error) {
      console.error("Failed to fetch course details:", error)
      toast.error("Có lỗi xảy ra khi tải thông tin khóa học")
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  React.useEffect(() => {
    if (params.id) {
      fetchCourseData()
    }
  }, [fetchCourseData, params.id])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="md:col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!course) return null

  // Format price
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(course.price || 0))

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/courses">
            <Button variant="ghost" size="icon" className="hover:bg-muted/50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {course.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded-md text-xs">ID: {course.id}</span>
              • Chi tiết khóa học
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Can permission="class_list">
            <Link href={`/admin/courses/${course.id}/classes?course_name=${encodeURIComponent(course.name)}`}>
              <Button variant="outline" className="gap-2 shadow-sm bg-background hover:bg-primary/5 hover:text-primary border-primary/20 transition-all">
                <LayoutGrid className="h-4 w-4" />
                Lớp học
              </Button>
            </Link>
          </Can>
          <Can permission="student_in_course_list">
            <Link href={`/courses/${course.id}/students`}>
              <Button variant="outline" className="gap-2 shadow-sm bg-background hover:bg-primary/5 hover:text-primary border-primary/20 transition-all">
                <Users className="h-4 w-4" />
                Học sinh
              </Button>
            </Link>
          </Can>
          <Can permission="course_edit">
            <Button variant="outline" className="gap-2 shadow-sm" onClick={() => router.push(`/admin/courses/${course.id}/edit`)}>
              <Edit className="h-4 w-4" />
              Chỉnh sửa
            </Button>
          </Can>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card className="border-none shadow-md overflow-hidden bg-gradient-to-b from-card to-muted/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Course Image - Portrait / Book ratio */}
                <div className="w-full md:w-56 shrink-0">
                  <div className="aspect-[3/4] relative rounded-xl overflow-hidden shadow-xl ring-1 ring-border bg-muted group">
                    {course.image_url ? (
                      <Image
                        src={course.image_url}
                        alt={course.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        width={300}
                        height={400}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 bg-primary/5 gap-2">
                        <BookOpen className="h-12 w-12" />
                        <span className="text-xs font-medium">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 shadow-sm transition-all">
                        {course.subject}
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1 text-sm shadow-sm bg-background">
                        {course.level}
                      </Badge>
                      <Badge variant="outline" className={`px-3 py-1 text-sm shadow-none font-medium ${targetStudentConfig[course.target_student]?.color || ""}`}>
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        {targetStudentConfig[course.target_student]?.label || course.target_student}
                      </Badge>
                      <StatusBadge status={course.status as StatusType} className="px-3 py-1 text-sm shadow-none font-medium rounded-md ml-auto" />
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Mô tả khóa học
                      </h3>
                      <div 
                        className="text-muted-foreground leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: course.description }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
                    <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-card border shadow-sm">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Bài học</span>
                      <span className="text-lg font-bold">{course.lesson_count}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-card border shadow-sm">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Thời gian</span>
                      <span className="text-lg font-bold">{course.completion_time} <span className="text-xs font-normal">phút</span></span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-primary/5 border border-primary/20 shadow-sm text-primary">
                      <span className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">Giá bán</span>
                      <span className="text-lg font-bold">{formattedPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Materials */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Tài liệu khóa học ({course.course_materials?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {course.course_materials && course.course_materials.length > 0 ? (
                <ul className="space-y-3">
                  {course.course_materials.map((material, idx) => (
                    <li key={idx} className="flex items-center p-3 rounded-lg border bg-muted/30 group">
                      <FileText className="h-5 w-5 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      {material.link_url ? (
                        <Link
                          href={material.link_url}
                          target="_blank"
                          className="flex-1 font-medium hover:text-primary hover:underline transition-colors line-clamp-1 pr-2"
                          title={material.name || `Tài liệu ${idx + 1}`}
                        >
                          {material.name || `Tài liệu ${idx + 1}`}
                        </Link>
                      ) : (
                        <span className="flex-1 font-medium line-clamp-1 pr-2">{material.name || `Tài liệu ${idx + 1}`}</span>
                      )}
                      {material.link_url && (
                        <Link href={material.link_url} target="_blank" className="shrink-0">
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">Xem</Button>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center p-8 bg-muted/20 rounded-xl border border-dashed flex flex-col items-center justify-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Hiện chưa có tài liệu nào cho khóa học này.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="bg-primary/5 p-4 border-b">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Thông tin chung
              </h3>
            </div>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground font-medium">Trạng thái</span>
                  <StatusBadge status={course.status as StatusType} className="shadow-none rounded-md" />
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground font-medium">Môn học</span>
                  <span className="font-medium text-sm">{course.subject}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground font-medium">Trình độ</span>
                  <span className="font-medium text-sm">{course.level}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground font-medium">Đối tượng</span>
                  <span className="font-medium text-sm">{targetStudentConfig[course.target_student]?.label || course.target_student}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors bg-primary/5">
                  <span className="text-sm font-semibold text-primary/80">Giá bán</span>
                  <span className="font-bold text-primary">{formattedPrice}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
