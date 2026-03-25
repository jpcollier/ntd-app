"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function TablesRedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", "table")
    router.replace(`/explore?${params.toString()}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function TablesRedirect() {
  return (
    <Suspense>
      <TablesRedirectInner />
    </Suspense>
  )
}
