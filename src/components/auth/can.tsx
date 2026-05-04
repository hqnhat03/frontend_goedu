"use client"

import * as React from "react"
import { usePermission } from "@/hooks/use-permission"

interface CanProps {
  permission: string | string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Component dùng để bọc các UI cần kiểm tra quyền truy cập.
 * 
 * @example
 * <Can permission="student_create">
 *   <Button>Thêm học sinh</Button>
 * </Can>
 */
export const Can = ({ permission, children, fallback = null }: CanProps) => {
  const { hasPermission } = usePermission()

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
