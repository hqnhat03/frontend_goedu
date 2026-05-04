import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export const metadata = {
  title: "Đăng nhập Giảng viên | GoEdu",
  description: "Dành cho giảng viên quản lý lớp học và bài giảng tại GoEdu.",
};

export default function TeacherLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm role="teacher" />
    </Suspense>
  );
}
