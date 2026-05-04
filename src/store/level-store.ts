import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Level {
    id: string
    level: string
    education_level: string
    status: "draft" | "published" | "archived"
}

interface LevelState {
    editingLevel: Level | null
    setEditingLevel: (level: Level | null) => void
    clearEditingLevel: () => void
}

export const useLevelStore = create<LevelState>()(
    persist(
        (set) => ({
            editingLevel: null,
            setEditingLevel: (level) => set({ editingLevel: level }),
            clearEditingLevel: () => set({ editingLevel: null }),
        }),
        {
            name: "level-storage",
        }
    )
)
