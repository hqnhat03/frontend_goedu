"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Chrome, Github, Lock, LogIn, Mail, MoveLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";

const loginSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }).min(1, { message: "Vui lòng nhập email" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
  remember: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const rememberValue = watch("remember");

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Đăng nhập thành công!");

        if (result.data) {
          useAuthStore.getState().setAuth(result.data.user, result.data.access_token);

          // Lưu vào localStorage để hỗ trợ các components cũ
          localStorage.setItem("access_token", result.data.access_token);
          localStorage.setItem("user_info", JSON.stringify(result.data.user));

          // Lưu vào cookie thay vì localStorage để đồng bộ với Middleware và tránh flick
          const maxAge = 604800; // 7 days
          document.cookie = `access_token=${result.data.access_token}; path=/; max-age=${maxAge}; samesite=lax`;
          document.cookie = `user_info=${encodeURIComponent(JSON.stringify(result.data.user))}; path=/; max-age=${maxAge}; samesite=lax`;
        }

        // Chuyển sang trang dashboard
        router.push("/admin");
      } else {
        toast.error(result.message || "Đăng nhập thất bại");
        // Nếu có lỗi cụ thể cho từng field từ server
        if (result.errors && typeof result.errors === 'object') {
          Object.keys(result.errors).forEach((key) => {
            form.setError(key as keyof LoginFormValues, { message: result.errors[key][0] });
          });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* Left Side: Brand/Image Area */}
      <div className="relative hidden w-1/2 overflow-hidden bg-muted md:flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/login-bg.png"
            alt="GoEdu Workspace"
            fill
            className="object-cover transition-transform duration-[10000ms] hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>

        {/* Content on Image */}
        <div className="relative z-10 flex flex-col h-full p-12 text-white">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium transition-transform hover:-translate-x-1"
          >
            <MoveLeft className="size-4" />
            Về trang chủ
          </Link>

          <div className="mt-auto max-w-lg">
            <h1 className="text-6xl font-extrabold tracking-tight mb-4 drop-shadow-lg">GoEdu</h1>
            <p className="text-xl text-white/90 leading-relaxed font-light">
              Kiến tạo tương lai giáo dục.
              Hệ thống quản trị thông minh dành cho doanh nghiệp hiện đại.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex gap-6 items-center">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="size-10 rounded-full border-2 border-white/50 bg-slate-200 flex items-center justify-center overflow-hidden transition-transform hover:scale-110 hover:z-20 cursor-pointer"
                  >
                    <Image
                      src={`https://i.pravatar.cc/100?u=${i + 10}`}
                      alt="Avatar"
                      width={40}
                      height={40}
                      sizes="40px"
                    />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm text-white/80">
                  <span className="text-white font-bold text-lg">1,000+</span>
                </p>
                <p className="text-xs text-white/60">Quản trị viên đang tin dùng</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form Area */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full flex-col justify-center gap-8 sm:w-[420px]">
          <div className="flex flex-col gap-3 text-center md:text-left">
            <div className="md:hidden flex justify-center mb-4">
              <h1 className="text-3xl font-bold tracking-tight text-primary">GoEdu</h1>
            </div>
            <h2 className="text-4xl font-bold tracking-tight">Đăng nhập</h2>
            <p className="text-muted-foreground text-lg">
              Vui lòng nhập thông tin quản trị viên.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8">
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email" className="font-semibold text-sm ml-1">Email công việc</FieldLabel>
                <div className="relative group">
                  <div className="absolute left-3 top-3 transition-colors group-focus-within:text-primary">
                    <Mail className="size-5 text-muted-foreground pointer-events-none" />
                  </div>
                  <Input
                    {...register("email")}
                    id="email"
                    placeholder="admin@goedu.vn"
                    type="email"
                    disabled={isLoading}
                    className="pl-12 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                  />
                </div>
                <FieldError errors={[errors.email]} />
              </Field>

              <Field data-invalid={!!errors.password}>
                <div className="flex items-center justify-between ml-1">
                  <FieldLabel htmlFor="password" title="password" className="font-semibold text-sm">Mật khẩu</FieldLabel>
                  <Link
                    href="/admin/forgot-password"
                    className="text-xs font-semibold text-primary/80 hover:text-primary hover:underline transition-all"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-3 top-3 transition-colors group-focus-within:text-primary">
                    <Lock className="size-5 text-muted-foreground pointer-events-none" />
                  </div>
                  <Input
                    {...register("password")}
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="pl-12 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                  />
                </div>
                <FieldError errors={[errors.password]} />
              </Field>

              <div className="flex items-center gap-3 ml-1">
                <Checkbox
                  id="remember"
                  checked={rememberValue}
                  onCheckedChange={(checked) => setValue("remember", checked === true)}
                  className="size-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary transition-colors"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  Duy trì đăng nhập trong 30 ngày
                </label>
              </div>
            </FieldGroup>

            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="size-5 animate-spin rounded-full border-3 border-current border-t-transparent" />
                  Đang xác thực...
                </div>
              ) : (
                <>
                  <LogIn className="size-5 mr-2" />
                  Đăng nhập ngay
                </>
              )}
            </Button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium tracking-widest">
                Hoặc sử dụng
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full h-12 rounded-xl border-muted-foreground/20 hover:bg-muted/50 transition-all" disabled={isLoading}>
              <Chrome className="size-5 mr-2 text-[#4285F4]" />
              <span className="font-semibold">Google</span>
            </Button>
            <Button variant="outline" className="w-full h-12 rounded-xl border-muted-foreground/20 hover:bg-muted/50 transition-all" disabled={isLoading}>
              <Github className="size-5 mr-2" />
              <span className="font-semibold">Github</span>
            </Button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground font-medium">
              Chưa có mã truy cập?{" "}
              <Link href="/contact" className="text-primary font-bold hover:underline">
                Liên hệ hỗ trợ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
