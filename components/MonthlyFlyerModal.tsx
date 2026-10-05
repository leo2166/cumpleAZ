'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  X,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  Cake,
  Sparkles,
} from 'lucide-react'

export type BirthdayItem = {
  id?: number
  name: string
  date: string
}

interface MonthlyFlyerModalProps {
  isOpen: boolean
  onClose: () => void
  birthdays: BirthdayItem[]
  monthName: string
  monthIndex: number // 0 a 11
  year: number
}

function parseDayAndMonth(dateStr: string): { day: number; month: number } {
  if (!dateStr || typeof dateStr !== 'string') return { day: 1, month: 1 }
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const parts = clean.split('-')
  if (parts.length >= 3) {
    return {
      day: parseInt(parts[2], 10) || 1,
      month: parseInt(parts[1], 10) || 1,
    }
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime())
    ? { day: 1, month: 1 }
    : { day: d.getDate(), month: d.getMonth() + 1 }
}

export default function MonthlyFlyerModal({
  isOpen,
  onClose,
  birthdays = [],
  monthName,
  monthIndex,
  year,
}: MonthlyFlyerModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)

  // Filtrar y ordenar los cumpleañeros del mes de forma cronológica por día (1 al 31)
  const sortedBirthdays = useMemo(() => {
    return [...birthdays]
      .map(b => {
        const { day, month } = parseDayAndMonth(b.date)
        return { ...b, parsedDay: day, parsedMonth: month }
      })
      .sort((a, b) => {
        if (a.parsedDay !== b.parsedDay) return a.parsedDay - b.parsedDay
        return a.name.localeCompare(b.name, 'es')
      })
  }, [birthdays])

  // Dibujar el Flyer en alta resolución en Canvas (1200 x 1500 px)
  const drawFlyer = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1200
    const H = 1500
    canvas.width = W
    canvas.height = H

    // ── 1. Fondo suave festivo con degradado ──
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#ffffff')
    bgGrad.addColorStop(0.35, '#fff9f2')
    bgGrad.addColorStop(1, '#fceddf')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // ── 2. Marco ornamental exterior e interior ──
    // Marco exterior grueso
    ctx.strokeStyle = '#cda26f'
    ctx.lineWidth = 6
    ctx.strokeRect(36, 36, W - 72, H - 72)

    // Marco interior fino
    ctx.strokeStyle = '#17254e'
    ctx.lineWidth = 2
    ctx.strokeRect(48, 48, W - 96, H - 96)

    // Detalle de esquinas ornamentales
    const cornerSize = 28
    const corners = [
      { x: 48, y: 48 },
      { x: W - 48, y: 48 },
      { x: 48, y: H - 48 },
      { x: W - 48, y: H - 48 },
    ]
    ctx.fillStyle = '#cda26f'
    corners.forEach(c => {
      ctx.beginPath()
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2)
      ctx.fill()
    })

    // ── 3. Chispas y serpentinas festivas decorativas en el fondo ──
    ctx.save()
    const confettiColors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#cda26f']
    const sparkPoints = [
      { x: 120, y: 110, r: 6 },
      { x: 190, y: 170, r: 4 },
      { x: 260, y: 100, r: 5 },
      { x: W - 120, y: 110, r: 6 },
      { x: W - 190, y: 170, r: 4 },
      { x: W - 260, y: 100, r: 5 },
      { x: 100, y: H - 140, r: 5 },
      { x: 210, y: H - 100, r: 4 },
      { x: W - 100, y: H - 140, r: 5 },
      { x: W - 210, y: H - 100, r: 4 },
    ]
    sparkPoints.forEach((p, idx) => {
      ctx.fillStyle = confettiColors[idx % confettiColors.length]
      ctx.globalAlpha = 0.65
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()

    // ── 4. Cabecera Festiva (Icono / Pastel) ──
    // Emoji de torta grande o pastel
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '64px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'
    ctx.fillText('🎂', W / 2, 125)
    ctx.restore()

    // ── 5. Título Principal Centrado ──
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#17254e'
    ctx.font = 'bold 36px "Playfair Display", Georgia, serif'
    ctx.fillText('Asociación de Jubilados y Pensionados', W / 2, 195)
    ctx.fillText('CANTV Zulia', W / 2, 240)

    // Línea divisoria elegante dorada
    ctx.beginPath()
    ctx.moveTo(W / 2 - 160, 275)
    ctx.lineTo(W / 2 + 160, 275)
    ctx.strokeStyle = '#cda26f'
    ctx.lineWidth = 3
    ctx.stroke()

    // Pequeño diamante central
    ctx.save()
    ctx.translate(W / 2, 275)
    ctx.rotate(Math.PI / 4)
    ctx.fillStyle = '#cda26f'
    ctx.fillRect(-6, -6, 12, 12)
    ctx.restore()

    // ── 6. Subtítulo Centrado ──
    ctx.fillStyle = '#c65b45'
    ctx.font = 'italic 600 28px "Playfair Display", Georgia, serif'
    ctx.fillText(
      `Estos son los cumpleañeros del mes de ${monthName} ${year}`,
      W / 2,
      325
    )

    // ── 7. Recuadro Central para la totalidad de los cumpleañeros ──
    const boxX = 100
    const boxY = 370
    const boxW = W - 200
    const boxH = 960
    const radius = 24

    // Sombra suave del recuadro
    ctx.save()
    ctx.shadowColor = 'rgba(23, 37, 78, 0.08)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 6

    // Relleno blanco marfil del recuadro
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(boxX, boxY, boxW, boxH, radius)
    ctx.fill()
    ctx.restore()

    // Borde elegante del recuadro
    ctx.strokeStyle = '#e2ceb9'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(boxX, boxY, boxW, boxH, radius)
    ctx.stroke()

    // Franja decorativa interna superior del recuadro
    ctx.fillStyle = '#fbf5ed'
    ctx.beginPath()
    ctx.roundRect(boxX + 2, boxY + 2, boxW - 4, 46, [radius, radius, 0, 0])
    ctx.fill()

    ctx.fillStyle = '#78532f'
    ctx.font = 'bold 15px "Inter", system-ui, sans-serif'
    ctx.letterSpacing = '2px'
    ctx.fillText(
      `LISTADO OFICIAL • ${sortedBirthdays.length} ${sortedBirthdays.length === 1 ? 'HOMENAJEADO' : 'HOMENAJEADOS'}`,
      W / 2,
      boxY + 25
    )
    ctx.letterSpacing = '0px'

    // ── 8. Renderizar el listado en el recuadro ──
    const count = sortedBirthdays.length
    if (count === 0) {
      ctx.fillStyle = '#6f665f'
      ctx.font = '500 24px "Inter", system-ui, sans-serif'
      ctx.fillText(
        'No hay cumpleañeros registrados para este mes.',
        W / 2,
        boxY + boxH / 2
      )
    } else {
      // Determinar número de columnas: 1 columna si <= 14; 2 columnas si > 14
      const useTwoCols = count > 14
      const usableTop = boxY + 70
      const usableBottom = boxY + boxH - 25
      const availableH = usableBottom - usableTop

      if (!useTwoCols) {
        // ── 1 Columna Centrada ──
        const rowH = Math.min(54, Math.max(34, availableH / count))
        const fontSize = Math.min(22, Math.max(16, Math.floor(rowH * 0.48)))
        const startY = usableTop + (availableH - count * rowH) / 2 + rowH / 2

        sortedBirthdays.forEach((b, i) => {
          const y = startY + i * rowH

          // Fondo alternado sutil
          if (i % 2 === 0) {
            ctx.fillStyle = 'rgba(251, 245, 237, 0.55)'
            ctx.fillRect(boxX + 24, y - rowH / 2 + 3, boxW - 48, rowH - 6)
          }

          // Fecha y nombre: formato "3/10  Fulano de tal"
          const dateLabel = `${b.parsedDay}/${b.parsedMonth}`
          
          // Medir para centrado armónico
          ctx.font = `bold ${fontSize}px "Inter", system-ui, sans-serif`
          const dateWidth = ctx.measureText(dateLabel).width
          
          ctx.font = `600 ${fontSize}px "Inter", system-ui, sans-serif`
          const nameWidth = ctx.measureText(b.name).width
          
          const totalWidth = dateWidth + 30 + nameWidth
          const startX = (W - totalWidth) / 2

          // Fecha destacada
          ctx.fillStyle = '#c65b45'
          ctx.textAlign = 'left'
          ctx.font = `bold ${fontSize}px "Inter", system-ui, sans-serif`
          ctx.fillText(dateLabel, startX, y)

          // Separador guión
          ctx.fillStyle = '#d5b99e'
          ctx.font = `normal ${fontSize}px "Inter", system-ui, sans-serif`
          ctx.fillText('—', startX + dateWidth + 10, y)

          // Nombre del cumpleañero
          ctx.fillStyle = '#17254e'
          ctx.font = `600 ${fontSize}px "Inter", system-ui, sans-serif`
          ctx.fillText(b.name, startX + dateWidth + 30, y)
        })
      } else {
        // ── 2 Columnas Balanceadas ──
        const half = Math.ceil(count / 2)
        const colW = (boxW - 60) / 2
        const rowH = Math.min(46, Math.max(26, availableH / half))
        const fontSize = Math.min(18, Math.max(13, Math.floor(rowH * 0.52)))
        const startY = usableTop + 10 + rowH / 2

        // Línea vertical tenue divisoria entre columnas
        ctx.strokeStyle = '#f1e6da'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(W / 2, usableTop + 10)
        ctx.lineTo(W / 2, usableBottom - 10)
        ctx.stroke()

        sortedBirthdays.forEach((b, i) => {
          const colIndex = i < half ? 0 : 1
          const rowIndex = colIndex === 0 ? i : i - half
          const y = startY + rowIndex * rowH
          const colStartX = colIndex === 0 ? boxX + 25 : W / 2 + 15

          // Fondo alternado sutil
          if (rowIndex % 2 === 0) {
            ctx.fillStyle = 'rgba(251, 245, 237, 0.55)'
            ctx.fillRect(colStartX, y - rowH / 2 + 2, colW - 10, rowH - 4)
          }

          const dateLabel = `${b.parsedDay}/${b.parsedMonth}`

          // Fecha
          ctx.textAlign = 'left'
          ctx.fillStyle = '#c65b45'
          ctx.font = `bold ${fontSize}px "Inter", system-ui, sans-serif`
          ctx.fillText(dateLabel, colStartX + 8, y)

          // Separador
          ctx.fillStyle = '#d5b99e'
          ctx.font = `normal ${fontSize}px "Inter", system-ui, sans-serif`
          ctx.fillText('—', colStartX + 8 + 48, y)

          // Nombre
          ctx.fillStyle = '#17254e'
          ctx.font = `600 ${fontSize}px "Inter", system-ui, sans-serif`
          // Truncar si fuera excesivamente largo
          const maxNameW = colW - 85
          let displayName = b.name
          while (ctx.measureText(displayName).width > maxNameW && displayName.length > 5) {
            displayName = displayName.slice(0, -1)
          }
          if (displayName !== b.name) displayName += '…'
          ctx.fillText(displayName, colStartX + 8 + 66, y)
        })
      }
    }

    // ── 9. Pie del Flyer ──
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#78532f'
    ctx.font = 'italic 500 20px "Playfair Display", Georgia, serif'
    ctx.fillText(
      '«¡Que la dicha y las bendiciones de Dios los acompañen en su día!»',
      W / 2,
      H - 95
    )

    ctx.fillStyle = '#8b96b2'
    ctx.font = '500 13px "Inter", system-ui, sans-serif'
    ctx.letterSpacing = '1.5px'
    ctx.fillText('ASOCIACIÓN DE JUBILADOS Y PENSIONADOS CANTV • ESTADO ZULIA', W / 2, H - 65)
    ctx.letterSpacing = '0px'
  }, [sortedBirthdays, monthName, year])

  // Redibujar siempre que se abra el modal o cambien los datos
  useEffect(() => {
    if (isOpen) {
      // Dar tiempo a que el canvas se monte en el DOM
      const timer = setTimeout(() => {
        drawFlyer()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, drawFlyer])

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Acción: Descargar Imagen PNG
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading(true)
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `Cumpleaneros_${monthName}_${year}_CANTV_Zulia.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setDownloading(false)
    }
  }

  // Acción: Imprimir
  const handlePrint = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setPrinting(true)
    const dataUrl = canvas.toDataURL('image/png')

    const printWin = window.open('', '_blank', 'width=900,height=1100')
    if (!printWin) {
      // Fallback a window.print() tradicional si el navegador bloquea popups
      window.print()
      setPrinting(false)
      return
    }

    printWin.document.open()
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Cumpleañeros ${monthName} ${year} - CANTV Zulia</title>
          <style>
            @page {
              size: portrait;
              margin: 8mm;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #ffffff;
            }
            img {
              max-width: 100%;
              height: auto;
              max-height: 98vh;
              display: block;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.focus(); window.print(); window.close();" />
        </body>
      </html>
    `)
    printWin.document.close()
    setTimeout(() => setPrinting(false), 1500)
  }

  // Acción: Copiar lista en texto para WhatsApp
  const handleCopyText = async () => {
    const lines = [
      `🎂 *Asociación de Jubilados y Pensionados CANTV Zulia*`,
      `📅 *Cumpleañeros de ${monthName} ${year}*`,
      ``,
      ...sortedBirthdays.map(b => `• ${b.parsedDay}/${b.parsedMonth} — ${b.name}`),
      ``,
      `🎉 _¡Muchas felicidades a todos en su día!_`,
    ]
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-5 animate-fade-in">
      <div
        className="relative flex flex-col max-h-[95vh] w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e9e3dc]"
        onClick={e => e.stopPropagation()}
      >
        {/* Barra superior de controles del Modal */}
        <div className="flex items-center justify-between border-b border-[#e9e3dc] px-5 py-3.5 bg-gradient-to-r from-[#fefbf8] to-[#fbf5ee]">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e87358] text-white shadow-xs">
              <Cake className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#17254e] leading-tight">
                Flyer de Cumpleañeros del Mes
              </h2>
              <p className="text-xs text-[#6f665f]">
                {monthName} {year} • {sortedBirthdays.length} cumpleañeros registrados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#6f665f] transition hover:bg-[#ebdcd1] hover:text-[#17254e]"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Contenido: Previsualización del Flyer y Barra de Acciones */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f4f2ee] flex flex-col items-center">
          {/* Canvas donde se dibuja el Flyer con calidad editorial */}
          <div className="w-full max-w-[560px] rounded-xl overflow-hidden shadow-xl border border-[#ded7cf] bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
              style={{ display: 'block' }}
            />
          </div>
        </div>

        {/* Barra inferior de acciones (Imprimir, Descargar PNG, Copiar) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9e3dc] bg-white px-5 py-3.5">
          <div className="text-xs text-[#6f665f] hidden sm:block">
            Listo para imprimir en hoja o descargar y enviar por WhatsApp.
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Copiar texto */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-2 rounded-full border border-[#ded7cf] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#6f665f] hover:bg-[#f6f2ed] hover:text-[#17254e] transition active:scale-95"
              title="Copiar listado en formato texto para WhatsApp"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>

            {/* Descargar imagen PNG */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 rounded-full border border-[#cda26f] bg-[#fbf5ee] px-4 py-2 text-xs sm:text-sm font-semibold text-[#78532f] hover:bg-[#f6ebd9] transition active:scale-95 shadow-xs"
              title="Descargar como imagen PNG de alta calidad"
            >
              <Download className="size-4" />
              <span>Descargar Imagen</span>
            </button>

            {/* Imprimir */}
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-2 rounded-full bg-[#17254e] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#263b78] transition active:scale-95 shadow-sm"
              title="Imprimir reporte centrado del mes"
            >
              <Printer className="size-4 text-[#fbbf24]" />
              <span>Imprimir Flyer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
