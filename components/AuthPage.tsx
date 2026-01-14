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
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password)
        if (!result.success) setError(result.error || "Erreur de connexion")
      } else {
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
        if (!result.success) setError(result.error || "Erreur d'inscription")
      }
    } catch (err) {
      setError("Une erreur est survenue.")
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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      
      {/* LOGO EN ARRIÈRE-PLAN (FULL PAGE) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] sm:opacity-[0.05]">
        <div className="relative w-[100%] h-[100%] ">
          <Image
            src="/logo.png"
            alt=""
            fill
            className="object-contain "
            priority
          />
        </div>
      </div>

      {/* FORMULAIRE D'AUTHENTIFICATION */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Petit logo au-dessus de la carte pour le rappel de marque */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16 drop-shadow-sm">
            <Image
              src="/logo.png"
              alt="RestoSmart"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <Card className="shadow-2xl border-muted/50 backdrop-blur-sm bg-background/80">
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
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="nom@exemple.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="pl-10"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base font-semibold transition-all active:scale-[0.98]" disabled={isLoading}>
                {isLoading ? "Chargement..." : (isLogin ? "Se connecter" : "S'inscrire")}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Nouveau sur RestoSmart ?" : "Déjà un compte ?"}
              </p>
              <Button
                variant="link"
                onClick={toggleMode}
                className="mt-1 font-bold text-primary underline-offset-4 hover:underline"
              >
                {isLogin ? "Créer un compte maintenant" : "Se connecter à mon compte"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8 uppercase tracking-widest opacity-60">
          © 2026 RestoSmart • Système de Gestion
        </p>
      </div>
    </div>
  )
}