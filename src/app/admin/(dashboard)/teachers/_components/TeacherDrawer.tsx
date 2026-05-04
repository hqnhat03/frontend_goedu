"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
    Briefcase,
    Calendar,
    CalendarIcon,
    Camera,
    Edit,
    FileText,
    Globe,
    GraduationCap,
    Info,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldAlert,
    ShieldCheck,
    User,
    Users
} from "lucide-react"
import Image from "next/image"
import * as React from "react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Can } from "@/components/auth/can"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { AxiosError } from "axios"

// ─────────────────────────── Types ───────────────────────────

export interface Teacher {
    id: number | string
    name: string
    email: string
    phone: string
    address?: string
    gender?: string
    nationality?: string
    expertise?: string
    experience?: string
    target_student?: string
    status: "active" | "inactive"
    date_of_birth?: string
    avatar?: string | null
    bio?: string
}

// ─────────────────────────── Schema ───────────────────────────

const teacherSchema = z.object({
    name: z.string().min(1, { message: "Vui lòng nhập tên" }),
    email: z.email({ message: "Email không hợp lệ" }),
    phone: z.string().min(10, { message: "Số điện thoại không hợp lệ" }),
    address: z.string().min(1, { message: "Vui lòng nhập địa chỉ" }),
    nationality: z.string().min(1, { message: "Vui lòng nhập quốc tịch" }),
    gender: z
        .enum(["male", "female", "other"], { error: "Vui lòng chọn giới tính" })
        .or(z.string()),
    expertise: z.string().min(1, { message: "Vui lòng nhập chuyên môn" }),
    experience: z.string().min(1, { message: "Vui lòng nhập kinh nghiệm" }),
    target_student: z.string().min(1, { message: "Vui lòng chọn đối tượng học sinh" }),
    status: z.enum(["active", "inactive"], {
        error: "Vui lòng chọn trạng thái",
    }),
    date_of_birth: z.string().min(1, { message: "Vui lòng chọn ngày sinh" }),
    avatar: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
})

type TeacherFormValues = z.infer<typeof teacherSchema>

// ─────────────────────────── Helpers ───────────────────────────

const genderOptions = [
    { value: "male", label: "Nam" },
    { value: "female", label: "Nữ" },
    { value: "other", label: "Khác" },
]

const statusOptions = [
    {
        value: "active",
        label: "Hoạt động",
        activeClass:
            "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-300",
    },
    {
        value: "inactive",
        label: "Tạm khóa",
        activeClass:
            "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-500 dark:text-rose-300",
    },
]

const targetStudentOptions = [
    { value: "all", label: "Tất cả", icon: Globe },
    { value: "student", label: "Học sinh", icon: GraduationCap },
    { value: "employee", label: "Nhân viên", icon: Briefcase },
]

function getLabel(options: { value: string; label: string }[], val?: string) {
    return options.find((o) => o.value === val)?.label ?? val ?? "—"
}

// ─────────────────────────── Props ───────────────────────────

type DrawerMode = "create" | "edit" | "view"

interface TeacherDrawerProps {
    /** Controls which mode is open; undefined = closed */
    mode?: DrawerMode
    /** Required for edit / view */
    teacher?: Teacher | null
    /** Callback after successful create/edit */
    onSuccess?: () => void
    onClose?: () => void
    /** Custom trigger element — wrapping will open the drawer.
     *  If omitted, you must control open state externally via `mode`. */
    trigger?: React.ReactNode
}

// ─────────────────────────── Component ───────────────────────────

export function TeacherDrawer({
    mode: externalMode,
    teacher,
    onSuccess,
    onClose,
    trigger,
}: TeacherDrawerProps) {
    const [internalMode, setInternalMode] = useState<DrawerMode | undefined>(
        externalMode
    )
    const open = !!internalMode

    // Keep in sync with external control
    useEffect(() => {
        setInternalMode(externalMode)
    }, [externalMode])

    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setInternalMode(undefined)
            onClose?.()
        }
    }

    // ── Form ──
    const form = useForm<TeacherFormValues>({
        resolver: zodResolver(teacherSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            address: "",
            nationality: "Việt Nam",
            gender: "male",
            expertise: "",
            experience: "",
            target_student: "all",
            status: "active",
            avatar: "",
            bio: "",
        },
    })

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        watch,
    } = form

    const currentAvatar = watch("avatar")

    const [isFetching, setIsFetching] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Reset + load data when drawer opens
    useEffect(() => {
        if (!open) return

        if ((internalMode === "edit" || internalMode === "view") && teacher) {
            setIsFetching(true)
            api.get(`/admin/teachers/${teacher.id}`)
                .then((res) => {
                    const data = res.data?.data || res.data
                    reset({
                        name: data.name || "",
                        email: data.email || "",
                        phone: data.phone || "",
                        address: data.address || "",
                        nationality: data.nationality || "Việt Nam",
                        gender: data.gender || "male",
                        expertise: data.expertise || "",
                        experience: data.experience?.toString() || "",
                        target_student: data.target_student || "all",
                        status: data.status || "active",
                        date_of_birth: data.date_of_birth
                            ? format(new Date(data.date_of_birth), "yyyy-MM-dd")
                            : "",
                        avatar: data.avatar || "",
                        bio: data.bio || "",
                    })
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message ||
                        "Không thể tải thông tin giáo viên"
                    )
                    handleOpenChange(false)
                })
                .finally(() => setIsFetching(false))
        } else {
            reset({
                name: "",
                email: "",
                phone: "",
                address: "",
                nationality: "Việt Nam",
                gender: "male",
                expertise: "",
                experience: "",
                target_student: "all",
                status: "active",
                date_of_birth: "",
                avatar: "",
                bio: "",
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, internalMode, teacher?.id])

    // ── Submit ──
    const onSubmit = async (data: TeacherFormValues) => {
        setIsSubmitting(true)
        try {
            const payload = {
                ...data,
            }

            if (internalMode === "edit" && teacher) {
                const res = await api.put(`/admin/teachers/${teacher.id}`, payload)
                if (res.data?.success === false)
                    throw new Error(res.data.message || "Lỗi khi cập nhật")
                toast.success("Cập nhật giáo viên thành công!")
            } else {
                const res = await api.post("/admin/teachers", payload)
                if (res.data?.success === false)
                    throw new Error(res.data.message || "Lỗi khi tạo")
                toast.success("Thêm giáo viên thành công!")
                reset()
            }

            handleOpenChange(false)
            onSuccess?.()
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                const msg = err.response?.data?.message || "Đã có lỗi xảy ra."
                toast.error(msg)
                if (err.response?.data?.errors) {
                    Object.entries(err.response.data.errors).forEach(
                        ([key, val]) => {
                            form.setError(key as keyof TeacherFormValues, {
                                message: (val as string[])[0],
                            })
                        }
                    )
                }
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // ── Upload ──
    const handleAvatarClick = () => {
        if (isDisabled || isUploading) return
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
                form.setValue("avatar", url, { shouldValidate: true })
                toast.success("Tải ảnh lên thành công")
            } else {
                throw new Error("Không nhận được URL từ máy chủ")
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                toast.error(err.response?.data?.message || "Lỗi khi tải ảnh lên")
            }
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    // ── Title & icon per mode ──
    const modeConfig: Record<
        DrawerMode,
        { title: string; description: string }
    > = {
        create: {
            title: "Thêm giáo viên mới",
            description: "Điền thông tin để tạo hồ sơ giáo viên.",
        },
        edit: {
            title: "Chỉnh sửa giáo viên",
            description: "Cập nhật thông tin chi tiết của giáo viên.",
        },
        view: {
            title: "Chi tiết giáo viên",
            description: "Xem toàn bộ thông tin của giáo viên.",
        },
    }

    const isView = internalMode === "view"
    const isDisabled = isSubmitting || isFetching

    // ── Render detail info row ──
    const DetailRow = ({
        icon: Icon,
        label,
        value,
    }: {
        icon: React.ElementType
        label: string
        value?: string | null
    }) => (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {label}
                </span>
                <span className="text-sm font-medium text-foreground break-words">
                    {value || "—"}
                </span>
            </div>
        </div>
    )

    // ─── Trigger wrapping ────────
    const triggerEl = trigger ? (
        <span
            onClick={() => setInternalMode(externalMode ?? "create")}
            style={{ display: "contents" }}
        >
            {trigger}
        </span>
    ) : null

    return (
        <>
            {triggerEl}
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto overflow-x-hidden px-6 pb-6">
                    {/* Header */}
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <GraduationCap className="h-4 w-4" />
                            </div>
                            {internalMode
                                ? modeConfig[internalMode].title
                                : "Giáo viên"}
                        </SheetTitle>
                        <SheetDescription>
                            {internalMode
                                ? modeConfig[internalMode].description
                                : ""}
                        </SheetDescription>
                    </SheetHeader>

                    {/* Loading skeleton */}
                    {isFetching ? (
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : isView ? (
                        /* ──────────── VIEW MODE ──────────── */
                        <div className="space-y-6">
                            {/* Avatar + name */}
                            <div className="flex flex-col items-center gap-3 py-4">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-lg ring-2 ring-primary/20">
                                    <AvatarImage
                                        src={currentAvatar || undefined}
                                        alt={watch("name")}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                        {watch("name")
                                            ?.split(" ")
                                            .pop()
                                            ?.substring(0, 2)
                                            .toUpperCase() || "GV"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-foreground">
                                        {watch("name")}
                                    </h3>
                                    <Badge
                                        className={cn(
                                            "mt-1 text-xs",
                                            watch("status") === "active"
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-200/50"
                                                : "bg-rose-500/10 text-rose-600 border-rose-200/50"
                                        )}
                                        variant="outline"
                                    >
                                        {watch("status") === "active"
                                            ? "Đang hoạt động"
                                            : "Bị khóa"}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                                        <Info className="h-4 w-4" /> Thông tin cơ bản
                                    </h4>
                                    <div className="space-y-5">
                                        <DetailRow
                                            icon={Mail}
                                            label="Email"
                                            value={watch("email")}
                                        />
                                        <DetailRow
                                            icon={Phone}
                                            label="Số điện thoại"
                                            value={watch("phone")}
                                        />
                                        <DetailRow
                                            icon={MapPin}
                                            label="Địa chỉ"
                                            value={watch("address")}
                                        />
                                        <DetailRow
                                            icon={Globe}
                                            label="Quốc tịch"
                                            value={watch("nationality")}
                                        />
                                        <DetailRow
                                            icon={User}
                                            label="Giới tính"
                                            value={getLabel(genderOptions, watch("gender"))}
                                        />
                                        <DetailRow
                                            icon={Calendar}
                                            label="Ngày sinh"
                                            value={
                                                watch("date_of_birth")
                                                    ? format(
                                                        watch("date_of_birth"),
                                                        "dd/MM/yyyy"
                                                    )
                                                    : undefined
                                            }
                                        />
                                    </div>
                                </div>

                                <Separator className="opacity-50" />

                                <div className="space-y-6">
                                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" /> Chuyên môn & Giảng dạy
                                    </h4>
                                    <div className="space-y-5">
                                        <DetailRow
                                            icon={GraduationCap}
                                            label="Chuyên môn"
                                            value={watch("expertise")}
                                        />
                                        <DetailRow
                                            icon={CalendarIcon}
                                            label="Kinh nghiệm"
                                            value={`${watch("experience")} năm`}
                                        />
                                        <DetailRow
                                            icon={Users}
                                            label="Đối tượng học sinh"
                                            value={getLabel(targetStudentOptions, watch("target_student"))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {watch("bio") && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Giới thiệu (Bio)
                                    </h4>
                                    <div className="rounded-xl bg-muted/30 p-4 border text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                        {watch("bio")}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleOpenChange(false)}
                                >
                                    Đóng
                                </Button>
                                <Can permission="teacher_edit">
                                    <Button
                                        onClick={() => setInternalMode("edit")}
                                        className="shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform"
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Chỉnh sửa
                                    </Button>
                                </Can>
                            </div>
                        </div>
                    ) : (
                        /* ──────────── CREATE / EDIT MODE ──────────── */
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            {/* Avatar selector at the top */}
                            <div className="flex flex-col items-center gap-2 py-2">
                                <div
                                    className={cn(
                                        "relative group cursor-pointer",
                                        (isDisabled || isUploading) && "cursor-not-allowed opacity-70"
                                    )}
                                    onClick={handleAvatarClick}
                                >
                                    <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-background shadow-lg ring-2 ring-primary/10 transition-all hover:ring-primary/40">
                                        {currentAvatar ? (
                                            <Image
                                                src={currentAvatar}
                                                alt="Avatar"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-primary/5 flex items-center justify-center">
                                                <User className="h-12 w-12 text-primary/30" />
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isUploading ? (
                                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                                            ) : (
                                                <Camera className="h-8 w-8 text-white" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Upload Progress Indicator */}
                                    {isUploading && (
                                        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center shadow-md">
                                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Click để {currentAvatar ? "đổi" : "tải"} ảnh đại diện
                                </p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <Separator />

                            <div className="flex flex-col gap-6">
                                {/* Họ và tên */}
                                <Field data-invalid={!!errors.name}>
                                    <FieldLabel>
                                        Họ và tên <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("name")}
                                            placeholder="VD: Trần Văn E"
                                            disabled={isDisabled}
                                            className="focus-visible:ring-primary/30"
                                        />
                                    </FieldContent>
                                    <FieldError
                                        errors={[
                                            { message: errors.name?.message },
                                        ]}
                                    />
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Email */}
                                    <Field data-invalid={!!errors.email}>
                                        <FieldLabel>
                                            Email <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("email")}
                                                type="email"
                                                placeholder="VD: giaovien@gmail.com"
                                                disabled={isDisabled}
                                                className="focus-visible:ring-primary/30"
                                            />
                                        </FieldContent>
                                        <FieldError
                                            errors={[
                                                { message: errors.email?.message },
                                            ]}
                                        />
                                    </Field>

                                    {/* Số điện thoại */}
                                    <Field data-invalid={!!errors.phone}>
                                        <FieldLabel>
                                            Số điện thoại <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("phone")}
                                                placeholder="VD: 0789123456"
                                                disabled={isDisabled}
                                                className="focus-visible:ring-primary/30"
                                            />
                                        </FieldContent>
                                        <FieldError
                                            errors={[
                                                { message: errors.phone?.message },
                                            ]}
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Ngày sinh */}
                                    <Field data-invalid={!!errors.date_of_birth}>
                                        <FieldLabel>
                                            Ngày sinh <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                type="date"
                                                {...register("date_of_birth")}
                                                disabled={isDisabled}
                                                className="focus-visible:ring-primary/30"
                                            />
                                        </FieldContent>
                                        <FieldError
                                            errors={[
                                                { message: errors.date_of_birth?.message },
                                            ]}
                                        />
                                    </Field>

                                    {/* Giới tính */}
                                    <Field data-invalid={!!errors.gender}>
                                        <FieldLabel>
                                            Giới tính <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <div className="flex gap-2">
                                                {genderOptions.map((opt) => {
                                                    const isSelected = watch("gender") === opt.value
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            disabled={isDisabled}
                                                            onClick={() =>
                                                                form.setValue("gender", opt.value, { shouldValidate: true })
                                                            }
                                                            className={cn(
                                                                "flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all disabled:opacity-50",
                                                                isSelected
                                                                    ? "bg-primary/10 border-primary text-primary"
                                                                    : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                                                            )}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </FieldContent>
                                        <FieldError
                                            errors={[
                                                { message: errors.gender?.message },
                                            ]}
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Quốc tịch */}
                                    <Field data-invalid={!!errors.nationality}>
                                        <FieldLabel>
                                            Quốc tịch <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("nationality")}
                                                placeholder="VD: Việt Nam"
                                                disabled={isDisabled}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: errors.nationality?.message }]} />
                                    </Field>

                                    {/* Địa chỉ */}
                                    <Field data-invalid={!!errors.address}>
                                        <FieldLabel>
                                            Địa chỉ <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("address")}
                                                placeholder="VD: Số nhà, đường..."
                                                disabled={isDisabled}
                                            />
                                        </FieldContent>
                                        <FieldError
                                            errors={[
                                                { message: errors.address?.message },
                                            ]}
                                        />
                                    </Field>
                                </div>

                                {/* Trạng thái */}
                                <Field data-invalid={!!errors.status}>
                                    <FieldLabel>
                                        Trạng thái <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <div className="flex gap-4">
                                            {statusOptions.map((opt) => {
                                                const isSelected = watch("status") === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        disabled={isDisabled}
                                                        onClick={() =>
                                                            form.setValue("status", opt.value as "active" | "inactive", { shouldValidate: true })
                                                        }
                                                        className={cn(
                                                            "flex-1 flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200 disabled:opacity-50",
                                                            isSelected
                                                                ? opt.activeClass
                                                                : "border-muted bg-muted/20 text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/40"
                                                        )}
                                                    >
                                                        {opt.value === "active" ? (
                                                            <ShieldCheck className={cn("h-5 w-5", isSelected ? "text-emerald-500" : "text-muted-foreground")} />
                                                        ) : (
                                                            <ShieldAlert className={cn("h-5 w-5", isSelected ? "text-rose-500" : "text-muted-foreground")} />
                                                        )}
                                                        <span className="text-sm font-bold">{opt.label}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </FieldContent>
                                    <FieldError
                                        errors={[
                                            { message: errors.status?.message },
                                        ]}
                                    />
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Chuyên môn */}
                                    <Field data-invalid={!!errors.expertise}>
                                        <FieldLabel>
                                            Chuyên môn <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("expertise")}
                                                placeholder="VD: Toán, Tiếng Anh..."
                                                disabled={isDisabled}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: errors.expertise?.message }]} />
                                    </Field>

                                    {/* Kinh nghiệm */}
                                    <Field data-invalid={!!errors.experience}>
                                        <FieldLabel>
                                            Kinh nghiệm (năm) <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("experience")}
                                                placeholder="VD: 5"
                                                disabled={isDisabled}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: errors.experience?.message }]} />
                                    </Field>
                                </div>

                                {/* Đối tượng học sinh */}
                                <Field data-invalid={!!errors.target_student}>
                                    <FieldLabel>
                                        Đối tượng học sinh <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            control={control}
                                            name="target_student"
                                            render={({ field }) => (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {targetStudentOptions.map((opt) => {
                                                        const isSelected = field.value === opt.value
                                                        const Icon = opt.icon
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                disabled={isDisabled}
                                                                onClick={() => field.onChange(opt.value)}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-xs font-medium transition-all",
                                                                    isSelected
                                                                        ? "bg-primary/10 border-primary text-primary"
                                                                        : "border-input bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                )}
                                                            >
                                                                <Icon className="h-4 w-4" />
                                                                {opt.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: errors.target_student?.message }]} />
                                </Field>

                                {/* Bio */}
                                <Field data-invalid={!!errors.bio}>
                                    <FieldLabel>Giới thiệu (Bio)</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            {...register("bio")}
                                            placeholder="Giới thiệu sơ lược về bản thân..."
                                            rows={4}
                                            disabled={isDisabled}
                                            className="resize-none focus-visible:ring-primary/30"
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: errors.bio?.message }]} />
                                </Field>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isDisabled}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isDisabled}
                                    className="min-w-[120px] shadow-md shadow-primary/20"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            {internalMode === "edit" ? "Cập nhật" : "Lưu hồ sơ"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}
