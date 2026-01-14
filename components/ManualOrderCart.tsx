"use client"

import { useState } from "react"
import {   Trash2,  Check, ArrowLeft, RotateCcw } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
 
import { useManualOrderCart } from "@/contexts/ManualOrderCartContext"
import { useTables } from "@/lib/hooks/useTables"
import { useOfflineSync } from "@/lib/hooks/useOfflineSync"
import { SyncProgressModal } from "@/components/SyncProgressModal"
import { toast } from "sonner"
import Image from "next/image"

export default function ManualOrderCart({ restaurantId, onBack }: { restaurantId: string; onBack: () => void }) {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalAmount } = useManualOrderCart()
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>("none")
  const [status, setStatus] = useState<'completed' | 'PAID'>('PAID')
  const [amountGiven, setAmountGiven] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { saveOrder, isSyncing, syncProgress, unsyncedCount } = useOfflineSync()
  const { data: tablesData } = useTables(restaurantId)
  const tables = tablesData?.tables || []

  const changeToReturn = amountGiven !== "" ? parseFloat(amountGiven) - totalAmount : 0

  const handleKeypadPress = (value: string) => {
    if (value === 'C') setAmountGiven("")
    else if (value === 'backspace') setAmountGiven(prev => prev.slice(0, -1))
    else {
      if (value === '.' && amountGiven.includes('.')) return
      setAmountGiven(prev => prev + value)
    }
  }

  const handleSubmit = async () => {
    if (items.length === 0) return toast.error("Le panier est vide")

    setIsSubmitting(true)
    try {
      await saveOrder({
        restaurantId,
        tableId: selectedTableId === 'none' ? undefined : selectedTableId,
        totalAmount,
        status,
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productPrice: item.product.price,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity
        }))
      })

      // Clear cart without restoring stock (order confirmed, stock already deducted)
      await clearCart(false)
      onBack()
    } catch (e) {
      console.error('Order submission error:', e)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* HEADER FIXE */}
      <header className="h-14 shrink-0 border-b flex items-center justify-between px-4 md:px-6 bg-card z-20">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <h2 className="text-sm md:text-lg font-bold truncate">Caisse</h2>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none">{totalItems}</Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => clearCart()}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Vider
        </Button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ZONE GAUCHE : TABLEAU (SCROLLABLE) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/5">
          <ScrollArea className="flex-1 px-2 md:px-4">
            <Table>
              <TableHeader className="bg-background/95 backdrop-blur sticky top-0 z-10 shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] md:w-[80px]">Item</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.product.id} className="text-xs md:text-sm">
                    <TableCell className="p-2">
                      <div className="relative h-10 w-10 md:h-12 md:w-12 rounded border bg-muted shrink-0">
                        <Image
                          src={(item.product as any).cachedImage || item.product.image || "/default.svg"}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized={(item.product as any).cachedImage?.startsWith('data:')}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[100px] md:max-w-none">
                      <p className="truncate">{item.product.name}</p>
                      <span className="text-[10px] text-muted-foreground">{item.product.price.toLocaleString()} FCFA</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1 md:gap-2">
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</Button>
                        <span className="font-bold min-w-[20px] text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {(item.product.price * item.quantity).toLocaleString()}
                    </TableCell>
                    <TableCell className="p-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.product.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Espace pour éviter que le bouton flottant cache le dernier item sur mobile */}
            <div className="h-32 lg:hidden" />
          </ScrollArea>
        </div>

        {/* SECTION DROITE : PAIEMENT (FIXE) */}
        <aside className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l bg-card flex flex-col z-10">
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[40vh] lg:max-h-none">
         

            {/* MONITORING PRIX */}
            <div className="bg-slate-900 rounded-xl p-3 md:p-4 text-white">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
                <span className="text-xl font-black tracking-tight">{totalAmount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-mono text-sm border-t border-slate-800 pt-2">
                <span className="text-[10px] text-slate-400 uppercase">Reçu:</span>
                <span>{amountGiven || "0"}</span>
              </div>
              <div className="flex justify-between items-center mt-1 font-bold text-sm">
                <span className="text-[10px] text-slate-400 uppercase">{changeToReturn >= 0 ? "Rendre:" : "Reste:"}</span>
                <span className={changeToReturn >= 0 ? "text-white" : "text-orange-400"}>
                  {Math.abs(changeToReturn).toLocaleString()}
                </span>
              </div>
            </div>

            {/* CLAVIER COMPACT */}
            <div className="hidden lg:grid grid-cols-3 gap-1.5 mt-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '.'].map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  onClick={() => handleKeypadPress(key)}
                  className={`h-10 text-md font-bold ${key === 'C' ? 'text-destructive' : ''}`}
                >
                  {key}
                </Button>
              ))}
            </div>
          </div>

          {/* BOUTON VALIDER (FLOTTANT SUR MOBILE, FIXE SUR DESKTOP) */}
          <div className="fixed lg:relative bottom-4 left-4 right-4 lg:bottom-0 lg:left-0 lg:right-0 lg:p-4 bg-transparent lg:bg-background lg:border-t">
            <Button
              className="w-full h-14 lg:h-12 text-sm font-bold uppercase shadow-2xl lg:shadow-none bg-primary hover:bg-primary/90"
              onClick={handleSubmit}
              disabled={isSubmitting || items.length === 0}
            >
              {isSubmitting ? "Enregistrement..." : `Valider (${totalAmount.toLocaleString()})`}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </aside>
      </main>

      {/* Sync Progress Modal */}
      <SyncProgressModal
        open={isSyncing}
        onOpenChange={() => { }}
        progress={syncProgress}
        unsyncedCount={unsyncedCount}
        isComplete={!isSyncing && syncProgress === 100}
      />
    </div>
  )
}