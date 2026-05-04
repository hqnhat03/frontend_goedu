'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';
import {
    AlertCircle,
    ArrowLeft,
    ChevronLeft,
    FileText,
    Info,
    MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Question {
    id: string;
    question: string;
    type: 'multiple_choice' | 'essay' | 'multiple_select';
    options: string[] | null;
    correct_answer: string;
    score: number;
    order_number?: number;
}

interface ExamDetail {
    id: number;
    question: Question;
    answer_content: string | string[];
    score: number;
    is_correct: boolean;
    teacher_comment: string | null;
}

interface ResultData {
    exam: {
        id: number;
        name: string;
        duration_minutes: number;
    };
    result: {
        id: number;
        score: number;
        status: string;
        submitted_at: string;
        graded_at: string;
    };
    details: ExamDetail[];
}

export default function ExamResultPage() {
    const params = useParams();
    const router = useRouter();
    const code = params?.code as string;
    const exam_id = params?.exam_id as string;

    const [loading, setLoading] = useState(true);
    const [resultData, setResultData] = useState<ResultData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!exam_id) return;

        const fetchResult = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/student/exams/${exam_id}/result`);
                if (response.data.success) {
                    setResultData(response.data.data);
                } else {
                    setError(response.data.message || 'Không thể tải kết quả bài kiểm tra');
                }
            } catch (err: unknown) {
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [exam_id]);

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6 max-w-5xl">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !resultData) {
        return (
            <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-red-50 rounded-full text-red-500">
                    <AlertCircle className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Không tìm thấy kết quả</h3>
                <p className="text-slate-500 max-w-md text-center">
                    {error || 'Bài kiểm tra không tồn tại hoặc bạn chưa hoàn thành bài làm này.'}
                </p>
                <Link href={`/classes/${code}/detail`}>
                    <Button variant="outline" className="gap-2">
                        <ChevronLeft className="w-4 h-4" /> Quay lại lớp học
                    </Button>
                </Link>
            </div>
        );
    }

    const { exam, result, details } = resultData;
    const totalPossibleScore = details.reduce((acc, curr) => acc + curr.question.score, 0);
    const scorePercentage = (result.score / totalPossibleScore) * 100;

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full shrink-0"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                                {exam.name}
                            </h1>
                            <Badge className="bg-emerald-500 text-white border-none px-3">
                                Hoàn thành
                            </Badge>
                        </div>
                        <p className="text-slate-500 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Kết quả bài kiểm tra chi tiết
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-500 mb-1">Điểm số của bạn</p>
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-4xl font-black text-primary">{result.score}</span>
                            <span className="text-slate-400 font-medium pb-1">/ {totalPossibleScore}</span>
                        </div>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="transparent"
                                className="text-slate-100"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="transparent"
                                strokeDasharray={175.92}
                                strokeDashoffset={175.92 - (175.92 * Math.min(scorePercentage, 100)) / 100}
                                className="text-primary transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-[12px] font-bold text-slate-700">{Math.round(scorePercentage)}%</span>
                    </div>
                </div>
            </div>


            {/* Questions Detail */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Info className="w-5 h-5 text-indigo-500" />
                        Chi tiết bài làm
                    </h2>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-medium">
                            Đúng: {details.filter(d => d.is_correct).length}
                        </Badge>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 font-medium">
                            Sai: {details.filter(d => !d.is_correct).length}
                        </Badge>
                    </div>
                </div>

                <div className="space-y-6">
                    {[...details].sort((a, b) => (a.question.order_number ?? 0) - (b.question.order_number ?? 0)).map((detail, index) => (
                        <Card key={detail.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all border-l-4 border-l-transparent data-[correct=true]:border-l-emerald-500 data-[correct=false]:border-l-red-500" data-correct={detail.is_correct}>
                            <CardHeader className="bg-slate-50/50 pb-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm shrink-0 shadow-sm ${detail.is_correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {detail.question.order_number || (index + 1)}
                                        </div>
                                        <div
                                            className="prose prose-slate max-w-none text-slate-800 font-medium pt-1"
                                            dangerouslySetInnerHTML={{ __html: detail.question.question }}
                                        />
                                    </div>
                                    <Badge variant="outline" className={`shrink-0 border-none font-medium ${detail.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {detail.score} / {detail.question.score} điểm
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {/* Multiple Choice Options */}
                                {(detail.question.type === 'multiple_choice' || detail.question.type === 'multiple_select') && detail.question.options && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                            {detail.question.options.map((option, optIdx) => {
                                                const isStudentChoice = Array.isArray(detail.answer_content)
                                                    ? detail.answer_content.map(String).includes(String(option))
                                                    : String(detail.answer_content) === String(option);

                                                const isCorrectAnswer = Array.isArray(detail.question.correct_answer)
                                                    ? detail.question.correct_answer.map(String).includes(String(option)) || detail.question.correct_answer.map(String).includes(optIdx.toString())
                                                    : (String(detail.question.correct_answer) === optIdx.toString() || String(detail.question.correct_answer) === String(option));

                                                return (
                                                    <div
                                                        key={optIdx}
                                                        className={cn(
                                                            "flex items-center justify-between p-1 rounded-md border-1 transition-all",
                                                            isStudentChoice && isCorrectAnswer ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-950/20" :
                                                                isStudentChoice && !isCorrectAnswer ? "bg-rose-50 border-rose-500 dark:bg-rose-950/20" :
                                                                    isCorrectAnswer ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-950/20" :
                                                                        "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "flex items-center justify-center w-6 h-6 rounded-full border-1 text-xs font-bold",
                                                                isStudentChoice && isCorrectAnswer ? "border-emerald-600 text-emerald-600 bg-white" :
                                                                    isStudentChoice && !isCorrectAnswer ? "border-rose-600 text-rose-600 bg-white" :
                                                                        isCorrectAnswer ? "border-emerald-600 text-emerald-600 bg-white" :
                                                                            "border-slate-300 text-slate-500"
                                                            )}>
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </div>
                                                            <span className={cn(
                                                                "text-sm",
                                                                isStudentChoice && isCorrectAnswer ? "font-bold text-emerald-700 dark:text-emerald-400" :
                                                                    isStudentChoice && !isCorrectAnswer ? "font-bold text-rose-700 dark:text-rose-400" :
                                                                        isCorrectAnswer ? "font-bold text-emerald-700 dark:text-emerald-400" :
                                                                            "text-slate-700 dark:text-slate-300"
                                                            )}>
                                                                {option}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Essay Answer */}
                                {detail.question.type === 'essay' && (
                                    <div className="space-y-3">
                                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Bài làm của bạn:</p>
                                        <div className={`p-4 rounded-xl border whitespace-pre-wrap text-sm leading-relaxed ${detail.is_correct ? 'bg-emerald-50/50 border-emerald-100 text-slate-700' : 'bg-red-50/50 border-red-100 text-slate-700'}`}>
                                            {detail.answer_content || <span className="text-slate-400 font-normal">Không có nội dung trả lời</span>}
                                        </div>
                                    </div>
                                )}

                                {/* Teacher Comment */}
                                {detail.teacher_comment && (
                                    <div className="mt-4 p-4 bg-amber-50/80 rounded-xl border border-amber-100 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg self-start">
                                            <MessageCircle className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Cố vấn học tập phản hồi:</p>
                                            <p className="text-sm text-amber-900 font-medium">{detail.teacher_comment}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}