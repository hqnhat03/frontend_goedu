"use client"

import api from "@/lib/axios"
import { AxiosError } from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isBefore, parseISO, startOfDay } from "date-fns"
import {
  AlertCircle,
  BookOpen,
  Clock,
  Loader2,
  Save,
  Users,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import * as z from "zod"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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

import { useClassStore } from "@/store/class-store"
import { CourseSelect } from "../../../_components/course-select"
import { SchedulePicker } from "../../../_components/schedule-picker"
import { TeacherSelect } from "../../../_components/teacher-select"

const classSchema = z.object({
  class_code: z.string().min(1, "Vui lòng nhập mã lớp"),
  start_day: z.date({
    error: "Vui lòng chọn ngày bắt đầu",
  }),
  end_day: z.date({
    error: "Vui lòng chọn ngày kết thúc",
  }),
  max_student: z.coerce.number().min(1, "Sĩ số phải lớn hơn 0"),
  meeting_url: z.string().url("Link phải là một URL hợp lệ").or(z.literal("")).optional(),
  status: z.enum(["published", "draft", "archived"]),
  course_id: z.coerce.number({
    error: "Vui lòng chọn khóa học",
  }).min(1, "Vui lòng chọn khóa học"),
  class_teachers: z.array(z.object({
    id: z.string(),
    teacher_id: z.number()
  })).min(1, "Cần ít nhất 1 giáo viên phụ trách"),
  class_schedules: z.array(z.object({
    id: z.string(),
    day_of_week: z.number(),
    start_time: z.string(),
    end_time: z.string(),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.start_day && data.end_day && !isBefore(startOfDay(data.start_day), startOfDay(data.end_day)) && data.start_day.getTime() !== data.end_day.getTime()) {
    // Check if start_day is before end_day
    if (isBefore(data.end_day, data.start_day)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày kết thúc phải sau ngày bắt đầu",
        path: ["end_day"],
      })
    }
  }
})

type FormValues = z.infer<typeof classSchema>

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

interface InitialClassData {
  class_code?: string;
  start_day?: string;
  end_day?: string;
  max_student?: number;
  meeting_url?: string;
  status?: string;
  course_id?: number;
  class_teaches?: { id?: string; teacher_id: number }[];
  class_teachers?: { id?: string; teacher_id: number }[];
  class_schedules?: { id?: string; day_of_week: string; start_time?: string; end_time?: string }[];
  students?: unknown[];
}

interface ClassFormProps {
  initialData: InitialClassData
}

export function ClassForm({ initialData }: ClassFormProps) {
  const params = useParams()
  const router = useRouter()
  const classId = params.classId as string

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(classSchema as any),
    defaultValues: {
      class_code: initialData.class_code || "",
      start_day: initialData.start_day ? parseISO(initialData.start_day) : undefined,
      end_day: initialData.end_day ? parseISO(initialData.end_day) : undefined,
      max_student: initialData.max_student || 25,
      meeting_url: initialData.meeting_url || "",
      status: initialData.status || "published",
      course_id: initialData.course_id || Number(params.id),
      class_teachers: (initialData.class_teaches || initialData.class_teachers || []).map((t) => ({
        id: t.id || uuidv4(),
        teacher_id: t.teacher_id
      })),
      class_schedules: (initialData.class_schedules || []).map((s) => ({
        id: s.id || uuidv4(),
        day_of_week: s.day_of_week,
        start_time: s.start_time?.substring(0, 5),
        end_time: s.end_time?.substring(0, 5)
      })),
    },
  })

  const { formState: { errors, isDirty } } = form

  // Prevent leaving if form is dirty
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    setShowConfirm(false)
    try {
      const payload = {
        ...data,
        start_day: format(data.start_day, "yyyy-MM-dd"),
        end_day: format(data.end_day, "yyyy-MM-dd"),
      }


      const response = await api.put(`/admin/classes/${classId}`, payload)

      // Save data to store for use in detail page
      if (response.data?.data) {
        useClassStore.getState().setClassDetail(response.data.data)
      }

      toast.success("Cập nhật lớp học thành công!")
      router.push(`/admin/courses/${params.id}/classes/${classId}`)
      router.refresh()
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || err.message || "Có lỗi xảy ra khi cập nhật lớp học")
      } else {
        toast.error("Có lỗi xảy ra khi cập nhật lớp học")
      }
      setIsSubmitting(false)
    }
  }

  const studentCount = initialData.students?.length || 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Card: Thông tin lớp học */}
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Thông tin lớp học
              </div>
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  Sĩ số: {studentCount}/{form.watch("max_student")}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field data-invalid={!!errors.class_code}>
                <FieldLabel>Mã lớp <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="VD: LH001"
                    className="bg-background/50 focus-visible:ring-primary/20"
                    {...form.register("class_code")}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.class_code?.message }]} />
              </Field>

              <Field data-invalid={!!errors.course_id}>
                <FieldLabel>Khóa học <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="course_id"
                    render={({ field }) => (
                      <CourseSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.course_id?.message }]} />
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
                    {...form.register("max_student")}
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
                  placeholder="https://zoom.us/j/..."
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
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t mt-8">
        <div className="flex-1">
          {isDirty && (
            <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium animate-pulse">
              <AlertCircle className="h-4 w-4" />
              Bạn có thay đổi chưa lưu
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          type="button"
          onClick={() => router.back()}
          className="hover:bg-muted"
          disabled={isSubmitting}
        >
          Hủy bỏ
        </Button>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogTrigger render={
            <Button
              type="button"
              className="min-w-[140px] shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isSubmitting || !isDirty}
              onClick={async () => {
                const isValid = await form.trigger();
                if (isValid) setShowConfirm(true);
                else {
                  toast.error("Vui lòng kiểm tra lại thông tin trong form");
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          }></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận cập nhật</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn lưu các thay đổi này cho lớp học không?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={form.handleSubmit(onSubmit)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Xác nhận lưu
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </form>
  )
}
