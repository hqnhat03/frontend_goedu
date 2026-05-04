"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EditGuardianPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/guardians");
  }, [router]);

  return null;
}
