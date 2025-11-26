import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function downloadAsFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportToExcel(filename: string, sheetName: string, data: any[][]) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}