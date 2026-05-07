'use client';

import { QuillEditor } from '@/components/quill-editor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Loader2, Megaphone, Save, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề').max(255),
  content: z.string().min(1, 'Vui lòng nhập nội dung'),
  is_pinned: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface Announcement {
  id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface AnnouncementFormProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (announcement: any) => void;
  editingAnnouncement: Announcement | null;
  classId: number;
}

export function AnnouncementForm({
  isOpen,
  onClose,
  onSuccess,
  editingAnnouncement,
  classId,
}: AnnouncementFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      is_pinned: false,
    },
  });

  useEffect(() => {
    if (editingAnnouncement) {
      form.reset({
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        is_pinned: editingAnnouncement.is_pinned,
      });
    } else {
      form.reset({
        title: '',
        content: '',
        is_pinned: false,
      });
    }
  }, [editingAnnouncement, form, isOpen]);

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      let response;

      if (editingAnnouncement) {
        response = await api.put(`/teacher/announcements/${editingAnnouncement.id}`, values);
      } else {
        response = await api.post(`/teacher/classes/${classId}/announcements`, values);
      }

      if (response.data) {
        onSuccess(response.data.data || response.data);
      }
    } catch (error: unknown) {
      console.error('Submission error:', error);
      if (error instanceof AxiosError && error.response?.status === 422) {
        toast.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else {
        toast.error('Có lỗi xảy ra khi thực hiện thao tác');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl rounded-xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-primary/5 p-8 pb-8 flex items-center gap-4 border-b border-primary/10">
          <div className="h-14 w-14 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Megaphone className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {editingAnnouncement ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
            </DialogTitle>
            <DialogDescription className="font-medium text-primary/60">
              {editingAnnouncement
                ? 'Cập nhật lại nội dung thông báo cho sinh viên.'
                : 'Đăng thông báo mới để sinh viên nhận được thông báo ngay lập tức.'}
            </DialogDescription>
          </div>
        </div>

        <div className="bg-background rounded-xl p-6 shadow-xl">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Field>
              <FieldLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Tiêu đề thông báo
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Ví dụ: Thông báo thi giữa kỳ..."
                  className="h-12 rounded-lg border-border/20 focus:ring-primary/20 bg-muted/30 font-bold"
                  {...form.register('title')}
                />
              </FieldContent>
              <FieldError errors={[{ message: form.formState.errors.title?.message }]} className="font-bold text-[11px]" />
            </Field>

            <Field>
              <FieldLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Nội dung chi tiết
              </FieldLabel>
              <FieldContent>
                <div className="rounded-lg overflow-hidden border border-border/20 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Controller
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <QuillEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Nhập nội dung thông báo tại đây..."
                        minHeight={250}
                      />
                    )}
                  />
                </div>
              </FieldContent>
              <FieldError errors={[{ message: form.formState.errors.content?.message }]} className="font-bold text-[11px]" />
            </Field>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/20">
              <div className="space-y-0.5">
                <FieldLabel className="text-sm font-black">Ghim thông báo</FieldLabel>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                  Bài viết sẽ luôn nằm ở đầu danh sách
                </p>
              </div>
              <Controller
                control={form.control}
                name="is_pinned"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-primary"
                  />
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 px-6 rounded-lg font-bold uppercase tracking-widest hover:bg-muted"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-8 rounded-lg font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="mr-2 size-5 animate-spin" />
                ) : editingAnnouncement ? (
                  <Save className="mr-2 size-5" />
                ) : (
                  <Send className="mr-2 size-5" />
                )}
                {editingAnnouncement ? 'Lưu thay đổi' : 'Đăng ngay'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
