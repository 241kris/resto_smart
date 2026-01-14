"use client"

import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderOpen,
  QrCode,
  ShoppingCart,
  Store,
  LogOut,
  BarChart3,
  Package,
  Users,
  Calendar,
  ClipboardCheck,
  ShieldCheck,
  ChevronRight,
  Box,
  Sparkles
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/AuthContext"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOfflineSync } from "@/lib/hooks/useOfflineSync"

interface AppSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

// Organisation par sections pour une meilleure ergonomie
const navigationGroups = [
  {
    label: "Gestion",
    items: [
      { id: "analytics", label: "Inventaire", icon: Box }, // Renommé en Inventaire
      { id: "orders", label: "Commandes", icon: ShoppingCart },
      { id: "tables", label: "Tables & QR", icon: QrCode },
    ]
  },
  {
    label: "Catalogue",
    items: [
      { id: "products", label: "Produits", icon: UtensilsCrossed },
      { id: "categories", label: "Catégories", icon: FolderOpen },
      { id: "smart-menu", label: "Menu Intelligent", icon: Sparkles },
      { id: "restock-history", label: "Historique Stock", icon: Package },
    ]
  },
  {
    label: "Ressources Humaines",
    items: [
      { id: "employees", label: "Employés", icon: Users },
      { id: "schedules", label: "Plannings", icon: Calendar },
 
    ]
  },
  {
    label: "Configuration",
    items: [
      { id: "establishment", label: "Établissement", icon: Store },
    ]
  }
]

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  const { logout, user } = useAuth()
  const { isOnline } = useOfflineSync()

  const handleLogout = async () => {
    await logout()
  }

  const hasEstablishment = !!user?.establishmentId

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="bg-primary/5 hover:bg-primary/10 transition-colors rounded-2xl">
              <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <LayoutDashboard className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none ml-2">
                <span className="font-black tracking-tight text-lg">RestoSmart</span>
                <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Pro Panel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-4">
        {navigationGroups.map((group) => {
          // Filter items based on online status
          const visibleItems = isOnline
            ? group.items
            : group.items.filter(item => item.id === "products" || item.id === "orders")

          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentPage === item.id
                    const isDisabled = !hasEstablishment && item.id !== "establishment"

                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => !isDisabled && onPageChange(item.id)}
                          isActive={isActive}
                          disabled={isDisabled}
                          tooltip={item.label}
                          className={`
                            h-11 px-4 rounded-xl transition-all duration-200
                            ${isActive
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}
                          `}
                        >
                          <Icon className={`size-5 ${isActive ? "scale-110" : "opacity-70"}`} />
                          <span className="ml-2">{item.label}</span>

                          {isActive && <ChevronRight className="ml-auto size-4 animate-in slide-in-from-left-2" />}
                          {isDisabled && (
                            <Badge variant="outline" className="ml-auto border-none bg-slate-100 text-[10px] p-1">
                              🔒
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
        <SidebarMenu className="gap-4">
          {/* User Profile Info */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-inner font-black text-lg">
              {user?.email?.[0].toUpperCase() || "A"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-slate-900 dark:text-white">
                {user?.email?.split('@')[0] || "Administrateur"}
              </span>
              <div className="flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-500" />
                 
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-center items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 h-10">
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="h-10 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs"
            >
              <LogOut className="mr-2 h-4 w-4" />
       
            </Button>
          </div>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}