"use client"

import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import {
    ArrowLeft,
    Eye,
    LayoutGrid,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { StudentDrawer } from "@/app/admin/(dashboard)/students/_components/StudentDrawer"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AssignClassModal } from "./_components/AssignClassModal"

interface Student {
    id: string | number
    name: string
    email: string
    phone: string
    class_code: string | null
    class_id?: number | string | null
    avatar?: string | null
    is_assigned?: boolean
    status: "active" | "inactive"
}

/**
 * Helper to get full avatar URL
 */
const getAvatarUrl = (path?: string | null) => {
    if (!path) return undefined
    if (path.startsWith("http")) return path
    // Base URL from environment variable
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    return path.startsWith("/") ? `${baseUrl}${path}` : `${baseUrl}/${path}`
}

export default function CourseStudentsPage() {
    const params = useParams()
    const router = useRouter()
    const { hasPermission } = usePermission()

    // Kiểm tra quyền
    React.useEffect(() => {
        if (!hasPermission("student_in_course_list")) {
            toast.error("Bạn không có quyền truy cập trang này")
            router.push(`/admin/courses/${params.id}`)
        }
    }, [hasPermission, router, params.id])

    const [students, setStudents] = React.useState<Student[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [filterType, setFilterType] = React.useState<"all" | "registered" | "arranged">("registered")


    // Selection state
    const [selectedIds, setSelectedIds] = React.useState<Set<string | number>>(new Set())

    // Dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [deleteType, setDeleteType] = React.useState<"course" | "class">("course")
    const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    // Drawer state
    const [drawerMode, setDrawerMode] = React.useState<"view" | undefined>(undefined)
    const [selectedStudentId, setSelectedStudentId] = React.useState<string | number | null>(null)

    // Assign class state
    const [assignClassOpen, setAssignClassOpen] = React.useState(false)
    const [studentsToAssign, setStudentsToAssign] = React.useState<(string | number)[]>([])

    const fetchStudents = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const params_obj: Record<string, string> = {}
            if (filterType === "registered") params_obj.is_assigned = "false"
            if (filterType === "arranged") params_obj.is_assigned = "true"

            const response = await api.get(`/admin/courses/${params.id}/students`, {
                params: params_obj
            })
            const result = response.data
            if (response.status === 200) {
                setStudents(result.data || result)
            } else {
                toast.error(result.message || "Không thể tải danh sách học sinh")
            }
        } catch (error) {
            console.error("Failed to fetch students:", error)
            toast.error("Có lỗi xảy ra khi tải danh sách học sinh")
            setStudents([])
        } finally {
            setIsLoading(false)
        }
    }, [params.id, filterType])

    React.useEffect(() => {
        if (params.id) {
            fetchStudents()
        }
    }, [fetchStudents, params.id])

    // Clear selection when filterType changes
    React.useEffect(() => {
        setSelectedIds(new Set())
    }, [filterType])

    const filteredStudents = students.filter((s) => {
        const matchesSearch =
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()) ||
            s.phone.includes(search)

        if (filterType === "registered") return matchesSearch && !s.class_code
        if (filterType === "arranged") return matchesSearch && !!s.class_code
        return matchesSearch
    })

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredStudents.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredStudents.map((s) => s.id)))
        }
    }

    const toggleSelect = (id: string | number) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const handleDeleteClick = (student: Student, type: "course" | "class") => {
        setStudentToDelete(student)
        setDeleteType(type)
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!studentToDelete) return
        setIsDeleting(true)
        try {
            let endpoint = ""
            if (deleteType === "course") {
                endpoint = `/admin/courses/${params.id}/students/${studentToDelete.id}`
            } else {
                endpoint = `/admin/classes/${studentToDelete.class_id}/students/${studentToDelete.id}`
            }

            const res = await api.delete(endpoint)
            if (res.data?.success) {
                toast.success(deleteType === "course" ? "Đã xóa học sinh khỏi khóa học" : "Đã xóa học sinh khỏi lớp")
                fetchStudents()
            } else {
                toast.error(res.data?.message || "Không thể thực hiện thao tác")
            }
        } catch (error) {
            console.error("Delete error:", error)
            toast.error("Có lỗi xảy ra khi thực hiện")
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
            setStudentToDelete(null)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href={`/courses/${params.id}`}>
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Danh sách học sinh
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded-md text-xs">ID Khóa: {params.id}</span>
                            • Quản lý học sinh trong khóa học
                        </p>
                    </div>
                </div>

                <Can permission="student_in_course_edit">
                    <Tabs value={filterType} onValueChange={(v) => setFilterType(v as "registered" | "arranged")} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-muted/50">
                            <TabsTrigger value="registered" className="rounded-md transition-all">
                                <UserPlus className="mr-2 h-4 w-4" /> Đăng ký
                            </TabsTrigger>
                            <TabsTrigger value="arranged" className="rounded-md transition-all">
                                <UserCheck className="mr-2 h-4 w-4" /> Đã sắp xếp
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </Can>
            </div>

            {/* Filter Section */}
            <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:w-[400px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm tên, email, số điện thoại..."
                                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className="flex-1 sm:flex-none bg-background hover:bg-muted transition-colors border-dashed"
                                onClick={fetchStudents}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Tải lại
                            </Button>
                            <Can permission="student_in_course_edit">
                                {selectedIds.size > 0 && filterType !== "arranged" && (
                                    <Button variant="destructive" className="flex-1 sm:flex-none animate-in zoom-in-95">
                                        <Trash2 className="mr-2 h-4 w-4" /> Xóa đã chọn ({selectedIds.size})
                                    </Button>
                                )}
                                {selectedIds.size > 0 && filterType !== "arranged" && (
                                    <Button
                                        variant="outline"
                                        className="flex-1 sm:flex-none border-primary text-primary hover:bg-primary/5 animate-in zoom-in-95"
                                        onClick={() => {
                                            setStudentsToAssign(Array.from(selectedIds))
                                            setAssignClassOpen(true)
                                        }}
                                    >
                                        <LayoutGrid className="mr-2 h-4 w-4" /> Xếp lớp ({selectedIds.size})
                                    </Button>
                                )}
                            </Can>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Section */}
            <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className={cn("w-[50px] py-4", filterType === "arranged" && "hidden")}>
                                    <Checkbox
                                        checked={selectedIds.size > 0 && selectedIds.size === filteredStudents.length}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="font-semibold py-4">Avatar</TableHead>
                                <TableHead className="font-semibold py-4">Họ và tên</TableHead>
                                <TableHead className="font-semibold py-4">Email</TableHead>
                                <TableHead className="font-semibold py-4">Số điện thoại</TableHead>
                                <TableHead className="font-semibold py-4">Mã lớp</TableHead>
                                <TableHead className="text-right font-semibold py-4">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-sm" />
                                            <p className="text-muted-foreground font-medium animate-pulse">Đang tải học sinh...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredStudents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Users className="h-10 w-10 opacity-20" />
                                            <p>{search ? "Không tìm thấy học sinh nào phù hợp." : "Chưa có học sinh nào tham gia khóa học này."}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStudents.map((student) => (
                                    <TableRow key={student.id} className="group hover:bg-muted/40 transition-colors">
                                        <TableCell className={cn("py-4", filterType === "arranged" && "hidden")}>
                                            <Checkbox
                                                checked={selectedIds.has(student.id)}
                                                onCheckedChange={() => toggleSelect(student.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-muted">
                                                    <AvatarImage src={getAvatarUrl(student.avatar)} alt={student.name} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                        {student.name?.split(" ").pop()?.substring(0, 2).toUpperCase() || "HS"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground/90 leading-none">{student.name}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-sm text-muted-foreground">{student.email}</TableCell>
                                        <TableCell className="py-4 text-sm text-muted-foreground">{student.phone}</TableCell>
                                        <TableCell className="py-4">
                                            {student.class_code ? (
                                                <span className="font-mono text-sm font-medium">{student.class_code}</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Chưa xếp lớp</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="flex justify-end gap-1">
                                                <Can permission="student_detail">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                                        title="Xem chi tiết"
                                                        onClick={() => {
                                                            setSelectedStudentId(student.id)
                                                            setDrawerMode("view")
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Can>
                                                {filterType !== "arranged" && (
                                                    <Can permission="student_in_course_delete">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-rose-600 transition-colors"
                                                            title="Xóa khỏi khóa học"
                                                            onClick={() => handleDeleteClick(student, "course")}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </Can>
                                                )}
                                                {student.class_id && (
                                                    <Can permission="class_edit">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                                                            title="Xóa khỏi lớp"
                                                            onClick={() => handleDeleteClick(student, "class")}
                                                        >
                                                            <ShieldAlert className="h-4 w-4" />
                                                        </Button>
                                                    </Can>
                                                )}
                                                {!student.class_id && filterType !== "arranged" && (
                                                    <Can permission="class_edit">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-indigo-600 transition-colors"
                                                            title="Xếp vào lớp"
                                                            onClick={() => {
                                                                setStudentsToAssign([student.id])
                                                                setAssignClassOpen(true)
                                                            }}
                                                        >
                                                            <LayoutGrid className="h-4 w-4" />
                                                        </Button>
                                                    </Can>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between px-2">
                <p className="text-sm text-muted-foreground">
                    Hiển thị <strong>{filteredStudents.length}</strong> trên <strong>{students.length}</strong> học sinh
                </p>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="glass-morphism border-rose-100 ring-4 ring-rose-50/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                            <ShieldAlert className="h-5 w-5" />
                            {deleteType === "course" ? "Xóa khỏi khóa học" : "Rời khỏi lớp học"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base pt-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border mb-4">
                                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                    <AvatarImage src={getAvatarUrl(studentToDelete?.avatar)} alt={studentToDelete?.name} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {studentToDelete?.name?.split(" ").pop()?.substring(0, 2).toUpperCase() || "HS"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-bold text-foreground">{studentToDelete?.name}</span>
                                    <span className="text-xs text-muted-foreground">{studentToDelete?.email}</span>
                                </div>
                            </div>
                            Bạn có chắc chắn muốn xóa học sinh này {deleteType === "course" ? "khỏi khóa học này" : `khỏi lớp ${studentToDelete?.class_code}`}?
                            <br />
                            <span className="text-sm mt-2 block opacity-80">
                                {deleteType === "course"
                                    ? "Học sinh sẽ không còn quyền truy cập vào các bài học và lớp học thuộc khóa này."
                                    : "Học sinh sẽ bị xóa khỏi danh sách lớp nhưng vẫn thuộc khóa học này."}
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel disabled={isDeleting} className="bg-muted/50 border-none hover:bg-muted">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleConfirmDelete()
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-rose-200 transition-all active:scale-95"
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Đang xử lý...
                                </div>
                            ) : "Xác nhận xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Student Detail Drawer */}
            <StudentDrawer
                mode={drawerMode}
                studentId={selectedStudentId}
                onClose={() => {
                    setDrawerMode(undefined)
                    setSelectedStudentId(null)
                }}
                onSuccess={() => {
                    fetchStudents()
                }}
            />

            {/* Assign Class Modal */}
            <AssignClassModal
                open={assignClassOpen}
                onOpenChange={setAssignClassOpen}
                courseId={params.id as string}
                studentIds={studentsToAssign}
                onSuccess={() => {
                    fetchStudents()
                    setSelectedIds(new Set())
                }}
            />
        </div>
    )
}
