"use client"

import { cn } from "@/lib/utils"
import {
  Activity,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Edit,
  Eye,
  Plus,
  RefreshCcw,
  Search,
  SearchX,
  Trash2,
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
import { AxiosError } from "axios"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AdminDrawer, type Admin } from "./_components/AdminDrawer"

export default function AdminsPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  const statusLabel: Record<string, string> = {
    "all": "Tất cả trạng thái",
    "active": "Đang hoạt động",
    "inactive": "Bị khóa",
  }

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("admin_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("all")

  // Pagination and Sorting State
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortBy, setSortBy] = React.useState("created_at")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [totalItems, setTotalItems] = React.useState(0)
  const [lastPage, setLastPage] = React.useState(1)

  const [admins, setAdmins] = React.useState<Admin[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)


  const debouncedSearch = useDebounce(search, 400)

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [adminToDelete, setAdminToDelete] = React.useState<Admin | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Drawer state
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit" | "view" | undefined>(undefined)
  const [selectedAdmin, setSelectedAdmin] = React.useState<Admin | null>(null)
  const fetchAdmins = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get("/admin/admins", {
        params: {
          search: debouncedSearch,
          status: status !== "all" ? status : undefined,
          page: currentPage,
          per_page: pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      })

      const result = response.data
      if (result.success) {
        setAdmins(result.data || [])
        setTotalItems(result.meta?.total || 0)
        setLastPage(result.meta?.last_page || 1)
      } else {
        throw new Error(result.message || "Không thể tải danh sách quản trị viên")
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error(err)
        setError(err.response?.data?.message || "Không thể tải danh sách quản trị viên")
        toast.error("Lỗi: " + (err.response?.data?.message || "Đã có lỗi xảy ra"))
      } else if (err instanceof Error) {
        setError(err.message)
        toast.error(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, status, currentPage, pageSize, sortBy, sortOrder])

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

  React.useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  const handleDeleteClick = (admin: Admin) => {
    setAdminToDelete(admin)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!adminToDelete) return

    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/admins/${adminToDelete.id}`)

      if (response.status === 200 || response.data?.success) {
        toast.success(response.data?.message || "Xóa quản trị viên thành công")
        setAdmins(prev => prev.filter(a => a.id !== adminToDelete.id))
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error(err)
        toast.error(err.response?.data?.message || "Lỗi khi xóa quản trị viên")
      }
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setAdminToDelete(null)
    }
  }

  if (!hasPermission("admin_list")) return null

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Quản lý quản trị viên
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Quản lý đội ngũ quản trị hệ thống, phân quyền vai trò và kiểm soát trạng thái hoạt động của nhân sự.
          </p>
        </div>
        <Can permission="admin_create">
          <div className="flex items-center gap-3">
            <Button
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
              onClick={() => {
                setSelectedAdmin(null)
                setDrawerMode("create")
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm mới
            </Button>
          </div>
        </Can>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, email hoặc SĐT..."
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full md:w-48">
              <Select
                value={statusLabel[status]}
                onValueChange={(val) => {
                  const key = Object.keys(statusLabel).find(k => statusLabel[k] === val);
                  setStatus(key || "all");
                }}
              >
                <SelectTrigger className="bg-background border-muted-foreground/20">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <SelectValue placeholder="Trạng thái" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tất cả trạng thái">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem>
                  <SelectItem value="Bị khóa">Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1"></div>
            <Button
              variant="outline"
              className="w-full md:w-fit bg-background hover:bg-muted transition-colors border-dashed"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setCurrentPage(1);
                setSortBy("created_at");
                setSortOrder("desc");
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
          <p>
            Hiển thị <strong>{admins.length}</strong> / <strong>{totalItems}</strong> quản trị viên
          </p>
        </div>

        <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead
                  className="w-[80px] cursor-pointer hover:text-primary transition-colors text-center"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center justify-center">
                    ID
                    <SortIcon field="id" />
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">Ảnh đại diện</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Họ tên
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center">
                    Email
                    <SortIcon field="email" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("phone")}
                >
                  <div className="flex items-center">
                    Số điện thoại
                    <SortIcon field="phone" />
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">Vai trò</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary transition-colors"
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
            <TableBody className={cn(isLoading && admins.length > 0 && "opacity-50 transition-opacity duration-300")}>
              {isLoading && admins.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-32 mx-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-destructive">
                      <SearchX className="h-12 w-12 opacity-50" />
                      <p className="font-medium">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchAdmins}>Thử lại</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                      <SearchX className="h-12 w-12 opacity-30" />
                      <div className="space-y-1">
                        <p className="text-lg font-medium">Không tìm thấy kết quả nào</p>
                        <p className="text-sm">Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc của bạn.</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSearch(""); setStatus("all"); }}
                        className="mt-2"
                      >
                        Xóa bộ lọc
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="text-center">
                      <div className="text-sm font-medium text-muted-foreground">#{admin.id}</div>
                    </TableCell>
                    <TableCell>
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-muted/50 group-hover:ring-primary/30 transition-all">
                        <AvatarImage src={admin.avatar || ""} alt={admin.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {admin.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {admin.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Sao chép email">
                        {admin.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.phone ? (
                        <div className="text-sm text-muted-foreground">
                          {admin.phone}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Chưa cập nhật</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {admin.roles && admin.roles.length > 0 ? (
                          admin.roles.map((role, idx) => {
                            const roleName = typeof role === "string" ? role : role.name;
                            const roleKey = typeof role === "string" ? role : role.id?.toString() || String(idx);
                            return (
                              <Badge key={roleKey} variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-normal text-[10px] flex items-center gap-1">
                                {roleName}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">Chưa phân vai trò</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.status === "active" ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200/50 transition-colors cursor-default">
                          Đang hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-200/50 transition-colors cursor-default">
                          Bị khóa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Can permission="admin_detail">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            title="Chi tiết"
                            onClick={() => {
                              setSelectedAdmin(admin)
                              setDrawerMode("view")
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Can>
                        <Can permission="admin_edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                            title="Chỉnh sửa"
                            onClick={() => {
                              setSelectedAdmin(admin)
                              setDrawerMode("edit")
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Can>
                        <Can permission="admin_delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            title="Xóa"
                            onClick={() => handleDeleteClick(admin)}
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

      <div className="flex flex-col sm:flex-row items-center justify-between px-2 mt-6 gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <p>
            Hiển thị <strong>{admins.length}</strong> / <strong>{totalItems}</strong> quản trị viên
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
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
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
                    "h-8 w-8 text-xs font-bold",
                    currentPage === pageNum && "bg-primary/10 text-primary hover:bg-primary/20 shadow-sm"
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
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
            disabled={currentPage === lastPage || isLoading}
          >
            Sau
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-full">
                <Trash2 className="h-5 w-5" />
              </div>
              Xác nhận xóa tài khoản?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base py-2">
              Bạn đang yêu cầu xóa tài khoản quản trị của <strong>{adminToDelete?.name}</strong>.
              Hành động này <span className="text-destructive font-semibold underline decoration-2 underline-offset-4">không thể hoàn tác</span> và sẽ gỡ bỏ mọi quyền truy cập của người dùng này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl border-muted">Bỏ qua</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl px-8 shadow-lg shadow-rose-200"
            >
              {isDeleting ? "Đang xử lý..." : "Chấp nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Drawer */}
      <AdminDrawer
        mode={drawerMode}
        admin={selectedAdmin}
        onClose={() => {
          setDrawerMode(undefined)
          setSelectedAdmin(null)
        }}
        onSuccess={() => {
          fetchAdmins()
        }}
      />
    </div>
  )
}
