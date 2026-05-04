'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import {
    BookOpen,
    ChevronRight,
    Clock,
    FileText,
    PlayCircle,
    ShieldAlert,
    Video
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Lecture {
    id: number;
    name: string;
    duration_time: number;
    lecture_number: number;
}

export default function LecturesPage() {
    const params = useParams();
    const code = params?.code as string;

    const [loading, setLoading] = useState(true);
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!code) return;

        const fetchLectures = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/student/classes/${code}/lectures`);
                if (response.data.success) {
                    setLectures(response.data.data);
                } else {
                    setError(response.data.message || 'Không thể tải danh sách bài giảng');
                }
            } catch (err: unknown) {
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLectures();
    }, [code]);

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} phút`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-3 w-[300px]" />
                </div>
                <div className="grid gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="p-3 bg-red-50 rounded-full text-red-500 mb-3">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Đã có lỗi xảy ra</h3>
                <p className="text-sm text-slate-500 max-w-md mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                    Thử lại ngay
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                        <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    Nội dung bài giảng
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Theo dõi và học tập các bài giảng của lớp <span className="font-semibold text-primary uppercase">{code}</span>
                </p>
            </div>

            {/* Content Section */}
            {lectures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <BookOpen className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Chưa có bài giảng nào</h3>
                    <p className="text-sm text-slate-500">Danh sách bài giảng sẽ sớm được cập nhật.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {lectures.map((lecture) => (
                        <Link
                            key={lecture.id}
                            href={`/student/classes/${code}/lectures/${lecture.id}`}
                            className="block"
                        >
                            <Card
                                className="p-0 group overflow-hidden border-slate-100 rounded-xl hover:shadow-md hover:border-primary/20 transition-all"
                            >
                                <CardContent className="p-0">
                                    <div className="flex items-center p-3 md:p-4 gap-4 md:gap-6">
                                        {/* Number Badge - Smaller */}
                                        <div className="flex flex-col items-center justify-center min-w-[48px] h-[48px] bg-slate-50 group-hover:bg-primary/10 rounded-xl transition-colors shrink-0">
                                            <span className="text-[8px] font-black text-slate-400 group-hover:text-primary/70 uppercase tracking-widest leading-none mb-0.5">Bài</span>
                                            <span className="text-lg font-black text-slate-700 group-hover:text-primary leading-none">
                                                {lecture.lecture_number}
                                            </span>
                                        </div>

                                        {/* Main Info - Smaller text */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm md:text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1 mb-1">
                                                {lecture.name}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full group-hover:bg-primary/5 transition-colors">
                                                    <Clock className="w-3 h-3 text-slate-400 group-hover:text-primary" />
                                                    <span>{formatDuration(lecture.duration_time)}</span>
                                                </div>
                                                <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full group-hover:bg-primary/5 transition-colors">
                                                    <Video className="w-3 h-3 text-slate-400 group-hover:text-primary" />
                                                    <span>Video</span>
                                                </div>
                                                <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full group-hover:bg-primary/5 transition-colors">
                                                    <FileText className="w-3 h-3 text-slate-400 group-hover:text-primary" />
                                                    <span>Tài liệu</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button - Smaller */}
                                        <div className="hidden sm:block">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="border border-slate-100 group-hover:border-primary group-hover:bg-primary group-hover:text-white text-slate-600 rounded-lg h-9 px-4 text-xs font-bold transition-all shadow-sm"
                                            >
                                                <PlayCircle className="w-4 h-4 mr-1.5" />
                                                Học ngay
                                                <ChevronRight className="w-3 h-3 ml-0.5 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </div>

                                        <div className="sm:hidden">
                                            <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all text-slate-400">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}


            {/* Compact Footer Tip */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                    <ShieldAlert className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                    <p className="text-emerald-700 text-xs leading-relaxed font-medium">
                        <span className="font-bold">Lưu ý:</span> Hãy hoàn thành các bài học theo thứ tự để đạt hiệu quả tốt nhất.
                    </p>
                </div>
                <Badge className="hidden md:flex bg-emerald-500/10 text-emerald-600 border-none px-2 py-0.5 rounded-md text-[10px] font-bold">
                    Tip
                </Badge>
            </div>
        </div>
    );
}