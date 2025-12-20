import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

interface ProductStats {
  productId: string
  productName: string
  productImage: string | null
  currentPrice: number
  totalQuantity: number
  totalRevenue: number
  orderCount: number
}

interface InventoryData {
  period: string
  startDate: string
  endDate: string
  summary: {
    totalProducts: number
    totalQuantitySold: number
    totalRevenue: number
    totalProductsInCatalog: number
  }
  products: ProductStats[]
}

export async function generateInventoryPDF(data: InventoryData, establishmentName: string) {
  const doc = new jsPDF()

  // Titre
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('INVENTAIRE DES PRODUITS', 105, 20, { align: 'center' })

  // Nom de l'établissement
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(establishmentName, 105, 30, { align: 'center' })

  // Période
  doc.setFontSize(10)
  const periodText = `Période: ${new Date(data.startDate).toLocaleDateString('fr-FR')} - ${new Date(data.endDate).toLocaleDateString('fr-FR')}`
  doc.text(periodText, 105, 38, { align: 'center' })

  // Date de génération
  const dateGeneration = new Date().toLocaleString('fr-FR')
  doc.text(`Généré le: ${dateGeneration}`, 105, 44, { align: 'center' })

  // Résumé
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RÉSUMÉ', 14, 55)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Produits au catalogue: ${data.summary.totalProductsInCatalog}`, 14, 62)
  doc.text(`Produits vendus: ${data.summary.totalProducts}`, 14, 68)
  doc.text(`Quantité totale vendue: ${data.summary.totalQuantitySold}`, 14, 74)
  doc.text(`Revenu total: ${data.summary.totalRevenue.toFixed(2)} FCFA`, 14, 80)

  // Tableau des produits
  const tableData = data.products.map((product, index) => [
    (index + 1).toString(),
    product.productName,
    `${product.currentPrice.toFixed(2)} FCFA`,
    product.totalQuantity.toString(),
    product.orderCount.toString(),
    `${product.totalRevenue.toFixed(2)} FCFA`,
    product.totalQuantity > 0 ? 'Vendu' : 'Non vendu'
  ])

  autoTable(doc, {
    startY: 88,
    head: [['N°', 'Produit', 'Prix unitaire', 'Qté vendue', 'Nb commandes', 'Revenu total', 'Statut']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [249, 115, 22], // Orange
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 50 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 30 },
      6: { halign: 'center', cellWidth: 25 }
    },
    didParseCell: (data) => {
      // Colorer les statuts
      if (data.column.index === 6 && data.section === 'body') {
        if (data.cell.text[0] === 'Vendu') {
          data.cell.styles.textColor = [34, 197, 94] // Vert
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [156, 163, 175] // Gris
        }
      }
    }
  })

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Page ${i} sur ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  // Télécharger
  const fileName = `Inventaire_${establishmentName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`
  doc.save(fileName)
}

export async function generateInventoryWord(data: InventoryData, establishmentName: string) {
  // Créer les lignes du tableau
  const tableRows = [
    // En-tête
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: 'N°', alignment: AlignmentType.CENTER })],
          shading: { fill: 'F97316' },
          width: { size: 5, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Produit', alignment: AlignmentType.CENTER })],
          shading: { fill: 'F97316' },
          width: { size: 30, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Prix unitaire', alignment: AlignmentType.CENTER })],
          shading: { fill: 'F97316' },
          width: { size: 15, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Qté vendue', alignment: AlignmentType.CENTER })],
          shading: { fill: 'F97316' },
          width: { size: 12, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Nb commandes', alignment: AlignmentType.CENTER })],
          shading: { fill: 'F97316' },
          width: { size: 13, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Revenu total', alignment: AlignmentType.CENTER })],
          shading: { fill: 'F97316' },
          width: { size: 15, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Statut', alignment: AlignmentType.CENTER })],
          shading: { fill: 'F97316' },
          width: { size: 10, type: WidthType.PERCENTAGE }
        })
      ]
    })
  ]

  // Lignes de données
  data.products.forEach((product, index) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            children: [new Paragraph({ text: product.productName, alignment: AlignmentType.LEFT })]
          }),
          new TableCell({
            children: [new Paragraph({ text: `${product.currentPrice.toFixed(2)} FCFA`, alignment: AlignmentType.RIGHT })]
          }),
          new TableCell({
            children: [new Paragraph({ text: product.totalQuantity.toString(), alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            children: [new Paragraph({ text: product.orderCount.toString(), alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            children: [new Paragraph({ text: `${product.totalRevenue.toFixed(2)} FCFA`, alignment: AlignmentType.RIGHT })]
          }),
          new TableCell({
            children: [new Paragraph({
              text: product.totalQuantity > 0 ? 'Vendu' : 'Non vendu',
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: product.totalQuantity > 0 ? 'E8F5E9' : 'F5F5F5' }
          })
        ]
      })
    )
  })

  // Créer le document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Titre
        new Paragraph({
          text: 'INVENTAIRE DES PRODUITS',
          heading: 'Heading1',
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        // Nom de l'établissement
        new Paragraph({
          text: establishmentName,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }),
        // Période
        new Paragraph({
          text: `Période: ${new Date(data.startDate).toLocaleDateString('fr-FR')} - ${new Date(data.endDate).toLocaleDateString('fr-FR')}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 }
        }),
        // Date de génération
        new Paragraph({
          text: `Généré le: ${new Date().toLocaleString('fr-FR')}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),
        // Résumé
        new Paragraph({
          text: 'RÉSUMÉ',
          heading: 'Heading2',
          spacing: { after: 150 }
        }),
        new Paragraph({
          text: `Produits au catalogue: ${data.summary.totalProductsInCatalog}`,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `Produits vendus: ${data.summary.totalProducts}`,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `Quantité totale vendue: ${data.summary.totalQuantitySold}`,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `Revenu total: ${data.summary.totalRevenue.toFixed(2)} FCFA`,
          spacing: { after: 300 }
        }),
        // Tableau
        new Paragraph({
          text: 'DÉTAIL DES PRODUITS',
          heading: 'Heading2',
          spacing: { after: 150 }
        }),
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      ]
    }]
  })

  // Générer et télécharger
  const blob = await Packer.toBlob(doc)
  const fileName = `Inventaire_${establishmentName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.docx`
  saveAs(blob, fileName)
}
