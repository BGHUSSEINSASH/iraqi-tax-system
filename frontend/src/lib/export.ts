import * as XLSX from 'xlsx'
import type { Company } from './types'
import { fmtDate } from './format'

export function exportExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const aoa = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = headers.map((_, i) => ({
    wch: Math.max(12, ...aoa.map((r) => String(r[i] ?? '').length + 2)),
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

export interface PdfTableSpec {
  title: string
  subtitle?: string
  company?: Company
  meta?: string[]
  headers: string[]
  rows: (string | number)[][]
  footers?: string[]
  orientation?: 'portrait' | 'landscape'
}

export function exportPdf(spec: PdfTableSpec): void {
  const w = window.open('', '_blank', 'width=1000,height=720')
  if (!w) {
    alert('يُرجى السماح بالنوافذ المنبثقة لتصدير PDF.')
    return
  }
  const orientation = spec.orientation ?? 'landscape'
  const company = spec.company
  const companyBlock = company
    ? `<div class="co">${company.name} — رقم المكلف: ${company.taxId}<br/>${company.address} — هاتف: ${company.phone}</div>`
    : ''
  const metaBlock = spec.meta ? `<div class="meta">${spec.meta.map((m) => `<span>${m}</span>`).join('')}</div>` : ''
  const footBlock = spec.footers
    ? `<div class="foot">${spec.footers.map((f) => `<div>${f}</div>`).join('')}</div>`
    : ''
  const rowsHtml = spec.rows
    .map(
      (r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`,
    )
    .join('')
  const headHtml = `<tr>${spec.headers.map((h) => `<th>${h}</th>`).join('')}</tr>`

  const doc = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
  <title>${spec.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Tajawal','Segoe UI',sans-serif; padding: 20px; color: #0f172a; }
    .brand { text-align: center; margin-bottom: 4px; font-size: 20px; font-weight: 900; color: #065f46; }
    .sub { text-align: center; font-size: 13px; color: #475569; margin-bottom: 8px; }
    .co { text-align: center; font-size: 12px; color: #334155; margin-bottom: 10px; }
    .meta { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; font-size: 12px; margin-bottom: 8px; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #065f46; color: #fff; padding: 6px 8px; border: 1px solid #065f46; text-align: right; }
    td { padding: 5px 8px; border: 1px solid #cbd5e1; }
    tbody tr:nth-child(even) { background: #f1f5f9; }
    .foot { margin-top: 16px; font-size: 12px; color: #334155; line-height: 1.7; }
    @media print { body { padding: 6mm; } .no-print { display: none !important; } }
  </style>
  <style>@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');</style>
  </head><body>
  <div class="brand">جمهورية العراق — الهيئة العامة للضرائب</div>
  <div class="sub">${spec.subtitle ?? ''}</div>
  <div class="sub">تاريخ التقرير: ${fmtDate(new Date().toISOString())}</div>
  ${companyBlock}
  ${metaBlock}
  <table><thead>${headHtml}</thead><tbody>${rowsHtml}</tbody></table>
  ${footBlock}
  <div class="no-print" style="text-align:center;margin-top:14px;font-size:12px;color:#64748b;">يمكنك حفظ النتيجة بصيغة PDF من نافذة الطباعة.</div>
  <script>setTimeout(function(){ window.print(); }, 350);</script>
  </body></html>`
  w.document.open()
  w.document.write(doc)
  w.document.close()
  w.focus()
}

export function printWindowHtml(title: string, bodyHtml: string, styles = ''): void {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  const doc = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${title}</title>
  <style>body{font-family:'Tajawal','Segoe UI',sans-serif;padding:16px;color:#0f172a;}${styles}
  @media print{body{padding:6mm;}}</style></head><body>${bodyHtml}
  <script>setTimeout(function(){window.print();},300);</script></body></html>`
  w.document.open()
  w.document.write(doc)
  w.document.close()
  w.focus()
}
