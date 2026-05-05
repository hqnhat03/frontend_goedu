"use client"

import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { AxiosError } from "axios"
import {
    CheckCircle2,
    Clock,
    Edit2,
    Mail,
    Phone,
    RefreshCcw,
    Search,
    SearchX,
    XCircle
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermission } from "@/hooks/use-permission"
import { useRouter } from "next/navigation"

interface CourseRegistration {
    id: number
    course_id: number
    name: string
    email: string
    phone: string
    status: "pending" | "completed" | "canceled"
    course_name: string
}

interface Meta {
    total: number
    per_page: number
    current_page: number
    last_page: number
}

const statusConfig = {
    pending: {
        label: "Chưa xử lý",
        color: "bg-amber-500/10 text-amber-600 border-amber-200",
        icon: Clock,
    },
    completed: {
        label: "Hoàn Thành",
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
        icon: CheckCircle2,
    },
    canceled: {
        label: "Hủy",
        color: "bg-rose-500/10 text-rose-600 border-rose-200",
        icon: XCircle,
    },
}

export default function CourseRegistrationsPage() {
    const router = useRouter()
    const { hasPermission } = usePermission()

    // Kiểm tra quyền truy cập trang
    React.useEffect(() => {
        if (!hasPermission("course_registation_list")) {
            toast.error("Bạn không có quyền truy cập trang này")
            router.push("/admin")
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]) // Remove hasPermission to avoid loop

    const [registrations, setRegistrations] = React.useState<CourseRegistration[]>([])
    const [meta, setMeta] = React.useState<Meta | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")
    const [currentPage, setCurrentPage] = React.useState(1)

    const debouncedSearch = useDebounce(search, 500)

    // Edit status state
    const [editingRegistration, setEditingRegistration] = React.useState<CourseRegistration | null>(null)
    const [selectedStatus, setSelectedStatus] = React.useState<CourseRegistration["status"] | null>(null)
    const [isUpdating, setIsUpdating] = React.useState(false)

    React.useEffect(() => {
        if (editingRegistration) {
            setSelectedStatus(editingRegistration.status)
        } else {
            setSelectedStatus(null)
        }
    }, [editingRegistration])

    const fetchRegistrations = React.useCallback(async () => {
        // We check permission inside but don't depend on the function reference
        if (!hasPermission("course_registation_list")) return

        setIsLoading(true)
        try {
            const response = await api.get("/admin/course-registrations", {
                params: {
                    page: currentPage,
                    search: debouncedSearch,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                },
            })

            const { data, meta } = response.data
            setRegistrations(data || [])
            setMeta(meta || null)
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.message || "Không thể tải danh sách đăng ký")
            }
        } finally {
            setIsLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, debouncedSearch, statusFilter]) // Remove hasPermission

    React.useEffect(() => {
        fetchRegistrations()
    }, [fetchRegistrations])

    if (!hasPermission("course_registation_list")) return null

    const handleUpdateStatus = async () => {
        if (!editingRegistration || !selectedStatus) return

        setIsUpdating(true)
        try {
            const response = await api.patch(`/admin/course-registrations/${editingRegistration.id}`, {
                status: selectedStatus
            })

            if (response.data.success) {
                toast.success("Cập nhật trạng thái thành công")
                setRegistrations(prev => prev.map(reg => reg.id === editingRegistration.id ? { ...reg, status: selectedStatus } : reg))
                setEditingRegistration(null)
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái")
            }
        } finally {
            setIsUpdating(false)
        }
    }

    const statusLabels: Record<string, string> = {
        "all": "Tất cả trạng thái",
        "pending": "Chưa xử lý",
        "completed": "Hoàn Thành",
        "canceled": "Hủy",
    }

    const handleReset = () => {
        setSearch("")
        setStatusFilter("all")
        setCurrentPage(1)
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Quản lý đăng ký khóa học
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Theo dõi và xử lý danh sách học sinh đăng ký tư vấn hoặc mua khóa học.
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm tên, email hoặc SĐT..."
                                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="w-full md:w-64">
                            <Select
                                value={statusLabels[statusFilter]}
                                onValueChange={(val) => {
                                    const key = Object.keys(statusLabels).find(k => statusLabels[k] === val);
                                    setStatusFilter(key || "all");
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="bg-background border-muted-foreground/20">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(statusLabels).map((label) => (
                                        <SelectItem key={label} value={label}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full md:w-auto bg-background hover:bg-muted transition-colors border-dashed"
                            onClick={handleReset}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" /> Làm mới
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Main Table */}
            <div className="relative rounded-xl border bg-background/50 backdrop-blur-sm shadow-md overflow-hidden border-muted/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                <Table className="relative">
                    <TableHeader className="bg-muted/50 backdrop-blur-md">
                        <TableRow className="hover:bg-transparent border-muted/20">
                            <TableHead className="font-bold">Khóa học</TableHead>
                            <TableHead className="font-bold">Khách hàng</TableHead>
                            <TableHead className="font-bold">Email</TableHead>
                            <TableHead className="font-bold">Số điện thoại</TableHead>
                            <TableHead className="font-bold text-center">Trạng thái</TableHead>
                            <TableHead className="text-right font-bold">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-muted/10">
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><div className="flex justify-center"><Skeleton className="h-7 w-24 rounded-full" /></div></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                </TableRow>
                            ))
                        ) : registrations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-80 text-center">
                                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground animate-in zoom-in-95 duration-500">
                                        <div className="p-4 bg-muted rounded-full">
                                            <SearchX className="h-12 w-12 opacity-20" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xl font-semibold text-foreground/80">Không tìm thấy đăng ký nào</p>
                                            <p className="text-sm">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleReset} className="mt-2 border-dashed">
                                            Xóa tất cả bộ lọc
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            registrations.map((reg) => {
                                const config = statusConfig[reg.status]
                                const StatusIcon = config.icon
                                return (
                                    <TableRow key={reg.id} className="hover:bg-primary/[0.02] transition-all duration-300 group border-muted/10">
                                        <TableCell>
                                            <span className="text-sm font-semibold text-foreground/90">{reg.course_name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                {reg.name}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                                                <Mail className="h-3.5 w-3.5 text-primary/60" />
                                                {reg.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                                                <Phone className="h-3.5 w-3.5 text-primary/60" />
                                                {reg.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn(
                                                "font-semibold border shadow-sm px-3 py-1 rounded-full transition-all duration-300 group-hover:scale-105",
                                                config.color
                                            )}>
                                                <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                                                {config.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {hasPermission("course_registation_edit") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all active:scale-90 shadow-none"
                                                    onClick={() => setEditingRegistration(reg)}
                                                    title="Chỉnh sửa trạng thái"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 mt-6 text-sm text-muted-foreground">
                <p>
                    Hiển thị <strong>{registrations.length}</strong> {meta ? `trên ${meta.total}` : ""} kết quả
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={!meta || currentPage === 1 || isLoading}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        Trước
                    </Button>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold shadow-sm shadow-primary/10">
                        {currentPage}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={!meta || currentPage === meta.last_page || isLoading}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        Sau
                    </Button>
                </div>
            </div>

            {/* Edit Status Dialog */}
            <Dialog open={!!editingRegistration} onOpenChange={(open) => !open && setEditingRegistration(null)}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Cập nhật trạng thái</DialogTitle>
                        <DialogDescription className="text-base">
                            Thay đổi trạng thái đăng ký của <strong>{editingRegistration?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 gap-3">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "justify-start h-14 px-4 border-2 transition-all duration-300 rounded-xl relative overflow-hidden group",
                                        selectedStatus === "pending"
                                            ? "border-amber-500 bg-amber-500/5 text-amber-700 shadow-sm"
                                            : "hover:border-muted-foreground/30"
                                    )}
                                    onClick={() => setSelectedStatus("pending")}
                                    disabled={isUpdating}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center h-8 w-8 rounded-lg mr-3 transition-colors",
                                        selectedStatus === "pending" ? "bg-amber-500 text-white" : "bg-muted group-hover:bg-muted-foreground/10"
                                    )}>
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <span className="font-semibold">Chưa xử lý</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className={cn(
                                        "justify-start h-14 px-4 border-2 transition-all duration-300 rounded-xl relative overflow-hidden group",
                                        selectedStatus === "completed"
                                            ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 shadow-md shadow-emerald-500/10"
                                            : "hover:border-muted-foreground/30"
                                    )}
                                    onClick={() => setSelectedStatus("completed")}
                                    disabled={isUpdating}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center h-8 w-8 rounded-lg mr-3 transition-colors",
                                        selectedStatus === "completed" ? "bg-emerald-500 text-white" : "bg-muted group-hover:bg-muted-foreground/10"
                                    )}>
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <span className="font-semibold">Hoàn Thành</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className={cn(
                                        "justify-start h-14 px-4 border-2 transition-all duration-300 rounded-xl relative overflow-hidden group",
                                        selectedStatus === "canceled"
                                            ? "border-rose-500 bg-rose-500/5 text-rose-700 shadow-md shadow-rose-500/10"
                                            : "hover:border-muted-foreground/30"
                                    )}
                                    onClick={() => setSelectedStatus("canceled")}
                                    disabled={isUpdating}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center h-8 w-8 rounded-lg mr-3 transition-colors",
                                        selectedStatus === "canceled" ? "bg-rose-500 text-white" : "bg-muted group-hover:bg-muted-foreground/10"
                                    )}>
                                        <XCircle className="h-5 w-5" />
                                    </div>
                                    <span className="font-semibold">Hủy</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setEditingRegistration(null)}
                            disabled={isUpdating}
                            className="rounded-xl"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-white px-8 rounded-xl shadow-md shadow-primary/10 transition-all active:scale-95"
                            onClick={handleUpdateStatus}
                            disabled={isUpdating || selectedStatus === editingRegistration?.status}
                        >
                            {isUpdating ? (
                                <>
                                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                "Lưu thay đổi"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
