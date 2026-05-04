"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CreateTeacherPage() {
    const router = useRouter()
    useEffect(() => {
        router.replace("/admin/teachers")
    }, [router])
    return null
}
