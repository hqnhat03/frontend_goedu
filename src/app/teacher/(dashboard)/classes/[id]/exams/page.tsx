"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import api from "@/lib/axios"
import {
    ChevronRight,
    ClipboardList,
    Eye,
    FileText,
    LayoutGrid
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

interface Exam {
    id: number
    name: string
    status: string
    questions_count: number
    results_count: number
}

interface ExamsData {
    total_students: number
    exams: Exam[]
}

export default function ClassExamsPage() {
    const params = useParams()
    const [data, setData] = React.useState<ExamsData | null>(null)
    const [loading, setLoading] = React.useState(true)

    const fetchExams = React.useCallback(async () => {
        try {
            setLoading(true)
            // Chú ý: ID có thể là string từ params, api mong đợi /teacher/classes/2/exams
            const response = await api.get(`/teacher/classes/${params.id}/exams`)
            if (response.data?.success) {
                setData(response.data.data)
            } else {
                toast.error(response.data?.message || "Không thể tải danh sách bài kiểm tra")
            }
        } catch (error) {
            console.error("Failed to fetch exams:", error)
            toast.error("Đã có lỗi xảy ra khi kết nối đến máy chủ")
        } finally {
            setLoading(false)
        }
    }, [params.id])

    React.useEffect(() => {
        if (params.id) {
            fetchExams()
        }
    }, [fetchExams, params.id])



    const getStatusBadge = (status: string) => {
        if (status === 'published') {
            return (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                    Đang mở
                </Badge>
            )
        }
        return (
            <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
                {status}
            </Badge>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => window.history.back()}>Quản lý lớp học</span>
                    <ChevronRight className="size-4 opacity-50" />
                    <span className="text-primary font-semibold">Lớp #{params.id}</span>
                    <ChevronRight className="size-4 opacity-50" />
                    <span className="text-foreground">Bài kiểm tra</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-4">
                            Bài kiểm tra của lớp
                            {!loading && data && (
                                <Badge variant="secondary" className="font-bold rounded-lg text-sm bg-primary/10 text-primary border-none self-center px-3">
                                    {data.exams.length} bài
                                </Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground font-medium max-w-2xl">
                            Quản lý và theo dõi kết quả các bài kiểm tra được giao cho lớp học này. Xem chi tiết từng học sinh đã thực hiện bài làm.
                        </p>
                    </div>
                </div>
            </div>



            {/* Main Content Table */}
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[200px] w-full rounded-2xl" />
                    <Skeleton className="h-[400px] w-full rounded-2xl" />
                </div>
            ) : data?.exams.length === 0 ? (
                <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[450px] text-center space-y-6 shadow-sm">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="relative p-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/10 shadow-inner">
                            <ClipboardList className="size-20" />
                        </div>
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-2xl font-black tracking-tight">Không tìm thấy bài kiểm tra</h3>
                        <p className="text-muted-foreground font-medium leading-relaxed">
                            Lớp học này hiện tại chưa có bài kiểm tra nào được gán.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                    <Table>
                        <TableHeader className="bg-muted/40 h-12">
                            <TableRow className="hover:bg-transparent border-border/20">
                                <TableHead className="font-semibold text-xs pl-8">Thông tin bài kiểm tra</TableHead>
                                <TableHead className="font-semibold text-xs">Trạng thái</TableHead>
                                <TableHead className="font-semibold text-xs text-center">Nội dung</TableHead>
                                <TableHead className="font-semibold text-xs text-center">Tiến độ</TableHead>
                                <TableHead className="text-right font-semibold text-xs pr-8">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.exams.map((exam) => (
                                <TableRow key={exam.id} className="hover:bg-primary/5 group/row transition-all border-border/10 h-14">
                                    <TableCell className="pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-primary/20 blur opacity-0 group-hover/row:opacity-100 transition-opacity rounded-full scale-125" />
                                                <div className="relative p-2 rounded-lg bg-primary/5 text-primary group-hover/row:bg-primary group-hover/row:text-primary-foreground transition-all duration-300">
                                                    <FileText className="size-5" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-base group-hover/row:text-primary transition-colors">{exam.name}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(exam.status)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50 border border-border/20 font-medium text-xs group-hover/row:bg-white transition-colors duration-300">
                                            <LayoutGrid className="size-3.5 text-primary" />
                                            <span>{exam.questions_count} câu hỏi</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="flex items-center gap-2">
                                                {exam.results_count > 0 ? (
                                                    <Badge variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-500/20 font-semibold text-[10px] rounded">
                                                        {exam.results_count} / {data?.total_students} đã nộp
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground font-bold italic opacity-60">Chưa có ai nộp</span>
                                                )}
                                            </div>
                                            {data && data.total_students > 0 && (
                                                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 group-hover/row:animate-pulse transition-all duration-1000"
                                                        style={{ width: `${(exam.results_count / data.total_students) * 100}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/teacher/classes/${params.id}/exams/${exam.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="rounded-lg h-9 px-4 gap-2 font-semibold text-xs hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                                                >
                                                    <Eye className="size-4" />
                                                    <span>Kết quả</span>
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
