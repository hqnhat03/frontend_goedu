import { useAuthStore } from "@/store/auth-store";

export const usePermission = () => {
  const { user } = useAuthStore();

  // Lấy danh sách permission từ user object
  // Nếu là super_admin (hoặc logic đặc biệt) có thể mặc định return true
  const permissions = user?.permissions || [];

  const hasPermission = (permission: string | string[]) => {
    // Nếu không có user thì chắc chắn không có quyền
    if (!user) return false;

    if (Array.isArray(permission)) {
      return permission.some((p) => permissions.includes(p));
    }
    return permissions.includes(permission);
  };

  return { hasPermission, permissions };
};
