'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Type,
  Palette,
  Users,
} from 'lucide-react'

export type BirthdayItem = {
  id?: number
  name: string
  date: string
}

interface GreetingCardModalProps {
  isOpen: boolean
  onClose: () => void
  initialBirthdays?: BirthdayItem[]
  allMonthBirthdays?: BirthdayItem[]
  currentMonthName?: string
  currentYear?: number
  selectedDay?: number | null
}

const COLOR_PRESETS = [
  { id: 'gold', label: 'Dorado Cálido', value: '#78532f' },
  { id: 'navy', label: 'Azul CANTV', value: '#17254e' },
  { id: 'bronze', label: 'Bronce Oscuro', value: '#5b3a1a' },
  { id: 'black', label: 'Ébano Suave', value: '#292523' },
]

const FONT_PRESETS = [
  { id: 'serif', label: 'Serif (Playfair Display)', font: 'Playfair Display, Georgia, serif' },
  { id: 'sans', label: 'Sans (Inter)', font: 'Inter, system-ui, sans-serif' },
]

export default function GreetingCardModal({
  isOpen,
  onClose,
  initialBirthdays = [],
  allMonthBirthdays = [],
  currentMonthName = 'este mes',
  currentYear = new Date().getFullYear(),
  selectedDay = null,
}: GreetingCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const templateImgRef = useRef<HTMLImageElement | null>(null)

  // Estado de los nombres (editable libremente por renglones)
  const [namesText, setNamesText] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].value)
  const [selectedFont, setSelectedFont] = useState(FONT_PRESETS[0].font)
  const [fontSizeOffset, setFontSizeOffset] = useState(0) // ajuste relativo +/-
  const [yOffset, setYOffset] = useState(0) // ajuste vertical +/-
  const [copied, setCopied] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Formatear nombres en líneas de texto
  const formatNames = useCallback((items: BirthdayItem[]) => {
    return items
      .map(b => b.name.trim())
      .filter(Boolean)
      .join('\n')
  }, [])

  // Inicializar nombres cuando se abre el modal: SOLO los que corresponden
  useEffect(() => {
    if (isOpen) {
      if (initialBirthdays.length > 0) {
        setNamesText(formatNames(initialBirthdays))
      } else {
        // No inventar ni tomar personas de otros días
        setNamesText('')
      }
    }
  }, [isOpen, initialBirthdays, formatNames])

  // Cargar imagen plantilla img2.png una sola vez
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/img2.png'
    img.onload = () => {
      templateImgRef.current = img
      setImageLoaded(true)
    }
  }, [])

  // Dibujar tarjeta en el Canvas
  const drawCard = useCallback(() => {
    const canvas = canvasRef.current
    const img = templateImgRef.current
    if (!canvas || !img || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Tamaño canónico de la plantilla (1080 x 1080)
    canvas.width = 1080
    canvas.height = 1080

    // 1. Dibujar plantilla de fondo
    ctx.clearRect(0, 0, 1080, 1080)
    ctx.drawImage(img, 0, 0, 1080, 1080)

    // 2. Procesar nombres
    const lines = namesText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    if (lines.length === 0) return

    // 3. Configuración de tipografía y espaciado dinámico
    // El área disponible está entre Y ≈ 540 y Y ≈ 735 (centro Y ≈ 640)
    const centerY = 645 + yOffset
    const centerX = 540

    // Tamaño de fuente base según cantidad de líneas
    let baseFontSize = 32
    let lineHeight = 42

    if (lines.length === 1) {
      baseFontSize = 38
      lineHeight = 50
    } else if (lines.length === 2) {
      baseFontSize = 34
      lineHeight = 46
    } else if (lines.length === 3) {
      baseFontSize = 30
      lineHeight = 40
    } else if (lines.length === 4) {
      baseFontSize = 28
      lineHeight = 37
    } else if (lines.length <= 6) {
      baseFontSize = 24
      lineHeight = 32
    } else {
      baseFontSize = Math.max(16, 22 - (lines.length - 6))
      lineHeight = Math.max(20, baseFontSize * 1.3)
    }

    const finalFontSize = Math.max(14, baseFontSize + fontSizeOffset)
    const finalLineHeight = lineHeight * (finalFontSize / baseFontSize)

    ctx.fillStyle = selectedColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `500 ${finalFontSize}px ${selectedFont}`

    // Sombra de texto muy suave para máxima legibilidad sobre fondo dorado
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1

    // Calcular posición de inicio Y para que todo el bloque quede perfectamente centrado
    const totalBlockHeight = (lines.length - 1) * finalLineHeight
    const startY = centerY - totalBlockHeight / 2

    lines.forEach((line, index) => {
      const lineY = startY + index * finalLineHeight
      ctx.fillText(line, centerX, lineY)
    })

    // Reset de sombras
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }, [namesText, selectedColor, selectedFont, fontSizeOffset, yOffset, imageLoaded])

  // Redibujar ante cualquier cambio
  useEffect(() => {
    drawCard()
  }, [drawCard])

  // Cerrar al pulsar Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Acciones de descarga y compartir
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading(true)
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      const sanitizedDate = new Date().toISOString().slice(0, 10)
      a.download = `tarjeta-cumpleanos-cantv-${sanitizedDate}.png`
      a.href = dataUrl
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyImage = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob(async blob => {
        if (!blob) return
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ])
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        } else {
          handleDownload()
        }
      }, 'image/png')
    } catch {
      handleDownload()
    }
  }

  const handleShare = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async blob => {
      if (!blob) return
      const file = new File([blob], 'tarjeta-cumpleanos-cantv.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Feliz Cumpleaños - Jubilados CANTV Zulia',
            text: '¡Felicidades a nuestros cumpleañeros de la Asociación de Jubilados y Pensionados CANTV Zulia! 🎂🎉',
          })
        } catch {
          // Usuario canceló compartir
        }
      } else {
        handleCopyImage()
      }
    }, 'image/png')
  }

  // Días únicos con cumpleañeros en el mes
  const daysWithBirthdays = useMemo(() => {
    const map = new Map<number, BirthdayItem[]>()
    ;(allMonthBirthdays || []).forEach(b => {
      if (!b?.date) return
      const clean = b.date.includes('T') ? b.date.split('T')[0] : b.date
      const parts = clean.split('-')
      const day = parseInt(parts[2], 10)
      if (day && !isNaN(day)) {
        if (!map.has(day)) map.set(day, [])
        map.get(day)!.push(b)
      }
    })
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [allMonthBirthdays])

  const selectSpecificDay = (dayNum: number) => {
    const list = (allMonthBirthdays || []).filter(b => {
      if (!b?.date) return false
      const clean = b.date.includes('T') ? b.date.split('T')[0] : b.date
      const parts = clean.split('-')
      return parseInt(parts[2], 10) === dayNum
    })
    setNamesText(formatNames(list))
  }

  const loadPreset = (type: 'today' | 'day' | 'month') => {
    if (type === 'today') {
      const today = new Date()
      const todayList = (allMonthBirthdays || []).filter(b => {
        if (!b?.date) return false
        const clean = b.date.includes('T') ? b.date.split('T')[0] : b.date
        const parts = clean.split('-')
        const m = parseInt(parts[1], 10) - 1
        const d = parseInt(parts[2], 10)
        return m === today.getMonth() && d === today.getDate()
      })
      if (todayList.length > 0) {
        setNamesText(formatNames(todayList))
      } else {
        setNamesText('')
      }
    } else if (type === 'day' && selectedDay !== null) {
      selectSpecificDay(selectedDay)
    } else if (type === 'month') {
      setNamesText(formatNames(allMonthBirthdays))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex flex-col lg:flex-row w-full max-w-4xl max-h-[94vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#e9e3dc]">
        
        {/* ── Columna Izquierda: Vista Previa en Canvas ── */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#f4f2ee] p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-[#e9e3dc]">
          <div className="w-full flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#78532f]">
              <Sparkles className="size-3.5 text-[#e87358]" />
              Vista Previa (1080 × 1080)
            </span>
            <span className="text-[11px] text-[#81776e]">Alta Definición</span>
          </div>

          {/* Canvas contenedor responsivo */}
          <div className="relative w-full max-w-[380px] aspect-square rounded-xl shadow-lg overflow-hidden border border-[#dfd7cf] bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain block"
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 text-sm text-[#81776e]">
                <RefreshCw className="size-6 animate-spin text-[#e87358]" />
                <span>Cargando plantilla…</span>
              </div>
            )}
          </div>

          {/* Botones de acción rápida debajo de la vista previa */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center w-full max-w-[380px]">
            <button
              onClick={handleDownload}
              disabled={downloading || !imageLoaded}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#e87358] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#c65b45] active:scale-[0.98] transition disabled:opacity-50"
            >
              <Download className="size-4" />
              <span>Descargar PNG</span>
            </button>
            <button
              onClick={handleCopyImage}
              disabled={!imageLoaded}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#ded7cf] bg-white px-3 py-2.5 text-sm font-medium text-[#292523] hover:bg-[#fbfaf8] active:scale-[0.98] transition"
              title="Copiar imagen al portapapeles para pegar en WhatsApp Web"
            >
              {copied ? <Check className="size-4 text-[#3f8f5b]" /> : <Copy className="size-4" />}
              <span className="hidden sm:inline">{copied ? '¡Copiada!' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleShare}
              disabled={!imageLoaded}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#ded7cf] bg-white px-3 py-2.5 text-sm font-medium text-[#292523] hover:bg-[#fbfaf8] active:scale-[0.98] transition"
              title="Compartir"
            >
              <Share2 className="size-4" />
            </button>
          </div>
        </div>

        {/* ── Columna Derecha: Controles y Personalización ── */}
        <div className="w-full lg:w-[410px] flex flex-col justify-between p-5 sm:p-6 overflow-y-auto max-h-[85vh] lg:max-h-none">
          <div>
            {/* Header del modal */}
            <div className="flex items-start justify-between pb-4 border-b border-[#eee8e1]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#e87358]">
                  Generador Oficial (Solo Administrador)
                </p>
                <h3 className="font-serif text-2xl font-bold text-[#17254e]">
                  Tarjeta de Felicitación
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-[#a39a92] hover:bg-[#f5eee8] hover:text-[#292523] transition"
                aria-label="Cerrar modal"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Presets rápidos */}
            <div className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#6f665f] flex items-center gap-1.5">
                <Users className="size-3.5 text-[#263b78]" />
                Cumpleañeros a incluir:
              </span>
              <div className="flex flex-wrap gap-1.5 items-center">
                {initialBirthdays.length > 0 ? (
                  <button
                    onClick={() => setNamesText(formatNames(initialBirthdays))}
                    className="rounded-lg bg-[#fde8df] px-2.5 py-1 text-xs font-semibold text-[#c65b45] hover:bg-[#fcdad0] transition"
                  >
                    🎂 Hoy ({initialBirthdays.length})
                  </button>
                ) : (
                  <span className="text-[11px] text-[#81776e] bg-[#f4f2ee] px-2 py-1 rounded-lg">
                    Hoy no hay cumpleañeros
                  </span>
                )}

                {daysWithBirthdays.length > 0 && (
                  <select
                    onChange={e => {
                      const val = Number(e.target.value)
                      if (val) selectSpecificDay(val)
                    }}
                    defaultValue=""
                    className="rounded-lg border border-[#ded7cf] bg-white px-2 py-1 text-xs text-[#17254e] font-medium outline-none focus:border-[#e87358]"
                  >
                    <option value="" disabled>Seleccionar otro día…</option>
                    {daysWithBirthdays.map(([dayNum, items]) => (
                      <option key={dayNum} value={dayNum}>
                        Día {dayNum} ({items.length} {items.length === 1 ? 'persona' : 'personas'})
                      </option>
                    ))}
                  </select>
                )}

                {allMonthBirthdays.length > 0 && (
                  <button
                    onClick={() => loadPreset('month')}
                    className="rounded-lg bg-[#f4f2ee] px-2.5 py-1 text-xs font-medium text-[#4a403a] hover:bg-[#e9e4dc] transition"
                  >
                    Todo el mes ({allMonthBirthdays.length})
                  </button>
                )}
              </div>
            </div>

            {/* Editor de Nombres */}
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="card-names-input" className="text-xs font-semibold text-[#292523]">
                  Nombres en la tarjeta (uno por línea):
                </label>
                <span className="text-[11px] text-[#a39a92]">
                  {namesText.split('\n').filter(Boolean).length} persona(s)
                </span>
              </div>
              <textarea
                id="card-names-input"
                rows={4}
                value={namesText}
                onChange={e => setNamesText(e.target.value)}
                placeholder="Ejemplo:&#10;María Pérez&#10;Pedro Camejo&#10;Gloria Casal"
                className="w-full rounded-xl border border-[#ded7cf] p-3 text-sm font-medium text-[#17254e] outline-none focus:border-[#e87358] focus:ring-2 focus:ring-[#e87358]/20 transition resize-none bg-[#fdfbf9]"
              />
              <p className="text-[11px] text-[#81776e]">
                💡 Puedes editar cualquier nombre, corregir tildes o agregar apodos cariñosos.
              </p>
            </div>

            {/* Selector de Color */}
            <div className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#292523] flex items-center gap-1.5">
                <Palette className="size-3.5 text-[#78532f]" />
                Color del texto:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_PRESETS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.value)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-medium transition ${
                      selectedColor === color.value
                        ? 'border-[#78532f] bg-[#fbf5ee] text-[#78532f] shadow-sm font-semibold'
                        : 'border-[#ded7cf] bg-white text-[#6f665f] hover:bg-[#fbfaf8]'
                    }`}
                  >
                    <span
                      className="size-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="truncate">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Fuente */}
            <div className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#292523] flex items-center gap-1.5">
                <Type className="size-3.5 text-[#263b78]" />
                Tipografía:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {FONT_PRESETS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFont(f.font)}
                    className={`px-3 py-2 rounded-xl border text-xs text-center transition ${
                      selectedFont === f.font
                        ? 'border-[#263b78] bg-[#edf0f8] text-[#17254e] font-semibold'
                        : 'border-[#ded7cf] bg-white text-[#6f665f] hover:bg-[#fbfaf8]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ajustes de tamaño y posición */}
            <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#f8f6f3] border border-[#e9e3dc]">
              <div>
                <label className="text-[11px] font-semibold text-[#6f665f] block mb-1">
                  Tamaño letra: {fontSizeOffset > 0 ? `+${fontSizeOffset}` : fontSizeOffset}px
                </label>
                <input
                  type="range"
                  min="-10"
                  max="12"
                  value={fontSizeOffset}
                  onChange={e => setFontSizeOffset(Number(e.target.value))}
                  className="w-full accent-[#e87358]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#6f665f] block mb-1">
                  Posición vertical: {yOffset > 0 ? `+${yOffset}` : yOffset}px
                </label>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={yOffset}
                  onChange={e => setYOffset(Number(e.target.value))}
                  className="w-full accent-[#e87358]"
                />
              </div>
            </div>
          </div>

          {/* Footer de opciones en la columna derecha */}
          <div className="mt-6 pt-4 border-t border-[#eee8e1] flex items-center justify-between">
            <span className="text-[11px] text-[#a39a92]">
              Jubilados CANTV Zulia
            </span>
            <button
              onClick={onClose}
              className="rounded-xl border border-[#ded7cf] px-4 py-2 text-xs font-semibold text-[#6f665f] hover:bg-[#f5eee8] transition"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
