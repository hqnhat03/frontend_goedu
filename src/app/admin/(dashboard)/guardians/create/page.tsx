"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CreateGuardianPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/guardians");
  }, [router]);

  return null;
}
