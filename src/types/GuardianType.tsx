import { type Student } from "@/types/StudentType"

export interface Guardian {
    id: number | string
    name: string
    email: string
    phone: string
    address?: string
    gender?: "male" | "female" | "other"
    status: "active" | "inactive"
    date_of_birth?: string
    avatar?: string | null
    students?: Pick<Student, "id" | "name" | "email">[]
}
