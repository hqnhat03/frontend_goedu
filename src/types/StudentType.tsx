export interface Student {
    id: number | string
    name: string
    email: string
    phone: string
    address?: string
    gender?: "male" | "female" | "other"
    status: "active" | "inactive"
    date_of_birth?: string
    avatar?: string | null
    student_type: "student" | "employee"
    school?: string
    grade?: string
    work?: string
    position?: string
}
