"use client"

import api from "@/lib/axios"
import { Level } from "@/store/level-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { Activity, Layers, LayoutGrid, Loader2, Plus, Save } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { AxiosError } from "axios"

const levelSchema = z.object({
    name: z.string().min(1, "Tên trình độ không được để trống"),
    education_level: z.string().min(1, "Vui lòng chọn cấp học"),
    status: z.enum(["draft", "published", "archived"], {
        error: "Vui lòng chọn trạng thái",
    }),
})

type FormValues = z.infer<typeof levelSchema>

type LevelType = {
    id: number
    level: string
    education_level: string
    status: string
}

const statusOptions = [
    {
        value: "draft",
        label: "Bản nháp",
        activeClass:
            "bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-500 dark:text-slate-200",
    },
    {
        value: "published",
        label: "Đã xuất bản",
        activeClass:
            "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-300",
    },
    {
        value: "archived",
        label: "Lưu trữ",
        activeClass:
            "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-500 dark:text-rose-300",
    },
]

interface LevelFormDrawerProps {
    /** If provided, the drawer is in "edit" mode; otherwise "create" mode */
    level?: Level | null
    /** Called after a successful create or update */
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function LevelFormDrawer({
    level,
    onSuccess,
    trigger,
}: LevelFormDrawerProps) {
    const isEdit = !!level
    const [open, setOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [educationLevels, setEducationLevels] = React.useState<string[]>([])
    const [isEduPopoverOpen, setIsEduPopoverOpen] = React.useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(levelSchema),
        defaultValues: {
            name: level?.level ?? "",
            education_level: level?.education_level ?? "",
            status: level?.status ?? "draft",
        },
    })

    // Reset form when level changes (switching between rows)
    React.useEffect(() => {
        form.reset({
            name: level?.level ?? "",
            education_level: level?.education_level ?? "",
            status: level?.status ?? "draft",
        })
    }, [level, form])

    const fetchEducationLevels = React.useCallback(async () => {
        try {
            const response = await api.get("/admin/levels/education-levels")
            const result = response.data
            if (response.status === 200) {
                const data = result.data || []
                const levels = data.map((item: LevelType) => {
                    return item.education_level
                })
                setEducationLevels(levels)
            }
        } catch (error) {
            console.error("Failed to fetch education levels:", error)
        }
    }, [])

    // Fetch education levels when drawer opens
    React.useEffect(() => {
        if (open) {
            fetchEducationLevels()
        }
    }, [open, fetchEducationLevels])

    const eduLevelValue = form.watch("education_level")
    const filteredEduLevels = React.useMemo(() => {
        if (!eduLevelValue) return educationLevels
        return educationLevels.filter((l) =>
            l.toLowerCase().includes(eduLevelValue.toLowerCase())
        )
    }, [educationLevels, eduLevelValue])

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const payload = {
                level: data.name,
                education_level: data.education_level,
                status: data.status,
            }

            if (isEdit) {
                const res = await api.put(`/admin/levels/${level!.id}`, payload)
                if (res.status !== 200) {
                    throw new Error(
                        res.data?.message || "Có lỗi xảy ra khi cập nhật trình độ"
                    )
                }
                toast.success("Cập nhật trình độ thành công")
            } else {
                const res = await api.post("/admin/levels", payload)
                if (res.status !== 200 && res.status !== 201) {
                    throw new Error(
                        res.data?.message || "Có lỗi xảy ra khi tạo trình độ"
                    )
                }
                toast.success("Tạo trình độ thành công")
                form.reset({ name: "", education_level: "", status: "draft" })
            }

            setOpen(false)
            onSuccess?.()
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                toast.error(err.response?.data?.message || "Không thể kết nối đến máy chủ")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const defaultTrigger = isEdit ? (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
            title="Chỉnh sửa"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
        </Button>
    ) : (
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> Thêm trình độ
        </Button>
    )

    const triggerEl = trigger ?? defaultTrigger

    return (
        <>
            <span onClick={() => setOpen(true)} style={{ display: "contents" }}>
                {triggerEl}
            </span>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-6 pb-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Layers className="h-4 w-4" />
                            </div>
                            {isEdit ? "Chỉnh sửa trình độ" : "Thêm trình độ mới"}
                        </SheetTitle>
                        <SheetDescription>
                            {isEdit
                                ? `Cập nhật thông tin trình độ.`
                                : "Điền thông tin chi tiết để tạo một trình độ mới."}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Level Name */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                Tên trình độ <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    placeholder="VD: Lớp 1, Lớp 2, Đại học năm 1..."
                                    className="focus-visible:ring-primary/30"
                                    {...form.register("name")}
                                />
                            </FieldContent>
                            <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
                        </Field>

                        {/* Education Level */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                                Cấp học <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Popover
                                    open={isEduPopoverOpen && filteredEduLevels.length > 0}
                                    onOpenChange={setIsEduPopoverOpen}
                                >
                                    <PopoverTrigger
                                        render={
                                            <button className="relative w-full">
                                                <Input
                                                    placeholder="VD: Tiểu học, Trung học, Lớp 1..."
                                                    className="focus-visible:ring-primary/30"
                                                    {...form.register("education_level", {
                                                        onChange: (e) =>
                                                            setIsEduPopoverOpen(
                                                                e.target.value.length > 0
                                                            ),
                                                    })}
                                                    autoComplete="off"
                                                />
                                            </button>
                                        }
                                    />
                                    <PopoverContent
                                        className="p-1 w-[var(--radix-popover-trigger-width)] max-h-[300px] overflow-auto shadow-xl border-muted-foreground/20"
                                        align="start"
                                        initialFocus={false}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                Gợi ý cấp học
                                            </p>
                                            {filteredEduLevels.map((edu) => (
                                                <Button
                                                    key={edu}
                                                    variant="ghost"
                                                    type="button"
                                                    className="justify-start font-normal h-9 px-2 hover:bg-primary/10 hover:text-primary transition-colors text-sm"
                                                    onClick={() => {
                                                        form.setValue("education_level", edu)
                                                        setIsEduPopoverOpen(false)
                                                    }}
                                                >
                                                    {edu}
                                                </Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </FieldContent>
                            <FieldError
                                errors={[{ message: form.formState.errors.education_level?.message }]}
                            />
                        </Field>

                        {/* Status — radio-style buttons */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                Trạng thái <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <div className="flex gap-2">
                                    {statusOptions.map((opt) => {
                                        const isSelected = form.watch("status") === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() =>
                                                    form.setValue("status", opt.value as "draft" | "published" | "archived", {
                                                        shouldValidate: true,
                                                    })
                                                }
                                                className={[
                                                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
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
                                errors={[{ message: form.formState.errors.status?.message }]}
                            />
                        </Field>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setOpen(false)}
                                className="hover:bg-muted"
                                disabled={isSubmitting}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                type="submit"
                                className="min-w-[140px] shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isEdit ? "Lưu thay đổi" : "Lưu trình độ"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </>
    )
}
