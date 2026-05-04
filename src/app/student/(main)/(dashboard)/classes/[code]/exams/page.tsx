'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    Lock,
    Search,
    ShieldAlert,
    Timer
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Exam {
    id: number;
    name: string;
    duration_minutes: number;
    open_at: string;
    close_at: string;
}

export default function ExamsPage() {
    const params = useParams();
    const code = params?.code as string;

    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<Exam[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!code) return;

        const fetchExams = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/student/classes/${code}/exams`);
                if (response.data.success) {
                    setExams(response.data.data);
                } else {
                    setError(response.data.message || 'Không thể tải danh sách bài kiểm tra');
                }
            } catch (err: unknown) {
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [code]);

    const getStatus = (openAt: string, closeAt: string) => {
        const now = new Date();
        const start = parseISO(openAt);
        const end = parseISO(closeAt);

        if (isBefore(now, start)) {
            return {
                label: 'Sắp diễn ra',
                variant: 'secondary' as const,
                icon: <Calendar className="w-3 h-3 mr-1" />,
                className: 'bg-amber-50 text-amber-600 border-amber-100'
            };
        }
        if (isAfter(now, end)) {
            return {
                label: 'Đã kết thúc',
                variant: 'outline' as const,
                icon: <Lock className="w-3 h-3 mr-1" />,
                className: 'bg-slate-50 text-slate-500 border-slate-200'
            };
        }
        return {
            label: 'Đang diễn ra',
            variant: 'default' as const,
            icon: <Timer className="w-3 h-3 mr-1 animate-pulse" />,
            className: 'bg-emerald-50 text-emerald-600 border-emerald-100'
        };
    };

    const formatDate = (dateString: string) => {
        return format(parseISO(dateString), 'HH:mm - dd/MM/yyyy', { locale: vi });
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-3">
                    <Skeleton className="h-10 w-[250px] rounded-md" />
                    <Skeleton className="h-4 w-[350px]" />
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in zoom-in-95 duration-300">
                <div className="p-4 bg-red-50 rounded-lg text-red-500 mb-4 shadow-sm border border-red-100">
                    <ShieldAlert className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Đã có lỗi xảy ra</h3>
                <p className="text-slate-500 max-w-md mb-6">{error}</p>
                <Button
                    onClick={() => window.location.reload()}
                    variant="default"
                    className="rounded-md px-8 shadow-md hover:shadow-lg transition-all"
                >
                    Thử lại ngay
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative overflow-hidden p-6 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg shadow-sm">
                            <ClipboardList className="h-7 w-7 text-primary" />
                        </div>
                        Danh sách bài kiểm tra
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm md:text-base max-w-2xl leading-relaxed">
                        Tham gia các bài kiểm tra định kỳ và đánh giá năng lực cho lớp
                        <span className="mx-1.5 font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-sm uppercase tracking-wider">{code}</span>
                    </p>
                </div>
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* List Section */}
            {exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/40 rounded-xl border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
                    <div className="h-20 w-20 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                        <Search className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Chưa có bài kiểm tra</h3>
                    <p className="text-slate-500 mt-1">Danh sách bài kiểm tra sẽ xuất hiện ở đây khi giảng viên khởi tạo.</p>
                </div>
            ) : (
                <div className="grid gap-5">
                    {exams.map((exam) => {
                        const status = getStatus(exam.open_at, exam.close_at);
                        const isEnded = isAfter(new Date(), parseISO(exam.close_at));
                        const isUpcoming = isBefore(new Date(), parseISO(exam.open_at));
                        const isOngoing = !isEnded && !isUpcoming;

                        return (
                            <Link
                                key={exam.id}
                                href={isOngoing ? `/exams/${exam.id}` : `/classes/${code}/exams/${exam.id}`}
                                className={`block group transition-all ${isEnded ? 'opacity-75 grayscale-[0.3]' : ''}`}
                            >
                                <Card className="p-0 overflow-hidden border-slate-100 rounded-lg shadow-sm group-hover:shadow-xl group-hover:border-primary/20 group-hover:-translate-y-1 transition-all duration-300">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row items-stretch md:items-center">
                                            {/* Status Indicator Bar */}
                                            <div className={`w-full md:w-2 h-2 md:h-auto shrink-0 ${isOngoing ? 'bg-emerald-500' : isUpcoming ? 'bg-amber-500' : 'bg-slate-300'
                                                }`} />

                                            <div className="flex-1 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                                                {/* Info Column */}
                                                <div className="flex-1 min-w-0 space-y-3">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="text-lg md:text-xl font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                                                            {exam.name}
                                                        </h3>
                                                        <Badge variant={status.variant} className={`font-bold px-2.5 py-0.5 rounded-md border ${status.className}`}>
                                                            {status.icon}
                                                            {status.label}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1 bg-slate-100 rounded-sm">
                                                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                            </div>
                                                            <span>Thời gian: <span className="text-slate-900 font-bold">{exam.duration_minutes} phút</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1 bg-slate-100 rounded-sm">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                            </div>
                                                            <div className="flex items-center gap-1.5 leading-none">
                                                                <span className="hidden sm:inline">Mở từ:</span>
                                                                <span className="text-slate-700 font-semibold">{formatDate(exam.open_at)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1 bg-red-50 rounded-sm">
                                                                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                                            </div>
                                                            <div className="flex items-center gap-1.5 leading-none">
                                                                <span className="hidden sm:inline">Kết thúc:</span>
                                                                <span className="text-red-600/80 font-semibold">{formatDate(exam.close_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Section */}
                                                <div className="w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 flex items-center justify-between md:justify-end gap-4 min-w-[140px]">
                                                    {isOngoing ? (
                                                        <Button
                                                            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold rounded-md px-6 h-11 shadow-md shadow-primary/20 group-hover:scale-105 transition-all"
                                                        >
                                                            Vào thi ngay
                                                            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                                        </Button>
                                                    ) : isUpcoming ? (
                                                        <div className="text-right flex flex-col items-end">
                                                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Trạng thái</span>
                                                            <span className="text-sm font-bold text-amber-600 flex items-center">
                                                                Chưa đến giờ
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full md:w-auto border border-slate-200 text-slate-600 font-bold rounded-md px-6 h-11 bg-slate-50 group-hover:bg-slate-100 transition-all"
                                                        >
                                                            Xem kết quả
                                                            <ChevronRight className="w-4 h-4 ml-1" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Information Card */}
            <div className="bg-slate-900 rounded-xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-lg backdrop-blur-md">
                        <ShieldAlert className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="text-lg font-bold mb-2">Quy định phòng thi trực tuyến</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Đảm bảo kết nối internet ổn định trong suốt quá trình làm bài. Hệ thống sẽ tự động nộp bài khi hết thời gian hoặc nếu bạn phát hiện hành vi gian lận.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-md">
                            <CheckCircle2 className="w-4 h-4" />
                            Kết nối ổn định
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-400/10 px-3 py-2 rounded-md">
                            <CheckCircle2 className="w-4 h-4" />
                            Trình duyệt tương thích
                        </div>
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50" />
            </div>
        </div>
    );
}