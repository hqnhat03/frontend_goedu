"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns"
import { vi } from "date-fns/locale"
import { BookOpen, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ExternalLink, LayoutList, MapPin, Table as TableIcon, Video } from "lucide-react"
import * as React from "react"

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
    course_name?: string
    teacher_name?: string
    room_name?: string
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
            // Assuming student endpoints follow same pattern as teacher
            let endpoint = `/student/schedules/week?date=${format(date || new Date(), "yyyy-MM-dd")}`
            if (viewMode === "day" && date) {
                endpoint = `/student/schedules/day?date=${format(date, "yyyy-MM-dd")}`
            }

            const response = await api.get(endpoint)
            if (response?.data?.success) {
                setSchedules(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch schedules:", error)
            // Fallback to empty if API fails for now, or could use dummy data for "design" phase
            // toast.error("Không thể tải lịch học")
        } finally {
            setLoading(false)
        }
    }, [viewMode, date])

    React.useEffect(() => {
        fetchSchedules()
    }, [fetchSchedules])

    const weekDays = React.useMemo(() => {
        if (!date) return []
        const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i))
    }, [date])

    const classColors = React.useMemo(() => {
        const colorNames = [
            "blue", "emerald", "violet", "amber",
            "rose", "indigo", "cyan", "orange",
            "lime", "pink", "teal", "fuchsia",
            "sky", "yellow", "red", "green"
        ]
        const map: Record<string, string> = {}
        let colorIdx = 0
        schedules.forEach(s => {
            if (!map[s.class_code]) {
                map[s.class_code] = colorNames[colorIdx % colorNames.length]
                colorIdx++
            }
        })
        return map
    }, [schedules])

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
            <div className="w-full overflow-x-auto border border-slate-200 rounded-lg shadow-sm bg-white">
                <div className="min-w-[640px]">
                    <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] bg-slate-50/50 border-b border-slate-200">
                        <div className="p-3 text-[10px] font-black uppercase text-center text-slate-400 flex items-center justify-center border-r border-slate-200">
                            Giờ
                        </div>
                        {weekDays.map((day) => (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "p-3 text-xs font-bold text-center border-l first:border-l-0 border-slate-200",
                                    isSameDay(day, new Date()) ? "text-blue-600 bg-blue-50/50" : "text-slate-600"
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
                            <div key={time.start} className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] hover:bg-slate-50/30 transition-colors">
                                <div className="p-1.5 text-[11px] font-black text-center text-slate-400 flex items-center justify-center border-r border-slate-200 bg-slate-50/20 h-[34px] border-b border-slate-100/50">
                                    {time.label}
                                </div>
                                {weekDays.map((day) => {
                                    const session = getSessionAt(day, rowIdx)
                                    const isStart = session && timeToIndex(session.start_time) === rowIdx
                                    const isEnd = session && timeToIndex(session.end_time) - 1 === rowIdx
                                    const isPrevSelected = rowIdx > 0 && !!getSessionAt(day, rowIdx - 1)
                                    const isNextSelected = rowIdx < TIMES.length - 1 && !!getSessionAt(day, rowIdx + 1)

                                    return (
                                        <div
                                            key={`${day.toISOString()}-${time.start}`}
                                            className={cn(
                                                "relative border-l border-slate-100/50 flex flex-col items-stretch",
                                                session ? "bg-blue-50/30 px-1" : "p-1",
                                                session && !isPrevSelected && "pt-1",
                                                session && !isNextSelected && "pb-1",
                                                !isNextSelected ? "border-b border-slate-100/50" : "border-b border-transparent"
                                            )}
                                        >
                                            {session ? (
                                                <div
                                                    className={cn(
                                                        "w-full h-full min-h-[26px] transition-all duration-300 flex flex-col items-center justify-between overflow-hidden relative py-0.5",
                                                        `bg-${classColors[session.class_code] || "blue"}-600`,
                                                        "text-white shadow-sm",
                                                        !isPrevSelected && "rounded-t-md",
                                                        !isNextSelected && "rounded-b-md shadow-md",
                                                        "group/session cursor-pointer hover:brightness-110"
                                                    )}
                                                    onClick={() => {
                                                        setDate(day)
                                                        setViewMode("day")
                                                    }}
                                                >
                                                    {isStart ? (
                                                        <span className="block text-[9px] font-bold opacity-90 whitespace-nowrap truncate w-full text-center px-1">
                                                            {session.start_time.slice(0, 5)}-{session.end_time.slice(0, 5)}
                                                        </span>
                                                    ) : <div />}

                                                    {isEnd && (
                                                        <span className="block text-[10px] font-black truncate w-full uppercase tracking-tight text-center px-1">
                                                            {session.class_code}
                                                        </span>
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
            <div className="space-y-4 max-w-[614px] mx-auto py-2">
                {schedules.length > 0 ? (
                    schedules.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item) => {
                        const color = classColors[item.class_code] || "blue"
                        return (
                            <div key={item.id} className={cn(
                                "flex flex-col sm:flex-row items-stretch gap-0 sm:gap-4 rounded-lg border border-slate-200 bg-white transition-all shadow-sm overflow-hidden group",
                                `hover:border-${color}-400`
                            )}>
                                <div className="flex flex-row sm:flex-col items-center justify-center sm:min-w-[140px] p-6 bg-slate-50/50 sm:border-r border-slate-100 gap-4 sm:gap-1">
                                    <span className={cn("text-2xl font-black", `text-${color}-600`)}>{item.start_time.slice(0, 5)}</span>
                                    <div className={cn("hidden sm:block w-8 h-[2px] my-2 rounded-full", `bg-${color}-200`)} />
                                    <span className="text-sm font-bold text-slate-400">{item.end_time.slice(0, 5)}</span>
                                </div>
                                <div className="flex-1 p-6 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn(`bg-${color}-50 text-${color}-600 border-${color}-200`, "text-[10px] uppercase font-bold px-2 py-0")}>Lớp học</Badge>
                                                <h4 className={cn("font-bold text-xl text-slate-900 transition-colors uppercase tracking-tight", `group-hover:text-${color}-600`)}>{item.class_code}</h4>
                                            </div>
                                            {item.course_name && <p className="text-sm font-medium text-slate-500">{item.course_name}</p>}
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 pt-1">
                                                <span className="flex items-center gap-1.5"><Clock className="size-4" /> {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</span>
                                                {item.teacher_name && <span className="flex items-center gap-1.5"><BookOpen className="size-4" /> GV: {item.teacher_name}</span>}
                                                {item.room_name && <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {item.room_name}</span>}
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-3 py-1 text-xs font-bold">
                                            {item.status === 'scheduled' ? 'Sắp diễn ra' : item.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 pt-2">
                                        {item.meeting_url ? (
                                            <a
                                                href={item.meeting_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={cn(
                                                    "flex items-center gap-4 p-4 rounded-md text-white shadow-lg transition-all active:scale-[0.98]",
                                                    `bg-${color}-600 shadow-${color}-200 hover:bg-${color}-700`
                                                )}
                                            >
                                                <div className="p-2 rounded bg-white/20">
                                                    <Video className="size-5" />
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[10px] uppercase font-bold opacity-80 tracking-widest">Học trực tuyến qua Zoom/Google Meet</span>
                                                    <span className="text-sm font-bold">Vào lớp học ngay</span>
                                                </div>
                                                <ExternalLink className="size-5 opacity-60" />
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-4 p-4 rounded-md bg-slate-50 border border-slate-100 text-slate-400">
                                                <div className="p-2 rounded bg-slate-200/50">
                                                    <Video className="size-5" />
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Lớp học trực tuyến</span>
                                                    <span className="text-sm font-bold italic">Link học chưa sẵn sàng</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-slate-200 bg-slate-50/50">
                        <div className="p-6 rounded-full bg-white shadow-sm mb-4">
                            <CalendarIcon className="size-12 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold text-lg">Hôm nay bạn không có lịch học</p>
                        <p className="text-slate-400 text-sm mt-1">Hãy tận dụng thời gian để ôn tập kiến thức nhé!</p>
                        <Button variant="outline" onClick={() => setViewMode("week")} className="mt-6 rounded-md border-slate-200 text-xs font-black uppercase tracking-widest px-6 h-10 hover:bg-white hover:text-blue-600">Duyệt lịch theo tuần</Button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="grid gap-8 md:grid-cols-12 min-h-[calc(100vh-140px)] animate-in fade-in duration-700">
            <div className="md:col-span-4 lg:col-span-3 space-y-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
                    <CardHeader className="pb-4 border-b border-slate-50">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                            <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                                <CalendarIcon className="size-4" />
                            </div>
                            Lịch học của tôi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            className="rounded-xl border-none w-full"
                            showOutsideDays={false}
                            locale={vi}
                        />
                    </CardContent>
                </Card>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 p-8 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
                    <h4 className="text-lg font-black mb-3 flex items-center gap-2 relative z-10">
                        Trợ giúp học tập
                    </h4>
                    <p className="text-xs text-blue-100 leading-relaxed mb-6 font-medium relative z-10">Bạn gặp vấn đề về lịch học hoặc cần yêu cầu học bù? Liên hệ ngay với bộ phận giáo vụ.</p>
                    <Button variant="secondary" className="w-full h-11 rounded-lg text-[11px] font-black uppercase tracking-widest bg-white text-blue-600 hover:bg-blue-50 border-none relative z-10 shadow-lg">
                        GỬI YÊU CẦU HỖ TRỢ
                    </Button>
                </div>
            </div>

            <div className="md:col-span-8 lg:col-span-9">
                <Card className="border-none shadow-sm bg-white min-h-full flex flex-col rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8 pt-8 pb-6 border-b border-slate-50">
                        <div className="space-y-1.5 w-full sm:w-auto text-center sm:text-left">
                            <div className="flex items-center gap-3 justify-center sm:justify-start">
                                <Badge className="bg-blue-600 text-white border-none px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">Học sinh</Badge>
                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{viewMode === "week" ? "Week View" : "Day View"}</span>
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
                                Thời khóa biểu
                            </CardTitle>
                            <CardDescription className="text-sm font-bold text-slate-500 flex items-center gap-2 justify-center sm:justify-start">
                                <Clock className="size-4 text-blue-500" />
                                {viewMode === "week" ? "Lịch học chi tiết trong tuần" : `Lịch trình ngày ${date ? format(date, "dd/MM/yyyy") : ""}`}
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100 shadow-inner">
                            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-md hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                    onClick={() => navigateDate('prev')}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-4 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                    onClick={goToToday}
                                >
                                    Hôm nay
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-md hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                    onClick={() => navigateDate('next')}
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant={viewMode === "week" ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-9 px-4 gap-2 font-black text-[10px] uppercase tracking-widest rounded-md transition-all",
                                        viewMode === "week" ? "bg-white text-blue-600 shadow-md hover:bg-white" : "hover:bg-white hover:text-blue-600"
                                    )}
                                    onClick={() => setViewMode("week")}
                                >
                                    <TableIcon className="h-4 w-4" />
                                    Theo tuần
                                </Button>
                                <Button
                                    variant={viewMode === "day" ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-9 px-4 gap-2 font-black text-[10px] uppercase tracking-widest rounded-md transition-all",
                                        viewMode === "day" ? "bg-white text-blue-600 shadow-md hover:bg-white" : "hover:bg-white hover:text-blue-600"
                                    )}
                                    onClick={() => setViewMode("day")}
                                >
                                    <LayoutList className="h-4 w-4" />
                                    Theo ngày
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-5 sm:p-6">
                        {loading ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-0 border border-slate-100 rounded-xl overflow-hidden">
                                    <div className="h-9 bg-slate-50/50 border-b border-slate-100" />
                                    {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-9 bg-slate-50/50 border-b border-l border-slate-100" />)}
                                    {Array.from({ length: 56 }).map((_, i) => <Skeleton key={i} className="h-[34px] w-full rounded-none border-b border-l border-slate-50/50 bg-slate-20/20" />)}
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {viewMode === "week" ? renderWeekView() : renderDayView()}
                            </div>
                        )}
                    </CardContent>

                    <div className="px-8 py-5 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" /> Giờ học tập</span>
                            <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-slate-100" /> Thời gian trống</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                            Cập nhật: {format(new Date(), "HH:mm dd/MM/yyyy")}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}