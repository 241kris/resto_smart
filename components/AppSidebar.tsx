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

interface AppSidebarProps {
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

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  // Désactiver les boutons si pas d'établissement (sauf établissement)
  const hasEstablishment = !!user?.establishmentId

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboard className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">RestoSmart</span>
                <span className="text-xs">Admin Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                const isDisabled = !hasEstablishment && item.id !== "establishment"

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        if (!isDisabled) {
                          onPageChange(item.id)
                        }
                      }}
                      isActive={isActive}
                      disabled={isDisabled}
                      tooltip={item.label}
                    >
                      <Icon />
                      <span>{item.label}</span>
                      {isDisabled && <span className="ml-auto text-xs">🔒</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* User Profile */}
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="font-semibold">{user?.email?.[0].toUpperCase() || "R"}</span>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium text-sm truncate">{user?.email || "Admin"}</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Theme Toggle */}
          <SidebarMenuItem>
            <div className="px-2 py-1">
              <ThemeToggle />
            </div>
          </SidebarMenuItem>

          {/* Logout Button */}
          <SidebarMenuItem>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
