"use client"

import api from "@/lib/axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isBefore, startOfDay } from "date-fns"
import {
  BookOpen,
  Clock,
  Loader2,
  Save,
} from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { SchedulePicker } from "@/app/admin/(dashboard)/classes/_components/schedule-picker"
import { TeacherSelect } from "@/app/admin/(dashboard)/classes/_components/teacher-select"
import { AxiosError } from "axios"

const baseClassSchema = z.object({
  class_code: z.string().min(1, "Vui lòng nhập mã lớp"),
  start_day: z.date({
    error: "Vui lòng chọn ngày bắt đầu",
  }),
  end_day: z.date({
    error: "Vui lòng chọn ngày kết thúc",
  }),
  max_student: z.number().min(1, "Sĩ số phải lớn hơn 0"),
  meeting_url: z.string().url("Link phải là một URL hợp lệ (vd: https://meet.google.com/...)").or(z.literal("")).optional(),
  status: z.enum(["published", "draft", "archived"]),
  class_schedules: z.array(z.object({
    id: z.string(),
    day_of_week: z.number(),
    start_time: z.string(),
    end_time: z.string(),
  })).optional(),
  course_id: z.number({
    error: "Vui lòng chọn khóa học",
  }).min(1, "Vui lòng chọn khóa học"),
  class_teachers: z.array(z.object({
    id: z.string(),
    teacher_id: z.number()
  })).min(1, "Cần ít nhất 1 giáo viên phụ trách")
})

type FormValues = z.infer<typeof baseClassSchema>

const classSchema = baseClassSchema.superRefine((data, ctx) => {
  if (data.start_day && data.end_day && !isBefore(startOfDay(data.start_day), startOfDay(data.end_day)) && !isBefore(data.start_day, data.end_day)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ngày kết thúc phải sau ngày bắt đầu",
      path: ["end_day"],
    })
  }
})

const statusOptions = [
  {
    value: "draft",
    label: "Bản nháp",
    activeClass: "bg-slate-50 border-slate-500 text-slate-700 dark:bg-slate-950 dark:border-slate-500 dark:text-slate-300"
  },
  {
    value: "published",
    label: "Xuất bản",
    activeClass: "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-300"
  },
  {
    value: "archived",
    label: "Lưu trữ",
    activeClass: "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300"
  },
]

export function ClassForm() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialCourseId = params?.id as string
  const [courseName, setCourseName] = React.useState<string>(searchParams.get("course_name") || "")

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoadingCourse, setIsLoadingCourse] = React.useState(false)

  // Fetch course name if not in state/query
  React.useEffect(() => {
    if (initialCourseId && !courseName) {
      const fetchCourseName = async () => {
        setIsLoadingCourse(true)
        try {
          const res = await api.get(`/admin/courses/${initialCourseId}`)
          const data = res.data?.data || res.data
          if (data?.name) {
            setCourseName(data.name)
          }
        } catch (error) {
          console.error("Failed to fetch course name:", error)
        } finally {
          setIsLoadingCourse(false)
        }
      }
      fetchCourseName()
    }
  }, [initialCourseId, courseName])

  const form = useForm<FormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      class_code: "",
      max_student: 25,
      meeting_url: "",
      status: "published",
      course_id: initialCourseId ? Number(initialCourseId) : undefined,
      class_teachers: [],
      class_schedules: [],
    },
  })

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        start_day: format(data.start_day, "yyyy-MM-dd"),
        end_day: format(data.end_day, "yyyy-MM-dd"),
      }

      await api.post("/admin/classes", payload)

      toast.success("Tạo lớp học thành công!")

      // Chuyển hướng ngay lập tức để cải thiện tốc độ phản hồi UI
      const targetUrl = initialCourseId
        ? `/admin/courses/${initialCourseId}/classes`
        : "/admin/classes"

      router.push(targetUrl)
      router.refresh()
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Có lỗi xảy ra khi tạo lớp học")
      }
      setIsSubmitting(false)
    }
  }

  const { formState: { errors } } = form

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Card: Thông tin lớp học */}
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Thông tin lớp học
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field data-invalid={!!errors.class_code}>
                <FieldLabel>Mã lớp <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="VD: CLS001"
                    className="bg-background/50 focus-visible:ring-primary/20"
                    {...form.register("class_code")}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.class_code?.message }]} />
              </Field>

              <Field>
                <FieldLabel>Khóa học</FieldLabel>
                <FieldContent>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-primary font-medium">
                    <BookOpen className="h-4 w-4" />
                    {isLoadingCourse ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-sm opacity-70">Đang tải thông tin khóa học...</span>
                      </div>
                    ) : (
                      <span className="text-sm">{courseName || `ID: ${initialCourseId}`}</span>
                    )}
                  </div>
                  {/* Hidden input to keep form value if needed, though course_id is already in defaultValues */}
                  <input type="hidden" {...form.register("course_id", { valueAsNumber: true })} />
                </FieldContent>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field data-invalid={!!errors.start_day}>
                <FieldLabel>Ngày bắt đầu <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="start_day"
                    render={({ field }) => (
                      <Input
                        type="date"
                        className="bg-background/50 focus-visible:ring-primary/20"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    )}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.start_day?.message }]} />
              </Field>

              <Field data-invalid={!!errors.end_day}>
                <FieldLabel>Ngày kết thúc <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="end_day"
                    render={({ field }) => (
                      <Input
                        type="date"
                        className="bg-background/50 focus-visible:ring-primary/20"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    )}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.end_day?.message }]} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field data-invalid={!!errors.max_student}>
                <FieldLabel>Sĩ số tối đa <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    placeholder="VD: 25"
                    className="bg-background/50 focus-visible:ring-primary/20"
                    {...form.register("max_student", { valueAsNumber: true })}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.max_student?.message }]} />
              </Field>

              <Field data-invalid={!!errors.status}>
                <FieldLabel>Trạng thái <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <div className="flex gap-2 w-full">
                        {statusOptions.map((opt) => {
                          const isSelected = field.value === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={cn(
                                "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                                isSelected
                                  ? opt.activeClass
                                  : "border-input bg-background/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.status?.message }]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.meeting_url}>
              <FieldLabel>Link học online (Meeting URL) <span className="text-muted-foreground font-normal">(Tùy chọn)</span></FieldLabel>
              <FieldContent>
                <Input
                  placeholder="https://meet.google.com/abc-def-ghi"
                  className="bg-background/50 focus-visible:ring-primary/20"
                  {...form.register("meeting_url")}
                />
              </FieldContent>
              <FieldError errors={[{ message: errors.meeting_url?.message }]} />
            </Field>

            <Field data-invalid={!!errors.class_teachers}>
              <FieldLabel>Giáo viên phụ trách <span className="text-destructive">*</span></FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="class_teachers"
                  render={({ field }) => (
                    <TeacherSelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FieldContent>
              <FieldError errors={[{ message: errors.class_teachers?.message }]} />
            </Field>
          </CardContent>
        </Card>

        {/* Card: Lịch học */}
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Lịch học
            </CardTitle>
            <CardDescription>
              <p className="text-sm text-muted-foreground mt-3">
                Kéo thả hoặc click chọn/hủy chọn các khung giờ học trong tuần.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="class_schedules"
              render={({ field }) => (
                <SchedulePicker
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-6 border-t mt-8">
          <Button
            variant="ghost"
            type="button"
            onClick={() => router.back()}
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
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu lớp học
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
