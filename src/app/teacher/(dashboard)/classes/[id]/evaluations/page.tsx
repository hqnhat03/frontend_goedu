'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import {
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    GraduationCap,
    Mail,
    Pencil,
    Star,
    User,
} from 'lucide-react';
import { use, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Student {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
}

interface Teacher {
    id: number;
    name: string;
    avatar: string | null;
}

interface Evaluation {
    id: number | null;
    rating: string | null;
    comment: string | null;
    created_at: string | null;
    is_evaluated: boolean;
    student: Student;
    teacher: Teacher | null;
}

const RATING_OPTIONS = [
    { value: 'unsatisfactory', label: 'Chưa đạt', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    { value: 'satisfactory', label: 'Đạt', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    { value: 'good', label: 'Tốt', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    { value: 'excellent', label: 'Xuất sắc', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
];

export default function ClassEvaluationsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: classId } = use(params);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
    const [rating, setRating] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    const fetchEvaluations = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/teacher/classes/${classId}/evaluations`);
            if (response.data?.success) {
                setEvaluations(response.data.data || []);
            }
        } catch (error: unknown) {
            console.error('Failed to fetch evaluations:', error);
            toast.error('Không thể tải danh sách đánh giá');
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        if (classId) {
            fetchEvaluations();
        }
    }, [classId, fetchEvaluations]);

    const handleOpenEvaluate = (evaluation: Evaluation) => {
        setSelectedEvaluation(evaluation);
        setRating(evaluation.rating || 'satisfactory');
        setComment(evaluation.comment || '');
        setIsDialogOpen(true);
    };

    const handleSubmitEvaluation = async () => {
        if (!selectedEvaluation) return;

        try {
            setSubmitting(true);
            const response = await api.post(`/teacher/classes/${classId}/evaluations`, {
                student_id: selectedEvaluation.student.id,
                rating,
                comment,
            });

            if (response.data?.success) {
                toast.success('Đánh giá học sinh thành công');
                setIsDialogOpen(false);
                fetchEvaluations(); // Refresh list
            }
        } catch (error: unknown) {
            console.error('Failed to submit evaluation:', error);
            if (error instanceof AxiosError && error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Có lỗi xảy ra khi gửi đánh giá');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getRatingBadge = (rating: string | null) => {
        if (!rating) return null;
        const option = RATING_OPTIONS.find((o) => o.value === rating);
        return (
            <Badge
                variant="outline"
                className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${option?.color}`}
            >
                {option ? option.label : rating}
            </Badge>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <span>Quản lý lớp học</span>
                    <ChevronRight className="size-4 opacity-50" />
                    <span className="text-primary font-semibold">Đánh giá học sinh</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-8 w-1.5 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Đánh giá học sinh
                            </h1>
                        </div>
                        <p className="text-muted-foreground font-medium ml-4">
                            Xem và đánh giá kết quả học tập của học sinh trong khóa học.
                        </p>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-lg border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-transparent overflow-hidden group py-0">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3.5 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 scale-100 group-hover:scale-110 transition-transform">
                            <GraduationCap className="size-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Tổng số học sinh</p>
                            <p className="text-2xl font-black">{evaluations.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-transparent overflow-hidden group py-0">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 scale-100 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Đã đánh giá</p>
                            <p className="text-2xl font-black text-emerald-600">
                                {evaluations.filter(e => e.is_evaluated).length}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-transparent overflow-hidden group py-0">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 scale-100 group-hover:scale-110 transition-transform">
                            <ClipboardCheck className="size-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Chưa đánh giá</p>
                            <p className="text-2xl font-black text-amber-600">
                                {evaluations.filter(e => !e.is_evaluated).length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* List Section */}
            <Card className="rounded-lg border-border/40 shadow-sm overflow-hidden bg-background/60 backdrop-blur-xl py-0">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-4 px-6 pt-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <User className="size-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Danh sách học sinh</CardTitle>
                            <CardDescription className="font-medium text-muted-foreground">Thực hiện đánh giá cho từng học sinh</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/20">
                                    <TableHead className="w-[80px] font-bold text-xs uppercase tracking-wider pl-6">STT</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Học sinh</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Email</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Đánh giá</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Nhận xét</TableHead>
                                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider pr-6">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [1, 2, 3].map((i) => (
                                        <TableRow key={i}>
                                            <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell className="text-right pr-6"><Skeleton className="h-9 w-24 ml-auto rounded-lg" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : evaluations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="p-3 rounded-full bg-muted">
                                                    <GraduationCap className="size-8 text-muted-foreground" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">Chưa có học sinh nào trong lớp này</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    evaluations.map((evaluation, index) => (
                                        <TableRow key={evaluation.student.id} className="hover:bg-muted/30 transition-colors border-border/10">
                                            <TableCell className="pl-6 font-medium text-muted-foreground">
                                                {(index + 1).toString().padStart(2, '0')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-10 border border-border/40 shadow-sm">
                                                        <AvatarImage src={evaluation.student.avatar || ''} alt={evaluation.student.name} />
                                                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                            {evaluation.student.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-black text-sm">{evaluation.student.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <Mail className="size-3.5" />
                                                    {evaluation.student.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {evaluation.is_evaluated ? (
                                                    getRatingBadge(evaluation.rating)
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/50">
                                                        Chưa đánh giá
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-muted-foreground line-clamp-1 max-w-[300px] font-medium">
                                                    {evaluation.comment || "---"}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    size="sm"
                                                    variant={evaluation.is_evaluated ? "outline" : "default"}
                                                    className={`rounded-lg font-bold text-xs uppercase tracking-widest gap-2 transition-all ${!evaluation.is_evaluated ? "shadow-md shadow-primary/20 hover:shadow-primary/30" : "hover:bg-primary/5 hover:text-primary"
                                                        }`}
                                                    onClick={() => handleOpenEvaluate(evaluation)}
                                                >
                                                    {evaluation.is_evaluated ? (
                                                        <>
                                                            <Pencil className="size-3.5" />
                                                            Sửa đánh giá
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Star className="size-3.5" />
                                                            Đánh giá
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Evaluation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-lg border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            <Star className="size-6 text-amber-500 fill-amber-500" />
                            {selectedEvaluation?.is_evaluated ? 'Cập nhật đánh giá' : 'Đánh giá học sinh'}
                        </DialogTitle>
                        <DialogDescription className="text-base font-medium">
                            Đang thực hiện đánh giá cho <span className="text-primary font-black">{selectedEvaluation?.student.name}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rating" className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                Kết quả đánh giá
                            </Label>
                            <Select value={rating} onValueChange={(value) => setRating(value as 'unsatisfactory' | 'satisfactory' | 'good' | 'excellent')}>
                                <SelectTrigger id="rating" className="h-12 rounded-lg border-border/40 bg-muted/20 font-bold focus:ring-primary/20">
                                    <SelectValue placeholder="Chọn kết quả">
                                        {RATING_OPTIONS.find(o => o.value === rating)?.label || "Chọn kết quả"}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-border/40 shadow-xl">
                                    {RATING_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            className="rounded-lg text-sm font-medium"
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="comment" className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                Nhận xét chi tiết
                            </Label>
                            <Textarea
                                id="comment"
                                placeholder="Nhập nhận xét về thái độ học tập, kết quả..."
                                className="min-h-[120px] rounded-lg border-border/40 bg-muted/20 focus-visible:ring-primary/20 p-4 font-medium"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                            className="rounded-lg font-bold uppercase tracking-widest h-12"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleSubmitEvaluation}
                            disabled={submitting}
                            className="rounded-lg font-black uppercase tracking-widest h-12 px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                        >
                            {submitting ? 'Đang lưu...' : 'Lưu đánh giá'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
