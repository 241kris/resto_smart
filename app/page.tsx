"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/AuthContext"
import Sidebar from "@/components/Sidebar"
import ProductsPage from "@/components/ProductsPage"
import CategoriesPage from "@/components/CategoriesPage"
import TablesPage from "@/components/TablesPage"
import OrdersPage from "@/components/OrdersPage"
import EstablishmentPage from "@/components/EstablishmentPage"
import AuthPage from "@/components/AuthPage"

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [currentPage, setCurrentPage] = useState("products")

  // Forcer la redirection vers Établissement si pas d'établissement
  useEffect(() => {
    if (isAuthenticated && !isLoading && !user?.establishmentId) {
      setCurrentPage("establishment")
    }
  }, [isAuthenticated, isLoading, user])

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
        {/* Message d'alerte si pas d'établissement */}
        {!user?.establishmentId && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Créez votre établissement pour continuer
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Vous devez d'abord créer un établissement pour accéder aux produits, catégories, tables et commandes.
                </p>
              </div>
            </div>
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  )
}
