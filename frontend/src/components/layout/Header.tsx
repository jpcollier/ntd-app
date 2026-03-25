"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Train } from "lucide-react"

const navigation = [
  { name: "Explore Data", href: "/explore" },
  { name: "API Builder", href: "/api-builder" },
  { name: "API Docs", href: "/api-docs" },
  { name: "Glossary", href: "/glossary" },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 mr-8">
          <Train className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">NTD Ridership Data</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium px-3 py-1.5 rounded-md transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
