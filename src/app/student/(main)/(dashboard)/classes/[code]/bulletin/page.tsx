'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Clock, Megaphone } from 'lucide-react';
import { use, useEffect, useState } from 'react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  user?: {
    name: string;
    avatar: string | null;
  };
}

export default function BulletinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/student/classes/${code}/announcements`);
        if (response.data.success) {
          setAnnouncements(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchAnnouncements();
    }
  }, [code]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-slate-100 shadow-sm overflow-hidden rounded-xl">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
        <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
          <Megaphone className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có thông báo nào</h3>
        <p className="text-slate-500 max-w-sm">
          Hiện tại chưa có bài đăng nào trên bảng tin của lớp học này. Các thông báo từ giáo viên sẽ xuất hiện tại đây.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-1 rounded-full bg-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bảng tin lớp học</h2>
          <p className="text-xs text-slate-500 font-medium">Cập nhật những thông báo mới nhất từ giáo viên</p>
        </div>
      </div>

      <div className="space-y-3">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="gap-0 group border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden rounded-xl bg-white">
            <CardHeader className="p-4 pb-2 border-b border-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={announcement.user?.avatar || ""} />
                    <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                      {announcement.user?.name.substring(0, 2).toUpperCase() || 'GV'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {announcement.user?.name || 'Giáo viên'}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true, locale: vi })}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">
                {announcement.title}
              </h3>
              <div
                className="text-slate-600 leading-relaxed whitespace-pre-line text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}