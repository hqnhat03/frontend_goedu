'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePermission } from "@/hooks/use-permission";
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Book,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Key,
  Layers,
  LayoutDashboard,
  Lock,
  Newspaper,
  RefreshCw,
  Save,
  School,
  Search,
  Settings2,
  Shield,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  UserCircle,
  UserCog,
  Users
} from 'lucide-react';
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Role {
  id: number;
  name: string;
  permissions: string[];
}

interface PermissionData {
  roles: Role[];
  all_permissions: string[];
}

const GROUP_CONFIG: Record<string, { label: string; icon: React.ComponentType }> = {
  dashboard: { label: 'Bảng điều khiển', icon: LayoutDashboard },
  admin: { label: 'Quản trị viên', icon: UserCog },
  teacher: { label: 'Giáo viên', icon: Users },
  student: { label: 'Học sinh', icon: GraduationCap },
  course: { label: 'Khóa học', icon: BookOpen },
  class: { label: 'Lớp học', icon: School },
  news: { label: 'Tin tức', icon: Newspaper },
  grade: { label: 'Khối lớp', icon: Layers },
  subject: { label: 'Môn học', icon: Book },
  level: { label: 'Cấp độ', icon: TrendingUp },
  role: { label: 'Vai trò', icon: ShieldAlert },
  guardian: { label: 'Người giám hộ', icon: UserCircle },
  permission: { label: 'Phân quyền', icon: Key },
  student_in_course: { label: 'HS trong khóa', icon: UserCheck },
};

const ACTION_LABELS: Record<string, string> = {
  list: 'Xem',
  detail: 'C.tiết',
  create: 'Thêm',
  edit: 'Sửa',
  delete: 'Xóa',
  manage: 'Q.lý',
};

export default function PermissionsPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền truy cập trang phân quyền
  React.useEffect(() => {
    if (!hasPermission("permission_manage")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [data, setData] = useState<PermissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  // Local state for modified permissions
  const [rolePermissions, setRolePermissions] = useState<Record<number, string[]>>({});



  useEffect(() => {

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/admin/permissions');
        // Handle both old and new response structures
        let rawData: PermissionData;
        if (response.data.data.roles && response.data.data.all_permissions) {
          rawData = response.data.data;
        } else {
          // Fallback to deriving all_permissions from roles if needed
          const roles = response.data.data;
          const allPermissionsSet = new Set<string>();
          roles.forEach((r: Role) => r.permissions.forEach((p: string) => allPermissionsSet.add(p)));
          rawData = {
            roles,
            all_permissions: Array.from(allPermissionsSet)
          };
        }

        setData(rawData);

        // Initialize local state
        const initialPermissions: Record<number, string[]> = {};
        rawData.roles.forEach(role => {
          initialPermissions[role.id] = [...role.permissions];
        });
        setRolePermissions(initialPermissions);

        if (rawData.roles.length > 0 && !selectedRole) {
          setSelectedRole(rawData.roles[0].id);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        toast.error('Không thể tải danh sách quyền');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePermission = (roleId: number, permission: string) => {
    // Prevent editing super_admin
    const role = data?.roles.find(r => r.id === roleId);
    if (role?.name === 'super_admin') {
      toast.error('Không thể chỉnh sửa quyền của Super Admin');
      return;
    }

    setRolePermissions(prev => {
      const current = prev[roleId] || [];
      if (current.includes(permission)) {
        return { ...prev, [roleId]: current.filter(p => p !== permission) };
      } else {
        return { ...prev, [roleId]: [...current, permission] };
      }
    });
  };

  const handleSave = async (roleId: number) => {
    setSaving(roleId);
    try {
      const role = data?.roles.find(r => r.id === roleId);
      if (!role) return;

      const response = await api.put(`/admin/roles/${roleId}`, {
        name: role.name,
        permissions: rolePermissions[roleId]
      });

      if (response.data.success) {
        toast.success(`Cập nhật quyền cho vai trò ${role.name} thành công`);
        // Update original data state to reflect changes and remove "dirty" state
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            roles: prev.roles.map(r =>
              r.id === roleId ? { ...r, permissions: rolePermissions[roleId] } : r
            )
          };
        });
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Lỗi khi cập nhật quyền');
    } finally {
      setSaving(null);
    }
  };

  const isRoleDirty = (roleId: number) => {
    if (!data) return false;
    const originalRole = data.roles.find(r => r.id === roleId);
    if (!originalRole) return false;

    const current = rolePermissions[roleId] || [];
    if (current.length !== originalRole.permissions.length) return true;

    return !current.every(p => originalRole.permissions.includes(p));
  };

  // Grouping logic
  const groupedPermissions = useMemo(() => {
    if (!data) return [];

    const actions = ['list', 'detail', 'create', 'edit', 'delete', 'manage'];
    const groups: Record<string, string[]> = {};

    data.all_permissions.forEach(perm => {
      let groupKey = 'other';

      // Match dashboard and permission_manage specifically
      if (perm === 'dashboard') groupKey = 'dashboard';
      else if (perm === 'permission_manage') groupKey = 'permission';
      else {
        for (const action of actions) {
          if (perm.endsWith(`_${action}`)) {
            groupKey = perm.replace(`_${action}`, '');
            break;
          }
        }
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(perm);
    });

    return Object.entries(groups)
      .map(([key, perms]) => ({
        key,
        config: GROUP_CONFIG[key] || { label: key, icon: Settings2 },
        permissions: perms.sort()
      }))
      .filter(group =>
        group.config.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.permissions.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => a.config.label.localeCompare(b.config.label));
  }, [data, searchQuery]);

  const getActionFromPerm = (perm: string) => {
    const actions = ['list', 'detail', 'create', 'edit', 'delete', 'manage'];
    for (const action of actions) {
      if (perm.endsWith(`_${action}`)) return action;
    }
    if (perm === 'dashboard') return 'list';
    if (perm === 'permission_manage') return 'manage';
    return 'manage';
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Phân quyền hệ thống
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Quản lý quyền truy cập và chức năng cho từng vai trò người dùng trong hệ thống.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={fetchData}
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md hover:bg-slate-50 transition-all duration-300"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {/* Sidebar Roles */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-800/50">
            <CardHeader className="pb-3 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Vai trò
                </CardTitle>
                <ShieldAlert className="w-4 h-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="flex flex-col gap-1">
                {data?.roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-300 group",
                      selectedRole === role.id
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        selectedRole === role.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                      )}>
                        {role.name === 'super_admin' ? <Lock className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-sm capitalize">
                        {role.name.replace('_', ' ')}
                      </span>
                    </div>
                    {isRoleDirty(role.id) && (
                      <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permissions Content */}
        <div className="md:col-span-3 lg:col-span-4 space-y-6">
          <Card className="border-none shadow-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-3xl overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-800/20">
            <CardHeader className="pb-0 pt-8 px-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
                      {data?.roles.find(r => r.id === selectedRole)?.name.replace('_', ' ')}
                    </h2>
                    {data?.roles.find(r => r.id === selectedRole)?.name === 'super_admin' && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        ReadOnly
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Tùy chỉnh chi tiết quyền hạn cho vai trò này.
                  </CardDescription>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Tìm kiếm quyền..."
                      className="pl-10 rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {selectedRole && isRoleDirty(selectedRole) && (
                    <Button
                      onClick={() => handleSave(selectedRole)}
                      disabled={saving === selectedRole}
                      className="rounded-xl shadow-lg shadow-primary/25 px-6 animate-in zoom-in duration-300"
                    >
                      {saving === selectedRole ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Lưu thay đổi
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4 text-sm font-medium text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{rolePermissions[selectedRole || 0]?.length || 0} quyền đã cấp</span>
                </div>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>{data?.all_permissions.length || 0} quyền tổng cộng</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="w-[300px] pl-8 py-4 font-semibold text-slate-600 dark:text-slate-300">Chức năng / Màn hình</TableHead>
                      <TableHead className="py-4 font-semibold text-slate-600 dark:text-slate-300">Quyền hạn chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedPermissions.map((group) => (
                      <TableRow key={group.key} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 border-slate-100 dark:border-slate-800 transition-colors">
                        <TableCell className="pl-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                              <group.config.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{group.config.label}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-500 font-mono mt-0.5">{group.key}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="pr-8 ">
                          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-2 pr-4">
                            {group.permissions.map(perm => {
                              const action = getActionFromPerm(perm);
                              const isChecked = rolePermissions[selectedRole || 0]?.includes(perm);
                              const isReadOnly = data?.roles.find(r => r.id === selectedRole)?.name === 'super_admin';

                              return (
                                <label
                                  key={perm}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer group",
                                    isChecked
                                      ? "bg-primary/5 border-primary/20 ring-1 ring-primary/5 shadow-sm"
                                      : "bg-transparent border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-none",
                                    isReadOnly && "cursor-not-allowed opacity-80"
                                  )}
                                >
                                  <Checkbox
                                    id={perm}
                                    checked={isChecked}
                                    onCheckedChange={() => handleTogglePermission(selectedRole || 0, perm)}
                                    disabled={isReadOnly}
                                    className={cn(
                                      "rounded-md w-5 h-5 transition-all",
                                      isChecked ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className={cn(
                                      "text-sm font-medium transition-colors",
                                      isChecked ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900"
                                    )}>
                                      {ACTION_LABELS[action] || action}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono hidden lg:block uppercase tracking-tight">
                                      {perm.split('_').pop()}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {groupedPermissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Search className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Không tìm thấy quyền phù hợp</p>
                            <p className="text-sm">Vui lòng kiểm tra lại từ khóa tìm kiếm</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 flex gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full h-fit mt-0.5">
              <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300">Lưu ý về bảo mật</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                Các thay đổi về quyền hạn sẽ có hiệu lực ngay lập tức đối với người dùng đang đăng nhập.
                Hãy cẩn thận khi điều chỉnh quyền <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded font-bold">permission_manage</code> và các vai trò quan trọng như <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded font-bold">admin</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
