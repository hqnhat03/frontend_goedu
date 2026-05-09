"use client"

import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"
import {
  BookOpen,
  LayoutGrid,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { SubjectFormDrawer } from "./_components/SubjectFormDrawer"


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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { toast } from "sonner"

interface Subject {
  id: string
  name: string
  category: string
  status: "draft" | "published" | "archived"
}



const statusConfig = {
  draft: { label: "Bản nháp", color: "bg-slate-500/10 text-slate-600 border-slate-200" },
  published: { label: "Đã xuất bản", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  archived: { label: "Lưu trữ", color: "bg-rose-500/10 text-rose-600 border-rose-200" },
}

const statusLabels: Record<string, string> = {
  all: "Tất cả trạng thái",
  draft: "Bản nháp",
  published: "Đã xuất bản",
  archived: "Lưu trữ",
}

export default function SubjectsPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("subject_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")
  const [category, setCategory] = React.useState<string>("all")
  const [items, setItems] = React.useState<Subject[]>([])
  const [categories, setCategories] = React.useState<{ name: string; slug: string }[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [subjectToDelete, setSubjectToDelete] = React.useState<Subject | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)


  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await api.get("/admin/subjects/categories")
      const result = response.data
      if (response.status === 200) {
        setCategories(result.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }, [])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const fetchSubjects = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        name: search,
        status: status === "all" ? "" : status,
        category: category === "all" ? "" : category,
      })

      const response = await api.get(`/admin/subjects?${queryParams}`)
      const result = response.data
      if (response.status === 200) {
        setItems(result.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error)
    } finally {
      setIsLoading(false)
    }
  }, [search, status, category])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubjects()
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchSubjects])

  const handleDelete = async () => {
    if (!subjectToDelete) return
    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/subjects/${subjectToDelete.id}`)
      const result = response.data
      if (result.success) {
        toast.success(result.message || "Xóa môn học thành công")
        fetchSubjects()
      } else {
        toast.error(result.message || "Xóa thất bại")
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi xóa môn học")
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSubjectToDelete(null)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
    setCategory("all")
  }

  if (!hasPermission("subject_list")) return null

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Quản lý môn học
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Quản lý danh mục các môn học, trạng thái nội dung và phân loại học thuật.
          </p>
        </div>
        <Can permission="subject_create">
          <SubjectFormDrawer onSuccess={fetchSubjects} />
        </Can>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row flex-wrap items-center justify-start gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên môn học..."
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
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
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả trạng thái">Tất cả trạng thái</SelectItem>
                <SelectItem value="Bản nháp">Bản nháp</SelectItem>
                <SelectItem value="Đã xuất bản">Đã xuất bản</SelectItem>
                <SelectItem value="Lưu trữ">Lưu trữ</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={category === "all" ? "Tất cả danh mục" : categories.find(c => c.slug === category)?.name || "Tất cả danh mục"} 
              onValueChange={(val) => {
                if (val === "Tất cả danh mục") {
                  setCategory("all");
                } else {
                  const cat = categories.find(c => c.name === val);
                  setCategory(cat?.slug || "all");
                }
              }}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Danh mục" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả danh mục">Tất cả danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1"></div>

            <Button
              variant="outline"
              className="w-full md:w-fit bg-background hover:bg-muted transition-colors border-dashed"
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
                <TableHead className="font-semibold py-4 pl-8">Tên môn học</TableHead>
                <TableHead className="font-semibold py-4">Danh mục</TableHead>
                <TableHead className="font-semibold py-4">Trạng thái</TableHead>
                <TableHead className="text-center font-semibold py-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-8 py-4">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="h-8 w-8 opacity-20" />
                      <p>Không tìm thấy môn học nào phù hợp.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: Subject) => (
                  <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-foreground/90 py-4 pl-8">
                      {item.name}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="font-normal bg-muted/50">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`shadow-none font-medium ${statusConfig[item.status].color}`}
                      >
                        {statusConfig[item.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex justify-center gap-1">
                        <Can permission="subject_edit">
                          <SubjectFormDrawer
                            subject={item}
                            onSuccess={fetchSubjects}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                                title="Chỉnh sửa"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </Button>
                            }
                          />
                        </Can>
                        <Can permission="subject_delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            title="Xóa"
                            onClick={() => {
                              setSubjectToDelete(item)
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
            <AlertDialogTitle>Xác nhận xóa môn học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa môn học <strong>{subjectToDelete?.name}</strong>?
              Hành động này không thể hoàn tác.
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
          Hiển thị <strong>{items.length}</strong> môn học
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled>Trước</Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">1</div>
          <Button variant="ghost" size="sm" disabled>Sau</Button>
        </div>
      </div>
    </div>
  )
}
