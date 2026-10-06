'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  monthIndex: number
  year: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDay(dateStr: string): number {
  if (!dateStr || typeof dateStr !== 'string') return 0
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const parts = clean.split('-')
  return parseInt(parts[2] ?? '0', 10) || 0
}

function sortByDay(list: BirthdayItem[]): BirthdayItem[] {
  return [...list].sort((a, b) => parseDay(a.date) - parseDay(b.date))
}

// Dimensiones oficiales de Flyer_mes.png
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1350

export default function MonthlyFlyerModal({
  isOpen,
  onClose,
  birthdays = [],
  monthName = 'Octubre',
  year = new Date().getFullYear(),
}: MonthlyFlyerModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const templateImgRef = useRef<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  const sorted = sortByDay(birthdays)

  // ── Cargar la plantilla oficial /Flyer_mes.png ─────────────────────────────
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/Flyer_mes.png'
    img.onload = () => {
      templateImgRef.current = img
      setImageLoaded(true)
    }
  }, [])

  // ── Dibujar flyer en el Canvas ────────────────────────────────────────────
  const drawFlyer = useCallback(() => {
    const canvas = canvasRef.current
    const img = templateImgRef.current
    if (!canvas || !img || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    // 1. Dibujar plantilla base de fondo
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 2. Título del mes en la cinta dorada superior (Centro exacto: Y = 265, X = 540)
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#17254e' // Azul CANTV elegante de alto contraste sobre dorado
    ctx.shadowColor = 'rgba(255, 255, 255, 0.45)'
    ctx.shadowBlur = 3
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1

    const titleText = `${monthName.toUpperCase()} ${year}`
    ctx.font = `bold 38px 'Playfair Display', Georgia, serif`
    ctx.fillText(titleText, 540, 265)
    ctx.restore()

    // 3. Subtítulo en la pastilla azul redondeada sobre el pergamino (Centro exacto: Y = 365, X = 540)
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fce59f' // Dorado luminoso sobre azul oscuro
    ctx.font = `bold 15px Inter, system-ui, sans-serif`
    ctx.letterSpacing = '3px'
    ctx.fillText('CUMPLEAÑEROS DEL MES', 540, 365)
    ctx.restore()

    // 4. Lista de cumpleañeros en las 2 columnas del pergamino
    // Área útil verificada: Y de 415 a 1075 (alto útil: 660px)
    // Columna 1 (Izquierda): X ≈ 75 a 515 (ancho ~440px)
    // Columna 2 (Derecha):   X ≈ 565 a 1005 (ancho ~440px)
    const listStartY = 415
    const listEndY = 1075
    const totalHeight = listEndY - listStartY

    if (sorted.length === 0) {
      ctx.save()
      ctx.fillStyle = '#7a7067'
      ctx.font = "italic 24px 'Playfair Display', Georgia, serif"
      ctx.textAlign = 'center'
      ctx.fillText('No hay cumpleañeros registrados en este mes.', 540, listStartY + 150)
      ctx.restore()
      setRendered(true)
      return
    }

    const half = Math.ceil(sorted.length / 2)
    const col1 = sorted.slice(0, half)
    const col2 = sorted.slice(half)
    const maxRows = Math.max(col1.length, col2.length, 1)

    // Cálculo dinámico proporcional: se adapta automáticamente tanto si hay 5 como si hay 50 cumpleañeros
    const rowHeight = Math.min(44, Math.floor(totalHeight / Math.max(maxRows, 12)))
    const nameFontSize = Math.max(13, Math.min(19, Math.floor(rowHeight * 0.45)))
    const dayFontSize = Math.max(12, Math.min(16, Math.floor(rowHeight * 0.39)))

    const renderColumn = (items: BirthdayItem[], colStartX: number, colWidth: number) => {
      items.forEach((item, index) => {
        const y = listStartY + index * rowHeight + rowHeight / 2

        // Sombra de renglón muy suave para alternar
        if (index % 2 === 0) {
          ctx.save()
          ctx.fillStyle = 'rgba(23, 37, 78, 0.03)'
          if (ctx.roundRect) {
            ctx.roundRect(colStartX + 8, y - rowHeight / 2 + 3, colWidth - 16, rowHeight - 6, 6)
          } else {
            ctx.rect(colStartX + 8, y - rowHeight / 2 + 3, colWidth - 16, rowHeight - 6)
          }
          ctx.fill()
          ctx.restore()
        }

        // Día del mes (Dorado oscuro / Bronce para legibilidad)
        const day = parseDay(item.date)
        const dayText = String(day).padStart(2, '0')

        ctx.save()
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#8f6526' // Bronce / oro viejo
        ctx.font = `bold ${dayFontSize}px Inter, system-ui, sans-serif`
        ctx.fillText(dayText, colStartX + 50, y)

        // Pequeño divisor vertical entre día y nombre
        ctx.strokeStyle = '#c49e4d'
        ctx.lineWidth = 1.2
        ctx.globalAlpha = 0.55
        ctx.beginPath()
        ctx.moveTo(colStartX + 62, y - dayFontSize * 0.55)
        ctx.lineTo(colStartX + 62, y + dayFontSize * 0.55)
        ctx.stroke()
        ctx.restore()

        // Nombre del cumpleañero (Tipografía Cormorant Garamond - Ultra elegante)
        ctx.save()
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#17254e' // Azul Marino CANTV
        ctx.font = `600 ${nameFontSize}px 'Cormorant Garamond', 'Playfair Display', Georgia, serif`

        let displayName = item.name.trim()
        const maxTextWidth = colWidth - 84
        while (ctx.measureText(displayName).width > maxTextWidth && displayName.length > 3) {
          displayName = displayName.slice(0, -1)
        }
        if (displayName !== item.name.trim()) displayName += '…'

        ctx.fillText(displayName, colStartX + 74, y)
        ctx.restore()
      })
    }

    // Renderizar columna izquierda y derecha
    renderColumn(col1, 75, 440)
    renderColumn(col2, 565, 440)

    setRendered(true)
  }, [imageLoaded, sorted, monthName, year])

  // Dibujar cuando la imagen esté cargada o cambien los datos
  useEffect(() => {
    if (!isOpen || !imageLoaded) return
    const loadFontsAndDraw = async () => {
      try {
        if (typeof document !== 'undefined' && document.fonts) {
          await Promise.all([
            document.fonts.load("600 20px 'Cormorant Garamond'"),
            document.fonts.load("bold 42px 'Playfair Display'"),
          ])
        }
      } catch {}
      drawFlyer()
    }
    const timer = setTimeout(loadFontsAndDraw, 60)
    return () => clearTimeout(timer)
  }, [isOpen, imageLoaded, drawFlyer])

  // Detectar soporte para Web Share API
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator)
  }, [])

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // ── Acciones de exportación ────────────────────────────────────────────────
  const getBlob = (): Promise<Blob | null> =>
    new Promise(resolve => {
      const canvas = canvasRef.current
      if (!canvas) return resolve(null)
      canvas.toBlob(blob => resolve(blob), 'image/png')
    })

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `Flyer-Cumpleañeros-${monthName}-${year}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleCopy = async () => {
    try {
      const blob = await getBlob()
      if (!blob) return
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      handleDownload()
    }
  }

  const handleShare = async () => {
    try {
      const blob = await getBlob()
      if (!blob) return
      const file = new File([blob], `Flyer-Cumpleañeros-${monthName}-${year}.png`, {
        type: 'image/png',
      })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Cumpleañeros de ${monthName} ${year}`,
        })
      } else {
        handleDownload()
      }
    } catch {
      // Usuario canceló
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Flyer de cumpleañeros de ${monthName} ${year}`}
    >
      <div className="relative flex max-h-[96vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[#e9e3dc] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎂</span>
            <div>
              <p className="font-semibold text-[#17254e] text-base leading-tight">
                Flyer Oficial del Mes
              </p>
              <p className="text-xs text-[#6f665f]">
                {monthName} {year} · {sorted.length} cumpleañero{sorted.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-[#6f665f] hover:bg-[#f5eee8] hover:text-[#292523] transition"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Vista previa en Canvas */}
        <div className="flex-1 overflow-y-auto bg-[#f3f0eb] p-4">
          <div
            className="relative mx-auto overflow-hidden rounded-2xl shadow-xl bg-white"
            style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
          >
            <canvas
              ref={canvasRef}
              className="h-auto w-full block"
              aria-label="Vista previa del flyer oficial"
            />
            {(!imageLoaded || !rendered) && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#17254e]/85">
                <RefreshCw className="size-8 animate-spin text-[#c9a84c]" />
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between gap-3 border-t border-[#e9e3dc] px-6 py-4">
          <button
            onClick={drawFlyer}
            className="flex items-center gap-1.5 rounded-xl border border-[#ded7cf] px-3.5 py-2 text-sm font-medium text-[#6f665f] hover:bg-[#f5eee8] transition"
            title="Refrescar vista previa"
          >
            <RefreshCw className="size-4" />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          <div className="flex items-center gap-2">
            {canShare && (
              <button
                id="btn-flyer-share"
                onClick={handleShare}
                disabled={!rendered}
                className="flex items-center gap-2 rounded-xl border border-[#ded7cf] px-4 py-2 text-sm font-medium text-[#6f665f] hover:bg-[#f5eee8] disabled:opacity-50 transition"
              >
                <Share2 className="size-4" />
                <span className="hidden sm:inline">Compartir</span>
              </button>
            )}

            <button
              id="btn-flyer-copy"
              onClick={handleCopy}
              disabled={!rendered}
              className="flex items-center gap-2 rounded-xl border border-[#ded7cf] px-4 py-2 text-sm font-medium text-[#6f665f] hover:bg-[#f5eee8] disabled:opacity-50 transition"
            >
              {copied ? <Check className="size-4 text-[#3f8f5b]" /> : <Copy className="size-4" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              id="btn-flyer-download"
              onClick={handleDownload}
              disabled={!rendered}
              className="flex items-center gap-2 rounded-xl bg-[#17254e] px-5 py-2 text-sm font-semibold text-white hover:bg-[#263b78] disabled:opacity-50 transition shadow-sm"
            >
              <Download className="size-4" />
              Descargar PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
