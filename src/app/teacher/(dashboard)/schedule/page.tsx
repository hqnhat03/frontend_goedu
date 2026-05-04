"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ExternalLink, LayoutList, Plus, Table as TableIcon, Trash2, Video, X } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

const TIMES = Array.from({ length: 26 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7
  const minute = i % 2 === 0 ? "00" : "30"
  const startStr = `${hour.toString().padStart(2, "0")}:${minute}:00`

  const endMinute = minute === "00" ? "30" : "00"
  const endHour = minute === "30" ? hour + 1 : hour
  const endStr = `${endHour.toString().padStart(2, "0")}:${endMinute}:00`

  return {
    label: minute === "00" ? `${hour}:00` : "",
    start: startStr,
    end: endStr,
    index: i,
  }
})

interface ScheduleItem {
  id: number
  class_id: number
  date: string
  start_time: string
  end_time: string
  status: string
  class_code: string
  meeting_url?: string
}

export default function SchedulePage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = React.useState<"week" | "day">("week")
  const [loading, setLoading] = React.useState(false)
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([])

  const fetchSchedules = React.useCallback(async () => {
    setLoading(true)
    try {
      let endpoint = `/teacher/schedules/week?date=${format(date || new Date(), "yyyy-MM-dd")}`
      if (viewMode === "day" && date) {
        endpoint = `/teacher/schedules/day?date=${format(date, "yyyy-MM-dd")}`
      }

      const response = await api.get(endpoint)
      if (response?.data?.success) {
        setSchedules(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
    } finally {
      setLoading(false)
    }
  }, [viewMode, date])

  const handleDeleteSession = async (id: number) => {
    try {
      const response = await api.delete(`/teacher/schedules/sessions/${id}`)
      if (response.data.success) {
        toast.success("Xóa buổi học thành công")
        fetchSchedules()
      }
    } catch (error) {
      toast.error("Không thể xóa buổi học")
      console.error("Delete error:", error)
    }
  }

  React.useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const weekDays = React.useMemo(() => {
    if (!date) return []
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i))
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      setViewMode("day")
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    if (!date) return
    const amount = viewMode === 'week' ? 7 : 1
    const newDate = addDays(date, direction === 'next' ? amount : -amount)
    setDate(newDate)
  }

  const goToToday = () => {
    setDate(new Date())
  }

  const getDayLabel = (date: Date) => {
    const day = date.getDay()
    if (day === 0) return "Chủ nhật"
    return `Thứ ${day + 1}`
  }

  const timeToIndex = (tStr: string) => {
    const [h, m] = tStr.split(':').map(Number)
    return (h - 7) * 2 + (m >= 30 ? 1 : 0)
  }

  const getSessionAt = (day: Date, timeIndex: number) => {
    return schedules.find(s => {
      if (!isSameDay(parseISO(s.date), day)) return false
      const startIdx = timeToIndex(s.start_time)
      const endIdx = timeToIndex(s.end_time) - 1
      return timeIndex >= startIdx && timeIndex <= endIdx
    })
  }

  const renderWeekView = () => {
    return (
      <div className="w-full overflow-x-auto border border-border/40 rounded-xl shadow-sm bg-background/50">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-muted/40 border-b border-border/40">
            <div className="p-3 text-[10px] font-black uppercase text-center text-muted-foreground flex items-center justify-center border-r border-border/40">
              Giờ
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-3 text-xs font-bold text-center border-l first:border-l-0 border-border/40",
                  isSameDay(day, new Date()) ? "text-primary bg-primary/5" : "text-foreground"
                )}
              >
                <div className="flex flex-col items-center">
                  <span>{getDayLabel(day)}</span>
                  <span className="text-[10px] font-medium opacity-60 mt-0.5">{format(day, "dd/MM")}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col select-none relative">
            {TIMES.map((time, rowIdx) => (
              <div key={time.start} className="grid grid-cols-[80px_repeat(7,1fr)] border-b last:border-0 border-border/10 hover:bg-muted/5 transition-colors">
                <div className="p-2 text-[10px] font-bold text-center text-muted-foreground/60 flex items-center justify-center border-r border-border/40 bg-muted/10 h-[40px]">
                  {time.label}
                </div>
                {weekDays.map((day) => {
                  const session = getSessionAt(day, rowIdx)
                  const isStart = session && timeToIndex(session.start_time) === rowIdx
                  const isPrevSelected = rowIdx > 0 && !!getSessionAt(day, rowIdx - 1)
                  const isNextSelected = rowIdx < TIMES.length - 1 && !!getSessionAt(day, rowIdx + 1)

                  return (
                    <div
                      key={`${day.toISOString()}-${time.start}`}
                      className={cn(
                        "relative border-l border-border/10 flex flex-col items-stretch",
                        session ? "bg-primary/5 px-1" : "p-1",
                        session && !isPrevSelected && "pt-1",
                        session && !isNextSelected && "pb-1",
                      )}
                    >
                      {session ? (
                        <div
                          className={cn(
                            "w-full h-full min-h-[30px] shadow-sm transition-all duration-300 flex flex-col items-center justify-center overflow-hidden relative",
                            session.status === 'scheduled' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                            !isPrevSelected && "rounded-t-lg",
                            !isNextSelected && "rounded-b-lg shadow-md",
                            "group/session cursor-pointer hover:brightness-110"
                          )}
                          onClick={() => {
                            setDate(day)
                            setViewMode("day")
                          }}
                        >
                          {isStart && (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger render={
                                  <Button
                                    className="absolute top-0.5 right-0.5 p-1 rounded-md bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover/session:opacity-100 transition-opacity z-10"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <X className="size-2.5" />
                                  </Button>
                                }
                                />
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Xác nhận xóa buổi học?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Hành động này không thể hoàn tác. Buổi học của lớp <strong>{session.class_code}</strong> vào lúc {session.start_time} sẽ bị xóa khỏi lịch.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleDeleteSession(session.id)}
                                    >
                                      Xác nhận xóa
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <div className="px-1 text-center animate-in fade-in zoom-in duration-300">
                                <span className="block text-[10px] font-black truncate max-w-full uppercase tracking-tighter">
                                  {session.class_code}
                                </span>
                                <span className="block text-[8px] font-medium opacity-80 whitespace-nowrap">
                                  {session.start_time.slice(0, 5)}-{session.end_time.slice(0, 5)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-md border border-transparent" />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    return (
      <div className="space-y-4 max-w-3xl mx-auto py-2">
        {schedules.length > 0 ? (
          schedules.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row items-stretch gap-0 sm:gap-4 rounded-xl border border-border/40 bg-background/50 hover:border-primary/40 transition-all shadow-sm overflow-hidden group">
              <div className="flex flex-row sm:flex-col items-center justify-center sm:min-w-[120px] p-4 bg-muted/20 sm:border-r border-border/20 gap-3 sm:gap-1">
                <span className="text-lg font-bold text-primary">{item.start_time.slice(0, 5)}</span>
                <div className="hidden sm:block w-8 h-[2px] bg-primary/20 my-1 rounded-full" />
                <span className="text-sm font-medium text-muted-foreground">{item.end_time.slice(0, 5)}</span>
              </div>
              <div className="flex-1 p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xl group-hover:text-primary transition-colors">{item.class_code}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock className="size-4" /> {item.start_time} - {item.end_time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === 'scheduled' ? 'default' : 'outline'} className="px-3 py-1">
                      {item.status === 'scheduled' ? 'Đang lên lịch' : item.status}
                    </Badge>

                    <AlertDialog>
                      <AlertDialogTrigger>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa buổi học?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa buổi học của lớp <strong>{item.class_code}</strong> vào ngày {format(parseISO(item.date), "dd/MM/yyyy")}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeleteSession(item.id)}
                          >
                            Xác nhận xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
                    <div className="p-2 rounded-md bg-background shadow-sm text-primary">
                      <Video className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Lớp học trực tuyến</span>
                      {item.meeting_url ? (
                        <a
                          href={item.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          Vào lớp học
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground/40 italic">Chưa có link</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center border border-dashed rounded-2xl border-border/60 bg-muted/5">
            <div className="p-4 rounded-full bg-muted/50 mb-4 animate-pulse">
              <CalendarIcon className="size-10 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">Không có lịch dạy trong ngày này</p>
            <Button variant="link" onClick={() => setViewMode("week")} className="mt-2 text-xs font-bold uppercase tracking-widest">Quay lại xem theo tuần</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-12 min-h-[calc(100vh-140px)]">
      <div className="md:col-span-4 lg:col-span-3 space-y-6">
        <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/10">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" />
              Lịch dạy của tôi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex justify-center pb-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md border-none w-full"
              showOutsideDays={false}
            />
          </CardContent>
        </Card>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Plus className="size-12 rotate-45" />
          </div>
          <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2 relative z-10">
            <Plus className="size-4" /> Thêm lịch dạy bù
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed relative z-10">Bạn có thể tạo yêu cầu dạy bù hoặc ghi chú lịch họp chuyên môn tại đây.</p>
          <Button variant="outline" size="sm" className="w-full mt-4 h-8 text-[11px] font-bold border-primary/20 hover:bg-primary/5 relative z-10">
            Tạo yêu cầu mới
          </Button>
        </div>
      </div>

      <div className="md:col-span-8 lg:col-span-9">
        <Card className="border-none shadow-md bg-background/60 backdrop-blur-sm min-h-full flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/10 pb-6">
            <div className="space-y-1 w-full sm:w-auto text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-2 py-0.5 text-[10px]">Cá nhân</Badge>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{viewMode === "week" ? "Week View" : "Day View"}</span>
              </div>
              <CardTitle className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Thời khóa biểu chi tiết
              </CardTitle>
              <CardDescription className="text-sm font-medium flex items-center gap-2 justify-center sm:justify-start">
                <Clock className="size-3" />
                {viewMode === "week" ? "Toàn bộ lịch dạy trong tuần" : `Lịch trình ngày ${date ? format(date, "dd/MM/yyyy") : ""}`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/20 shadow-inner">
              <div className="flex items-center gap-1 pr-2 border-r border-border/20 mr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-background"
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-[11px] font-bold hover:bg-background"
                  onClick={goToToday}
                >
                  HÔM NAY
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-background"
                  onClick={() => navigateDate('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant={viewMode === "week" ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 px-4 gap-2 font-bold text-[11px] transition-all ${viewMode === "week" ? "shadow-sm" : ""}`}
                onClick={() => setViewMode("week")}
              >
                <TableIcon className="h-3.5 w-3.5" />
                XEM THEO TUẦN
              </Button>
              <Button
                variant={viewMode === "day" ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 px-4 gap-2 font-bold text-[11px] transition-all ${viewMode === "day" ? "shadow-sm" : ""}`}
                onClick={() => setViewMode("day")}
              >
                <LayoutList className="h-3.5 w-3.5" />
                XEM THEO NGÀY
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 sm:p-6 overflow-hidden">
            {loading ? (
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 border rounded-xl overflow-hidden">
                  <div className="h-10 bg-muted/40 border-b" />
                  {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-10 bg-muted/40 border-b border-l" />)}
                  {Array.from({ length: 80 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-none border-b border-l bg-muted/20" />)}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 p-4 sm:p-0">
                {viewMode === "week" ? renderWeekView() : renderDayView()}
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t border-border/10 flex items-center justify-between text-[11px] text-muted-foreground/60">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><div className="size-2 rounded-full bg-primary" /> Tiết dạy</span>
              <span className="flex items-center gap-1"><div className="size-2 rounded-full bg-muted-foreground/30" /> Trống</span>
            </div>
            <div>Cập nhật: {format(new Date(), "HH:mm dd/MM/yyyy")}</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
