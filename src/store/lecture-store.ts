import { create } from 'zustand'

interface Lecture {
  id: number
  name: string
  description?: string
  lecture_number: number
  status: 'draft' | 'published'
  created_at: string
  duration_time: number
  document_url?: string
  video_url: string
}

interface LectureStore {
  editingLecture: Lecture | null
  setEditingLecture: (lecture: Lecture | null) => void
}

export const useLectureStore = create<LectureStore>((set) => ({
  editingLecture: null,
  setEditingLecture: (lecture) => set({ editingLecture: lecture }),
}))
