"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import * as z from "zod"
import {
    Save,
    Loader2,
    Plus,
    ShieldCheck,
    CalendarIcon,
    Check,
    ChevronsUpDown,
    X,
    Eye,
    Edit,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Camera,
    Shield,
    Activity,
    UserCircle
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import Image from "next/image"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Field,
    FieldLabel,
    FieldError,
    FieldContent,
} from "@/components/ui/field"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import { Can } from "@/components/auth/can"

// ─────────────────────────── Types ───────────────────────────

interface Role {
    id: number
    name: string
    guard_name?: string
}

export interface Admin {
    id: string | number
    name: string
    email: string
    phone: string | null
    address: string | null
    gender: "male" | "female" | "other"
    date_of_birth: string | null
    avatar: string | null
    status: "active" | "inactive"
    roles: Role[] | string[]
    created_at?: string
}

// ─────────────────────────── Schema ───────────────────────────

const adminSchema = z.object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    gender: z.enum(["male", "female", "other"]).default("male"),
    date_of_birth: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
    roles: z.array(z.string()).min(1, "Vui lòng chọn một vai trò").max(1, "Chỉ được chọn một vai trò"),
})

type AdminFormValues = z.infer<typeof adminSchema>

// ─────────────────────────── Helpers ───────────────────────────

const genderOptions = [
    { value: "male", label: "Nam" },
    { value: "female", label: "Nữ" },
    { value: "other", label: "Khác" },
]

function genderLabel(g?: string) {
    return genderOptions.find((o) => o.value === g)?.label ?? g ?? "—"
}

// ─────────────────────────── Props ───────────────────────────

type DrawerMode = "create" | "edit" | "view"

interface AdminDrawerProps {
    mode?: DrawerMode
    admin?: Admin | null
    onSuccess?: () => void
    onClose?: () => void
    trigger?: React.ReactNode
}

// ─────────────────────────── Component ───────────────────────────

export function AdminDrawer({
    mode: externalMode,
    admin,
    onSuccess,
    onClose,
    trigger,
}: AdminDrawerProps) {
    const [internalMode, setInternalMode] = useState<DrawerMode | undefined>(
        externalMode
    )
    const open = !!internalMode

    useEffect(() => {
        setInternalMode(externalMode)
    }, [externalMode])

    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setInternalMode(undefined)
            onClose?.()
        }
    }

    const [roles, setRoles] = useState<Role[]>([])
    const [isLoadingRoles, setIsLoadingRoles] = useState(false)

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

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        watch,
        setValue,
        getValues,
    } = form

    const currentAvatar = watch("avatar")
    const currentRoles = watch("roles")

    const [isFetching, setIsFetching] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Reset + load data when drawer opens
    useEffect(() => {
        if (!open) return

        // Fetch roles if not already fetched
        if (roles.length === 0) {
            setIsLoadingRoles(true)
            api.get("/admin/roles")
                .then(res => {
                    const data = res.data?.data || res.data
                    if (Array.isArray(data)) setRoles(data)
                })
                .catch(() => toast.error("Không thể tải danh sách vai trò"))
                .finally(() => setIsLoadingRoles(false))
        }

        if ((internalMode === "edit" || internalMode === "view") && admin) {
            setIsFetching(true)
            api.get(`/admin/admins/${admin.id}`)
                .then((res) => {
                    const data = res.data?.data || res.data
                    reset({
                        name: data.name || "",
                        email: data.email || "",
                        phone: data.phone || null,
                        address: data.address || null,
                        gender: data.gender || "male",
                        status: data.status || "active",
                        date_of_birth: data.date_of_birth || null,
                        avatar: data.avatar || null,
                        roles: data.roles 
                            ? data.roles.map((r: any) => typeof r === 'string' ? r : r.name)
                            : [],
                    })
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message ||
                        "Không thể tải thông tin quản trị viên"
                    )
                    handleOpenChange(false)
                })
                .finally(() => setIsFetching(false))
        } else {
            reset({
                name: "",
                email: "",
                phone: null,
                address: null,
                gender: "male",
                status: "active",
                avatar: null,
                roles: ["admin"],
            })
        }
    }, [open, internalMode, admin?.id])

    const onSubmit = async (data: AdminFormValues) => {
        setIsSubmitting(true)
        try {
            if (internalMode === "edit" && admin) {
                await api.put(`/admin/admins/${admin.id}`, data)
                toast.success("Cập nhật quản trị viên thành công!")
            } else {
                await api.post("/admin/admins", data)
                toast.success("Thêm quản trị viên thành công!")
            }

            handleOpenChange(false)
            onSuccess?.()
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || "Đã có lỗi xảy ra.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRoleSelect = (roleName: string) => {
        setValue("roles", [roleName], { shouldValidate: true })
    }

    const handleAvatarClick = () => {
        if (isDisabled || isUploading || isView) return
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("path", "avatars")

        try {
            const res = await api.post("/storage/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            const url = res.data?.data?.public_url || res.data?.data?.url || res.data?.url
            if (url) {
                setValue("avatar", url, { shouldValidate: true })
                toast.success("Tải ảnh lên thành công")
            }
        } catch (err: any) {
            toast.error("Lỗi khi tải ảnh lên")
        } finally {
            setIsUploading(false)
        }
    }

    const isView = internalMode === "view"
    const isDisabled = isSubmitting || isFetching

    const DetailRow = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string | null }) => (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
                <span className="text-sm font-medium text-foreground break-words">{value || "—"}</span>
            </div>
        </div>
    )

    const modeConfig = {
        create: { title: "Thêm quản trị viên mới", description: "Tạo tài khoản mới cho nhân sự quản lý hệ thống." },
        edit: { title: "Chỉnh sửa quản trị viên", description: "Cập nhật thông tin tài khoản quản trị viên." },
        view: { title: "Chi tiết quản trị viên", description: "Xem thông tin chi tiết và quyền hạn của quản trị viên." },
    }

    return (
        <>
            {trigger && (
                <span onClick={() => setInternalMode(externalMode ?? "create")} style={{ display: "contents" }}>
                    {trigger}
                </span>
            )}
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-6 pb-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            {internalMode ? modeConfig[internalMode].title : "Quản trị viên"}
                        </SheetTitle>
                        <SheetDescription>
                            {internalMode ? modeConfig[internalMode].description : ""}
                        </SheetDescription>
                    </SheetHeader>

                    {isFetching ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : isView ? (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center gap-3 py-4">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-lg ring-2 ring-primary/20">
                                    <AvatarImage src={currentAvatar || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                        {watch("name")?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold">{watch("name")}</h3>
                                    <Badge className={cn("mt-1", watch("status") === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")} variant="outline">
                                        {watch("status") === "active" ? "Đang hoạt động" : "Vô hiệu hóa"}
                                    </Badge>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <DetailRow icon={Mail} label="Email" value={watch("email")} />
                                <DetailRow icon={Phone} label="Số điện thoại" value={watch("phone")} />
                                <DetailRow icon={MapPin} label="Địa chỉ" value={watch("address")} />
                                <DetailRow icon={User} label="Giới tính" value={genderLabel(watch("gender"))} />
                                <DetailRow icon={Calendar} label="Ngày sinh" value={watch("date_of_birth")} />
                            </div>
                            <Separator />
                            <div className="space-y-3">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" /> Vai trò hệ thống
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {currentRoles.map(r => (
                                        <Badge key={r} variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-normal">
                                            {r}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="ghost" onClick={() => handleOpenChange(false)}>Đóng</Button>
                                <Can permission="admin_edit">
                                    <Button onClick={() => setInternalMode("edit")}>
                                        <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                                    </Button>
                                </Can>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="flex flex-col items-center gap-2 py-2">
                                <div className={cn("relative group cursor-pointer", (isDisabled || isUploading) && "cursor-not-allowed opacity-70")} onClick={handleAvatarClick}>
                                    <Avatar className="h-28 w-28 rounded-full border-4 border-background shadow-lg ring-2 ring-primary/10 transition-all hover:ring-primary/40">
                                        <AvatarImage src={currentAvatar || ""} className="object-cover" />
                                        <AvatarFallback className="bg-primary/5">
                                            <User className="h-12 w-12 text-primary/30" />
                                        </AvatarFallback>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isUploading ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
                                        </div>
                                    </Avatar>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <Separator />
                            <Field data-invalid={!!errors.name}>
                                <FieldLabel>Họ và tên <span className="text-destructive">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register("name")} placeholder="VD: Nguyễn Văn A" disabled={isDisabled} />
                                </FieldContent>
                                <FieldError errors={[{ message: errors.name?.message }]} />
                            </Field>
                            <Field data-invalid={!!errors.email}>
                                <FieldLabel>Email đăng nhập <span className="text-destructive">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register("email")} type="email" placeholder="admin@example.com" disabled={isDisabled} />
                                </FieldContent>
                                <FieldError errors={[{ message: errors.email?.message }]} />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field>
                                    <FieldLabel>Số điện thoại</FieldLabel>
                                    <Input {...register("phone")} placeholder="09xx xxx xxx" disabled={isDisabled} />
                                </Field>
                                <Field>
                                    <FieldLabel>Giới tính</FieldLabel>
                                    <div className="flex gap-2">
                                        {genderOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setValue("gender", opt.value as any)}
                                                className={cn(
                                                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                                                    watch("gender") === opt.value ? "bg-primary/10 border-primary text-primary" : "border-input bg-transparent text-muted-foreground"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field>
                                    <FieldLabel>Ngày sinh</FieldLabel>
                                    <Input {...register("date_of_birth")} type="date" disabled={isDisabled} />
                                </Field>
                                <Field>
                                    <FieldLabel>Trạng thái</FieldLabel>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setValue("status", "active")}
                                            className={cn(
                                                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                                                watch("status") === "active" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-input bg-transparent text-muted-foreground"
                                            )}
                                        >
                                            Hoạt động
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setValue("status", "inactive")}
                                            className={cn(
                                                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                                                watch("status") === "inactive" ? "bg-rose-50 border-rose-500 text-rose-700" : "border-input bg-transparent text-muted-foreground"
                                            )}
                                        >
                                            Vô hiệu hóa
                                        </button>
                                    </div>
                                </Field>
                            </div>
                            <Field>
                                <FieldLabel>Địa chỉ</FieldLabel>
                                <Input {...register("address")} placeholder="Nhập địa chỉ cư trú..." disabled={isDisabled} />
                            </Field>
                            <Separator />
                            <div className="space-y-4">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" /> Phân quyền hệ thống <span className="text-destructive">*</span>
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {isLoadingRoles ? (
                                        [1, 2].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                                    ) : (
                                        roles.map((role) => (
                                            <div
                                                key={role.id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                                                    currentRoles.includes(role.name) 
                                                        ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20 shadow-sm shadow-primary/5" 
                                                        : "bg-muted/5 border-slate-200 dark:border-slate-800 hover:border-primary/30"
                                                )}
                                                onClick={() => handleRoleSelect(role.name)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                                        currentRoles.includes(role.name) 
                                                            ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" 
                                                            : "border-slate-300 dark:border-slate-600"
                                                    )}>
                                                        {currentRoles.includes(role.name) && <Check className="h-3 w-3 stroke-[3]" />}
                                                    </div>
                                                    <span className={cn(
                                                        "text-sm font-medium transition-colors",
                                                        currentRoles.includes(role.name) ? "text-primary" : "text-slate-600 dark:text-slate-400"
                                                    )}>
                                                        {role.name}
                                                    </span>
                                                </div>
                                                {currentRoles.includes(role.name) && <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-bold border-none uppercase tracking-wider">Active</Badge>}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <FieldError errors={[{ message: errors.roles?.message }]} />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t mt-8 sticky bottom-0 bg-background pb-2">
                                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isDisabled}>Hủy</Button>
                                <Button type="submit" disabled={isDisabled} className="min-w-[120px] shadow-lg shadow-primary/20 transition-all active:scale-95">
                                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</> : <><Save className="mr-2 h-4 w-4" /> Lưu</>}
                                </Button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}
