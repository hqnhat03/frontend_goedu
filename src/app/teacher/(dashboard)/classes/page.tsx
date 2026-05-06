"use client"

import {
  BookOpen,
  Eye,
  Search
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"

interface Class {
  id: number;
  class_code: string;
  start_day: string;
  end_day: string;
  max_student: number;
  status: string;
  course_name: string;
  students_count: number;
}

export default function ClassesPage() {
  const [classes, setClasses] = React.useState<Class[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get("/teacher/classes/")
        if (response.data?.success) {
          setClasses(response.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

  const filteredClasses = classes.filter(cls =>
    cls.class_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.course_name.toLowerCase().includes(searchQuery.toLowerCase())
  )


  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">Đã xuất bản</Badge>
      case 'draft':
        return <Badge variant="outline" className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">Bản nháp</Badge>
      case 'archived':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">Đã đóng</Badge>
      default:
        return <Badge variant="outline" className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Quản lý lớp học</h2>
          <p className="text-muted-foreground text-sm font-medium">Danh sách các lớp học bạn đang phụ trách giảng dạy.</p>
        </div>
      </div>

      <div className="bg-background/40 p-4 rounded-2xl border border-border/40 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên khóa học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/40 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="w-[120px] font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Mã lớp</TableHead>
                <TableHead className="min-w-[200px] font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Khóa học</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4 text-center">Sĩ số</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Ngày bắt đầu</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Ngày kết thúc</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Trạng thái</TableHead>
                <TableHead className="w-[140px] text-right py-4 font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/20">
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <TableRow key={cls.id} className="group border-border/20 hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4">
                      <span className="text-sm font-bold text-foreground flex items-center h-full">
                        {cls.class_code}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">
                          {cls.course_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-bold">{cls.students_count}<span className="text-muted-foreground font-medium text-xs">/{cls.max_student}</span></span>
                        <div className="w-12 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              (cls.students_count / cls.max_student) > 0.8 ? "bg-orange-500" : "bg-primary"
                            )}
                            style={{ width: `${Math.min((cls.students_count / cls.max_student) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs font-bold text-muted-foreground">
                        {new Date(cls.start_day).toLocaleDateString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs font-bold text-muted-foreground">
                        {new Date(cls.end_day).toLocaleDateString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(cls.status)}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={
                              <Link href={`/classes/${cls.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5">
                                  <Eye className="size-4" />
                                </Button>
                              </Link>
                            } />
                            <TooltipContent>Xem chi tiết</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 rounded-full bg-muted/20">
                        <BookOpen className="size-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">Không tìm thấy lớp học nào</p>
                      <Button variant="link" onClick={() => setSearchQuery("")} className="text-xs font-bold uppercase tracking-widest h-auto p-0">
                        Xóa bộ lọc
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
