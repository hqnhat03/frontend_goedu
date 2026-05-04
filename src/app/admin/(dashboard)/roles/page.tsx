"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Shield,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import api from "@/lib/axios"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldContent,
} from "@/components/ui/field"

interface Role {
  id: number
  name: string
}

const roleSchema = z.object({
  name: z.string().min(1, "Tên vai trò không được để trống"),
})

type FormValues = z.infer<typeof roleSchema>

export default function RolesPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("role_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [items, setItems] = React.useState<Role[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  if (!hasPermission("role_list")) return null

  
  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<Role | null>(null)
  
  // Delete Alert State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [roleToDelete, setRoleToDelete] = React.useState<Role | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
    },
  })

  const fetchRoles = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/admin/roles")
      const result = response.data
      if (response.status === 200) {
        setItems(result.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
      toast.error("Không thể tải danh sách vai trò")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const onOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      form.reset({ name: role.name })
    } else {
      setEditingRole(null)
      form.reset({ name: "" })
    }
    setIsModalOpen(true)
  }

  const onSubmit = async (data: FormValues) => {
    try {
      const response = editingRole 
        ? await api.put(`/admin/roles/${editingRole.id}`, data)
        : await api.post(`/admin/roles`, data)
      
      const result = response.data
      if (response.status === 200 || response.status === 201) {
        toast.success(editingRole ? "Cập nhật vai trò thành công" : "Tạo vai trò thành công")
        setIsModalOpen(false)
        fetchRoles()
      } else {
        toast.error(result.message || "Thao tác thất bại")
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra")
      console.error(error)
    }
  }

  const handleDelete = async () => {
    if (!roleToDelete) return
    
    if (roleToDelete.name === "super_admin") {
      toast.error("Không thể xóa vai trò quản trị viên tối cao")
      setIsDeleteDialogOpen(false)
      return
    }

    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/roles/${roleToDelete.id}`)
      const result = response.data
      if (response.status === 200) {
        toast.success("Xóa vai trò thành công")
        fetchRoles()
      } else {
        toast.error(result.message || "Xóa thất bại")
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi xóa")
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setRoleToDelete(null)
    }
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Quản lý vai trò
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Quản lý các vai trò và quyền hạn trong hệ thống.
          </p>
        </div>
        <Can permission="role_create">
          <Button 
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
            onClick={() => onOpenModal()}
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm vai trò
          </Button>
        </Can>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm tên vai trò..."
              className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold py-4">Vai trò (Role)</TableHead>
                <TableHead className="text-right font-semibold py-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-8 w-8 animate-spin opacity-20" />
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Shield className="h-8 w-8 opacity-20" />
                      <p>Không tìm thấy vai trò nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-foreground/90 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Shield className="size-4" />
                        </div>
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-1">
                        {item.name !== "super_admin" && (
                          <div className="flex justify-end gap-1">
                            <Can permission="role_edit">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                                title="Chỉnh sửa"
                                onClick={() => onOpenModal(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Can>
                            <Can permission="role_delete">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                title="Xóa"
                                onClick={() => {
                                  setRoleToDelete(item)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </Can>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}</DialogTitle>
            <DialogDescription>
              Nhập tên vai trò. Nhấn lưu để hoàn tất.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <Field>
              <FieldLabel>Tên vai trò <span className="text-destructive">*</span></FieldLabel>
              <FieldContent>
                <Input 
                  placeholder="VD: admin, teacher, support..." 
                  {...form.register("name")}
                />
              </FieldContent>
              <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa vai trò</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa vai trò <strong>{roleToDelete?.name}</strong>?
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
    </div>
  )
}
