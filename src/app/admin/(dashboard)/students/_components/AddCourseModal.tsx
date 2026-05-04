"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BookOpen, Layers, GraduationCap, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"

interface AddCourseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    studentId: number | string | null
    studentName?: string
    onSuccess?: () => void
}

interface FilterOption {
    id: number | string
    name: string
}

interface Course {
    id: number
    name: string
}

export function AddCourseModal({
    open,
    onOpenChange,
    studentId,
    studentName,
    onSuccess,
}: AddCourseModalProps) {
    const [subjects, setSubjects] = React.useState<FilterOption[]>([])
    const [levels, setLevels] = React.useState<FilterOption[]>([])
    const [courses, setCourses] = React.useState<Course[]>([])

    const [selectedSubject, setSelectedSubject] = React.useState<string>("all")
    const [selectedLevel, setSelectedLevel] = React.useState<string>("all")
    const [selectedCourse, setSelectedCourse] = React.useState<string>("")

    const [isLoadingFilters, setIsLoadingFilters] = React.useState(false)
    const [isLoadingCourses, setIsLoadingCourses] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Reset state when modal opens
    React.useEffect(() => {
        if (open) {
            setSelectedSubject("all")
            setSelectedLevel("all")
            setSelectedCourse("")
            fetchFilters()
        }
    }, [open])

    // Fetch filters (subjects, levels)
    const fetchFilters = async () => {
        setIsLoadingFilters(true)
        try {
            const [subjectsRes, levelsRes] = await Promise.all([
                api.get("/common/subjects"),
                api.get("/common/levels")
            ])

            const subjectsData = subjectsRes.data?.data || []
            const levelsData = levelsRes.data?.data || []

            setSubjects(subjectsData)
            setLevels(levelsData.map((l: any) => ({
                id: l.id,
                name: l.level || l.name
            })))
        } catch (error) {
            console.error("Failed to fetch filters:", error)
            toast.error("Không thể tải bộ lọc")
        } finally {
            setIsLoadingFilters(false)
        }
    }

    // Fetch courses when filters change
    React.useEffect(() => {
        if (!open) return

        const fetchCourses = async () => {
            setIsLoadingCourses(true)
            try {
                const params = new URLSearchParams()
                if (selectedSubject !== "all") params.append("subject", selectedSubject)
                if (selectedLevel !== "all") params.append("level", selectedLevel)
                params.append("status", "published")

                const res = await api.get(`/admin/courses?${params.toString()}`)
                const data = res.data?.data || res.data || []
                setCourses(data)

                // If current selected course is not in the new list, clear it
                if (selectedCourse && !data.find((c: Course) => String(c.id) === selectedCourse)) {
                    setSelectedCourse("")
                }
            } catch (error) {
                console.error("Failed to fetch courses:", error)
                toast.error("Không thể tải danh sách khóa học")
            } finally {
                setIsLoadingCourses(false)
            }
        }

        fetchCourses()
    }, [selectedSubject, selectedLevel, open])

    const handleAdd = async () => {
        if (!studentId || !selectedCourse) {
            toast.error("Vui lòng chọn khóa học")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await api.post(`/admin/students/${studentId}/enroll-course`, {
                course_id: Number(selectedCourse),
            })

            if (res.data?.success) {
                toast.success("Thêm học sinh vào khóa học thành công!")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(res.data?.message || "Không thể thêm vào khóa học")
            }
        } catch (error: any) {
            console.error("Enrollment error:", error)
            toast.error(error.response?.data?.message || "Đã có lỗi xảy ra")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Thêm vào khóa học
                    </DialogTitle>
                    <DialogDescription>
                        Chọn khóa học để thêm học sinh <span className="font-bold text-foreground">{studentName}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Filters */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5" />
                                Môn học
                            </Label>
                            <Select
                                value={selectedSubject}
                                onValueChange={(value) => setSelectedSubject(value ?? "")}
                                disabled={isLoadingFilters}
                            >
                                <SelectTrigger className="bg-muted/30 w-full">
                                    <SelectValue placeholder="Tất cả môn học">
                                        {selectedSubject === "all"
                                            ? "Tất cả môn học"
                                            : subjects.find(s => String(s.id) === selectedSubject)?.name}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả môn học</SelectItem>
                                    {subjects.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5" />
                                Trình độ
                            </Label>
                            <Select
                                value={selectedLevel}
                                onValueChange={(value) => setSelectedLevel(value ?? "")}
                                disabled={isLoadingFilters}
                            >
                                <SelectTrigger className="bg-muted/30 w-full">
                                    <SelectValue placeholder="Tất cả trình độ">
                                        {selectedLevel === "all"
                                            ? "Tất cả trình độ"
                                            : levels.find(l => String(l.id) === selectedLevel)?.name}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trình độ</SelectItem>
                                    {levels.map((l) => (
                                        <SelectItem key={l.id} value={String(l.id)}>
                                            {l.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Course Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Khóa học <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={selectedCourse}
                            onValueChange={(value) => setSelectedCourse(value ?? "")}
                            disabled={isLoadingCourses || courses.length === 0}
                        >
                            <SelectTrigger className={cn(
                                "h-12 w-full",
                                !selectedCourse && "text-muted-foreground"
                            )}>
                                <SelectValue placeholder={
                                    isLoadingCourses
                                        ? "Đang tải khóa học..."
                                        : courses.length === 0
                                            ? "Không tìm thấy khóa học nào"
                                            : "Chọn khóa học..."
                                }>
                                    {courses.find(c => String(c.id) === selectedCourse)?.name}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {courses.length === 0 && !isLoadingCourses && (
                        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200/50 italic text-center">
                            Không tìm thấy khóa học nào phù hợp với bộ lọc hiện tại.
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={isSubmitting || !selectedCourse}
                        className="min-w-[120px] shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang thêm...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Thêm vào khóa</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
