"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import * as z from "zod"
import { v4 as uuidv4 } from "uuid"
import {
    Save,
    Loader2,
    ChevronLeft,
    Plus,
    Trash2,
    LinkIcon,
    CheckIcon,
    ImageIcon,
    BookOpen,
    ChevronsUpDown,
    Layers,
    LayoutGrid
} from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/axios"
import { usePermission } from "@/hooks/use-permission"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Field,
    FieldLabel,
    FieldError,
    FieldContent,
} from "@/components/ui/field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

const courseSchema = z.object({
    name: z.string().min(1, "Tên khóa học không được để trống"),
    description: z.string().min(1, "Mô tả khóa học không được để trống"),
    status: z.enum(["draft", "published", "archived"], {
        errorMap: () => ({ message: "Vui lòng chọn trạng thái" }),
    }),
    target_student: z.enum(["student", "teacher", "all"], {
        errorMap: () => ({ message: "Vui lòng chọn đối tượng" }),
    }),
    price: z.number().min(0, "Giá bán phải lớn hơn hoặc bằng 0"),
    lesson_count: z.number().optional().default(0),
    completion_time: z.number().optional().default(0),
    image_url: z.string().optional(),
    level_id: z.number({ invalid_type_error: "Vui lòng chọn trình độ" }).min(1, "Vui lòng chọn trình độ"),
    subject_id: z.number({ invalid_type_error: "Vui lòng chọn môn học" }).min(1, "Vui lòng chọn môn học"),
    course_materials: z.array(
        z.object({
            id: z.string().optional(),
            name: z.string().optional(),
            link_url: z.string().url("URL không hợp lệ").min(1, "Vui lòng nhập Link URL"),
        })
    ).optional(),
})

type FormValues = z.infer<typeof courseSchema>

export default function EditCoursePage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.id
    const { hasPermission } = usePermission()

    // Kiểm tra quyền
    React.useEffect(() => {
        if (!hasPermission("course_edit")) {
            toast.error("Bạn không có quyền thực hiện chức năng này")
            router.push("/admin/courses")
        }
    }, [hasPermission, router])

    
    const [isLoadingInit, setIsLoadingInit] = React.useState(true)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [levels, setLevels] = React.useState<{ label: string; value: number }[]>([])
    const [subjects, setSubjects] = React.useState<{ label: string; value: number }[]>([])

    // Combobox popover states
    const [openLevel, setOpenLevel] = React.useState(false)
    const [openSubject, setOpenSubject] = React.useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            name: "",
            description: "",
            status: "draft",
            target_student: "student",
            price: 0,
            lesson_count: 0,
            completion_time: 0,
            image_url: "",
            course_materials: []
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "course_materials",
    })

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoadingInit(true)
            try {
                const [levelRes, subjectRes, courseRes] = await Promise.all([
                    api.get("/admin/levels"),
                    api.get("/admin/subjects"),
                    api.get(`/admin/courses/${courseId}`)
                ]);

                const levelsData = levelRes.data.data || levelRes.data || [];
                const subjectsData = subjectRes.data.data || subjectRes.data || [];

                setLevels(levelsData.map((item: any) => ({
                    label: item.level || item.name || String(item.id),
                    value: Number(item.id)
                })));

                setSubjects(subjectsData.map((item: any) => ({
                    label: item.name || String(item.id),
                    value: Number(item.id)
                })));

                // Map course data to form
                const cData = courseRes.data.data || courseRes.data;
                if (cData) {
                    let defaultLevelId = Number(cData.level_id || cData.level?.id || 0);
                    if (!defaultLevelId && typeof cData.level === 'string') {
                        const matched = levelsData.find((l: any) => (l.level || l.name) === cData.level);
                        if (matched) defaultLevelId = Number(matched.id);
                    }
                    
                    let defaultSubjectId = Number(cData.subject_id || cData.subject?.id || 0);
                    if (!defaultSubjectId && typeof cData.subject === 'string') {
                        const matched = subjectsData.find((s: any) => s.name === cData.subject);
                        if (matched) defaultSubjectId = Number(matched.id);
                    }

                    form.reset({
                        name: cData.name || "",
                        description: cData.description || "",
                        status: cData.status || "draft",
                        target_student: cData.target_student || "student",
                        price: Number(cData.price) || 0,
                        lesson_count: Number(cData.lesson_count) || 0,
                        completion_time: Number(cData.completion_time) || 0,
                        image_url: cData.image_url || "",
                        level_id: defaultLevelId,
                        subject_id: defaultSubjectId,
                        course_materials: Array.isArray(cData.course_materials) ? cData.course_materials.map((m: any) => ({
                            id: m.id ? String(m.id) : uuidv4(),
                            name: m.name || "",
                            link_url: m.link_url || ""
                        })) : []
                    })
                }
            } catch (error) {
                console.error("Fetch data failed", error);
                toast.error("Không thể tải dữ liệu khóa học");
                router.push("/admin/courses")
            } finally {
                setIsLoadingInit(false)
            }
        };

        if (courseId) {
            fetchData();
        }
    }, [courseId, form, router]);

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const payload = {
                ...data,
                course_materials: data.course_materials?.filter(m => m.link_url.trim() !== "") || []
            }

            await api.put(`/admin/courses/${courseId}`, payload)

            toast.success("Cập nhật khóa học thành công!")
            router.push("/admin/courses")
            router.refresh()
        } catch (err: any) {
            console.error(err)
            toast.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật khóa học")
        } finally {
            setIsSubmitting(false)
        }
    }

    const imageUrl = form.watch("image_url")

    if (isLoadingInit) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                        <div>
                            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[400px] bg-muted animate-pulse rounded-lg" />
                    <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full shadow-sm hover:bg-accent transition-colors"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Chỉnh sửa khóa học
                        </h2>
                        <p className="text-muted-foreground">Cập nhật thông tin chi tiết của khóa học</p>
                    </div>
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cột chính: Thông tin cơ bản */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Thông tin chung
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Field>
                                    <FieldLabel>Tên khóa học <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Input
                                            placeholder="VD: Khóa học Laravel từ cơ bản đến nâng cao"
                                            className="bg-background/50"
                                            {...form.register("name")}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
                                </Field>

                                <Field>
                                    <FieldLabel>Mô tả <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            placeholder="Nhập nội dung mô tả khóa học..."
                                            className="min-h-[160px] bg-background/50"
                                            {...form.register("description")}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.description?.message }]} />
                                </Field>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field>
                                        <FieldLabel>Môn học <span className="text-destructive">*</span></FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                control={form.control}
                                                name="subject_id"
                                                render={({ field }) => (
                                                    <Popover open={openSubject} onOpenChange={setOpenSubject}>
                                                        <PopoverTrigger render={
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={openSubject}
                                                                className={cn(
                                                                    "w-full justify-between font-normal bg-background/50",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? subjects.find((s) => s.value === field.value)?.label
                                                                    : "Chọn môn học"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        }>

                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Tìm kiếm môn học..." />
                                                                <CommandList>
                                                                    <CommandEmpty>Không tìm thấy môn học.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {subjects.map((subject) => (
                                                                            <CommandItem
                                                                                key={subject.value}
                                                                                value={subject.label}
                                                                                onSelect={() => {
                                                                                    field.onChange(subject.value)
                                                                                    setOpenSubject(false)
                                                                                }}
                                                                            >
                                                                                <CheckIcon
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        field.value === subject.value ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {subject.label}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.subject_id?.message }]} />
                                    </Field>

                                    <Field>
                                        <FieldLabel>Trình độ <span className="text-destructive">*</span></FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                control={form.control}
                                                name="level_id"
                                                render={({ field }) => (
                                                    <Popover open={openLevel} onOpenChange={setOpenLevel}>
                                                        <PopoverTrigger render={
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={openLevel}
                                                                className={cn(
                                                                    "w-full justify-between font-normal bg-background/50",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? levels.find((l) => l.value === field.value)?.label
                                                                    : "Chọn trình độ"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        }>

                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Tìm kiếm trình độ..." />
                                                                <CommandList>
                                                                    <CommandEmpty>Không tìm thấy trình độ.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {levels.map((level) => (
                                                                            <CommandItem
                                                                                key={level.value}
                                                                                value={level.label}
                                                                                onSelect={() => {
                                                                                    field.onChange(level.value)
                                                                                    setOpenLevel(false)
                                                                                }}
                                                                            >
                                                                                <CheckIcon
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        field.value === level.value ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {level.label}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.level_id?.message }]} />
                                    </Field>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tài liệu khóa học (Dynamic List) */}
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-primary" />
                                        Tài liệu khóa học
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ id: uuidv4(), link_url: "" })}
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" /> Thêm tài liệu
                                    </Button>
                                </CardTitle>
                                <CardDescription>Các tài liệu tham khảo cho toàn bộ khóa học</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {fields.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/20">
                                        Chưa có tài liệu nào. Bấm "Thêm tài liệu" để bắt đầu.
                                    </div>
                                ) : (
                                    fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-4 items-start bg-accent/30 p-3 rounded-lg border border-accent">
                                            <div className="flex-1">
                                                <Field>
                                                    <FieldContent>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <Input
                                                                placeholder="https://example.com/tai-lieu.zip"
                                                                className="pl-10 bg-background"
                                                                {...form.register(`course_materials.${index}.link_url` as const)}
                                                            />
                                                        </div>
                                                    </FieldContent>
                                                    {form.formState.errors.course_materials?.[index]?.link_url && (
                                                        <p className="text-[0.8rem] font-medium text-destructive mt-1">
                                                            {form.formState.errors.course_materials[index]?.link_url?.message}
                                                        </p>
                                                    )}
                                                </Field>
                                                {/* Hidden input for ID logic if needed */}
                                                <input type="hidden" {...form.register(`course_materials.${index}.id` as const)} value={field.id} />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cột bên phải: Thuộc tính bổ sung */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <LayoutGrid className="h-5 w-5 text-primary" />
                                    Cài đặt thuộc tính
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Field>
                                    <FieldLabel>Trạng thái <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-9 px-2 text-xs md:text-sm font-medium transition-all bg-transparent",
                                                            field.value === "draft" 
                                                                ? "border-slate-500 text-slate-700 dark:text-slate-300 ring-1 ring-slate-500 bg-slate-50 dark:bg-slate-900/50" 
                                                                : "border-input text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                                                        )}
                                                        onClick={() => field.onChange("draft")}
                                                    >
                                                        Bản nháp
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-9 px-2 text-xs md:text-sm font-medium transition-all bg-transparent",
                                                            field.value === "published" 
                                                                ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                                                                : "border-input text-muted-foreground hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
                                                        )}
                                                        onClick={() => field.onChange("published")}
                                                    >
                                                        Xuất bản
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-9 px-2 text-xs md:text-sm font-medium transition-all bg-transparent",
                                                            field.value === "archived" 
                                                                ? "border-rose-500 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500 bg-rose-50 dark:bg-rose-950/30" 
                                                                : "border-input text-muted-foreground hover:bg-rose-50/50 dark:hover:bg-rose-950/30"
                                                        )}
                                                        onClick={() => field.onChange("archived")}
                                                    >
                                                        Lưu trữ
                                                    </Button>
                                                </div>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.status?.message }]} />
                                </Field>

                                <Field>
                                    <FieldLabel>Đối tượng <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            control={form.control}
                                            name="target_student"
                                            render={({ field }) => (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-9 text-sm font-medium transition-all bg-transparent",
                                                            field.value === "student"
                                                                ? "border-primary text-primary ring-1 ring-primary bg-primary/5"
                                                                : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                        )}
                                                        onClick={() => field.onChange("student")}
                                                    >
                                                        Học sinh
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-9 text-sm font-medium transition-all bg-transparent",
                                                            field.value === "teacher"
                                                                ? "border-primary text-primary ring-1 ring-primary bg-primary/5"
                                                                : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                        )}
                                                        onClick={() => field.onChange("teacher")}
                                                    >
                                                        Nhân viên
                                                    </Button>
                                                </div>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.target_student?.message }]} />
                                </Field>

                                <div>
                                    <Field>
                                        <FieldLabel>Giá bán (VNĐ) <span className="text-destructive">*</span></FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                control={form.control}
                                                name="price"
                                                render={({ field }) => (
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        placeholder="1,990,000"
                                                        className="bg-background/50"
                                                        value={field.value ? Number(field.value).toLocaleString('vi-VN') : ""}
                                                        onChange={(e) => {
                                                            const raw = e.target.value.replace(/\D/g, "")
                                                            field.onChange(raw ? Number(raw) : 0)
                                                        }}
                                                    />
                                                )}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.price?.message }]} />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel>Số bài học</FieldLabel>
                                        <FieldContent>
                                            <Input
                                                type="number"
                                                placeholder="VD: 24"
                                                className="bg-background/50"
                                                {...form.register("lesson_count")}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.lesson_count?.message }]} />
                                    </Field>

                                    <Field>
                                        <FieldLabel>Thời gian (Giờ)</FieldLabel>
                                        <FieldContent>
                                            <Input
                                                type="number"
                                                placeholder="VD: 60"
                                                className="bg-background/50"
                                                {...form.register("completion_time")}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.completion_time?.message }]} />
                                    </Field>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-primary" />
                                    Hình ảnh khóa học
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Field>
                                    <FieldContent>
                                        <Input
                                            placeholder="https://example.com/image.jpg"
                                            className="bg-background/50"
                                            {...form.register("image_url")}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.image_url?.message }]} />
                                </Field>

                                {imageUrl ? (
                                    <div className="rounded-lg overflow-hidden border bg-muted flex items-center justify-center min-h-[160px]">
                                        <img
                                            src={imageUrl}
                                            alt="Preview"
                                            className="w-full h-auto object-cover max-h-[250px]"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.classList.add('p-8');
                                                const span = document.createElement('span');
                                                span.className = "text-muted-foreground text-sm flex flex-col items-center gap-2";
                                                span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off h-8 w-8 opacity-50"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><line x1="13.5" x2="6" y1="13.5" y2="21"/><line x1="18" x2="21" y1="12" y2="15"/><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59"/><path d="M21 15V5a2 2 0 0 0-2-2H9"/></svg>Hình ảnh không hợp lệ`;
                                                e.currentTarget.parentElement?.appendChild(span);
                                            }}
                                            onLoad={(e) => {
                                                e.currentTarget.style.display = 'block';
                                                const errSpan = e.currentTarget.parentElement?.querySelector('span');
                                                if (errSpan) errSpan.remove();
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed bg-muted/20 flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                                        <span className="text-sm">Chưa có hình ảnh đại diện</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t mt-8">
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() => router.back()}
                        className="hover:bg-muted"
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
                                Cập nhật khóa học
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
