"use client"

import { cn } from "@/lib/utils"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Edit,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2
} from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Teacher, TeacherDrawer } from "./_components/TeacherDrawer"

export default function TeachersPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền truy cập trang
  React.useEffect(() => {
    if (!hasPermission("teacher_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("all")

  const statusLabels: Record<string, string> = {
    "all": "Tất cả trạng thái",
    "active": "Đang hoạt động",
    "inactive": "Bị khóa",
  }
  const targetStudentLabels: Record<string, string> = {
    all: "Tất cả",
    student: "Học sinh",
    employee: "Nhân viên",
  }
  const [expertise, setExpertise] = React.useState("")
  const [teachers, setTeachers] = React.useState<Teacher[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const debouncedExpertise = useDebounce(expertise, 300)

  // Pagination and Sorting State
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortBy, setSortBy] = React.useState("created_at")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [totalItems, setTotalItems] = React.useState(0)
  const [lastPage, setLastPage] = React.useState(1)

  // Drawer state
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit" | "view" | undefined>()
  const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [teacherToDelete, setTeacherToDelete] = React.useState<Teacher | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete(teacher)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return

    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/teachers/${teacherToDelete.id}`)

      if (response.data.success) {
        toast.success(response.data.message || "Xóa giáo viên thành công")
        // Refresh the list
        fetchTeachers()
      } else {
        throw new Error(response.data.message || "Không thể xóa giáo viên")
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi xóa")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setTeacherToDelete(null)
    }
  }

  const fetchTeachers = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append("search", debouncedSearch)
      if (status !== "all") params.append("status", status)
      if (debouncedExpertise) params.append("expertise", debouncedExpertise)

      params.append("page", currentPage.toString())
      params.append("limit", pageSize.toString())
      params.append("sort_by", sortBy)
      params.append("sort_order", sortOrder)

      const response = await api.get(`/admin/teachers?${params.toString()}`)
      const result = response.data

      if (result.data && Array.isArray(result.data)) {
        setTeachers(result.data)
        setTotalItems(result.meta?.total || result.total || 0)
        setLastPage(result.meta?.last_page || result.last_page || 1)
      } else if (Array.isArray(result)) {
        setTeachers(result)
        setTotalItems(result.length)
        setLastPage(1)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, status, debouncedExpertise, currentPage, pageSize, sortBy, sortOrder])

  React.useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const openDrawer = (mode: "create" | "edit" | "view", teacher: Teacher | null = null) => {
    setSelectedTeacher(teacher)
    setDrawerMode(mode)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4 text-primary" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý giáo viên</h2>
          <p className="text-muted-foreground">
            Quản lý và theo dõi thông tin đội ngũ giáo viên trong hệ thống.
          </p>
        </div>
        <Can permission="teacher_create">
          <Button
            className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
            onClick={() => openDrawer("create")}
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm giáo viên
          </Button>
        </Can>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/40">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-end gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, email..."
                className="pl-8 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={statusLabels[status]}
              onValueChange={(val) => {
                const key = Object.keys(statusLabels).find(k => statusLabels[k] === val);
                setStatus(key || "all");
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả trạng thái">Tất cả trạng thái</SelectItem>
                <SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem>
                <SelectItem value="Bị khóa">Bị khóa</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full md:w-64">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Chuyên môn..."
                className="pl-8 bg-background"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
              />
            </div>


            <div className='flex-1'></div>

            <Button variant="outline" className="w-full md:w-fit" onClick={() => {
              setSearch("")
              setStatus("all")
              setExpertise("")
            }}>
              <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead
                className="w-[80px] cursor-pointer hover:bg-muted/80 transition-colors text-center"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center justify-center">
                  ID
                  <SortIcon field="id" />
                </div>
              </TableHead>
              <TableHead className="w-[120px]">Ảnh đại diện</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Họ tên
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center">
                  Email
                  <SortIcon field="email" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("phone")}
              >
                <div className="flex items-center">
                  Số điện thoại
                  <SortIcon field="phone" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("expertise")}
              >
                <div className="flex items-center">
                  Chuyên môn
                  <SortIcon field="expertise" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("target_student")}
              >
                <div className="flex items-center">
                  Đối tượng
                  <SortIcon field="target_student" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Trạng thái
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isLoading && teachers.length > 0 && "opacity-50 transition-opacity duration-300")}>
            {isLoading && teachers.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-8 w-32 mx-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Không tìm thấy giáo viên nào.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-center">
                    <div className="text-sm font-medium text-muted-foreground">#{teacher.id}</div>
                  </TableCell>
                  <TableCell>
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={teacher.avatar || undefined} alt={teacher.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {teacher.name?.split(" ").pop()?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm text-foreground">{teacher.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-muted-foreground">{teacher.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{teacher.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {teacher.expertise?.split(",").map((exp, index) => (
                        <Badge key={index} variant="secondary" className="text-[10px] font-medium py-0 px-1.5 h-5">
                          {exp.trim()}
                        </Badge>
                      )) || <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {targetStudentLabels[teacher.target_student || "all"] || teacher.target_student}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {teacher.status === "active" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 hover:bg-emerald-500/20">
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 border-rose-200/50 hover:bg-rose-500/20">
                        Bị khóa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Can permission="teacher_detail">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                          title="Chi tiết"
                          onClick={() => openDrawer("view", teacher)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="teacher_edit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                          title="Chỉnh sửa"
                          onClick={() => openDrawer("edit", teacher)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="teacher_delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          title="Xóa"
                          onClick={() => handleDeleteClick(teacher)}
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

      {/* Pagination Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4 text-sm text-muted-foreground border-t bg-muted/5 rounded-b-xl">
        <div className="flex items-center gap-4">
          <p>
            Hiển thị <strong>{teachers.length}</strong> / <strong>{totalItems}</strong> giáo viên
          </p>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Số hàng:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(parseInt(val || "10"))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-background">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            className="bg-background h-8"
          >
            Trước
          </Button>
          <div className="flex items-center gap-1">
            {(() => {
              const maxVisible = 5;
              let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              const end = Math.min(lastPage, start + maxVisible - 1);

              if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
              }

              const pages = [];
              for (let i = start; i <= end; i++) {
                pages.push(i);
              }

              return pages.map((pageNum) => (
                <Button
                  key={`page-${pageNum}`}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-xs font-medium",
                    currentPage === pageNum && "shadow-md shadow-primary/20"
                  )}
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={isLoading}
                >
                  {pageNum}
                </Button>
              ));
            })()}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
            disabled={currentPage === lastPage || isLoading}
            className="bg-background h-8"
          >
            Sau
          </Button>
        </div>
      </div>

      {/* Drawer */}
      <TeacherDrawer
        mode={drawerMode}
        teacher={selectedTeacher}
        onClose={() => {
          setDrawerMode(undefined)
          setSelectedTeacher(null)
        }}
        onSuccess={() => {
          fetchTeachers()
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa giáo viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giáo viên <strong>{teacherToDelete?.name}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 transition-colors"
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
