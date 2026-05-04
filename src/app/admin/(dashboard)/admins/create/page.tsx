"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Activity,
  Calendar,
  ChevronLeft,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
  UserCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/axios"
import { AxiosError } from "axios"
import Link from "next/link"

const adminSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  gender: z.enum(["male", "female", "other"]),
  date_of_birth: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]),
  roles: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một vai trò"),
})

type AdminFormValues = z.infer<typeof adminSchema>

interface Role {
  id: number
  name: string
}

export default function CreateAdminPage() {
  const router = useRouter()
  const [roles, setRoles] = React.useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(true)

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: null,
      address: null,
      gender: "male",
      date_of_birth: null,
      avatar: null,
      status: "active",
      roles: ["admin"],
    },
  })

  React.useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get("/admin/roles")
        // Assuming response.data contains { data: Role[] } or Role[]
        const data = response.data?.data || response.data
        if (Array.isArray(data)) {
          setRoles(data)
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error)
        toast.error("Không thể tải danh sách vai trò")
      } finally {
        setIsLoadingRoles(false)
      }
    }

    fetchRoles()
  }, [])

  const onSubmit = async (data: AdminFormValues) => {
    try {
      const response = await api.post("/admin/admins", data)
      if (response.status === 201 || response.status === 200 || response.data?.success) {
        toast.success("Thêm quản trị viên thành công")
        router.push("/admin/admins")
        router.refresh()
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error)
        const message = error.response?.data?.message || "Đã có lỗi xảy ra khi tạo quản trị viên"
        toast.error(message)
      }

    }
  }

  const toggleRole = (roleName: string) => {
    const currentRoles = form.getValues("roles")
    if (currentRoles.includes(roleName)) {
      form.setValue("roles", currentRoles.filter(r => r !== roleName), { shouldValidate: true })
    } else {
      form.setValue("roles", [...currentRoles, roleName], { shouldValidate: true })
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <Link href="/admin/admins">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-muted-foreground/20 hover:bg-muted transition-all">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Thêm quản trị viên mới
          </h2>
          <p className="text-muted-foreground mt-1">
            Tạo tài khoản mới cho nhân sự quản lý hệ thống.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl bg-background/60 backdrop-blur-xl ring-1 ring-border/50">
            <CardHeader className="border-b border-border/40 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <UserCircle className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Thông tin cá nhân</CardTitle>
                  <CardDescription>Các thông tin cơ bản và trạng thái của quản trị viên mới</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel className="text-sm font-semibold">
                    Họ và tên <span className="text-destructive">*</span>
                  </FieldLabel>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="VD: Nguyễn Văn A"
                      className="pl-10 h-11 bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all"
                      {...form.register("name")}
                    />
                  </div>
                  <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
                </Field>

                <Field>
                  <FieldLabel className="text-sm font-semibold">
                    Email đăng nhập <span className="text-destructive">*</span>
                  </FieldLabel>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      className="pl-10 h-11 bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all"
                      {...form.register("email")}
                    />
                  </div>
                  <FieldError errors={[{ message: form.formState.errors.email?.message }]} />
                </Field>

                <Field>
                  <FieldLabel className="text-sm font-semibold">Số điện thoại</FieldLabel>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="09xx xxx xxx"
                      className="pl-10 h-11 bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all"
                      {...form.register("phone")}
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel className="text-sm font-semibold">Trạng thái <span className="text-destructive">*</span></FieldLabel>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(val) => form.setValue("status", val as "active" | "inactive")}
                  >
                    <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/10">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Chọn trạng thái" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" className="text-emerald-600 font-medium">Đang hoạt động</SelectItem>
                      <SelectItem value="inactive" className="text-rose-600 font-medium">Vô hiệu hóa</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel className="text-sm font-semibold">Giới tính</FieldLabel>
                  <Select
                    value={form.watch("gender")}
                    onValueChange={(val) => form.setValue("gender", val as "male" | "female" | "other")}
                  >
                    <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/10">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel className="text-sm font-semibold">Ngày sinh</FieldLabel>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="date"
                      className="pl-10 h-11 bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all"
                      {...form.register("date_of_birth")}
                    />
                  </div>
                </Field>

                <Field className="md:col-span-2">
                  <FieldLabel className="text-sm font-semibold">Địa chỉ</FieldLabel>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Nhập địa chỉ cư trú..."
                      className="pl-10 h-11 bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all"
                      {...form.register("address")}
                    />
                  </div>
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Space */}
        <div className="space-y-8">
          {/* Roles Card */}
          <Card className="border-none shadow-xl bg-background/60 backdrop-blur-xl ring-1 ring-border/50">
            <CardHeader className="border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                  <Shield className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Phân quyền</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Field>
                <FieldLabel className="text-sm font-semibold mb-3 block">Chọn vai trò hệ thống <span className="text-destructive">*</span></FieldLabel>
                <div className="grid grid-cols-1 gap-3">
                  {isLoadingRoles ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-10 w-full bg-muted/50 animate-pulse rounded-lg" />
                    ))
                  ) : (
                    roles.map((role) => (
                      <div
                        key={role.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${form.watch("roles").includes(role.name)
                          ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                          : "bg-muted/10 border-transparent hover:border-muted-foreground/20"
                          }`}
                        onClick={() => toggleRole(role.name)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={form.watch("roles").includes(role.name)}
                            onCheckedChange={() => toggleRole(role.name)}
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <label
                            htmlFor={`role-${role.id}`}
                            className="text-sm font-medium cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {role.name}
                          </label>
                        </div>
                        {form.watch("roles").includes(role.name) && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-bold">ACTIVE</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <FieldError errors={[{ message: form.formState.errors.roles?.message }]} />
              </Field>
            </CardContent>
          </Card>

        </div>

        {/* Action Buttons */}
        <div className="lg:col-span-3 flex items-center justify-end gap-4 mt-4">
          <Button
            type="button"
            variant="outline"
            className="min-w-[100px]"
            onClick={() => router.back()}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            className="min-w-[120px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
