import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
 
export const formatRupiah = (value?: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value || 0)

export const capitalize = (text?: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : ""

export const lowercase = (text?: string) =>
  text ? text.toLowerCase() : ""

export const formatMinutes = (value?: number) =>
  `${value || 0} min`