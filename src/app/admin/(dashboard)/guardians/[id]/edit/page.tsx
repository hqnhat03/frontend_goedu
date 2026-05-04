"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditGuardianPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/guardians");
  }, [router]);

  return null;
}
