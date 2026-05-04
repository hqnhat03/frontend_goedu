"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Loader2, BookOpen, Layers, Activity, Plus } from "lucide-react"
import { toast } from "sonner"

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
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import api from "@/lib/axios"
import { Subject } from "@/store/subject-store"

const subjectSchema = z.object({
    name: z.string().min(2, "Tên môn học phải có ít nhất 2 ký tự"),
    category: z.string().min(1, "Vui lòng chọn danh mục"),
    status: z.enum(["draft", "published", "archived"], {
        error: "Vui lòng chọn trạng thái",
    }),
})

type FormValues = z.infer<typeof subjectSchema>

const statusOptions = [
    { value: "draft", label: "Bản nháp", activeClass: "bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-500 dark:text-slate-200" },
    { value: "published", label: "Đã xuất bản", activeClass: "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-300" },
    { value: "archived", label: "Lưu trữ", activeClass: "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-500 dark:text-rose-300" },
]

interface SubjectFormDrawerProps {
    /** If provided, the drawer is in "edit" mode; otherwise "create" mode */
    subject?: Subject | null
    /** Called after a successful create or update */
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function SubjectFormDrawer({
    subject,
    onSuccess,
    trigger,
}: SubjectFormDrawerProps) {
    const isEdit = !!subject
    const [open, setOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [categories, setCategories] = React.useState<{ name: string; slug: string }[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = React.useState(false)
    const [isCatPopoverOpen, setIsCatPopoverOpen] = React.useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(subjectSchema),
        defaultValues: {
            name: subject?.name ?? "",
            category: subject?.category ?? "",
            status: subject?.status ?? "draft",
        },
    })

    // Reset form when subject changes (switching between rows)
    React.useEffect(() => {
        form.reset({
            name: subject?.name ?? "",
            category: subject?.category ?? "",
            status: subject?.status ?? "draft",
        })
    }, [subject, form])

    const fetchCategories = React.useCallback(async () => {
        setIsLoadingCategories(true)
        try {
            const response = await api.get("/admin/subjects/categories")
            setCategories(response.data?.data || [])
            // data is [{ name, slug }]
        } catch (error) {
            console.error("Failed to fetch categories:", error)
        } finally {
            setIsLoadingCategories(false)
        }
    }, [])

    // Fetch categories when drawer opens
    React.useEffect(() => {
        if (open) {
            fetchCategories()
        }
    }, [open, fetchCategories])

    const categoryValue = form.watch("category")
    const filteredCategories = React.useMemo(() => {
        if (!categoryValue) return categories
        return categories.filter((cat) =>
            cat.name.toLowerCase().includes(categoryValue.toLowerCase())
        )
    }, [categories, categoryValue])

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            if (isEdit) {
                const res = await api.put(`/admin/subjects/${subject!.id}`, data)
                if (!res.data?.success && res.status !== 200) {
                    throw new Error(res.data?.message || "Có lỗi xảy ra khi cập nhật môn học")
                }
                toast.success("Cập nhật môn học thành công")
            } else {
                const res = await api.post("/admin/subjects", data)
                if (!res.data?.success && res.status !== 201) {
                    throw new Error(res.data?.message || "Có lỗi xảy ra khi tạo môn học")
                }
                toast.success("Tạo môn học thành công")
                form.reset({ name: "", category: "", status: "draft" })
            }
            setOpen(false)
            onSuccess?.()
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || "Không thể kết nối đến máy chủ")
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        </Button>
    ) : (
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> Thêm môn học
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
                            <BookOpen className="h-4 w-4" />
                        </div>
                        {isEdit ? "Chỉnh sửa môn học" : "Thêm môn học mới"}
                    </SheetTitle>
                    <SheetDescription>
                        {isEdit
                            ? `Cập nhật thông tin môn học.`
                            : "Điền thông tin chi tiết để tạo một môn học mới."}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Subject Name */}
                    <Field>
                        <FieldLabel className="flex items-center gap-2">
                            Tên môn học <span className="text-destructive">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                placeholder="VD: Toán học cao cấp, Tiếng Anh giao tiếp..."
                                className="focus-visible:ring-primary/30"
                                {...form.register("name")}
                            />
                        </FieldContent>
                        <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
                    </Field>

                    {/* Category */}
                    <Field>
                        <FieldLabel className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            Danh mục <span className="text-destructive">*</span>
                        </FieldLabel>
                        <FieldContent>
                            {isLoadingCategories ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <Popover
                                    open={isCatPopoverOpen && filteredCategories.length > 0}
                                    onOpenChange={setIsCatPopoverOpen}
                                >
                                    <PopoverTrigger
                                        render={
                                            <button className="relative w-full">
                                                <Input
                                                    placeholder="Chọn hoặc nhập danh mục mới..."
                                                    className="focus-visible:ring-primary/30"
                                                    {...form.register("category", {
                                                        onChange: (e) =>
                                                            setIsCatPopoverOpen(
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
                                                Gợi ý danh mục
                                            </p>
                                            {filteredCategories.map((cat) => (
                                                <Button
                                                    key={cat.slug}
                                                    variant="ghost"
                                                    type="button"
                                                    className="justify-start font-normal h-9 px-2 hover:bg-primary/10 hover:text-primary transition-colors text-sm"
                                                    onClick={() => {
                                                        form.setValue("category", cat.name, { shouldValidate: true })
                                                        setIsCatPopoverOpen(false)
                                                    }}
                                                >
                                                    {cat.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </FieldContent>
                        <FieldError errors={[{ message: form.formState.errors.category?.message }]} />
                    </Field>

                    {/* Status */}
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
                                            onClick={() => form.setValue("status", opt.value as any, { shouldValidate: true })}
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
                        <FieldError errors={[{ message: form.formState.errors.status?.message }]} />
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
                                    {isEdit ? "Lưu thay đổi" : "Lưu môn học"}
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
