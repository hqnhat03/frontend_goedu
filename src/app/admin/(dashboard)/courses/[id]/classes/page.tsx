"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  Plus,
  RefreshCw,
  Search,
  Users,
  BookOpen,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, CommonStatus } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import api from "@/lib/axios"
import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"

interface Teacher {
  id: number
  name: string
}

interface ClassItem {
  id: number
  class_code: string
  start_day: string
  end_day: string
  status: string
  teachers: Teacher[]
  student_count: number
}

// Hàm giúp chuyển đổi các trạng thái legacy (nếu có) sang CommonStatus
const mapStatus = (status: string): CommonStatus => {
  const s = status?.toLowerCase() || ""
  if (["published", "active", "đang học", "in_progress"].some(k => s.includes(k))) return "published"
  if (['archived', 'cancelled', 'đã hủy', 'hủy'].some(k => s.includes(k))) return "archived"
  return "draft"
}

export default function CourseClassesPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền
  React.useEffect(() => {
    if (!hasPermission("class_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push(`/admin/courses/${params.id}`)
    }
  }, [hasPermission, router, params.id])

  const [classes, setClasses] = React.useState<ClassItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")


  const fetchClasses = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/admin/classes`, {
        params: { course_id: params.id }
      })
      const result = response.data
      if (response.status === 200) {
        // API có thể trả về array trực tiếp hoặc bọc trong "data"
        const classData = result.data || result
        if (Array.isArray(classData)) {
          setClasses(classData)
        } else if (classData && Array.isArray(classData.data)) {
          setClasses(classData.data)
        } else {
          setClasses([])
        }
      } else {
        toast.error(result.message || "Không thể tải danh sách lớp học")
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error)
      toast.error("Có lỗi xảy ra khi tải danh sách lớp học")
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  React.useEffect(() => {
    if (params.id) {
      fetchClasses()
    }
  }, [fetchClasses, params.id])

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleDateString("vi-VN")
    } catch {
      return dateString
    }
  }

  const filteredClasses = classes.filter((c) =>
    c.class_code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/courses/${params.id}`}>
            <Button variant="ghost" size="icon" className="hover:bg-muted/50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Danh sách lớp học
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded-md text-xs">ID Khóa: {params.id}</span>
              • Quản lý các lớp thuộc khóa học
            </p>
          </div>
        </div>

        <Can permission="class_create">
          <div className="flex items-center gap-3">
            {/* Link to create class within this course context */}
            <Link href={`/courses/${params.id}/classes/create`}>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" /> Thêm lớp học
              </Button>
            </Link>
          </div>
        </Can>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-end">
            <div className="relative w-full sm:w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã lớp học..."
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              className="w-full sm:w-auto sm:ml-auto bg-background hover:bg-muted transition-colors border-dashed"
              onClick={fetchClasses}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold py-4">Mã lớp</TableHead>
                <TableHead className="font-semibold py-4">Giáo viên phụ trách</TableHead>
                <TableHead className="font-semibold py-4 text-center">Học viên</TableHead>
                <TableHead className="font-semibold py-4">Thời gian</TableHead>
                <TableHead className="font-semibold py-4">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold py-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-8 w-8 animate-spin opacity-20" />
                      <p>Đang tải danh sách lớp học...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="h-8 w-8 opacity-20" />
                      <p>{search ? "Không tìm thấy lớp học nào phù hợp." : "Chưa có lớp học nào cho khóa này."}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((item) => {
                  const mappedStatus = mapStatus(item.status)
                  return (
                    <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium text-foreground/90 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <BookOpen className="size-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold">{item.class_code}</span>
                            <span className="text-xs text-muted-foreground">ID: {item.id}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          {item.teachers && item.teachers.length > 0 ? (
                            item.teachers.map((t) => (
                              <span key={t.id} className="text-sm font-medium flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-primary/60"></span>
                                {t.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Chưa phân công</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge variant="secondary" className="font-medium px-2 py-0.5">
                          <Users className="w-3 h-3 mr-1.5" />
                          {item.student_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1.5 text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Bắt đầu:</span>
                            <span className="text-foreground font-medium">{formatDate(item.start_day)}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Kết thúc:</span>
                            <span className="text-foreground font-medium">{formatDate(item.end_day)}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusBadge status={mappedStatus} className="shadow-none" />
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Link href={`/classes/${item.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
                          >
                            Chi tiết
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
