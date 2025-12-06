"use client"

import { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import Sidebar from "@/components/Sidebar"
import ProductsPage from "@/components/ProductsPage"
import CategoriesPage from "@/components/CategoriesPage"
import TablesPage from "@/components/TablesPage"
import OrdersPage from "@/components/OrdersPage"
import EstablishmentPage from "@/components/EstablishmentPage"
import AuthPage from "@/components/AuthPage"

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState("products")

  const renderPage = () => {
    switch (currentPage) {
      case "products":
        return <ProductsPage />
      case "categories":
        return <CategoriesPage />
      case "tables":
        return <TablesPage />
      case "orders":
        return <OrdersPage />
      case "establishment":
        return <EstablishmentPage />
      default:
        return <ProductsPage />
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
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="lg:pl-64 p-6 mx-3 lg:p-8">
        {renderPage()}
      </main>
    </div>
  )
}
