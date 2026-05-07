"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Globe, Settings as SettingsIcon, Shield, Smartphone, User } from "lucide-react"

const settingsSections = [
  {
    title: "Hồ sơ cá nhân",
    description: "Cập nhật thông tin cá nhân và ảnh đại diện của bạn.",
    icon: User,
  },
  {
    title: "Thông báo",
    description: "Quản lý cách bạn nhận được thông báo từ hệ thống.",
    icon: Bell,
  },
  {
    title: "Bảo mật",
    description: "Thay đổi mật khẩu và quản lý bảo mật tài khoản.",
    icon: Shield,
  },
  {
    title: "Thiết bị",
    description: "Quản lý các thiết bị đã đăng nhập vào hệ thống.",
    icon: Smartphone,
  },
  {
    title: "Ngôn ngữ & Khu vực",
    description: "Tùy chỉnh ngôn ngữ và định dạng thời gian.",
    icon: Globe,
  },
]

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary uppercase">
          <SettingsIcon className="size-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cài đặt tài khoản</h2>
          <p className="text-muted-foreground text-sm">Quản lý các thiết lập cho tài khoản giáo viên của bạn.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {settingsSections.map((section, i) => (
          <Card key={i} className="border-none shadow-sm bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center gap-4 py-4">
              <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <section.icon className="size-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-bold">{section.title}</CardTitle>
                <CardDescription className="text-xs">{section.description}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Chỉnh sửa
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button className="h-10 rounded-lg px-8 shadow-lg shadow-primary/20 font-bold">
          Lưu tất cả thay đổi
        </Button>
      </div>
    </div>
  )
}
