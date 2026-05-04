"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * The subject edit form has been moved to a drawer on the subjects listing page.
 * This page redirects users there automatically.
 */
export default function EditSubjectPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace("/admin/subjects")
    }, [router])

    return null
}
