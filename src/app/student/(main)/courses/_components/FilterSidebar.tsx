"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/axios"
import { RefreshCcw, Search } from "lucide-react"
import React, { useEffect, useState } from "react"

export interface FilterState {
  keyword: string
  level_id: string[]
  subject_id: string[]
}

interface FilterSidebarProps {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  onApply: () => void
  onReset: () => void
  className?: string
}

export function FilterSidebar({
  filters,
  setFilters,
  onApply,
  onReset,
  className = ""
}: FilterSidebarProps) {
  const [levels, setLevels] = useState<{ id: number, level: string }[]>([])
  const [subjects, setSubjects] = useState<{ id: number, name: string, category: string }[]>([])

  const [isLoadingLevels, setIsLoadingLevels] = useState(false)
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingLevels(true)
        setIsLoadingSubjects(true)

        const [lvRes, subRes] = await Promise.all([
          api.get("/common/levels"),
          api.get("/common/subjects")
        ])

        if (lvRes.data.success) setLevels(lvRes.data.data)
        if (subRes.data.success) setSubjects(subRes.data.data)

      } catch (error) {
        console.error("Failed to fetch filter data:", error)
      } finally {
        setIsLoadingLevels(false)
        setIsLoadingSubjects(false)
      }
    }
    fetchData()
  }, [])

  const handleToggleFilter = (key: keyof FilterState, value: string, checked: boolean | string) => {
    setFilters(prev => {
      const current = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : []
      if (checked) {
        if (!current.includes(value)) current.push(value)
      } else {
        const index = current.indexOf(value)
        if (index > -1) current.splice(index, 1)
      }
      return { ...prev, [key]: current }
    })
  }



  return (
    <div className={`space-y-8 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Search className="w-4 h-4" /> Tìm kiếm
        </h3>
        <Input
          placeholder="Tìm kiếm khóa học..."
          value={filters.keyword}
          onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
          className="w-full bg-background"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onApply()
          }}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Môn học</h3>
        <div className="space-y-3">
          {isLoadingSubjects ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            subjects.map(subject => (
              <div key={subject.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`subject-${subject.id}`}
                  checked={filters.subject_id.includes(subject.id.toString())}
                  onCheckedChange={(checked) => handleToggleFilter('subject_id', subject.id.toString(), checked)}
                />
                <Label
                  htmlFor={`subject-${subject.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {subject.name}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>



      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Cấp độ</h3>
        <div className="space-y-3">
          {isLoadingLevels ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            levels.map(level => (
              <div key={level.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`level-${level.id}`}
                  checked={filters.level_id.includes(level.id.toString())}
                  onCheckedChange={(checked) => handleToggleFilter('level_id', level.id.toString(), checked)}
                />
                <Label
                  htmlFor={`level-${level.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {level.level}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>


      <div className="pt-6 flex flex-col gap-3 border-t">
        <Button onClick={onApply} className="w-full font-medium shadow-sm">
          Áp dụng bộ lọc
        </Button>
        <Button onClick={onReset} variant="outline" className="w-full font-medium">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Đặt lại
        </Button>
      </div>
    </div>
  )
}
