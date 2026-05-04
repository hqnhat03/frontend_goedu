"use client"

import { Course, useCourseStore } from "@/store/course-store"
import {
  BookOpen,
  Edit,
  Eye,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Users,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { Can } from "@/components/auth/can"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { Level } from "@/store/level-store"
import { Subject } from "@/store/subject-store"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const targetStudentConfig: Record<string, { label: string, color: string }> = {
  all: { label: "Tất cả", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  student: { label: "Học sinh", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  employee: { label: "Nhân viên", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
}

export default function CoursesPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("course_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")
  const [targetStudent, setTargetStudent] = React.useState<string>("all")
  const [subject, setSubject] = React.useState<string>("all")
  const [level, setLevel] = React.useState<string>("all")
  const [items, setItems] = React.useState<Course[]>([])
  const [subjectsFilter, setSubjectsFilter] = React.useState<{ id: number | string, name: string }[]>([])
  const [levelsFilter, setLevelsFilter] = React.useState<{ id: number | string, name: string }[]>([])

  const statusLabel: Record<string, string> = {
    "all": "Tất cả trạng thái",
    "draft": "Bản nháp",
    "published": "Đã xuất bản",
    "archived": "Lưu trữ",
  }

  const targetStudentLabel: Record<string, string> = {
    "all": "Tất cả đối tượng",
    "student": "Học sinh",
    "employee": "Nhân viên",
  }



  const subjectMapper = React.useMemo(() => {
    return Object.fromEntries(
      subjectsFilter.map(item => [item.id, item.name])
    );
  }, [subjectsFilter]);

  const levelMapper = React.useMemo(() => {
    return Object.fromEntries(
      levelsFilter.map(item => [item.id, item.name])
    );
  }, [levelsFilter]);

  const [isLoading, setIsLoading] = React.useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [courseToDelete, setCourseToDelete] = React.useState<Course | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const { setEditingCourse } = useCourseStore()

  const fetchFilters = React.useCallback(async () => {
    try {
      const [subjectsRes, levelsRes] = await Promise.all([
        api.get("/common/subjects"),
        api.get("/common/levels")
      ])

      if (subjectsRes.status === 200) {
        const subjectsData = subjectsRes.data?.data || []
        setSubjectsFilter(subjectsData.map((s: Subject) => ({
          id: s.id,
          name: s.name
        })))
      }

      if (levelsRes.status === 200) {
        const levelsData = levelsRes.data?.data || []
        setLevelsFilter(levelsData.map((l: Level) => ({
          id: l.id,
          name: l.level
        })))
      }
    } catch (error) {
      console.error("Failed to fetch filters:", error)
    }
  }, [])

  React.useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  const fetchCourses = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        name: search,
        status: status === "all" ? "" : status,
        target_student: targetStudent === "all" ? "" : targetStudent,
        subject: subject === "all" ? "" : subject,
        level: level === "all" ? "" : level,
      })

      const response = await api.get(`/admin/courses?${queryParams}`)
      const result = response.data
      if (response.status === 200) {
        setItems(result.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error)
      toast.error("Không thể tải danh sách khóa học")
    } finally {
      setIsLoading(false)
    }
  }, [search, status, targetStudent, subject, level])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses()
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchCourses])

  const handleDelete = async () => {
    if (!courseToDelete) return
    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/courses/${courseToDelete.id}`)
      const result = response.data
      if (result.success) {
        toast.success(result.message || "Xóa khóa học thành công")
        fetchCourses()
      } else {
        toast.error(result.message || "Xóa thất bại")
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi xóa khóa học")
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setCourseToDelete(null)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
    setTargetStudent("all")
    setSubject("all")
    setLevel("all")
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Quản lý khóa học
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Quản lý danh sách khóa học, nội dung và phân phối tới đối tượng học viên.
          </p>
        </div>
        <Can permission="course_create">
          <Link href="/courses/create">
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" /> Thêm khóa học
            </Button>
          </Link>
        </Can>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-6 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên khóa học..."
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusLabel[status]} onValueChange={(val: string | null) => setStatus(val || "all")}>
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Settings2 className="h-4 w-4" />
                  <SelectValue placeholder="Trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="archived">Lưu trữ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={targetStudentLabel[targetStudent]} onValueChange={(val: string | null) => setTargetStudent(val || "all")}>
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <SelectValue placeholder="Đối tượng" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đối tượng</SelectItem>
                <SelectItem value="student">Học sinh</SelectItem>
                <SelectItem value="employee">Nhân viên</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={subject == "all" ? "Tất cả môn học" : subjectMapper[subject]}
              onValueChange={(val) => setSubject(val === "all" ? "all" : String(val))}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <SelectValue placeholder="Môn học" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả môn học</SelectItem>
                {subjectsFilter.map((s) => (
                  <SelectItem key={String(s.id)} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={level == "all" ? "Tất cả trình độ" : levelMapper[level]}
              onValueChange={(val) => setLevel(val === "all" ? "all" : String(val))}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  <SelectValue placeholder="Trình độ" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trình độ</SelectItem>
                {levelsFilter.map((l) => (
                  <SelectItem key={String(l.id)} value={String(l.id)}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="w-full bg-background hover:bg-muted transition-colors border-dashed"
              onClick={resetFilters}
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
                <TableHead className="font-semibold py-4">Tên khóa học</TableHead>
                <TableHead className="font-semibold py-4">Môn học</TableHead>
                <TableHead className="font-semibold py-4">Trình độ</TableHead>
                <TableHead className="font-semibold py-4">Đối tượng</TableHead>
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
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="h-8 w-8 opacity-20" />
                      <p>Không tìm thấy khóa học nào phù hợp.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-foreground/90 py-4 max-w-[300px]">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          {item.thumbnail ? (
                            <Image src={item.thumbnail} alt="" className="size-full object-cover rounded-lg" />
                          ) : (
                            <BookOpen className="size-5" />
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate font-semibold">{item.name}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">ID: {item.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm">{item.subject_name || "N/A"}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm">{item.level_name || "N/A"}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`shadow-none font-medium ${targetStudentConfig[item.target_student]?.color || ""}`}
                      >
                        {targetStudentConfig[item.target_student]?.label || item.target_student}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <StatusBadge status={item.status} className="shadow-none rounded-md" />
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-1">
                        <Can permission="course_detail">
                          <Link href={`/admin/courses/${item.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </Can>
                        <Can permission="class_list">
                          <Link href={`/admin/courses/${item.id}/classes`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-indigo-600 transition-colors"
                              title="Quản lý lớp học"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </Link>
                        </Can>
                        <Can permission="course_edit">
                          <Link
                            href={`/admin/courses/${item.id}/edit`}
                            onClick={() => setEditingCourse(item)}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </Can>
                        <Can permission="course_delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            title="Xóa"
                            onClick={() => {
                              setCourseToDelete(item)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khóa học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khóa học <strong>{courseToDelete?.name}</strong>?
              Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn và hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
        <p>
          Hiển thị <strong>{items.length}</strong> khóa học
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled>Trước</Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold shadow-sm shadow-primary/10">1</div>
          <Button variant="ghost" size="sm" disabled>Sau</Button>
        </div>
      </div>
    </div>
  )
}
