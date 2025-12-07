import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateOrderCode(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  
  return `KOP-${year}${month}${day}-${random}`
}

export function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'DIPROSES':
      return 'info'
    case 'DITOLAK':
      return 'destructive'
    case 'SELESAI':
      return 'success'
    default:
      return 'secondary'
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Menunggu'
    case 'DIPROSES':
      return 'Diproses'
    case 'DITOLAK':
      return 'Ditolak'
    case 'SELESAI':
      return 'Selesai'
    default:
      return status
  }
}