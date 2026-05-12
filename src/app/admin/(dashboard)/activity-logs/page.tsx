"use client"

import { cn } from "@/lib/utils";
interface ActivityLog {
  id: number;
  log_name: string;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  subject_name: string | null;
  causer_type: string;
  causer_id: number;
  causer_name: string;
  causer_avatar: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any;
  action: string;
  created_at: string;
}

import {
  Activity,
  Calendar,
  Filter,
  History,
  RefreshCw,
  Search,
  User
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermission } from "@/hooks/use-permission";
import api from "@/lib/axios";
import Image from "next/image";
import { useRouter } from "next/navigation";

const actionColors: Record<string, string> = {
  "tạo mới": "bg-green-500/10 text-green-600 border-green-200",
  "cập nhật": "bg-blue-500/10 text-blue-600 border-blue-200",
  "xóa": "bg-red-500/10 text-red-600 border-red-200",
  "mặc định": "bg-slate-500/10 text-slate-600 border-slate-200",
}

export default function ActivityLogsPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền truy cập
  React.useEffect(() => {
    if (!hasPermission("activity_log_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [action, setAction] = React.useState("all")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  const [items, setItems] = React.useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(15)
  const [totalItems, setTotalItems] = React.useState(0)
  const [lastPage, setLastPage] = React.useState(1)

  const fetchLogs = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams({
        search: search,
        action: action === "all" ? "" : action,
        start_date: startDate,
        end_date: endDate,
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })

      const response = await api.get(`/admin/activity-logs?${queryParams}`)

      if (response.status === 200) {
        const result = response.data
        setItems(result.data || [])
        setTotalItems(result.meta?.total || 0)
        setLastPage(result.meta?.last_page || 1)
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error)
      setError("Không thể tải danh sách hoạt động")
      toast.error("Không thể tải danh sách hoạt động")
    } finally {
      setIsLoading(false)
    }
  }, [search, action, startDate, endDate, currentPage, pageSize])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs()
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchLogs])

  const resetFilters = () => {
    setSearch("")
    setAction("all")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }

  const getActionColor = (actionStr: string) => {
    const lowerAction = actionStr.toLowerCase()
    for (const [key, color] of Object.entries(actionColors)) {
      if (lowerAction.includes(key)) return color
    }
    return actionColors["mặc định"]
  }

  return (
    <div className="flex flex-col gap-6 p-1 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <History className="size-5" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Nhật ký hoạt động
            </h2>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Theo dõi và kiểm tra tất cả các hành động của người dùng trên toàn hệ thống.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs()}
          disabled={isLoading}
          className="bg-background shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md overflow-visible">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mô tả, tên người dùng..."
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={action} onValueChange={(val) => setAction(val || "all")}>
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <SelectValue placeholder="Hành động" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hành động</SelectItem>
                <SelectItem value="tạo mới">Tạo mới</SelectItem>
                <SelectItem value="cập nhật">Cập nhật</SelectItem>
                <SelectItem value="xóa">Xóa</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 lg:col-span-3">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Từ ngày"
                />
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="Đến ngày"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:bg-muted"
                onClick={resetFilters}
                title="Đặt lại bộ lọc"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <div className="rounded-xl border bg-background shadow-xl overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[80px] text-center font-semibold py-4">ID</TableHead>
                <TableHead className="font-semibold py-4 min-w-[150px]">Thời gian</TableHead>
                <TableHead className="font-semibold py-4">Người thực hiện</TableHead>
                <TableHead className="font-semibold py-4">Hành động</TableHead>
                <TableHead className="font-semibold py-4 min-w-[300px]">Mô tả chi tiết</TableHead>
                <TableHead className="font-semibold py-4">Đối tượng tác động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn(isLoading && items.length > 0 && "opacity-50 transition-opacity duration-300")}>
              {isLoading && items.length === 0 ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-destructive">
                      <History className="h-12 w-12 opacity-50" />
                      <p className="font-medium">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchLogs}>Thử lại</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <History className="h-12 w-12 opacity-20" />
                      <div className="space-y-1">
                        <p className="text-lg font-medium">Chưa có hoạt động nào được ghi lại</p>
                        <p className="text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm của bạn.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors">
                    <TableCell className="py-4 text-center">
                      <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.created_at.split(' ')[0]}</span>
                        <span className="text-xs text-muted-foreground">{item.created_at.split(' ')[1]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20 uppercase overflow-hidden shrink-0">
                          {item.causer_avatar ? (
                            <Image src={item.causer_avatar} alt={item.causer_name} className="size-full object-cover" />
                          ) : (
                            <User className="size-4" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{item.causer_name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={cn("shadow-none font-medium whitespace-nowrap", getActionColor(item.action))}
                      >
                        {item.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 max-w-[400px]">
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {item.description}
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                      {item.subject_name ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-primary">{item.subject_name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.subject_type?.split('\\').pop()}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4 text-sm text-muted-foreground border-t bg-muted/10 rounded-b-xl">
        <div className="flex items-center gap-4">
          <p>
            Hiển thị <strong>{items.length}</strong> / <strong>{totalItems}</strong> hoạt động
          </p>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Số hàng:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(parseInt(val || "15"))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-background">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            className="bg-background h-8 px-3"
          >
            Trước
          </Button>
          <div className="flex items-center gap-1">
            {(() => {
              const maxVisible = 5;
              let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              const end = Math.min(lastPage, start + maxVisible - 1);

              if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
              }

              const pages = [];
              for (let i = start; i <= end; i++) {
                if (i > 0) pages.push(i);
              }

              return pages.map((pageNum) => (
                <Button
                  key={`page-${pageNum}`}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-xs font-medium transition-all",
                    currentPage === pageNum && "shadow-md shadow-primary/20 scale-110"
                  )}
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={isLoading}
                >
                  {pageNum}
                </Button>
              ));
            })()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
            disabled={currentPage === lastPage || isLoading}
            className="bg-background h-8 px-3"
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}
