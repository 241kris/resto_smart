declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf'

  export interface RowInput {
    [key: string]: any
  }

  export interface UserOptions {
    head?: RowInput[]
    body?: RowInput[]
    foot?: RowInput[]
    startY?: number
    margin?: number | { top?: number; right?: number; bottom?: number; left?: number }
    theme?: 'striped' | 'grid' | 'plain'
    headStyles?: Partial<CellStyles>
    bodyStyles?: Partial<CellStyles>
    footStyles?: Partial<CellStyles>
    alternateRowStyles?: Partial<CellStyles>
    columnStyles?: { [key: string]: Partial<CellStyles> }
    [key: string]: any
  }

  export interface CellStyles {
    fillColor?: number | [number, number, number]
    textColor?: number | [number, number, number]
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic'
    fontSize?: number
    halign?: 'left' | 'center' | 'right'
    valign?: 'top' | 'middle' | 'bottom'
    cellWidth?: number | 'auto' | 'wrap'
    minCellHeight?: number
    cellPadding?: number | { top?: number; right?: number; bottom?: number; left?: number }
    [key: string]: any
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void
}
