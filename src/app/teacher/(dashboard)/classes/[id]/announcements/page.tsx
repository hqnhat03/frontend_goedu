'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Clock,
    Megaphone,
    MoreVertical,
    Pencil,
    Pin,
    PinOff,
    Plus,
    Trash2,
} from 'lucide-react';
import { use, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AnnouncementForm } from './_components/announcement-form';

interface Announcement {
    id: number;
    class_id: number;
    teacher_id: number;
    title: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
    teacher: {
        id: number;
        user: {
            name: string;
            avatar: string | null;
        };
    };
}

export default function TeacherAnnouncementsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: classId } = use(params);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAnnouncements = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/teacher/classes/${classId}/announcements`);
            if (response.data) {
                // The API returns the list directly or wrapped in data
                const data = Array.isArray(response.data) ? response.data : response.data.data;
                setAnnouncements(data || []);
            }
        } catch (error: unknown) {
            console.error('Failed to fetch announcements:', error);
            if (error instanceof AxiosError && error.response?.status === 403) {
                toast.error('Bạn không có quyền xem thông báo của lớp này');
            } else {
                toast.error('Không thể tải danh sách thông báo');
            }
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        if (classId) {
            fetchAnnouncements();
        }
    }, [classId, fetchAnnouncements]);

    const handleCreateOrUpdateSuccess = (updatedAnnouncement: Announcement) => {
        if (editingAnnouncement) {
            setAnnouncements((prev) =>
                prev.map((a) => (a.id === updatedAnnouncement.id ? updatedAnnouncement : a))
            );
            toast.success('Cập nhật thông báo thành công');
        } else {
            setAnnouncements((prev) => [updatedAnnouncement, ...prev]);
            toast.success('Đã đăng thông báo mới');
        }
        setIsDialogOpen(false);
        setEditingAnnouncement(null);
    };

    const handleDelete = async () => {
        if (!announcementToDelete) return;

        try {
            setIsDeleting(true);
            await api.delete(`/teacher/announcements/${announcementToDelete}`);
            setAnnouncements((prev) => prev.filter((a) => a.id !== announcementToDelete));
            toast.success('Đã xóa thông báo');
        } catch (error: unknown) {
            if (error instanceof AxiosError && error.response?.status === 403) {
                toast.error('Bạn không có quyền xóa thông báo này');
            } else {
                toast.error('Không thể xóa thông báo');
            }
        } finally {
            setIsDeleting(false);
            setAnnouncementToDelete(null);
        }
    };

    const togglePin = async (announcement: Announcement) => {
        try {
            const response = await api.put(`/teacher/announcements/${announcement.id}`, {
                is_pinned: !Boolean(announcement.is_pinned),
            });

            const updated = response.data.data || response.data;
            setAnnouncements((prev) => {
                const newAnnouncements = prev.map((a) => (a.id === announcement.id ? updated : a));
                // Sort: pinned first, then by date
                return newAnnouncements.sort((a, b) => {
                    if (a.is_pinned === b.is_pinned) {
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    }
                    return a.is_pinned ? -1 : 1;
                });
            });

            toast.success(announcement.is_pinned ? 'Đã bỏ ghim thông báo' : 'Đã ghim thông báo');
        } catch (error: unknown) {
            if (error instanceof AxiosError && error.response?.status === 403) {
                toast.error('Bạn không có quyền thực hiện thao tác này');
            } else {
                toast.error('Không thể thực hiện thao tác');
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-8 w-1.5 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Thông báo lớp học
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-medium ml-4">
                        Quản lý các bài đăng và thông báo quan trọng cho sinh viên trong lớp.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingAnnouncement(null);
                        setIsDialogOpen(true);
                    }}
                    className="rounded-lg h-12 px-6 font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Plus className="mr-2 size-5" />
                    Đăng thông báo
                </Button>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    [1, 2, 3].map((i) => (
                        <Card key={i} className="border-none shadow-sm bg-background/40 backdrop-blur-md rounded-lg overflow-hidden">
                            <CardHeader className="p-6 pb-2">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-2 space-y-4">
                                <Skeleton className="h-7 w-3/4" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : announcements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-muted/20 rounded-xl border-2 border-dashed border-border/50 backdrop-blur-sm">
                        <div className="h-24 w-24 rounded-full bg-background flex items-center justify-center mb-8 shadow-xl border border-border/40">
                            <Megaphone className="h-10 w-10 text-primary animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-3">Chưa có thông báo nào</h3>
                        <p className="text-muted-foreground max-w-md font-medium text-lg">
                            Bắt đầu kết nối với lớp học bằng cách đăng thông báo đầu tiên của bạn.
                        </p>
                        <Button
                            variant="link"
                            onClick={() => setIsDialogOpen(true)}
                            className="mt-4 text-primary font-bold uppercase tracking-widest"
                        >
                            Tạo bài đăng ngay
                        </Button>
                    </div>
                ) : (
                    announcements.map((announcement) => (
                        <Card
                            key={announcement.id}
                            className={`group border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-lg bg-background/60 backdrop-blur-md overflow-hidden relative ${announcement.is_pinned ? 'ring-2 ring-primary/20' : ''
                                }`}
                        >
                            {announcement.is_pinned && (
                                <div className="absolute top-0 right-12 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-b-lg flex items-center gap-1 shadow-sm">
                                    <Pin className="size-3 fill-current" />
                                    Đã ghim
                                </div>
                            )}

                            <CardHeader className="p-6 pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                                            <AvatarImage src={announcement.teacher.user.avatar || ''} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-black">
                                                {announcement.teacher.user.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                                                {announcement.teacher.user.name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(announcement.created_at), {
                                                    addSuffix: true,
                                                    locale: vi,
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/5">
                                            <MoreVertical className="size-5 text-muted-foreground" />
                                        </Button>}>

                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-lg border-border/40 shadow-xl">
                                            <DropdownMenuItem
                                                onClick={() => togglePin(announcement)}
                                                className="rounded-lg gap-2 font-bold text-xs uppercase tracking-widest py-2.5"
                                            >
                                                {announcement.is_pinned ? (
                                                    <>
                                                        <PinOff className="size-4" />
                                                        Bỏ ghim
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pin className="size-4" />
                                                        Ghim bài viết
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setEditingAnnouncement(announcement);
                                                    setIsDialogOpen(true);
                                                }}
                                                className="rounded-lg gap-2 font-bold text-xs uppercase tracking-widest py-2.5"
                                            >
                                                <Pencil className="size-4 text-amber-500" />
                                                Chỉnh sửa
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setAnnouncementToDelete(announcement.id)}
                                                className="rounded-lg gap-2 font-bold text-xs uppercase tracking-widest py-2.5 text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="size-4" />
                                                Xóa bài đăng
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 pt-4">
                                <h3 className="text-xl font-black text-foreground mb-4 leading-tight group-hover:translate-x-1 transition-transform">
                                    {announcement.title}
                                </h3>
                                <div
                                    className="text-muted-foreground leading-relaxed text-[15px] font-medium prose prose-sm dark:prose-invert max-w-none prose-headings:font-black prose-p:mb-4"
                                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                                />
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <AnnouncementForm
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setEditingAnnouncement(null);
                }}
                onSuccess={handleCreateOrUpdateSuccess}
                editingAnnouncement={editingAnnouncement}
                classId={parseInt(classId)}
            />

            <AlertDialog open={!!announcementToDelete} onOpenChange={() => setAnnouncementToDelete(null)}>
                <AlertDialogContent className="rounded-xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black">Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-muted-foreground">
                            Hành động này không thể hoàn tác. Thông báo này sẽ bị xóa vĩnh viễn khỏi lớp học.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-lg font-bold uppercase tracking-widest h-11">
                            Hủy bỏ
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-lg bg-destructive text-white hover:bg-destructive/90 font-bold uppercase tracking-widest h-11"
                        >
                            {isDeleting ? 'Đang xóa...' : 'Xóa thông báo'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
