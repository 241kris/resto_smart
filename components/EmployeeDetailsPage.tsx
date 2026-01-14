 "use client"

import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, 
  Briefcase, FileText, User, ShieldCheck, 
  Clock, Hash, UserCircle2, Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { type Employee } from "@/lib/hooks/useEmployees"
import Image from "next/image"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface EmployeeDetailsPageProps {
  employee: Employee
  onBack: () => void
}

export default function EmployeeDetailsPage({ employee, onBack }: EmployeeDetailsPageProps) {
  
  const getStatusStyle = (status: Employee['status']) => {
    const styles = {
      ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      ON_LEAVE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      SUSPENDED: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      TERMINATED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    }
    return styles[status] || styles.ACTIVE
  }

  const getPositionLabel = (pos: Employee['position']) => {
    const labels = { WAITER: "Serveur", COOK: "Cuisinier", CHEF: "Chef", CASHIER: "Caissier", MANAGER: "Manager", DELIVERY: "Livreur" }
    return labels[pos] || pos
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* BARRE DE NAVIGATION RAPIDE */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="gap-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-bold">Retour</span>
        </Button>
        <Badge variant="outline" className={`rounded-full px-4 py-1 font-bold ${getStatusStyle(employee.status)}`}>
          {employee.status}
        </Badge>
      </div>

      {/* HEADER : PROFIL BANNER */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-6 md:p-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10 text-center md:text-left">
          <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 shrink-0">
            {employee.avatar ? (
              <Image src={employee.avatar} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-4xl font-black text-slate-300">
                  {employee.firstName[0]}{employee.lastName[0]}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mt-1">
                {getPositionLabel(employee.position)}
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium">
                <Briefcase className="h-4 w-4" />
                {employee.department}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium">
                <Clock className="h-4 w-4" />
                {employee.contractType}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRID D'INFORMATIONS RESPONSIVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* BLOC : PERSONNEL */}
        <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <UserCircle2 className="h-5 w-5" />
              </div>
              Identité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={<Calendar />} label="Naissance" value={format(new Date(employee.dateOfBirth), 'dd MMMM yyyy', { locale: fr })} />
            <InfoItem icon={<User />} label="Genre" value={employee.gender === 'MALE' ? 'Homme' : 'Femme'} />
            <InfoItem icon={<Hash />} label="N° Identité" value={employee.identityNumber || 'Non renseigné'} isLast />
          </CardContent>
        </Card>

        {/* BLOC : CONTACT */}
        <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <Phone className="h-5 w-5" />
              </div>
              Coordonnées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={<Phone />} label="Téléphone" value={employee.phone} />
            <InfoItem icon={<Mail />} label="Email" value={employee.email || 'Non renseigné'} />
            <InfoItem icon={<MapPin />} label="Adresse" value={employee.address} isLast />
          </CardContent>
        </Card>

        {/* BLOC : CONTRAT & DATES */}
        <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              Carrière
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={<FileText />} label="Type de contrat" value={employee.contractType} />
            <InfoItem icon={<Calendar />} label="Date d'embauche" value={format(new Date(employee.hireDate), 'PPP', { locale: fr })} isLast />
          </CardContent>
        </Card>

        {/* BLOC : ADMIN / SYSTEM */}
        <Card className="rounded-[2rem] border-none shadow-sm bg-slate-50/50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-muted-foreground uppercase tracking-widest">
              <Info className="h-4 w-4" />
              Système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Créé le</span>
                <span className="text-sm font-medium">{format(new Date(employee.createdAt), 'Pp', { locale: fr })}</span>
             </div>
             <Separator className="opacity-50" />
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Dernière mise à jour</span>
                <span className="text-sm font-medium">{format(new Date(employee.updatedAt), 'Pp', { locale: fr })}</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Petit composant interne pour uniformiser les lignes d'info
 */
function InfoItem({ icon, label, value, isLast = false }: { icon: React.ReactNode, label: string, value: string, isLast?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-tight">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 pl-5.5">{value}</p>
      {!isLast && <Separator className="mt-3 opacity-30" />}
    </div>
  )
}