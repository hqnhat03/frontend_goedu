"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Skeleton
} from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useExamStore } from "@/store/exam-store";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Clock,
    Mail,
    Search,
    TrendingUp,
    Users
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Student {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
    result_id: number | null;
    score: number | null;
    status: "not_started" | "grading" | "completed";
    submitted_at: string | null;
}

interface ExamStudentResponse {
    success: boolean;
    message: string;
    data: {
        total_score: number;
        students: Student[];
    };
}

export default function ExamStudentsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.exam_id;
    const classId = params.id;
    const { setCurrentStudentName } = useExamStore();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ total_score: number; students: Student[] } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "grading" | "completed">("all");

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const response = await api.get<ExamStudentResponse>(`/teacher/exams/${examId}/students`);
                if (response.data.success) {
                    setData(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };

        if (examId) {
            fetchStudents();
        }
    }, [examId]);

    const filteredStudents = data?.students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || student.status === filterStatus;
        return matchesSearch && matchesStatus;
    }) || [];

    const completedCount = data?.students.filter(s => s.status === "completed").length || 0;
    const averageScore = completedCount > 0
        ? (data?.students.reduce((acc, s) => acc + (s.score || 0), 0) || 0) / completedCount
        : 0;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    const getStatusBadge = (status: Student["status"]) => {
        switch (status) {
            case "not_started":
                return (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 shadow-none border-none py-1 px-3 flex items-center gap-1.5 w-fit">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Chưa làm bài
                    </Badge>
                );
            case "grading":
                return (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 shadow-none border-none py-1 px-3 flex items-center gap-1.5 w-fit">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Chờ chấm điểm
                    </Badge>
                );
            case "completed":
                return (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none border-none py-1 px-3 flex items-center gap-1.5 w-fit">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Đã hoàn thành
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="group -ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Quay lại
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Kết quả bài kiểm tra
                    </h1>
                    <p className="text-muted-foreground">
                        Theo dõi chi tiết tình hình làm bài và điểm số của học sinh trong lớp.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-white to-blue-50 dark:from-slate-950 dark:to-blue-950/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Tổng số học sinh</CardTitle>
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <>
                                <div className="text-2xl font-bold">{data?.students.length || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Sĩ số lớp hiện tại</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-white to-green-50 dark:from-slate-950 dark:to-green-950/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Đã hoàn thành</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <>
                                <div className="text-2xl font-bold">{completedCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {data?.students.length ? Math.round((completedCount / data.students.length) * 100) : 0}% tỉ lệ nộp bài
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-white to-amber-50 dark:from-slate-950 dark:to-amber-950/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Điểm trung bình</CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <>
                                <div className="text-2xl font-bold">{averageScore.toFixed(1)} / {data?.total_score}</div>
                                <p className="text-xs text-muted-foreground mt-1">Dựa trên kết quả đã nộp</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-white to-purple-50 dark:from-slate-950 dark:to-purple-950/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Chưa bắt đầu</CardTitle>
                        <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <>
                                <div className="text-2xl font-bold">{(data?.students.length || 0) - completedCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">Nhắc nhở học sinh nộp bài</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Table */}
            <Card className="border-none shadow-lg outline-1 outline-slate-100 dark:outline-slate-800">
                <CardHeader className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm học sinh theo tên hoặc email..."
                                className="pl-10 h-11 border-slate-200 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filterStatus === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("all")}
                                className="rounded-full shadow-sm"
                            >
                                Tất cả
                            </Button>
                            <Button
                                variant={filterStatus === "not_started" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("not_started")}
                                className="rounded-full shadow-sm"
                            >
                                Chưa làm
                            </Button>
                            <Button
                                variant={filterStatus === "grading" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("grading")}
                                className="rounded-full shadow-sm"
                            >
                                Đang chấm
                            </Button>
                            <Button
                                variant={filterStatus === "completed" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("completed")}
                                className="rounded-full shadow-sm"
                            >
                                Hoàn thành
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                <TableRow>
                                    <TableHead className="w-[300px]">Học sinh</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Điểm số</TableHead>
                                    <TableHead>Thời gian nộp</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <TableRow key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                        {student.avatar ? (
                                                            <AvatarImage src={student.avatar} alt={student.name} />
                                                        ) : null}
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                                                            {getInitials(student.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                                                            {student.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {student.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(student.status)}
                                            </TableCell>
                                            <TableCell>
                                                {student.status !== "not_started" ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className={cn(
                                                            "text-lg font-bold",
                                                            student.status === "grading" ? "text-amber-600" : "text-slate-800 dark:text-slate-200"
                                                        )}>
                                                            {student.score ?? 0}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            / {data?.total_score}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">--</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {student.submitted_at ? (
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span className="text-sm">
                                                            {format(new Date(student.submitted_at), "HH:mm, dd/MM", { locale: vi })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic text-sm">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    disabled={!student.result_id}
                                                    onClick={() => {
                                                        setCurrentStudentName(student.name);
                                                        router.push(`/teacher/classes/${classId}/exams/${examId}/students/${student.id}/answers`);
                                                    }}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            Không tìm thấy học sinh nào phù hợp.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
