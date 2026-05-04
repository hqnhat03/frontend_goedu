"use client"

import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import {
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { Guardian, GuardianDrawer } from "./_components/GuardianDrawer"

export default function GuardiansPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("guardian_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  // State for filtering

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")

  // State for data
  const [guardians, setGuardians] = React.useState<Guardian[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Drawer state
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit" | "view" | undefined>(undefined)
  const [selectedGuardian, setSelectedGuardian] = React.useState<Guardian | null>(null)

  // Debounced search term
  const debouncedSearch = useDebounce(search, 300)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [guardianToDelete, setGuardianToDelete] = React.useState<Guardian | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const statusLabels: Record<string, string> = {
    all: "Tất cả",
    active: "Đang hoạt động",
    inactive: "Bị khóa",
  }

  const fetchGuardians = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get(`/admin/guardians`, {
        params: {
          search: debouncedSearch || undefined,
          status: status !== "all" ? status : undefined,
        }
      })

      const result = response.data

      if (result.success && Array.isArray(result.data)) {
        setGuardians(result.data)
      } else {
        throw new Error(result.message || "Lỗi khi lấy dữ liệu")
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
      toast.error(err instanceof Error ? err.message : "Đã có lỗi khi tải dữ liệu")
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, status])

  React.useEffect(() => {
    fetchGuardians()
  }, [fetchGuardians])

  const handleDeleteClick = (guardian: Guardian) => {
    setGuardianToDelete(guardian)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!guardianToDelete) return

    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/guardians/${guardianToDelete.id}`)
      const result = response.data

      if (result.success) {
        toast.success(result.message || "Xóa phụ huynh thành công")
        fetchGuardians() // Refresh list
      } else {
        throw new Error(result.message || "Không thể xóa phụ huynh")
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi xóa")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setGuardianToDelete(null)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
  }

  const openDrawer = (mode: "create" | "edit" | "view", guardian: Guardian | null = null) => {
    setSelectedGuardian(guardian)
    setDrawerMode(mode)
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Quản lý phụ huynh
          </h2>
          <p className="text-muted-foreground mt-1">
            Theo dõi, quản lý thông tin phụ huynh và liên lạc.
          </p>
        </div>
        <Can permission="guardian_create">
          <Button
            className="bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95 whitespace-nowrap"
            onClick={() => openDrawer("create")}
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm phụ huynh
          </Button>
        </Can>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/40 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, email, số điện thoại..."
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusLabels[status]} onValueChange={(value) => setStatus(value as "all" | "active" | "inactive")}>
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-background hover:bg-muted transition-colors"
                onClick={resetFilters}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px] font-semibold">Ảnh đại diện</TableHead>
              <TableHead className="font-semibold">Họ và tên</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Số điện thoại</TableHead>
              <TableHead className="font-semibold">Học sinh</TableHead>
              <TableHead className="font-semibold">Trạng thái</TableHead>
              <TableHead className="text-right font-semibold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-sm" />
                    <p className="text-muted-foreground font-medium animate-pulse">Đang tải dữ liệu...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                    <ShieldAlert className="h-8 w-8" />
                    <p className="font-semibold">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchGuardians}>Thử lại</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : guardians.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserCheck className="h-8 w-8 opacity-20" />
                    <p>Không tìm thấy phụ huynh nào phù hợp.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {!hasPermission("guardian_list") ? null : (
              guardians.map((guardian) => (

                <TableRow key={guardian.id} className="group hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-muted">
                      <AvatarImage src={guardian.avatar || undefined} alt={guardian.name} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {guardian.name?.split(" ").pop()?.substring(0, 2).toUpperCase() || "PH"}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground/90">{guardian.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{guardian.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{guardian.phone}</TableCell>
                  <TableCell>
                    {guardian.students && guardian.students.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {guardian.students.map((student) => (
                          <Badge key={student.id} variant="secondary" className="text-xs font-medium bg-muted whitespace-nowrap">
                            {student.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Chưa có</span>
                    )}
                  </TableCell>
                  <TableCell >
                    {guardian.status === "active" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200/50 shadow-none">
                        Đang hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-200/50 shadow-none">
                        Bị khóa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Can permission="guardian_detail">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                          title="Chi tiết"
                          onClick={() => openDrawer("view", guardian)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="guardian_edit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                          title="Chỉnh sửa"
                          onClick={() => openDrawer("edit", guardian)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="guardian_delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          title="Xóa"
                          onClick={() => handleDeleteClick(guardian)}
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

      {/* Pagination Placeholder */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4">
        <p className="text-sm text-muted-foreground">
          Hiển thị <strong>{guardians.length}</strong> phụ huynh
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="shadow-sm" disabled>Trước</Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium">1</div>
          <Button variant="outline" size="sm" className="shadow-sm" disabled>Sau</Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-morphism border-rose-100 ring-4 ring-rose-50/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              Xác nhận xóa phụ huynh
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2">
              Bạn có chắc chắn muốn xóa phụ huynh <strong>{guardianToDelete?.name}</strong>?
              <br />
              Hành động này sẽ xóa vĩnh viễn dữ liệu và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting} className="bg-muted/50 border-none hover:bg-muted">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-rose-200 transition-all active:scale-95"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang xóa...
                </div>
              ) : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Guardian Drawer */}
      <GuardianDrawer
        mode={drawerMode}
        guardian={selectedGuardian}
        onSuccess={fetchGuardians}
        onClose={() => {
          setDrawerMode(undefined)
          setSelectedGuardian(null)
        }}
      />
    </div>
  )
}
