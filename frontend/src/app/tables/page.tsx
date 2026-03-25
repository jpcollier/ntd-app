"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function TablesRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", "table")
    router.replace(`/explore?${params.toString()}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
