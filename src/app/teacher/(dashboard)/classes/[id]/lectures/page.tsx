"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  CloudUpload,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  FileUp,
  Info,
  Loader2,
  PlayCircle,
  Plus,
  Trash2,
  Upload
} from "lucide-react"
import { useParams } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/axios"
import { useLectureStore } from "@/store/lecture-store"
import { AxiosError } from "axios"
import { toast } from "sonner"

// Zod Schema for Lecture
const lectureSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên bài giảng"),
  duration_time: z.coerce.number().min(1, "Thời lượng phải lớn hơn 0"),
  lecture_number: z.coerce.number().min(1, "Số thứ tự phải lớn hơn 0"),
  document_url: z.string().url("Link tài liệu không hợp lệ").optional().or(z.literal("")),
  video_url: z.string().url("Link video không hợp lệ"),
  description: z.string().min(1, "Vui lòng nhập mô tả"),
})

type LectureFormValues = z.infer<typeof lectureSchema>

interface Lecture {
  id: number
  name: string
  description?: string
  lecture_number: number
  status: 'draft' | 'published'
  created_at: string
  duration_time: number
  document_url?: string
  video_url: string
}

export default function ClassLecturesPage() {
  const params = useParams()
  const [lectures, setLectures] = React.useState<Lecture[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const { editingLecture, setEditingLecture } = useLectureStore()
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false)
  const [selectedLecture, setSelectedLecture] = React.useState<Lecture | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [importFile, setImportFile] = React.useState<File | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [lectureToDelete, setLectureToDelete] = React.useState<Lecture | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const form = useForm<LectureFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(lectureSchema as any),
    defaultValues: {
      name: "",
      duration_time: 0,
      lecture_number: 1,
      document_url: "",
      video_url: "",
      description: "",
    },
  })

  const fetchLectures = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get(`/teacher/classes/${params.id}/lectures`)
      if (response.data?.success) {
        setLectures(response.data.data)
      } else {
        setLectures([])
      }
    } catch (error) {
      console.error("Failed to fetch lectures:", error)
      setLectures([])
    } finally {
      setLoading(false)
    }
  }, [params.id])

  React.useEffect(() => {
    if (params.id) {
      fetchLectures()
    }
  }, [fetchLectures, params.id])

  React.useEffect(() => {
    if (editingLecture && isEditModalOpen) {
      form.reset({
        name: editingLecture.name,
        duration_time: editingLecture.duration_time,
        lecture_number: editingLecture.lecture_number,
        document_url: editingLecture.document_url || "",
        video_url: editingLecture.video_url,
        description: editingLecture.description || "",
      })
    }
  }, [editingLecture, isEditModalOpen, form])

  const onSubmit = async (data: LectureFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await api.post(`/teacher/classes/${params.id}/lectures`, {
        ...data,
      })

      if (response.data?.success) {
        toast.success("Tạo bài giảng thành công")
        setIsCreateModalOpen(false)
        form.reset()
        fetchLectures()
      } else {
        toast.error(response.data?.message || "Không thể tạo bài giảng")
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi tạo bài giảng")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onUpdate = async (data: LectureFormValues) => {
    if (!editingLecture) return
    setIsSubmitting(true)
    try {
      const response = await api.put(`/teacher/lectures/${editingLecture.id}`, {
        ...data,
      })

      if (response.data?.success) {
        toast.success("Cập nhật bài giảng thành công")
        setIsEditModalOpen(false)
        setEditingLecture(null)
        form.reset()
        fetchLectures()
      } else {
        toast.error(response.data?.message || "Không thể cập nhật bài giảng")
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi cập nhật bài giảng")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Vui lòng chọn file CSV để tải lên")
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("file", importFile)

      const response = await api.post(`/teacher/classes/${params.id}/lectures/import`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data?.success) {
        toast.success("Nhập danh sách bài giảng thành công")
        setIsImportModalOpen(false)
        setImportFile(null)
        fetchLectures()
      } else {
        toast.error(response.data?.message || "Không thể nhập danh sách bài giảng")
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi nhập danh sách")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!lectureToDelete) return
    setIsDeleting(true)
    try {
      const response = await api.delete(`/teacher/lectures/${lectureToDelete.id}`)

      if (response.data?.success) {
        toast.success("Xóa bài giảng thành công")
        setIsDeleteModalOpen(false)
        setLectureToDelete(null)
        fetchLectures()
      } else {
        toast.error(response.data?.message || "Không thể xóa bài giảng")
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi xóa bài giảng")
      }
    } finally {
      setIsDeleting(false)
    }
  }



  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <span>Quản lý lớp học</span>
          <ChevronRight className="size-4 opacity-50" />
          <span className="text-primary font-semibold">{params.id}</span>
          <ChevronRight className="size-4 opacity-50" />
          <span>Bài giảng</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-4">
              Quản lý bài giảng
              {!loading && (
                <Badge variant="secondary" className="font-bold rounded-lg text-sm bg-primary/10 text-primary border-none self-center">
                  {lectures.length} bài
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground font-medium">
              Tạo và quản lý tài liệu, video bài giảng cho lớp học này.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="rounded-lg h-12 px-6 gap-2 border-2 hover:bg-muted/50 transition-all font-bold"
            >
              <FileUp className="size-5" />
              <span>Nhập danh sách</span>
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-lg h-12 px-6 gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 font-bold"
            >
              <Plus className="size-5" />
              <span>Thêm bài giảng mới</span>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : lectures.length === 0 ? (
        <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-xl p-16 flex flex-col items-center justify-center min-h-[500px] text-center space-y-6 shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative p-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/10 shadow-inner">
              <BookOpen className="size-16" />
            </div>
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-2xl font-black tracking-tight">Chưa có bài giảng nào</h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Lớp học của bạn hiện tại chưa có tài liệu hay bài giảng nào. Hãy bắt đầu bằng cách thêm bài giảng đầu tiên!
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="outline"
            className="rounded-lg h-12 px-8 font-bold border-2 hover:bg-primary/5 transition-all"
          >
            Thêm bài giảng đầu tiên
          </Button>
        </div>
      ) : (
        <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-border/40 h-14">
                <TableHead className="w-[80px] text-center font-bold text-primary pl-6">STT</TableHead>
                <TableHead className="font-bold text-primary">Tên bài giảng</TableHead>
                <TableHead className="font-bold text-primary">Thời lượng</TableHead>
                <TableHead className="font-bold text-primary">Trạng thái</TableHead>
                <TableHead className="font-bold text-primary">Ngày tạo</TableHead>
                <TableHead className="w-[140px] text-right font-bold text-primary pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lectures.map((lecture) => (
                <TableRow key={lecture.id} className="hover:bg-muted/30 border-b-border/40 transition-colors h-16">
                  <TableCell className="text-center pl-6">
                    <span className="inline-flex items-center justify-center size-8 rounded-lg bg-muted font-black text-[10px] text-muted-foreground uppercase tracking-widest">
                      {lecture.lecture_number}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-base line-clamp-1">{lecture.name}</span>
                      <span className="text-xs text-muted-foreground font-medium line-clamp-1">
                        {lecture.description || "Không có mô tả cho bài giảng này."}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 w-fit border border-transparent group-hover:bg-white/50 group-hover:border-border/40 transition-all">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold">{lecture.duration_time} phút</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lecture.status} className="rounded-sm" />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 opacity-50" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                        title="Xem chi tiết"
                        onClick={() => {
                          setSelectedLecture(lecture)
                          setIsViewModalOpen(true)
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
                        title="Chỉnh sửa"
                        onClick={() => {
                          setEditingLecture(lecture)
                          setIsEditModalOpen(true)
                        }}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Xóa bài giảng"
                        onClick={() => {
                          setLectureToDelete(lecture)
                          setIsDeleteModalOpen(true)
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-0 border-none shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-black tracking-tight">Thêm bài giảng mới</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Nhập thông tin chi tiết để tạo bài giảng mới cho lớp học này.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 pt-6 space-y-6">
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel>Tên bài giảng</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="VD: Giới thiệu về React"
                      className="rounded-lg h-11"
                      {...form.register("name")}
                    />
                    <FieldError errors={[form.formState.errors.name]} />
                  </FieldContent>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Số thứ tự</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min="1"
                        className="rounded-lg h-11"
                        {...form.register("lecture_number")}
                      />
                      <FieldError errors={[form.formState.errors.lecture_number]} />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Thời lượng (phút)</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min="1"
                        className="rounded-lg h-11"
                        {...form.register("duration_time")}
                      />
                      <FieldError errors={[form.formState.errors.duration_time]} />
                    </FieldContent>
                  </Field>
                </div>
              </div>

              <Field>
                <FieldLabel>Link Video</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <PlayCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="https://youtube.com/..."
                      className="pl-9 rounded-lg h-11"
                      {...form.register("video_url")}
                    />
                  </div>
                  <FieldError errors={[form.formState.errors.video_url]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Link tài liệu (Tùy chọn)</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="https://drive.google.com/..."
                      className="pl-9 rounded-lg h-11"
                      {...form.register("document_url")}
                    />
                  </div>
                  <FieldError errors={[form.formState.errors.document_url]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Mô tả bài giảng</FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Tóm tắt nội dung bài giảng..."
                    className="rounded-lg min-h-[120px] resize-none"
                    {...form.register("description")}
                  />
                  <FieldError errors={[form.formState.errors.description]} />
                </FieldContent>
              </Field>
            </FieldGroup>

            <DialogFooter className="pt-4 flex items-center justify-end gap-3 bg-transparent border-none p-0 -mx-0">
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg h-11 px-6 font-bold"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="rounded-lg h-11 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu bài giảng"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg p-0 border-none shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-black tracking-tight">Nhập danh sách bài giảng</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Nhập hàng loạt bài giảng cho lớp học này thông qua file CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 pt-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Hướng dẫn thực hiện</h4>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm">Tải file mẫu</p>
                        <p className="text-xs text-muted-foreground">Tải xuống file CSV mẫu để biết các trường thông tin cần thiết.</p>
                        <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary gap-1">
                          <a className="flex" href="https://pub-0f9896b14f8c41848d2ef611dffb0b92.r2.dev/lectures_template.csv" download="lectures_template.csv">
                            <Download className="size-3" /> Tải file mẫu .csv
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm">Điền dữ liệu</p>
                        <p className="text-xs text-muted-foreground">Đảm bảo điền đúng các cột: name, duration_time, lecture_number, video_url, description.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm">Tải lên và Lưu</p>
                        <p className="text-xs text-muted-foreground">Chọn file đã điền và nhấn nút Lưu bài giảng để hoàn tất.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                  <Info className="size-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-600 font-medium leading-relaxed">
                    Lưu ý: Hệ thống sẽ tự động gán các bài giảng này vào lớp học hiện tại. Các link video và tài liệu phải là link hợp lệ.
                  </p>
                </div>
              </div>

              <div className="flex flex-col">
                <h4 className="font-bold text-sm uppercase tracking-wider text-primary mb-4">Chọn tệp tin</h4>
                <div
                  className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center transition-all ${importFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
                      setImportFile(file);
                    } else {
                      toast.error("Chỉ chấp nhận file định dạng .csv");
                    }
                  }}
                >
                  <div className={`p-4 rounded-lg mb-4 ${importFile ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} transition-colors`}>
                    {importFile ? <FileSpreadsheet className="size-8" /> : <CloudUpload className="size-8" />}
                  </div>
                  {importFile ? (
                    <div className="space-y-2">
                      <p className="font-bold text-sm truncate max-w-[200px]">{importFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(2)} KB</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive font-bold h-7 hover:bg-destructive/10"
                        onClick={() => setImportFile(null)}
                      >
                        Chọn lại file
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-bold text-sm">Nhấp để chọn hoặc kéo thả</p>
                      <p className="text-xs text-muted-foreground">Chỉ hỗ trợ định dạng .csv</p>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        id="csv-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setImportFile(file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg font-bold mt-2"
                        onClick={() => document.getElementById('csv-upload')?.click()}
                      >
                        Duyệt file
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex items-center justify-end gap-3 bg-transparent border-none p-0 -mx-0">
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg h-11 px-6 font-bold"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                }}
                disabled={isSubmitting}
              >
                Đóng
              </Button>
              <Button
                onClick={handleImport}
                className="rounded-lg h-11 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
                disabled={isSubmitting || !importFile}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang nhập...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Bắt đầu nhập
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* View Detail Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-0 border-none shadow-2xl">
          {selectedLecture && (
            <>
              <DialogHeader className="p-8 pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    Bài học {selectedLecture.lecture_number}
                  </Badge>
                  <StatusBadge status={selectedLecture.status} className="rounded-sm" />
                </div>
                <DialogTitle className="text-3xl font-black tracking-tight">{selectedLecture.name}</DialogTitle>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground font-medium text-sm">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    <span>{selectedLecture.duration_time} phút</span>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-8 space-y-8">
                {/* Video Player Section */}
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl group border-4 border-muted/50">
                  {selectedLecture.video_url.includes('youtube.com') || selectedLecture.video_url.includes('youtu.be') ? (
                    <iframe
                      src={selectedLecture.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      title={selectedLecture.name}
                    />
                  ) : (
                    <video
                      src={selectedLecture.video_url}
                      className="absolute inset-0 w-full h-full"
                      controls
                    />
                  )}
                </div>

                {/* Description & Details */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-black flex items-center gap-2">
                      <FileText className="size-5 text-primary" />
                      Mô tả bài giảng
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-6 border border-border/40">
                      <p className="text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap">
                        {selectedLecture.description || "Không có mô tả cho bài giảng này."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLecture.document_url && (
                      <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between group/doc hover:bg-emerald-500/10 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                            <FileUp className="size-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">Tài liệu đính kèm</p>
                            <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest">Available to download</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-lg font-bold bg-white/50 hover:bg-white">
                          <a href={selectedLecture.document_url} target="_blank" rel="noopener noreferrer">
                            Mở tài liệu
                          </a>
                        </Button>
                      </div>
                    )}

                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                          <PlayCircle className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Nguồn Video</p>
                          <p className="text-[10px] text-blue-600/70 font-bold uppercase tracking-widest">
                            {selectedLecture.video_url.includes('youtube') ? 'Youtube Player' : 'Direct Link'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-lg font-bold bg-white/50 hover:bg-white">
                        <a href={selectedLecture.video_url} target="_blank" rel="noopener noreferrer">
                          Xem gốc
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-8 pt-0 bg-transparent border-none">
                <Button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full rounded-lg h-12 font-black text-base shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Đóng cửa sổ
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open)
        if (!open) setEditingLecture(null)
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-0 border-none shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-black tracking-tight">Chỉnh sửa bài giảng</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Cập nhật thông tin cho bài giảng &quot;{editingLecture?.name}&quot;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onUpdate)} className="p-8 pt-6 space-y-6">
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel>Tên bài giảng</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="VD: Giới thiệu về React"
                      className="rounded-lg h-11"
                      {...form.register("name")}
                    />
                    <FieldError errors={[form.formState.errors.name]} />
                  </FieldContent>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Số thứ tự</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min="1"
                        className="rounded-lg h-11"
                        {...form.register("lecture_number")}
                      />
                      <FieldError errors={[form.formState.errors.lecture_number]} />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Thời lượng (phút)</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min="1"
                        className="rounded-lg h-11"
                        {...form.register("duration_time")}
                      />
                      <FieldError errors={[form.formState.errors.duration_time]} />
                    </FieldContent>
                  </Field>
                </div>
              </div>

              <Field>
                <FieldLabel>Link Video</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <PlayCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="https://youtube.com/..."
                      className="pl-9 rounded-lg h-11"
                      {...form.register("video_url")}
                    />
                  </div>
                  <FieldError errors={[form.formState.errors.video_url]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Link tài liệu (Tùy chọn)</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="https://drive.google.com/..."
                      className="pl-9 rounded-lg h-11"
                      {...form.register("document_url")}
                    />
                  </div>
                  <FieldError errors={[form.formState.errors.document_url]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Mô tả bài giảng</FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Tóm tắt nội dung bài giảng..."
                    className="rounded-lg min-h-[120px] resize-none"
                    {...form.register("description")}
                  />
                  <FieldError errors={[form.formState.errors.description]} />
                </FieldContent>
              </Field>
            </FieldGroup>

            <DialogFooter className="pt-4 flex items-center justify-end gap-3 bg-transparent border-none p-0 -mx-0">
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg h-11 px-6 font-bold"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingLecture(null)
                }}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="rounded-lg h-11 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Cập nhật bài giảng"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="rounded-lg border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black tracking-tight">Xác nhận xóa bài giảng</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
              Bạn có chắc chắn muốn xóa bài giảng <span className="font-bold text-foreground">&quot;{lectureToDelete?.name}&quot;</span>?
              Hành động này không thể hoàn tác và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel disabled={isDeleting} className="rounded-lg font-bold">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg font-bold transition-all shadow-lg shadow-destructive/20"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
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
