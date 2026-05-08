"use client"

import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Clock,
    Edit,
    ExternalLink,
    Eye,
    FileEdit,
    FileText,
    Link as LinkIcon,
    ListOrdered,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Search,
    Settings2,
    Trash2,
    Video,
    X,
    XCircle
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Can } from "@/components/auth/can"
import { QuillEditor } from "@/components/quill-editor"
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
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { AxiosError } from "axios"

interface Lecture {
    id: number
    name: string
    duration_time: number
    lecture_number: number
    document_url?: string
    video_url?: string
    description?: string
    status: 'pending' | 'published' | 'rejected'
}

const lectureStatusConfig = {
    pending: {
        label: 'Chờ duyệt',
        icon: FileEdit,
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20',
    },
    published: {
        label: 'Đã duyệt',
        icon: CheckCircle2,
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20',
    },
    rejected: {
        label: 'Đã từ chối',
        icon: XCircle,
        className: 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20',
    },
}

function LectureStatusBadge({ status }: { status: Lecture['status'] }) {
    const config = lectureStatusConfig[status] || lectureStatusConfig.pending
    const Icon = config.icon

    return (
        <Badge
            variant="outline"
            className={cn(
                "px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-colors",
                config.className
            )}
        >
            <Icon className="size-3 mr-1.5" />
            <span>{config.label}</span>
        </Badge>
    )
}

const lectureSchema = z.object({
    name: z.string().min(1, "Tên bài giảng không được để trống"),
    lecture_number: z.number().min(1, "Số buổi học phải lớn hơn 0"),
    duration_time: z.number().min(1, "Thời lượng phải lớn hơn 0"),
    document_url: z.string().optional(),
    video_url: z.string().optional(),
    description: z.string().optional(),
})

type LectureFormValues = z.infer<typeof lectureSchema>

export default function ClassLecturesPage() {
    const router = useRouter()
    const params = useParams()
    const classId = params.id
    const { hasPermission } = usePermission()

    // Quyền truy cập
    React.useEffect(() => {
        if (!hasPermission("lecture_list")) {
            toast.error("Bạn không có quyền truy cập trang này")
            router.push("/admin")
        }
    }, [hasPermission, router])

    const [search, setSearch] = React.useState("")
    const [status, setStatus] = React.useState<string>("all")
    const [items, setItems] = React.useState<Lecture[]>([])
    const [selectedIds, setSelectedIds] = React.useState<number[]>([])

    // Pagination and Sorting State
    const [currentPage, setCurrentPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(10)
    const [sortBy, setSortBy] = React.useState("lecture_number")
    const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
    const [totalItems, setTotalItems] = React.useState(0)
    const [lastPage, setLastPage] = React.useState(1)

    const [isLoading, setIsLoading] = React.useState(true)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [lectureToDelete, setLectureToDelete] = React.useState<Lecture | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    // Drawer States
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = React.useState(false)
    const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false)
    const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false)

    // Processing States
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isUpdating, setIsUpdating] = React.useState(false)
    const [isFetchingDetail, setIsFetchingDetail] = React.useState(false)

    // Data States
    const [viewLecture, setViewLecture] = React.useState<Lecture | null>(null)
    const [editingLecture, setEditingLecture] = React.useState<Lecture | null>(null)

    const form = useForm<LectureFormValues>({
        resolver: zodResolver(lectureSchema),
        defaultValues: {
            name: "",
            lecture_number: 1,
            duration_time: 45,
            document_url: "",
            video_url: "",
            description: "",
        },
    })

    const statusOptions = [
        { label: "Tất cả trạng thái", value: "all" },
        { label: "Chờ duyệt", value: "pending" },
        { label: "Đã duyệt", value: "published" },
        { label: "Đã từ chối", value: "rejected" },
    ]

    const fetchLectures = React.useCallback(async () => {
        if (!classId) return
        setIsLoading(true)
        setError(null)
        try {
            const queryParams = new URLSearchParams({
                name: search,
                status: status === "all" ? "" : status,
                page: currentPage.toString(),
                per_page: pageSize.toString(),
                sort_by: sortBy,
                sort_order: sortOrder,
            })

            const response = await api.get(`/admin/classes/${classId}/lectures?${queryParams}`)
            const result = response.data
            if (response.status === 200) {
                setItems(result.data || [])
                setTotalItems(result.meta?.total || 0)
                setLastPage(result.meta?.last_page || 1)
                setSelectedIds([]) // Reset selection on fetch
            }
        } catch (error: unknown) {
            console.error("Failed to fetch lectures:", error)
            setError("Không thể tải danh sách bài giảng")
            toast.error("Không thể tải danh sách bài giảng")
        } finally {
            setIsLoading(false)
        }
    }, [classId, search, status, currentPage, pageSize, sortBy, sortOrder])

    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchLectures()
        }, 300)

        return () => clearTimeout(timer)
    }, [fetchLectures])

    const handleDelete = async () => {
        if (!lectureToDelete) return
        setIsDeleting(true)
        try {
            const response = await api.delete(`/admin/lectures/${lectureToDelete.id}`)
            if (response.data.success) {
                toast.success("Xóa bài giảng thành công")
                fetchLectures()
            } else {
                toast.error(response.data.message || "Xóa thất bại")
            }
        } catch (error) {
            toast.error("Đã có lỗi xảy ra khi xóa bài giảng")
            console.error("Delete error:", error)
        } finally {
            setIsDeleting(false)
            setIsDeleteDialogOpen(false)
            setLectureToDelete(null)
        }
    }

    const handleBulkAction = async (newStatus: 'published' | 'rejected') => {
        if (selectedIds.length === 0) return
        setIsProcessing(true)
        try {
            const response = await api.post('/admin/lectures/bulk-status', {
                ids: selectedIds,
                status: newStatus
            })
            if (response.data.success) {
                toast.success(`Đã ${newStatus === 'published' ? 'duyệt' : 'từ chối'} ${selectedIds.length} bài giảng`)
                fetchLectures()
            } else {
                toast.error(response.data.message || "Thao tác thất bại")
            }
        } catch (error) {
            toast.error("Đã có lỗi xảy ra")
            console.error("Bulk action error:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleView = async (id: number) => {
        setIsFetchingDetail(true)
        setIsViewDrawerOpen(true)
        try {
            const response = await api.get(`/admin/lectures/${id}`)
            if (response.data.success) {
                setViewLecture(response.data.data)
            } else {
                toast.error(response.data.message || "Không thể tải chi tiết bài giảng")
                setIsViewDrawerOpen(false)
            }
        } catch (error) {
            console.error("Fetch detail error:", error)
            toast.error("Đã có lỗi xảy ra khi tải chi tiết")
            setIsViewDrawerOpen(false)
        } finally {
            setIsFetchingDetail(false)
        }
    }

    const handleEdit = async (lecture: Lecture) => {
        setIsFetchingDetail(true)
        setEditingLecture(lecture)
        setIsEditDrawerOpen(true)
        try {
            const response = await api.get(`/admin/lectures/${lecture.id}`)
            if (response.data.success) {
                const detail = response.data.data
                form.reset({
                    name: detail.name || "",
                    lecture_number: detail.lecture_number || 1,
                    duration_time: detail.duration_time || 45,
                    document_url: detail.document_url || "",
                    video_url: detail.video_url || "",
                    description: detail.description || "",
                })
            } else {
                toast.error(response.data.message || "Không thể tải chi tiết bài giảng")
                setIsEditDrawerOpen(false)
            }
        } catch (error) {
            console.error("Fetch detail error:", error)
            toast.error("Đã có lỗi xảy ra khi tải chi tiết")
            setIsEditDrawerOpen(false)
        } finally {
            setIsFetchingDetail(false)
        }
    }

    const onSubmit = async (data: LectureFormValues) => {
        setIsSubmitting(true)
        try {
            const response = await api.post(`/admin/classes/${classId}/lectures`, data)
            if (response.data.success) {
                toast.success("Tạo bài giảng thành công")
                setIsCreateDrawerOpen(false)
                form.reset()
                fetchLectures()
            } else {
                toast.error(response.data.message || "Tạo thất bại")
            }
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }>
            const errorMessage =
                axiosError.response?.data?.message || axiosError.message || "Có lỗi xảy ra";
            toast.error(errorMessage)
            console.error("Create error:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const onUpdate = async (data: LectureFormValues) => {
        if (!editingLecture) return
        setIsUpdating(true)
        try {
            const response = await api.put(`/admin/lectures/${editingLecture.id}`, data)
            if (response.data.success) {
                toast.success("Cập nhật bài giảng thành công")
                setIsEditDrawerOpen(false)
                setEditingLecture(null)
                form.reset()
                fetchLectures()
            } else {
                toast.error(response.data.message || "Cập nhật thất bại")
            }
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }>
            const errorMessage =
                axiosError.response?.data?.message || axiosError.message || "Có lỗi xảy ra";
            toast.error(errorMessage)
            console.error("Update error:", error)
        } finally {
            setIsUpdating(false)
        }
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(items.map(item => item.id))
        }
    }

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const resetFilters = () => {
        setSearch("")
        setStatus("all")
        setCurrentPage(1)
    }

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
        setCurrentPage(1)
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        return sortOrder === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4 text-primary" />
        ) : (
            <ChevronDown className="ml-2 h-4 w-4 text-primary" />
        )
    }

    return (
        <div className="flex flex-col gap-6 p-1">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Quản lý bài giảng
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Danh sách các bài học và hoạt động trong lớp học này.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4">
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                                onClick={() => handleBulkAction('published')}
                                disabled={isProcessing}
                            >
                                <Check className="mr-2 h-4 w-4" /> Duyệt ({selectedIds.length})
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleBulkAction('rejected')}
                                disabled={isProcessing}
                            >
                                <X className="mr-2 h-4 w-4" /> Từ chối
                            </Button>
                        </div>
                    )}
                    <Can permission="lecture_create">
                        <Button
                            onClick={() => setIsCreateDrawerOpen(true)}
                            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Thêm bài giảng
                        </Button>
                    </Can>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm tên bài giảng..."
                                    className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="w-full md:w-48">
                                <Select
                                    value={status}
                                    onValueChange={(val) => setStatus(val || "all")}
                                >
                                    <SelectTrigger className="bg-background border-muted-foreground/20">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Settings2 className="h-4 w-4" />
                                            <SelectValue>
                                                {statusOptions.find(opt => opt.value === status)?.label || "Trạng thái"}
                                            </SelectValue>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full md:w-auto bg-background hover:bg-muted transition-colors border-dashed"
                            onClick={resetFilters}
                        >
                            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                            Làm mới
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table Section */}
            <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[50px] py-4">
                                    <Checkbox
                                        checked={selectedIds.length === items.length && items.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead
                                    className="font-semibold py-4 cursor-pointer hover:bg-muted/50 transition-colors w-[100px]"
                                    onClick={() => handleSort("lecture_number")}
                                >
                                    <div className="flex items-center">
                                        STT
                                        <SortIcon field="lecture_number" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleSort("name")}
                                >
                                    <div className="flex items-center">
                                        Tên bài giảng
                                        <SortIcon field="name" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleSort("duration_time")}
                                >
                                    <div className="flex items-center">
                                        Thời lượng
                                        <SortIcon field="duration_time" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleSort("status")}
                                >
                                    <div className="flex items-center">
                                        Trạng thái
                                        <SortIcon field="status" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right font-semibold py-4">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className={cn(isLoading && items.length > 0 && "opacity-50 transition-opacity duration-300")}>
                            {isLoading && items.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                    </TableRow>
                                ))
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 text-destructive">
                                            <RefreshCw className="h-12 w-12 opacity-50" />
                                            <p className="font-medium">{error}</p>
                                            <Button variant="outline" size="sm" onClick={fetchLectures}>Thử lại</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <FileText className="h-12 w-12 opacity-20" />
                                            <div className="space-y-1">
                                                <p className="text-lg font-medium">Không tìm thấy bài giảng nào</p>
                                                <p className="text-sm">Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc của bạn.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id} className={cn("group hover:bg-muted/40 transition-colors", selectedIds.includes(item.id) && "bg-muted/60")}>
                                        <TableCell className="py-4">
                                            <Checkbox
                                                checked={selectedIds.includes(item.id)}
                                                onCheckedChange={() => toggleSelect(item.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="py-4 font-medium text-center sm:text-left">
                                            <Badge variant="outline" className="bg-muted/50 font-mono">
                                                #{item.lecture_number}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground/90 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold line-clamp-1">{item.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-3.5" />
                                                <span>{item.duration_time} phút</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <LectureStatusBadge status={item.status} />
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="flex justify-end gap-1">
                                                <Can permission="lecture_detail">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                                        title="Xem chi tiết"
                                                        onClick={() => handleView(item.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Can>
                                                <Can permission="lecture_edit">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                                                        title="Chỉnh sửa"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Can>
                                                <Can permission="lecture_delete">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                                        title="Xóa"
                                                        onClick={() => {
                                                            setLectureToDelete(item)
                                                            setIsDeleteDialogOpen(true)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </Can>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa bài giảng</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa bài giảng <strong>{lectureToDelete?.name}</strong>?
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                "Xác nhận xóa"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Lecture Drawer */}
            <Sheet open={isViewDrawerOpen} onOpenChange={setIsViewDrawerOpen}>
                <SheetContent className="w-full sm:!max-w-[50vw] overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                <Eye className="h-6 w-6 text-primary" />
                                Chi tiết bài giảng
                            </SheetTitle>
                        </div>
                        <SheetDescription>
                            Thông tin chi tiết của bài giảng #{viewLecture?.lecture_number}
                        </SheetDescription>
                    </SheetHeader>

                    {isFetchingDetail ? (
                        <div className="space-y-6 px-4">
                            <Skeleton className="h-[400px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        </div>
                    ) : viewLecture ? (
                        <div className="px-4 space-y-8 pb-12">
                            <div className="grid gap-8">
                                {/* Video Section */}
                                {viewLecture.video_url && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <Video className="size-4" />
                                            Video bài giảng
                                        </label>
                                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-muted">
                                            {viewLecture.video_url.includes('youtube.com') || viewLecture.video_url.includes('youtu.be') ? (
                                                <iframe
                                                    src={viewLecture.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-white flex-col gap-4">
                                                    <Video className="size-12 opacity-20" />
                                                    <p className="text-sm opacity-60">Định dạng video không hỗ trợ xem trực tiếp</p>
                                                    <Button variant="outline" size="sm">
                                                        <a href={viewLecture.video_url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Mở link video
                                                        </a>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tên bài giảng</label>
                                            <p className="text-3xl font-bold text-foreground leading-tight">{viewLecture.name}</p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Buổi số</label>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-lg px-3">#{viewLecture.lecture_number}</Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Thời lượng</label>
                                                <div className="flex items-center gap-2 text-lg font-semibold">
                                                    <Clock className="size-5 text-primary" />
                                                    {viewLecture.duration_time} phút
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trạng thái</label>
                                                <div className="flex items-center h-8">
                                                    <LectureStatusBadge status={viewLecture.status} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tài liệu đính kèm</label>
                                            {viewLecture.document_url ? (
                                                <a
                                                    href={viewLecture.document_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all group"
                                                >
                                                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                        <FileText className="size-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold truncate">Tài liệu bài học</p>
                                                        <p className="text-xs text-muted-foreground truncate opacity-70">{viewLecture.document_url}</p>
                                                    </div>
                                                    <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed text-muted-foreground italic text-sm">
                                                    <FileText className="size-5 opacity-50" />
                                                    Chưa có tài liệu đính kèm
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Mô tả nội dung</label>
                                            <Card className="border-none bg-muted/20">
                                                <CardContent className="p-6 prose prose-sm max-w-none dark:prose-invert">
                                                    {viewLecture.description ? (
                                                        <div dangerouslySetInnerHTML={{ __html: viewLecture.description }} />
                                                    ) : (
                                                        <p className="text-muted-foreground italic">Không có mô tả cho bài giảng này.</p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-8 border-t">
                                <Button size="lg" onClick={() => setIsViewDrawerOpen(false)}>
                                    Đóng chi tiết
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>

            {/* Edit Lecture Drawer */}
            <Sheet open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
                <SheetContent className="sm:max-w-[640px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                            <Edit className="h-6 w-6 text-amber-600" />
                            Chỉnh sửa bài giảng
                        </SheetTitle>
                        <SheetDescription>
                            Cập nhật thông tin chi tiết cho bài giảng này.
                        </SheetDescription>
                    </SheetHeader>

                    {isFetchingDetail ? (
                        <div className="space-y-6 px-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-[200px] w-full" />
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 pb-4">
                            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-5">
                                <Field>
                                    <FieldLabel>Tên bài giảng <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="VD: Bài 1: Tổng quan về Laravel"
                                                className="pl-10"
                                                {...form.register("name")}
                                            />
                                        </div>
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel>Buổi số <span className="text-destructive">*</span></FieldLabel>
                                        <FieldContent>
                                            <div className="relative">
                                                <ListOrdered className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    placeholder="1"
                                                    className="pl-10"
                                                    {...form.register("lecture_number")}
                                                />
                                            </div>
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.lecture_number?.message }]} />
                                    </Field>

                                    <Field>
                                        <FieldLabel>Thời lượng (phút) <span className="text-destructive">*</span></FieldLabel>
                                        <FieldContent>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    placeholder="45"
                                                    className="pl-10"
                                                    {...form.register("duration_time")}
                                                />
                                            </div>
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.duration_time?.message }]} />
                                    </Field>
                                </div>

                                <Field>
                                    <FieldLabel>Đường dẫn tài liệu</FieldLabel>
                                    <FieldContent>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="https://example.com/tai-lieu.pdf"
                                                className="pl-10"
                                                {...form.register("document_url")}
                                            />
                                        </div>
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>Đường dẫn video</FieldLabel>
                                    <FieldContent>
                                        <div className="relative">
                                            <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="https://youtube.com/watch?v=..."
                                                className="pl-10"
                                                {...form.register("video_url")}
                                            />
                                        </div>
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>Mô tả bài giảng</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <QuillEditor
                                                    value={field.value || ""}
                                                    onChange={field.onChange}
                                                    placeholder="Nhập nội dung mô tả chi tiết cho bài giảng này..."
                                                    minHeight={200}
                                                    showImage={false}
                                                />
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

                                <SheetFooter className="mt-8 pt-6 border-t gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditDrawerOpen(false)}
                                        disabled={isUpdating}
                                    >
                                        Hủy bỏ
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="min-w-[120px] bg-amber-600 hover:bg-amber-700"
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Đang cập nhật...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Cập nhật
                                            </>
                                        )}
                                    </Button>
                                </SheetFooter>
                            </form>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Create Lecture Drawer */}
            <Sheet open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
                <SheetContent className="sm:max-w-[640px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                            <Plus className="h-6 w-6 text-primary" />
                            Thêm bài giảng mới
                        </SheetTitle>
                        <SheetDescription>
                            Nhập các thông tin chi tiết cho bài giảng này. Bài giảng sẽ được gán vào lớp học hiện tại.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="px-4 pb-4">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <Field>
                                <FieldLabel>Tên bài giảng <span className="text-destructive">*</span></FieldLabel>
                                <FieldContent>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="VD: Bài 1: Tổng quan về Laravel"
                                            className="pl-10"
                                            {...form.register("name")}
                                        />
                                    </div>
                                </FieldContent>
                                <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field>
                                    <FieldLabel>Buổi số <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <div className="relative">
                                            <ListOrdered className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="1"
                                                className="pl-10"
                                                {...form.register("lecture_number", { valueAsNumber: true })}
                                            />
                                        </div>
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.lecture_number?.message }]} />
                                </Field>

                                <Field>
                                    <FieldLabel>Thời lượng (phút) <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="45"
                                                className="pl-10"
                                                {...form.register("duration_time", { valueAsNumber: true })}
                                            />
                                        </div>
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.duration_time?.message }]} />
                                </Field>
                            </div>

                            <Field>
                                <FieldLabel>Đường dẫn tài liệu</FieldLabel>
                                <FieldContent>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="https://example.com/tai-lieu.pdf"
                                            className="pl-10"
                                            {...form.register("document_url")}
                                        />
                                    </div>
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>Đường dẫn video</FieldLabel>
                                <FieldContent>
                                    <div className="relative">
                                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="pl-10"
                                            {...form.register("video_url")}
                                        />
                                    </div>
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>Mô tả bài giảng</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <QuillEditor
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                placeholder="Nhập nội dung mô tả chi tiết cho bài giảng này..."
                                                minHeight={200}
                                                showImage={false}
                                            />
                                        )}
                                    />
                                </FieldContent>
                            </Field>

                            <SheetFooter className="mt-8 pt-6 border-t gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDrawerOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="submit"
                                    className="min-w-[120px]"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Lưu bài giảng
                                        </>
                                    )}
                                </Button>
                            </SheetFooter>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Footer Info */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4 text-sm text-muted-foreground border-t bg-muted/10">
                <div className="flex items-center gap-4">
                    <p>
                        Hiển thị <strong>{items.length}</strong> / <strong>{totalItems}</strong> bài giảng
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Số hàng:</span>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(val) => {
                                setPageSize(parseInt(val || "10"))
                                setCurrentPage(1)
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px] bg-background">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="bg-background h-8"
                    >
                        Trước
                    </Button>
                    <div className="flex items-center gap-1">
                        {(() => {
                            const maxVisible = 5;
                            let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                            const end = Math.min(lastPage, start + maxVisible - 1);

                            if (end - start + 1 < maxVisible) {
                                start = Math.max(1, end - maxVisible + 1);
                            }

                            const pages = [];
                            for (let i = start; i <= end; i++) {
                                pages.push(i);
                            }

                            return pages.map((pageNum) => (
                                <Button
                                    key={`page-${pageNum}`}
                                    variant={currentPage === pageNum ? "default" : "ghost"}
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 text-xs font-medium",
                                        currentPage === pageNum && "shadow-md shadow-primary/20"
                                    )}
                                    onClick={() => setCurrentPage(pageNum)}
                                    disabled={isLoading}
                                >
                                    {pageNum}
                                </Button>
                            ));
                        })()}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
                        disabled={currentPage === lastPage || isLoading}
                        className="bg-background h-8"
                    >
                        Sau
                    </Button>
                </div>
            </div>
        </div>
    )
}
