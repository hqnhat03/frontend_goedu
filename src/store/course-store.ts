import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Course {
  id: number | string
  name: string
  status: "draft" | "published" | "archived"
  target_student: "all" | "student" | "employee"
  subject_id?: number | string
  level_id?: number | string
  subject_name?: string
  level_name?: string
  thumbnail?: string
  price?: number
  old_price?: number
  full_price?: number
  description?: string
  created_at?: string
  updated_at?: string
}

interface CourseState {
  editingCourse: Course | null
  setEditingCourse: (course: Course | null) => void
  clearEditingCourse: () => void
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set) => ({
      editingCourse: null,
      setEditingCourse: (course) => set({ editingCourse: course }),
      clearEditingCourse: () => set({ editingCourse: null }),
    }),
    {
      name: "course-storage",
    }
  )
)
