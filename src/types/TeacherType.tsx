export interface Teacher {
    id: number | string
    name: string
    email: string
    phone: string
    address?: string
    gender?: string
    nationality?: string
    expertise?: string
    experience?: string
    target_student?: string
    status: "active" | "inactive"
    date_of_birth?: string
    avatar?: string | null
    bio?: string
}
