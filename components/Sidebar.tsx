"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderOpen,
  QrCode,
  ShoppingCart,
  Menu,
  X,
  Store,
  LogOut,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/AuthContext"
import Image from "next/image"

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

const menuItems = [
  { id: "analytics", label: "Statistiques", icon: BarChart3 },
  { id: "products", label: "Produits", icon: UtensilsCrossed },
  { id: "categories", label: "Catégories", icon: FolderOpen },
  { id: "tables", label: "Tables", icon: QrCode },
  { id: "orders", label: "Commandes", icon: ShoppingCart },
  { id: "establishment", label: "Établissement", icon: Store },
]

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { logout, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] z-40 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-8 w-8 text-[hsl(var(--primary))]" />
              <div>
                <h1 className="text-xl font-bold">RestoSmart</h1>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Admin Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                // Désactiver les boutons si pas d'établissement (sauf établissement)
                const hasEstablishment = !!user?.establishmentId
                const isDisabled = !hasEstablishment && item.id !== "establishment"

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        if (!isDisabled) {
                          onPageChange(item.id)
                          setIsOpen(false)
                        }
                      }}
                      disabled={isDisabled}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                        isActive
                          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                          : "hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]",
                        isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                      {isDisabled && (
                        <span className="ml-auto text-xs text-muted-foreground">🔒</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>



          {/* Footer */}
          <div className="p-4 border-t border-[hsl(var(--border))] space-y-2">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] font-semibold">
                {user?.email?.[0].toUpperCase() || "R"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email || "Admin"}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left hover:bg-destructive/10 text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
