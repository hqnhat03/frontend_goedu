'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bell, CheckCheck, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Notification {
    id: string;
    type: string;
    data: {
        title?: string;
        message?: string;
        body?: string;
        class_id?: string;
        class_code?: string;
        sender_name?: string;
        sender_image?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    read_at: string | null;
    created_at: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [pagination, setPagination] = useState<{
        current_page: number;
        last_page: number;
        total: number;
    } | null>(null);
    const router = useRouter();

    const fetchNotifications = async (page = 1, append = false) => {
        try {
            if (!append) setLoading(true);
            else setLoadingMore(true);

            const response = await api.get(`/notifications?page=${page}`);
            if (response.data.success) {
                const paginatedData = response.data.data;
                if (append) {
                    setNotifications(prev => [...prev, ...paginatedData.data]);
                } else {
                    setNotifications(paginatedData.data);
                }
                setPagination({
                    current_page: paginatedData.current_page,
                    last_page: paginatedData.last_page,
                    total: paginatedData.total,
                });
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast.error('Không thể tải thông báo');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleLoadMore = () => {
        if (pagination && pagination.current_page < pagination.last_page) {
            fetchNotifications(pagination.current_page + 1, true);
        }
    };

    const filteredNotifications = useMemo(() => {
        if (activeTab === 'unread') {
            return notifications.filter(n => !n.read_at);
        }
        return notifications;
    }, [notifications, activeTab]);

    const groupedNotifications = useMemo(() => {
        const groups: { [key: string]: Notification[] } = {
            'Hôm nay': [],
            'Hôm qua': [],
            'Cũ hơn': [],
        };

        filteredNotifications.forEach(n => {
            const date = new Date(n.created_at);
            if (isToday(date)) {
                groups['Hôm nay'].push(n);
            } else if (isYesterday(date)) {
                groups['Hôm qua'].push(n);
            } else {
                groups['Cũ hơn'].push(n);
            }
        });

        return groups;
    }, [filteredNotifications]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read_at) {
            try {
                await api.patch(`/notifications/${notification.id}/read`);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)
                );
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        // Navigation logic
        const data = notification.data;
        if (data.class_code) {
            router.push(`/student/classes/${data.class_code}`);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await api.post('/notifications/read-all');
            if (response.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
                toast.success('Đã đánh dấu tất cả là đã đọc');
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Thao tác thất bại');
        }
    };

    if (loading) {
        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-10 w-full" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Thông báo</h1>
                    <p className="text-slate-500 mt-1">Quản lý và cập nhật các thông tin mới nhất từ lớp học.</p>
                </div>
                {notifications.some(n => !n.read_at) && (
                    <Button
                        onClick={markAllAsRead}
                        variant="outline"
                        className="rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all font-bold"
                    >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Đọc tất cả
                    </Button>
                )}
            </div>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tabs defaultValue="all" onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="bg-slate-100/50 p-1 rounded-xl h-12">
                    <TabsTrigger
                        value="all"
                        className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold transition-all h-full"
                    >
                        Tất cả
                        <Badge variant="secondary" className="ml-2 bg-slate-200/50 text-slate-600 font-bold">
                            {notifications.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                        value="unread"
                        className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold transition-all h-full"
                    >
                        Chưa đọc
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-600 font-bold">
                            {notifications.filter(n => !n.read_at).length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="space-y-8">
                {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
                    groupNotifications.length > 0 && (
                        <div key={group} className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{group}</span>
                                <div className="h-px bg-slate-100 flex-1" />
                            </div>
                            <div className="grid gap-3">
                                {groupNotifications.map((notification) => (
                                    <Card
                                        key={notification.id}
                                        className={cn(
                                            "group cursor-pointer border-none transition-all duration-300 rounded-xl overflow-hidden",
                                            !notification.read_at
                                                ? "bg-gradient-to-br from-blue-50/50 to-white shadow-[0_4px_20px_-4px_rgba(37,99,235,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(37,99,235,0.15)] ring-1 ring-blue-100/50"
                                                : "bg-white hover:bg-slate-50/50 shadow-sm hover:shadow-md ring-1 ring-slate-100"
                                        )}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <CardContent className="p-3 sm:p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    <Avatar className="h-10 w-10 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                        <AvatarImage src={notification.data.sender_image} alt={notification.data.sender_name} />
                                                        <AvatarFallback className={cn(
                                                            "rounded-xl text-white font-bold text-xs",
                                                            !notification.read_at ? "bg-blue-600" : "bg-slate-300"
                                                        )}>
                                                            {notification.data.sender_name?.charAt(0) || 'G'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className={cn(
                                                                "text-xs font-black uppercase tracking-widest truncate",
                                                                !notification.read_at ? "text-blue-600" : "text-slate-400"
                                                            )}>
                                                                {notification.data.sender_name || 'Hệ thống'}
                                                            </span>
                                                            {notification.data.class_code && (
                                                                <Badge variant="outline" className="text-[9px] h-4 border-slate-200 bg-slate-50 text-slate-500 font-bold rounded-md px-1.5 uppercase shrink-0">
                                                                    {notification.data.class_code}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-tighter">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className={cn(
                                                            "text-sm truncate",
                                                            !notification.read_at ? "text-slate-900 font-bold" : "text-slate-600 font-medium"
                                                        )}>
                                                            {notification.data.title || notification.data.message || 'Thông báo mới'}
                                                        </span>
                                                        {!notification.read_at && (
                                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )
                ))}

                {pagination && pagination.current_page < pagination.last_page && (
                    <div className="flex justify-center pt-8">
                        <Button
                            variant="outline"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="rounded-xl px-8 h-12 font-bold border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang tải...
                                </>
                            ) : (
                                "Xem thêm thông báo"
                            )}
                        </Button>
                    </div>
                )}

                {filteredNotifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-blue-100 blur-3xl opacity-20 rounded-full scale-150 animate-pulse" />
                            <div className="relative h-32 w-32 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center rotate-3 ring-1 ring-slate-100">
                                <Bell className="h-14 w-14 text-slate-200 animate-bounce" />
                                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg ring-4 ring-white">
                                    <Clock className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Chưa có thông báo nào</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">
                            Khi có thông báo mới về lớp học, bài tập hoặc kết quả thi, chúng sẽ xuất hiện ở đây.
                        </p>
                        <Button
                            onClick={() => router.push('/student/dashboard')}
                            variant="outline"
                            className="mt-8 rounded-xl border-slate-200 font-bold hover:bg-slate-50"
                        >
                            Quay lại trang chủ
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
