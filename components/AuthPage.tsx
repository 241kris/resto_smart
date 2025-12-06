"use client"

import { useState } from "react"
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useAuth } from "@/lib/AuthContext"

export default function AuthPage() {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("") // Réinitialiser l'erreur lors de la saisie
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (isLogin) {
        // Connexion
        const result = await login(formData.email, formData.password)
        if (!result.success) {
          setError(result.error || "Erreur de connexion")
        }
      } else {
        // Inscription
        if (formData.password.length < 5) {
          setError("Le mot de passe doit contenir au moins 5 caractères")
          setIsLoading(false)
          return
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Les mots de passe ne correspondent pas")
          setIsLoading(false)
          return
        }
        const result = await register(formData.email, formData.password)
        if (!result.success) {
          setError(result.error || "Erreur d'inscription")
        }
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({ email: "", password: "", confirmPassword: "" })
    setError("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))]/10 via-[hsl(var(--background))] to-[hsl(var(--primary))]/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24">
            <Image
              src="/logo.png"
              alt="RestoSmart Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? "Connexion" : "Inscription"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Connectez-vous à votre compte RestoSmart"
                : "Créez votre compte RestoSmart"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Message d'erreur */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  Adresse e-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="votre.email@exemple.fr"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={5}
                  disabled={isLoading}
                />
              </div>

              {/* Confirm Password Field (only for registration) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={5}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? "Chargement..." : (isLogin ? "Se connecter" : "S'inscrire")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
              </p>
              <Button
                variant="link"
                onClick={toggleMode}
                className="text-[hsl(var(--primary))] font-semibold"
              >
                {isLogin ? "Créer un compte" : "Se connecter"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-8">
          © 2025 RestoSmart. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
