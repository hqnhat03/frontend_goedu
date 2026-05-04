"use client"

import * as React from "react"
import {
  Search,
  Layers,
  Trash2,
  RefreshCw,
  LayoutGrid,
  Settings2,
} from "lucide-react"
import { Level } from "@/store/level-store"
import { LevelFormDrawer } from "./_components/LevelFormDrawer"
import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"
import { useRouter } from "next/navigation"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import { toast } from "sonner"
import api from "@/lib/axios"

const statusConfig = {
  draft: { label: "Bản nháp", color: "bg-slate-500/10 text-slate-600 border-slate-200" },
  published: { label: "Đã xuất bản", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  archived: { label: "Lưu trữ", color: "bg-rose-500/10 text-rose-600 border-rose-200" },
}

export default function LevelsPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("level_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")
  const [educationLevel, setEducationLevel] = React.useState<string>("all")
  const [items, setItems] = React.useState<Level[]>([])
  const [educationLevels, setEducationLevels] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [levelToDelete, setLevelToDelete] = React.useState<Level | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  if (!hasPermission("level_list")) return null


  // Giả sử có API để lấy danh sách cấp học tương tự như category của subject
  const fetchEducationLevels = React.useCallback(async () => {
    try {
      const response = await api.get("/admin/levels/education-levels")
      const result = response.data
      if (response.status === 200) {
        const data = result.data || []
        // Ensure we have an array of strings to avoid [object Object] keys
        const levels = data.map((item: any) => {
            if (typeof item === 'string') return item
            return item.education_level || item.name || (typeof item === 'object' ? Object.values(item)[0] : String(item))
        })
        setEducationLevels(levels)
      }
    } catch (error) {
      console.error("Failed to fetch education levels:", error)
      // Nếu API lỗi, chúng ta có thể trích xuất từ dữ liệu items sau khi fetch levels
    }
  }, [])

  React.useEffect(() => {
    fetchEducationLevels()
  }, [fetchEducationLevels])

  const fetchLevels = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        level: search,
        status: status === "all" ? "" : status,
        education_level: educationLevel === "all" ? "" : educationLevel,
      })

      const response = await api.get(`/admin/levels?${queryParams}`)
      const result = response.data
      if (response.status === 200) {
        setItems(result.data || [])
        
        // Nếu không có API lấy education-levels riêng, ta trích xuất từ data
        if (educationLevels.length === 0 && result.data) {
          const uniqueEduLevels: string[] = Array.from(
            new Set(result.data.map((item: Level) => item.education_level))
          ).filter(Boolean) as string[]
          setEducationLevels(uniqueEduLevels)
        }
      }
    } catch (error) {
      console.error("Failed to fetch levels:", error)
      toast.error("Không thể tải danh sách trình độ")
    } finally {
      setIsLoading(false)
    }
  }, [search, status, educationLevel, educationLevels.length])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchLevels()
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchLevels])

  const handleDelete = async () => {
    if (!levelToDelete) return
    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/levels/${levelToDelete.id}`)
      const result = response.data
      if (result.success) {
        toast.success(result.message || "Xóa trình độ thành công")
        fetchLevels()
      } else {
        toast.error(result.message || "Xóa thất bại")
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi xóa trình độ")
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setLevelToDelete(null)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
    setEducationLevel("all")
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Quản lý trình độ
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Quản lý các cấp độ học tập và phân loại theo trình độ giáo dục.
          </p>
        </div>
        <Can permission="level_create">
          <LevelFormDrawer onSuccess={fetchLevels} />
        </Can>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên trình độ..."
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={status} onValueChange={(val: string) => setStatus(val ?? "all")}>
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
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

            <Select value={educationLevel} onValueChange={(val: string) => setEducationLevel(val ?? "all")}>
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Cấp học" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả cấp học</SelectItem>
                {educationLevels.map((edu: string) => (
                  <SelectItem key={edu} value={edu}>
                    {edu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="w-full bg-background hover:bg-muted transition-colors border-dashed"
              onClick={resetFilters}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Làm mới bộ lọc
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
                <TableHead className="font-semibold py-4">Trình độ</TableHead>
                <TableHead className="font-semibold py-4">Cấp học</TableHead>
                <TableHead className="font-semibold py-4">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold py-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-8 w-8 animate-spin opacity-20" />
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="h-8 w-8 opacity-20" />
                      <p>Không tìm thấy trình độ nào phù hợp.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: Level) => (
                  <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-foreground/90 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Layers className="size-4" />
                        </div>
                        {item.level}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="font-normal bg-muted/50">
                        {item.education_level}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`shadow-none font-medium ${statusConfig[item.status]?.color || ""}`}
                      >
                        {statusConfig[item.status]?.label || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-1">
                        <Can permission="level_edit">
                          <LevelFormDrawer level={item} onSuccess={fetchLevels} />
                        </Can>
                        <Can permission="level_delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            title="Xóa"
                            onClick={() => {
                              setLevelToDelete(item)
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
            <AlertDialogTitle>Xác nhận xóa trình độ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa trình độ <strong>{levelToDelete?.level}</strong>?
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
          Hiển thị <strong>{items.length}</strong> trình độ
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
