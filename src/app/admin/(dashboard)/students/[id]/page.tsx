"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StudentDetailPage() {
    const router = useRouter()
    useEffect(() => {
        router.replace("/students")
    }, [router])
    return null
}
