"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
    Calendar,
    CalendarIcon,
    Camera,
    Check,
    ChevronsUpDown,
    Edit,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Plus,
    Save,
    ShieldCheck,
    User,
    Users,
    X
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { AxiosError } from "axios"

// ─────────────────────────── Types ───────────────────────────

export interface Guardian {
    id: number | string
    name: string
    email: string
    phone: string
    address?: string
    gender?: string
    status: "active" | "inactive"
    date_of_birth?: string
    avatar?: string | null
    students?: { id: number; name: string; email?: string }[]
}

// ─────────────────────────── Schema ───────────────────────────

const guardianSchema = z.object({
    name: z.string().min(1, { message: "Vui lòng nhập tên" }),
    email: z.email({ message: "Email không hợp lệ" }),
    phone: z.string().min(10, { message: "Số điện thoại không hợp lệ" }),
    address: z.string().min(1, { message: "Vui lòng nhập địa chỉ" }),
    gender: z
        .enum(["male", "female", "other"], { error: "Vui lòng chọn giới tính" })
        .or(z.string()),
    status: z.enum(["active", "inactive"], {
        error: "Vui lòng chọn trạng thái",
    }),
    date_of_birth: z.date({ error: "Vui lòng chọn ngày sinh" }),
    avatar: z.string().optional().nullable(),
    student_ids: z.array(z.number()),
})

type GuardianFormValues = z.infer<typeof guardianSchema>

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

function genderLabel(g?: string) {
    return genderOptions.find((o) => o.value === g)?.label ?? g ?? "—"
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value)
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(t)
    }, [value, delay])
    return debounced
}

// ─────────────────────────── Props ───────────────────────────

type DrawerMode = "create" | "edit" | "view"

interface GuardianDrawerProps {
    /** Controls which mode is open; undefined = closed */
    mode?: DrawerMode
    /** Required for edit / view */
    guardian?: Guardian | null
    /** Callback after successful create/edit */
    onSuccess?: () => void
    onClose?: () => void
    /** Custom trigger element — wrapping will open the drawer.
     *  If omitted, you must control open state externally via `mode`. */
    trigger?: React.ReactNode
}

interface StudentType {
    id: number;
    name: string;
    email: string;
    avatar: string;
}

// ─────────────────────────── Component ───────────────────────────

export function GuardianDrawer({
    mode: externalMode,
    guardian,
    onSuccess,
    onClose,
    trigger,
}: GuardianDrawerProps) {
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

    // ── Students search state ──
    const [students, setStudents] = useState<
        { id: number; name: string; email?: string }[]
    >([])
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearch = useDebounce(searchTerm, 500)
    const [isStudentsLoading, setIsStudentsLoading] = useState(false)
    const [openStudentsDropdown, setOpenStudentsDropdown] = useState(false)
    const studentDict = React.useRef<Map<number, string>>(new Map())

    // ── Form ──
    const form = useForm<GuardianFormValues>({
        resolver: zodResolver(guardianSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            address: "",
            gender: "male",
            status: "active",
            avatar: "",
            student_ids: [],
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
        studentDict.current.clear()
        setStudents([])
        setSearchTerm("")

        if ((internalMode === "edit" || internalMode === "view") && guardian) {
            setIsFetching(true)
            api.get(`/admin/guardians/${guardian.id}`)
                .then((res) => {
                    const data = res.data?.data || res.data
                    reset({
                        name: data.name || "",
                        email: data.email || "",
                        phone: data.phone || "",
                        address: data.address || "",
                        gender: data.gender || "male",
                        status: data.status || "active",
                        date_of_birth: data.date_of_birth
                            ? new Date(data.date_of_birth)
                            : new Date(),
                        avatar: data.avatar || "",
                        student_ids: data.students
                            ? data.students.map((s: StudentType) => s.id)
                            : [],
                    })
                    if (data.students && Array.isArray(data.students)) {
                        data.students.forEach((s: StudentType) => {
                            const n = s.name
                            studentDict.current.set(s.id, n)
                        })
                        setStudents(
                            data.students.map((s: StudentType) => ({
                                id: s.id,
                                name: s.name,
                                email: s.email,
                            }))
                        )
                    }
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message ||
                        "Không thể tải thông tin phụ huynh"
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
                gender: "male",
                status: "active",
                avatar: "",
                student_ids: [],
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, internalMode, guardian?.id])

    // Fetch students for search
    useEffect(() => {
        if (!open || internalMode === "view") return
        if (!debouncedSearch && !openStudentsDropdown) return

        let mounted = true
        setIsStudentsLoading(true)
        const params = new URLSearchParams()
        if (debouncedSearch) params.append("search", debouncedSearch)

        api.get(`/admin/students/all-students?${params}`)
            .then((res) => {
                if (!mounted) return
                const raw = Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data?.data)
                        ? res.data.data
                        : Array.isArray(res.data?.data?.data)
                            ? res.data.data.data
                            : []

                const mapped = raw.map((s: StudentType) => {
                    const n = s.name
                    studentDict.current.set(s.id, n)
                    return { id: s.id, name: n, email: s.email }
                })
                setStudents(mapped)
            })
            .catch(console.error)
            .finally(() => { if (mounted) setIsStudentsLoading(false) })

        return () => { mounted = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, openStudentsDropdown, open, internalMode])

    // ── Submit ──
    const onSubmit = async (data: GuardianFormValues) => {
        setIsSubmitting(true)
        try {
            const payload = {
                ...data,
                date_of_birth: format(data.date_of_birth, "yyyy-MM-dd"),
            }

            if (internalMode === "edit" && guardian) {
                const res = await api.put(`/admin/guardians/${guardian.id}`, payload)
                if (res.data?.success === false)
                    throw new Error(res.data.message || "Lỗi khi cập nhật")
                toast.success("Cập nhật phụ huynh thành công!")
            } else {
                const res = await api.post("/admin/guardians", payload)
                if (res.data?.success === false)
                    throw new Error(res.data.message || "Lỗi khi tạo")
                toast.success("Thêm phụ huynh thành công!")
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
                            form.setError(key as keyof GuardianFormValues, {
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
            title: "Thêm phụ huynh mới",
            description: "Điền thông tin để tạo tài khoản phụ huynh.",
        },
        edit: {
            title: "Chỉnh sửa phụ huynh",
            description: "Cập nhật thông tin chi tiết của phụ huynh.",
        },
        view: {
            title: "Chi tiết phụ huynh",
            description: "Xem toàn bộ thông tin của phụ huynh.",
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
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto overflow-x-hidden px-6 pb-6">
                    {/* Header */}
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            {internalMode
                                ? modeConfig[internalMode].title
                                : "Phụ huynh"}
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
                                <Avatar className="h-20 w-20 border-4 border-background shadow-lg ring-2 ring-primary/20">
                                    <AvatarImage
                                        src={currentAvatar || undefined}
                                        alt={watch("name")}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                        {watch("name")
                                            ?.split(" ")
                                            .pop()
                                            ?.substring(0, 2)
                                            .toUpperCase() || "PH"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-foreground">
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

                            <div className="space-y-4">
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
                                    icon={User}
                                    label="Giới tính"
                                    value={genderLabel(watch("gender"))}
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

                            {/* Students */}
                            {students.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <Users className="h-4 w-4 text-primary" />
                                            Học sinh phụ trách ({students.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {students.map((s) => (
                                                <Badge
                                                    key={s.id}
                                                    variant="secondary"
                                                    className="text-xs font-medium"
                                                >
                                                    {s.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleOpenChange(false)}
                                >
                                    Đóng
                                </Button>
                                <Can permission="guardian_edit">
                                    <Button
                                        onClick={() => setInternalMode("edit")}
                                        className="shadow-md shadow-primary/20"
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
                            className="space-y-5"
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

                            {/* Họ và tên */}
                            <Field data-invalid={!!errors.name}>
                                <FieldLabel>
                                    Họ và tên{" "}
                                    <span className="text-destructive">*</span>
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

                            {/* Email */}
                            <Field data-invalid={!!errors.email}>
                                <FieldLabel>
                                    Email{" "}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        {...register("email")}
                                        type="email"
                                        placeholder="VD: phuhuynh@gmail.com"
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
                                    Số điện thoại{" "}
                                    <span className="text-destructive">*</span>
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

                            {/* Địa chỉ */}
                            <Field data-invalid={!!errors.address}>
                                <FieldLabel>
                                    Địa chỉ{" "}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        {...register("address")}
                                        placeholder="VD: Đà Nẵng"
                                        disabled={isDisabled}
                                        className="focus-visible:ring-primary/30"
                                    />
                                </FieldContent>
                                <FieldError
                                    errors={[
                                        { message: errors.address?.message },
                                    ]}
                                />
                            </Field>

                            {/* Giới tính */}
                            <Field data-invalid={!!errors.gender}>
                                <FieldLabel>
                                    Giới tính{" "}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <div className="flex gap-2">
                                        {genderOptions.map((opt) => {
                                            const isSelected =
                                                watch("gender") === opt.value
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() =>
                                                        form.setValue(
                                                            "gender",
                                                            opt.value,
                                                            {
                                                                shouldValidate:
                                                                    true,
                                                            }
                                                        )
                                                    }
                                                    className={[
                                                        "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all disabled:opacity-50",
                                                        isSelected
                                                            ? "bg-primary/10 border-primary text-primary"
                                                            : "border-input bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                                                    ].join(" ")}
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

                            {/* Trạng thái */}
                            <Field data-invalid={!!errors.status}>
                                <FieldLabel>
                                    Trạng thái{" "}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <div className="flex gap-2">
                                        {statusOptions.map((opt) => {
                                            const isSelected =
                                                watch("status") === opt.value
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() =>
                                                        form.setValue(
                                                            "status",
                                                            opt.value as
                                                            | "active"
                                                            | "inactive",
                                                            {
                                                                shouldValidate:
                                                                    true,
                                                            }
                                                        )
                                                    }
                                                    className={[
                                                        "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all disabled:opacity-50",
                                                        isSelected
                                                            ? opt.activeClass
                                                            : "border-input bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                                                    ].join(" ")}
                                                >
                                                    {opt.label}
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

                            {/* Ngày sinh */}
                            <Field
                                data-invalid={!!errors.date_of_birth}
                                className="flex flex-col"
                            >
                                <FieldLabel>
                                    Ngày sinh{" "}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={control}
                                        name="date_of_birth"
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger
                                                    render={
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal focus-visible:ring-primary/20 border-input",
                                                                !field.value &&
                                                                "text-muted-foreground"
                                                            )}
                                                            disabled={isDisabled}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value ? (
                                                                format(
                                                                    field.value,
                                                                    "dd/MM/yyyy"
                                                                )
                                                            ) : (
                                                                <span>
                                                                    Chọn ngày sinh
                                                                </span>
                                                            )}
                                                        </Button>
                                                    }
                                                />
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={
                                                            field.onChange
                                                        }
                                                        disabled={(date) =>
                                                            date > new Date() ||
                                                            date <
                                                            new Date(
                                                                "1900-01-01"
                                                            )
                                                        }
                                                        initialFocus
                                                        defaultMonth={
                                                            field.value ||
                                                            new Date(1990, 0)
                                                        }
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                </FieldContent>
                                <FieldError
                                    errors={[
                                        {
                                            message:
                                                errors.date_of_birth?.message,
                                        },
                                    ]}
                                />
                            </Field>

                            <Separator />

                            {/* Students Multiselect */}
                            <Field data-invalid={!!errors.student_ids}>
                                <FieldLabel className="flex items-center gap-1.5">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Học sinh phụ trách
                                </FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={control}
                                        name="student_ids"
                                        render={({ field }) => {
                                            const handleSelect = (
                                                id: number
                                            ) => {
                                                const cur =
                                                    field.value || []
                                                field.onChange(
                                                    cur.includes(id)
                                                        ? cur.filter(
                                                            (x) => x !== id
                                                        )
                                                        : [...cur, id]
                                                )
                                            }
                                            const handleRemove = (
                                                id: number,
                                                e: React.MouseEvent
                                            ) => {
                                                e.stopPropagation()
                                                field.onChange(
                                                    (
                                                        field.value || []
                                                    ).filter((x) => x !== id)
                                                )
                                            }

                                            return (
                                                <Popover
                                                    open={
                                                        openStudentsDropdown
                                                    }
                                                    onOpenChange={
                                                        setOpenStudentsDropdown
                                                    }
                                                >
                                                    <PopoverTrigger
                                                        render={
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                disabled={
                                                                    isDisabled
                                                                }
                                                                className="w-full justify-between min-h-10 h-auto py-2 focus-visible:ring-primary/30"
                                                            >
                                                                <div className="flex flex-wrap gap-1.5 flex-1 justify-start">
                                                                    {field.value &&
                                                                        field
                                                                            .value
                                                                            .length >
                                                                        0 ? (
                                                                        field.value.map(
                                                                            (
                                                                                id,
                                                                                idx
                                                                            ) => {
                                                                                const n =
                                                                                    studentDict.current.get(
                                                                                        id
                                                                                    ) ||
                                                                                    students.find(
                                                                                        (
                                                                                            s
                                                                                        ) =>
                                                                                            s.id ===
                                                                                            id
                                                                                    )
                                                                                        ?.name ||
                                                                                    `ID: ${id}`
                                                                                return (
                                                                                    <Badge
                                                                                        key={`${id}-${idx}`}
                                                                                        variant="secondary"
                                                                                        className="px-2 py-0.5 pr-1 text-xs"
                                                                                    >
                                                                                        <span className="mr-1">
                                                                                            {n}
                                                                                        </span>
                                                                                        <div
                                                                                            role="button"
                                                                                            className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-muted-foreground/20 cursor-pointer"
                                                                                            onClick={(
                                                                                                e
                                                                                            ) =>
                                                                                                handleRemove(
                                                                                                    id,
                                                                                                    e
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <X className="h-3 w-3 text-muted-foreground" />
                                                                                        </div>
                                                                                    </Badge>
                                                                                )
                                                                            }
                                                                        )
                                                                    ) : (
                                                                        <span className="text-muted-foreground font-normal text-sm">
                                                                            Chọn học sinh phụ trách...
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        }
                                                    />
                                                    <PopoverContent
                                                        className="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl"
                                                        align="start"
                                                    >
                                                        <Command
                                                            shouldFilter={false}
                                                        >
                                                            <CommandInput
                                                                placeholder="Tìm kiếm học sinh..."
                                                                value={
                                                                    searchTerm
                                                                }
                                                                onValueChange={
                                                                    setSearchTerm
                                                                }
                                                            />
                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    {isStudentsLoading ? (
                                                                        <div className="flex items-center justify-center p-4 text-muted-foreground">
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                            Đang tìm...
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-4 text-center text-muted-foreground text-sm">
                                                                            Không tìm thấy học sinh.
                                                                        </div>
                                                                    )}
                                                                </CommandEmpty>
                                                                {students.length >
                                                                    0 && (
                                                                        <CommandGroup heading="Danh sách học sinh">
                                                                            {students.map(
                                                                                (
                                                                                    student
                                                                                ) => {
                                                                                    const isSel =
                                                                                        (
                                                                                            field.value ||
                                                                                            []
                                                                                        ).includes(
                                                                                            student.id
                                                                                        )
                                                                                    return (
                                                                                        <CommandItem
                                                                                            key={
                                                                                                student.id
                                                                                            }
                                                                                            value={String(
                                                                                                student.id
                                                                                            )}
                                                                                            onSelect={() =>
                                                                                                handleSelect(
                                                                                                    student.id
                                                                                                )
                                                                                            }
                                                                                            className="cursor-pointer"
                                                                                        >
                                                                                            <div
                                                                                                className={cn(
                                                                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary text-primary transition-all",
                                                                                                    isSel
                                                                                                        ? "bg-primary text-primary-foreground border-transparent"
                                                                                                        : "opacity-50 [&_svg]:invisible"
                                                                                                )}
                                                                                            >
                                                                                                <Check className="h-3 w-3" />
                                                                                            </div>
                                                                                            <div className="flex flex-col">
                                                                                                <span className="font-medium text-sm">
                                                                                                    {
                                                                                                        student.name
                                                                                                    }
                                                                                                </span>
                                                                                                <span className="text-xs text-muted-foreground">
                                                                                                    ID:{" "}
                                                                                                    {
                                                                                                        student.id
                                                                                                    }
                                                                                                    {student.email
                                                                                                        ? ` • ${student.email}`
                                                                                                        : ""}
                                                                                                </span>
                                                                                            </div>
                                                                                        </CommandItem>
                                                                                    )
                                                                                }
                                                                            )}
                                                                        </CommandGroup>
                                                                    )}
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            )
                                        }}
                                    />
                                </FieldContent>
                                <FieldError
                                    errors={[
                                        {
                                            message:
                                                errors.student_ids?.message,
                                        },
                                    ]}
                                />
                            </Field>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isSubmitting}
                                    className="hover:bg-muted"
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isDisabled}
                                    className="min-w-[140px] shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            {internalMode === "edit" ? (
                                                <Save className="mr-2 h-4 w-4" />
                                            ) : (
                                                <Plus className="mr-2 h-4 w-4" />
                                            )}
                                            {internalMode === "edit"
                                                ? "Lưu thay đổi"
                                                : "Thêm phụ huynh"}
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
