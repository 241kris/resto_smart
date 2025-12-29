"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/AuthContext"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Separator } from "@/components/ui/separator"
import AnalyticsPage from "@/components/AnalyticsPage"
import ProductsPage from "@/components/ProductsPage"
import CategoriesPage from "@/components/CategoriesPage"
import TablesPage from "@/components/TablesPage"
import OrdersPage from "@/components/OrdersPage"
import RestockHistoryPage from "@/components/RestockHistoryPage"
import EmployeesPage from "@/components/EmployeesPage"
import SchedulesPage from "@/components/SchedulesPage"
import AttendancePage from "@/components/AttendancePage"
import EstablishmentPage from "@/components/EstablishmentPage"
import AuthPage from "@/components/AuthPage"

const menuItems = [
  { id: "analytics", label: "Statistiques" },
  { id: "products", label: "Produits" },
  { id: "categories", label: "Catégories" },
  { id: "tables", label: "Tables" },
  { id: "orders", label: "Commandes" },
  { id: "restock-history", label: "Historique Stock" },
  { id: "employees", label: "Employés" },
  { id: "schedules", label: "Plannings" },
  { id: "attendance", label: "Pointages" },
  { id: "establishment", label: "Établissement" },
]

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [currentPage, setCurrentPage] = useState("analytics")

  // Forcer la redirection vers Établissement si pas d'établissement
  useEffect(() => {
    if (isAuthenticated && !isLoading && !user?.establishmentId) {
      setCurrentPage("establishment")
    }
  }, [isAuthenticated, isLoading, user])

  const renderPage = () => {
    switch (currentPage) {
      case "analytics":
        return <AnalyticsPage />
      case "products":
        return <ProductsPage />
      case "categories":
        return <CategoriesPage />
      case "tables":
        return <TablesPage />
      case "orders":
        return <OrdersPage />
      case "restock-history":
        return <RestockHistoryPage />
      case "employees":
        return <EmployeesPage />
      case "schedules":
        return <SchedulesPage />
      case "attendance":
        return <AttendancePage />
      case "establishment":
        return <EstablishmentPage />
      default:
        return <AnalyticsPage />
    }
  }

  // Afficher un loader pendant la vérification de la session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--primary))] mx-auto"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))]">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si non authentifié, afficher la page d'authentification
  if (!isAuthenticated) {
    return <AuthPage />
  }

  // Si authentifié, afficher l'interface admin
  return (
    <SidebarProvider>
      <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg">
              {menuItems.find(item => item.id === currentPage)?.label || "RestoSmart"}
            </h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          {/* Message d'alerte si pas d'établissement */}
          {!user?.establishmentId && (
            <div className="mb-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Créez votre établissement pour continuer
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    Vous devez d'abord créer un établissement pour accéder aux produits, catégories, tables et commandes.
                  </p>
                </div>
              </div>
            </div>
          )}
          {renderPage()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
