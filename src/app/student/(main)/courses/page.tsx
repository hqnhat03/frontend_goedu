"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { AxiosError } from "axios"
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useState } from "react"
import { Course, CourseCard } from "./_components/CourseCard"
import { FilterSidebar, FilterState } from "./_components/FilterSidebar"

interface MetaData {
   total: number
   per_page: number
   current_page: number
   last_page: number
}

const initialFilters: FilterState = {
   keyword: "",
   level_id: [],
   subject_id: [],
}

export default function CoursesPage() {
   return (
      <Suspense fallback={<CoursesSkeleton />}>
         <CoursesContent />
      </Suspense>
   )
}

function CoursesContent() {
   const [courses, setCourses] = useState<Course[]>([])
   const [meta, setMeta] = useState<MetaData | null>(null)
   const [isLoading, setIsLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)

   const router = useRouter()
   const pathname = usePathname()
   const searchParams = useSearchParams()

   // URL params state
   const [filters, setFilters] = useState<FilterState>(initialFilters)
   const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters)
   const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
   const [sortBy, setSortBy] = useState("newest")
   const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

   const fetchCourses = useCallback(async () => {
      try {
         setIsLoading(true)
         setError(null)

         const params: Record<string, string | number> = {
            page: currentPage,
         }

         if (appliedFilters.keyword) params.keyword = appliedFilters.keyword
         if (appliedFilters.level_id && appliedFilters.level_id.length > 0) {
            params.level_id = appliedFilters.level_id.join(',')
         }
         if (appliedFilters.subject_id && appliedFilters.subject_id.length > 0) {
            params.subject_id = appliedFilters.subject_id.join(',')
         }

         if (sortBy !== "newest") params.sort = sortBy

         const response = await api.get("/student/courses", { params })

         if (response.data.success) {
            setCourses(response.data.data)
            setMeta(response.data.meta)
         } else {
            setError("Không thể tải dữ liệu khóa học.")
         }
      } catch (err: unknown) {
         if (err instanceof AxiosError) {
            setError(err.response?.data?.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại.")
         }
      } finally {
         setIsLoading(false)
      }
   }, [appliedFilters, currentPage, sortBy])

   useEffect(() => {
      const page = Number(searchParams.get("page")) || 1
      if (page !== currentPage) {
         setCurrentPage(page)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [searchParams])

   useEffect(() => {
      fetchCourses()
   }, [fetchCourses, currentPage])

   const handleApplyFilters = () => {
      setAppliedFilters(filters)
      setCurrentPage(1)
      setIsMobileFiltersOpen(false)
   }

   const handleResetFilters = () => {
      setFilters(initialFilters)
      setAppliedFilters(initialFilters)
      setCurrentPage(1)
      setIsMobileFiltersOpen(false)
   }

   const handlePageChange = (newPage: number) => {
      if (newPage > 0 && meta && newPage <= meta.last_page) {
         setCurrentPage(newPage)
         const params = new URLSearchParams(searchParams.toString())
         params.set("page", newPage.toString())
         router.push(`${pathname}?${params.toString()}`, { scroll: false })
         window.scrollTo({ top: 0, behavior: "smooth" })
      }
   }

   return (
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
         {/* Page Header */}
         <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
               Khám phá khóa học
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
               Tìm kiếm khóa học hoàn hảo để nâng cao kỹ năng của bạn. Lọc theo môn học, cấp độ và giá cả để tìm thấy chính xác những gì bạn cần.
            </p>
         </div>

         <div className="flex flex-col md:flex-row gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-72 shrink-0">
               <div className="sticky top-24 border rounded-xl p-6 bg-card shadow-sm">
                  <h2 className="font-semibold text-lg mb-6 border-b pb-4">Bộ lọc</h2>
                  <FilterSidebar
                     filters={filters}
                     setFilters={setFilters}
                     onApply={handleApplyFilters}
                     onReset={handleResetFilters}
                  />
               </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
               {/* Toolbar */}
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b">
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                     {/* Mobile Filter Trigger */}
                     <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
                        <SheetTrigger render={() => (
                           <Button variant="outline" className="md:hidden flex items-center gap-2">
                              <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
                           </Button>
                        )}>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto pt-10">
                           <h2 className="font-semibold text-lg mb-6 border-b pb-4">Bộ lọc</h2>
                           <FilterSidebar
                              filters={filters}
                              setFilters={setFilters}
                              onApply={handleApplyFilters}
                              onReset={handleResetFilters}
                           />
                        </SheetContent>
                     </Sheet>

                     <div className="text-sm text-muted-foreground">
                        {isLoading ? (
                           <Skeleton className="h-5 w-32" />
                        ) : (
                           <span>Hiển thị <span className="font-semibold text-foreground">{meta?.total || 0}</span> khóa học</span>
                        )}
                     </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                     <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sắp xếp theo</span>
                     <Select value={sortBy} onValueChange={(v) => { setSortBy(v ?? "newest"); setCurrentPage(1) }}>
                        <SelectTrigger className="w-full sm:w-[160px] bg-background">
                           <SelectValue placeholder="Sắp xếp..." />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="newest">Mới nhất</SelectItem>
                           <SelectItem value="popular">Phổ biến nhất</SelectItem>
                           <SelectItem value="price-asc">Giá: Thấp đến Cao</SelectItem>
                           <SelectItem value="price-desc">Giá: Cao đến Thấp</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               {/* Content Grid */}
               {error && (
                  <div className="p-6 text-center border text-destructive bg-destructive/10 rounded-lg">
                     {error}
                  </div>
               )}

               {!error && isLoading ? (
                  <div className="flex flex-col gap-6">
                     {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-0 border rounded-xl overflow-hidden bg-card shadow-sm sm:h-[180px]">
                           <Skeleton className="h-48 sm:h-full w-full sm:w-[320px] shrink-0 rounded-none" />
                           <div className="p-4 flex flex-col flex-grow w-full">
                              <Skeleton className="h-7 w-3/4 mb-3" />
                              <Skeleton className="h-5 w-1/4 mb-4" />
                              <Skeleton className="h-5 w-1/2 mb-auto" />
                              <div className="mt-4 pt-4 border-t flex justify-between">
                                 <Skeleton className="h-6 w-24" />
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : !error && courses.length === 0 ? (
                  <div className="py-20 text-center border border-dashed rounded-xl bg-card/50 px-4">
                     <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2">Không tìm thấy khóa học nào</h3>
                     <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Chúng tôi không tìm thấy khóa học nào phù hợp với bộ lọc hiện tại của bạn. Hãy thử điều chỉnh hoặc đặt lại bộ lọc.
                     </p>
                     <Button onClick={handleResetFilters}>Xóa tất cả bộ lọc</Button>
                  </div>
               ) : (
                  <div className="space-y-10">
                     <div className="flex flex-col gap-6">
                        {courses.map((course) => (
                           <CourseCard key={course.id} course={course} />
                        ))}
                     </div>

                     {/* Pagination */}
                     {meta && meta.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-6 border-t">
                           <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                           >
                              <ChevronLeft className="w-4 h-4" />
                           </Button>

                           <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, meta.last_page) }).map((_, idx) => {
                                 // Logic to handle centered pages
                                 let pageNum = idx + 1;
                                 if (meta.last_page > 5) {
                                    if (currentPage > 3 && currentPage < meta.last_page - 1) {
                                       pageNum = currentPage - 2 + idx;
                                    } else if (currentPage >= meta.last_page - 1) {
                                       pageNum = meta.last_page - 4 + idx;
                                    }
                                 }

                                 return (
                                    <Button
                                       key={pageNum}
                                       variant={currentPage === pageNum ? "default" : "outline"}
                                       size="icon"
                                       onClick={() => handlePageChange(pageNum)}
                                       className={currentPage === pageNum ? "pointer-events-none" : ""}
                                    >
                                       {pageNum}
                                    </Button>
                                 )
                              })}
                           </div>

                           <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === meta.last_page}
                           >
                              <ChevronRight className="w-4 h-4" />
                           </Button>
                        </div>
                     )}
                  </div>
               )}
            </main>
         </div>
      </div>
   )
}

function CoursesSkeleton() {
   return (
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
         <div className="mb-8 md:mb-12">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-full max-w-2xl" />
         </div>
         <div className="flex flex-col md:flex-row gap-8">
            <aside className="hidden md:block w-72 shrink-0">
               <Skeleton className="h-[400px] w-full rounded-xl" />
            </aside>
            <main className="flex-1">
               <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-40" />
               </div>
               <div className="flex flex-col gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                     <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
                  ))}
               </div>
            </main>
         </div>
      </div>
   )
}
