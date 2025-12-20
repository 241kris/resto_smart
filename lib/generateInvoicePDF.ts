import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface InvoiceItem {
  id: string
  product: {
    id: string
    name: string
    image: string | null
  }
  quantity: number
  price: number
  total: number
}

interface InvoiceOrder {
  id: string
  totalAmount: number
  status: string
  createdAt: string
  table?: {
    id: string
    number: number
    tableToken: string
  } | null
  customer?: {
    firstName: string
    lastName: string
    phone: string
    address: string
  }
  items: InvoiceItem[]
}

interface Establishment {
  id: string
  name: string
  email: string | null
  phones: string[]
  address: any
  images: string[]
}

export function generateInvoicePDF(order: InvoiceOrder, establishment: Establishment) {
  const doc = new jsPDF()

  // Couleurs
  const primaryColor: [number, number, number] = [59, 130, 246] // Bleu
  const darkGray: [number, number, number] = [75, 85, 99]
  const lightGray: [number, number, number] = [243, 244, 246]
  const textColor: [number, number, number] = [31, 41, 55]

  let yPosition = 20

  // ==========================================
  // EN-TÊTE - Informations du restaurant
  // ==========================================
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 50, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(establishment.name.toUpperCase(), 20, 25)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const addressText = typeof establishment.address === 'string' ? establishment.address : establishment.address?.street || 'Adresse non définie'
  doc.text(addressText, 20, 33)
  const phoneText = establishment.phones && establishment.phones.length > 0 ? establishment.phones[0] : 'N/A'
  doc.text(`Tél: ${phoneText}`, 20, 38)
  if (establishment.email) {
    doc.text(`Email: ${establishment.email}`, 20, 43)
  }

  // Logo FACTURE à droite
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', 210 - 20, 30, { align: 'right' })

  yPosition = 60

  // ==========================================
  // Informations de la facture
  // ==========================================
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Numéro de facture
  doc.setFont('helvetica', 'bold')
  doc.text('N° Facture:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(`#${order.id.slice(0, 8).toUpperCase()}`, 55, yPosition)

  // Date
  const date = new Date(order.createdAt)
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  doc.setFont('helvetica', 'bold')
  doc.text('Date:', 20, yPosition + 7)
  doc.setFont('helvetica', 'normal')
  doc.text(formattedDate, 55, yPosition + 7)

  // Table ou Type de commande
  let currentY = yPosition + 14
  doc.setFont('helvetica', 'bold')
  if (order.table) {
    doc.text('Table:', 20, currentY)
    doc.setFont('helvetica', 'normal')
    doc.text(`Table ${order.table.name}`, 55, currentY)
  } else {
    doc.text('Type:', 20, currentY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(251, 146, 60) // Orange
    doc.text('Commande publique', 55, currentY)
    doc.setTextColor(...textColor)
  }

  // Statut
  currentY += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Statut:', 20, currentY)
  doc.setFont('helvetica', 'normal')

  const statusLabels: Record<string, string> = {
    PENDING: 'En attente',
    completed: 'Traité',
    PAID: 'Payé',
    CANCELLED: 'Annulé',
  }

  const statusColors: Record<string, [number, number, number]> = {
    PENDING: [234, 179, 8], // Jaune
    completed: [59, 130, 246], // Bleu
    PAID: [34, 197, 94], // Vert
    CANCELLED: [156, 163, 175], // Gris
  }

  const statusLabel = statusLabels[order.status] || order.status
  const statusColor = statusColors[order.status] || darkGray

  doc.setTextColor(...statusColor)
  doc.setFont('helvetica', 'bold')
  doc.text(statusLabel, 55, currentY)
  doc.setTextColor(...textColor)

  yPosition = currentY + 7

  // Informations client pour commandes publiques
  const customerData = order.customer
  if (!order.table && customerData) {
    yPosition += 8

    // Encadré orange pour les infos client
    doc.setFillColor(255, 247, 237) // Orange très clair
    doc.setDrawColor(251, 146, 60) // Orange
    doc.setLineWidth(0.5)
    doc.roundedRect(20, yPosition, 170, 28, 2, 2, 'FD')

    yPosition += 6

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(234, 88, 12) // Orange foncé
    doc.text('Informations Client', 25, yPosition)

    yPosition += 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textColor)

    // Première ligne: Nom complet et Téléphone
    doc.setFont('helvetica', 'bold')
    doc.text('Client:', 25, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(`${customerData.firstName} ${customerData.lastName}`, 45, yPosition)

    doc.setFont('helvetica', 'bold')
    doc.text('Tél:', 120, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(customerData.phone, 135, yPosition)

    yPosition += 6

    // Deuxième ligne: Adresse
    doc.setFont('helvetica', 'bold')
    doc.text('Adresse:', 25, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(customerData.address, 45, yPosition)

    yPosition += 8
  }

  yPosition += 6

  // ==========================================
  // Ligne de séparation
  // ==========================================
  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(20, yPosition, 190, yPosition)

  yPosition += 10

  // ==========================================
  // Tableau des articles
  // ==========================================
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Détails de la commande', 20, yPosition)

  yPosition += 8

  // Préparer les données du tableau
  const tableData = order.items.map((item) => [
    item.product.name,
    item.quantity.toString(),
    `${item.price.toFixed(2)} FCFA`,
    `${item.total.toFixed(2)} FCFA`,
  ])

  autoTable(doc, {
    startY: yPosition,
    head: [['Article', 'Quantité', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  })

  // Position après le tableau
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 40

  // ==========================================
  // Totaux
  // ==========================================
  yPosition = finalY + 10

  // Encadré pour le total
  doc.setFillColor(...lightGray)
  doc.roundedRect(120, yPosition, 70, 25, 3, 3, 'F')

  // Sous-total
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.text('Sous-total:', 125, yPosition + 8)
  doc.text(`${order.totalAmount.toFixed(2)} FCFA`, 185, yPosition + 8, { align: 'right' })

  // Ligne de séparation
  doc.setDrawColor(...darkGray)
  doc.setLineWidth(0.3)
  doc.line(125, yPosition + 11, 185, yPosition + 11)

  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('TOTAL:', 125, yPosition + 19)
  doc.setFontSize(14)
  doc.text(`${order.totalAmount.toFixed(2)} FCFA`, 185, yPosition + 19, { align: 'right' })

  // ==========================================
  // Pied de page
  // ==========================================
  yPosition = 270

  doc.setFillColor(...primaryColor)
  doc.rect(0, yPosition, 210, 27, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const footerText = 'Merci de votre confiance !'
  doc.text(footerText, 105, yPosition + 10, { align: 'center' })

  doc.setFontSize(8)
  const footerPhone = establishment.phones && establishment.phones.length > 0 ? establishment.phones[0] : 'N/A'
  const footerDetails = `${establishment.name} - ${footerPhone}`
  doc.text(footerDetails, 105, yPosition + 16, { align: 'center' })

  // Générer le nom du fichier
  const dateStr = new Date(order.createdAt).toLocaleDateString('fr-FR').replace(/\//g, '-')
  const fileName = order.table
    ? `Facture_${order.id.slice(0, 8)}_Table${order.table.name}_${dateStr}.pdf`
    : `Facture_${order.id.slice(0, 8)}_Public_${dateStr}.pdf`

  // Télécharger le PDF
  doc.save(fileName)
}
