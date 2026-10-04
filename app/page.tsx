'use client'

import useSWR from 'swr'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Birthday = { id: number; name: string; date: string }
type Toast = { id: number; message: string; type: 'success' | 'error' }
type AdminView = 'login' | 'list' | 'add' | 'edit'

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then(r => r.json())

function getCalendarDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // Monday-first
  const totalDays = new Date(year, month + 1, 0).getDate()
  return Array.from(
    { length: Math.ceil((startOffset + totalDays) / 7) * 7 },
    (_, i) => {
      const day = i - startOffset + 1
      return day > 0 && day <= totalDays ? day : null
    }
  )
}

function parseDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`)
}

function formatDisplayDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function isTodayBirthday(dateStr: string, today: Date): boolean {
  const d = parseDate(dateStr)
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth()
}

// ─── Toast Component ─────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast-enter flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium text-white min-w-64 ${
            toast.type === 'success' ? 'bg-[#3f8f5b]' : 'bg-[#c65b45]'
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} aria-label="Cerrar notificación">
            <X className="size-4 opacity-80 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Page() {
  const today = useMemo(() => new Date(), [])
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth())
  const [visibleYear, setVisibleYear] = useState(today.getFullYear())

  // Data
  const { data: storedBirthdays, mutate } = useSWR<Birthday[]>('/api/birthdays', fetcher)
  const birthdays = useMemo(() => storedBirthdays ?? [], [storedBirthdays])

  // Admin state
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminView, setAdminView] = useState<AdminView>('login')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Add form
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // Edit form
  const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCounter = useRef(0)

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastCounter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingBirthday) {
          setEditingBirthday(null)
        } else if (adminOpen) {
          closeAdmin()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [adminOpen, editingBirthday]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived data ────────────────────────────────────────────────────────────

  const monthBirthdays = useMemo(
    () => birthdays.filter(b => {
      const d = parseDate(b.date)
      return d.getMonth() === visibleMonth && d.getFullYear() === visibleYear
    }),
    [birthdays, visibleMonth, visibleYear]
  )

  const todayBirthdays = useMemo(
    () => birthdays.filter(b => isTodayBirthday(b.date, today)),
    [birthdays, today]
  )

  const filteredBirthdays = useMemo(
    () => birthdays.filter(b => b.name.toLowerCase().includes(search.toLowerCase())),
    [birthdays, search]
  )

  const calendarDays = useMemo(
    () => getCalendarDays(visibleYear, visibleMonth),
    [visibleYear, visibleMonth]
  )

  // ── Navigation ──────────────────────────────────────────────────────────────

  const shiftMonth = (delta: number) => {
    const next = new Date(visibleYear, visibleMonth + delta, 1)
    setVisibleMonth(next.getMonth())
    setVisibleYear(next.getFullYear())
  }

  const goToCurrentMonth = () => {
    setVisibleMonth(today.getMonth())
    setVisibleYear(today.getFullYear())
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  const openAdmin = () => {
    setAdminOpen(true)
    setAdminView('login')
  }

  const closeAdmin = () => {
    setAdminOpen(false)
    setAdminView('login')
    setPassword('')
    setLoginError(false)
    setSearch('')
    setNewName('')
    setNewDate('')
    setEditingBirthday(null)
  }

  const login = async () => {
    if (!password.trim()) return
    setLoginLoading(true)
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: password }),
      })
      if (res.ok) {
        setLoginError(false)
        setAdminView('list')
      } else {
        setLoginError(true)
      }
    } catch {
      setLoginError(true)
    } finally {
      setLoginLoading(false)
    }
  }

  const openAdd = (initialName?: string) => {
    const nameToUse = (typeof initialName === 'string' ? initialName : search).trim()
    setNewName(nameToUse)
    setNewDate('')
    setAdminView('add')
  }

  const addBirthday = async () => {
    if (!newName.trim() || !newDate) return
    const nameToAdd = newName.trim()
    setAddLoading(true)
    try {
      const res = await fetch('/api/birthdays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': password },
        body: JSON.stringify({ name: nameToAdd, date: newDate }),
      })
      if (!res.ok) { addToast('No se pudo agregar el registro.', 'error'); return }
      await mutate()
      setNewName('')
      setNewDate('')
      setSearch('')
      addToast(`${nameToAdd} agregado correctamente.`)
      setAdminView('list')
    } catch {
      addToast('Error de conexión.', 'error')
    } finally {
      setAddLoading(false)
    }
  }

  const startEditing = (birthday: Birthday) => {
    setEditingBirthday(birthday)
    setEditName(birthday.name)
    setEditDate(birthday.date)
    setAdminView('edit')
  }

  const saveEdit = async () => {
    if (!editingBirthday || !editName.trim() || !editDate) return
    setEditLoading(true)
    try {
      const res = await fetch('/api/birthdays', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': password },
        body: JSON.stringify({ id: editingBirthday.id, name: editName.trim(), date: editDate }),
      })
      if (!res.ok) { addToast('No se pudo guardar los cambios.', 'error'); return }
      await mutate()
      addToast(`${editName.trim()} actualizado correctamente.`)
      setEditingBirthday(null)
      setAdminView('list')
    } catch {
      addToast('Error de conexión.', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const deleteBirthday = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch('/api/birthdays', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': password },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) { addToast('No se pudo eliminar el registro.', 'error'); return }
      await mutate()
      addToast(`${name} eliminado.`)
      if (editingBirthday?.id === id) {
        setEditingBirthday(null)
        setAdminView('list')
      }
    } catch {
      addToast('Error de conexión.', 'error')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isCurrentMonthAndYear =
    visibleMonth === today.getMonth() && visibleYear === today.getFullYear()

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#292523]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-[#e9e3dc] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e87358] text-white shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-[#17254e] sm:text-base">
                Asociación de Jubilados y Pensionados CANTV Zulia
              </p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#a39a92]">
                Jubilados del Zulia
              </p>
            </div>
          </div>
          <button
            id="btn-admin"
            onClick={openAdmin}
            className="flex items-center gap-2 rounded-full border border-[#ded7cf] px-3 py-2 text-sm font-medium text-[#6f665f] transition-all hover:border-[#e87358] hover:text-[#e87358] sm:px-4"
          >
            <Settings2 className="size-4" />
            <span className="hidden sm:inline">Administrar</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-12">

        {/* ── Cumpleañeros de hoy ── */}
        {todayBirthdays.length > 0 && (
          <div className="animate-slide-in-up mb-8 rounded-2xl border border-[#f5d7c8] bg-gradient-to-r from-[#fef3ee] to-[#fde8df] px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl">🎂</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#c65b45]">
                  ¡Hoy es el cumpleaños de!
                </p>
                <p className="font-serif text-lg font-semibold text-[#17254e]">
                  {todayBirthdays.map(b => b.name).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Hero + navegación ── */}
        <section className="mb-8 flex flex-col items-center gap-6 text-center">
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#263b78]">
              Cumpleañeros del mes
            </p>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-[#17254e] md:text-5xl">
              Jubilados del Zulia
            </h1>
            <p className="mt-2 text-sm text-[#5d6680]">
              Acompañemos juntos cada fecha especial.
            </p>
          </div>

          {/* Navegación de mes */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Mes anterior"
              onClick={() => shiftMonth(-1)}
              className="rounded-full border border-[#cbd2e5] bg-white p-2.5 text-[#263b78] shadow-sm transition hover:bg-[#edf0f8] hover:shadow"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="relative min-w-40 text-center">
              <p className="font-serif text-xl text-[#17254e]">{MONTH_NAMES[visibleMonth]}</p>
              <p className="text-sm text-[#6b7592]">{visibleYear}</p>
            </div>
            <button
              aria-label="Mes siguiente"
              onClick={() => shiftMonth(1)}
              className="rounded-full border border-[#cbd2e5] bg-white p-2.5 text-[#263b78] shadow-sm transition hover:bg-[#edf0f8] hover:shadow"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {!isCurrentMonthAndYear && (
            <button
              onClick={goToCurrentMonth}
              className="flex items-center gap-1.5 text-xs font-medium text-[#263b78] hover:underline"
            >
              <Calendar className="size-3.5" />
              Volver al mes actual
            </button>
          )}
        </section>

        {/* ── Lista de cumpleañeros del mes ── */}
        <section className="mx-auto mb-6 max-w-3xl">
          <div className="rounded-2xl border border-[#d9dce8] bg-[#f4f6fb] px-5 py-5 shadow-sm">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#263b78]">
              {MONTH_NAMES[visibleMonth]} {visibleYear}
            </p>
            {monthBirthdays.length > 0 ? (
              <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1.5">
                {monthBirthdays
                  .sort((a, b) => parseDate(a.date).getDate() - parseDate(b.date).getDate())
                  .map(b => {
                    const d = parseDate(b.date)
                    const isToday = isTodayBirthday(b.date, today)
                    return (
                      <li
                        key={b.id}
                        className={`font-serif text-base ${
                          isToday ? 'font-bold text-[#c65b45]' : 'text-[#17254e]'
                        }`}
                      >
                        {isToday && '🎂 '}
                        {`${d.getDate()}/${d.getMonth() + 1} — ${b.name}`}
                      </li>
                    )
                  })}
              </ul>
            ) : (
              <p className="text-center text-sm text-[#5d6680]">
                No hay cumpleañeros registrados este mes.
              </p>
            )}
          </div>
        </section>

        {/* ── Calendario ── */}
        <section className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-[#d9dce8] bg-white shadow-sm overflow-hidden">
            {/* Header de días */}
            <div className="grid grid-cols-7 border-b border-[#d9dce8] bg-[#f7f8fc]">
              {WEEK_DAYS.map(day => (
                <div
                  key={day}
                  className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#263b78]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Celdas */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const entries = day
                  ? monthBirthdays.filter(b => parseDate(b.date).getDate() === day)
                  : []
                const isToday =
                  day !== null &&
                  day === today.getDate() &&
                  isCurrentMonthAndYear
                const isLastRow = index >= calendarDays.length - 7

                return (
                  <div
                    key={index}
                    className={`relative min-h-[80px] p-2 sm:min-h-[96px] sm:p-3 ${
                      !isLastRow ? 'border-b border-[#eaecf4]' : ''
                    } ${index % 7 !== 6 ? 'border-r border-[#eaecf4]' : ''} ${
                      !day ? 'bg-[#f9fafb]' : ''
                    }`}
                  >
                    {day !== null && (
                      <>
                        <span
                          className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold transition ${
                            isToday
                              ? 'bg-[#e87358] text-white shadow-sm'
                              : 'text-[#263b78]'
                          }`}
                        >
                          {day}
                        </span>

                        {entries.length > 0 && (
                          <div className="absolute right-1.5 top-8 sm:right-2 sm:top-9">
                            <span
                              title={entries.map(e => e.name).join(', ')}
                              aria-label={`${entries.length} ${entries.length === 1 ? 'cumpleañero' : 'cumpleañeros'}: ${entries.map(e => e.name).join(', ')}`}
                              className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#3f8f5b] text-xs font-bold text-white shadow-md transition hover:scale-110"
                            >
                              {entries.length > 9 ? '9+' : entries.length}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Nota informativa */}
          <aside className="mt-4 rounded-2xl border border-[#d9dce8] bg-[#eef1f8] px-5 py-4 text-center text-sm leading-6 text-[#4f5b7d]">
            La información contenida en la base de datos es heredada y en su mayoría
            suministrada por asociados y familiares, ya que no contamos con el apoyo del
            departamento de Gestión Humana para mantener actualizada dicha base de datos.
          </aside>
        </section>
      </div>

      <footer className="mt-4 pb-8 text-center text-xs tracking-wide text-[#a39a92]">
        © {today.getFullYear()} Ing. Lucidio Fuenmayor — Asociación de Jubilados CANTV Zulia
      </footer>

      {/* ══════════════════════════════════════════════
          PANEL DE ADMINISTRACIÓN (drawer / modal)
      ══════════════════════════════════════════════ */}
      {adminOpen && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-black/30 backdrop-blur-[2px] sm:items-center sm:p-5 animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) closeAdmin() }}
        >
          <div className="animate-scale-in max-h-[92vh] w-full max-w-xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl flex flex-col">

            {/* Header del panel */}
            <div className="flex items-start justify-between border-b border-[#e9e3dc] px-6 py-5 shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#e87358]">
                  Zona privada
                </p>
                <h2 className="font-serif text-2xl text-[#17254e]">
                  {adminView === 'login' && 'Administrar'}
                  {adminView === 'list' && 'Registros'}
                  {adminView === 'add' && 'Agregar cumpleañero'}
                  {adminView === 'edit' && 'Editar registro'}
                </h2>
              </div>
              <button
                aria-label="Cerrar panel"
                onClick={closeAdmin}
                className="rounded-full p-2 text-[#a39a92] hover:bg-[#f5eee8] hover:text-[#292523] transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* ── Vista: Login ── */}
            {adminView === 'login' && (
              <div className="flex flex-col items-center justify-center gap-4 px-8 py-10">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#fbe9e3] text-[#e87358]">
                  <LockKeyhole className="size-6" />
                </div>
                <p className="text-center text-sm text-[#81776e]">
                  Ingresa la clave de acceso para gestionar los registros.
                </p>
                <div className="w-full max-w-xs flex flex-col gap-3">
                  <input
                    id="admin-password"
                    type="password"
                    placeholder="Clave de acceso"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError(false) }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) login()
                    }}
                    className="rounded-xl border border-[#ded7cf] px-4 py-3 text-sm outline-none focus:border-[#e87358] focus:ring-2 focus:ring-[#e87358]/20 transition"
                    autoFocus
                  />
                  {loginError && (
                    <p className="text-center text-xs text-red-600">
                      La clave no es correcta. Intenta de nuevo.
                    </p>
                  )}
                  <button
                    onClick={login}
                    disabled={loginLoading || !password.trim()}
                    className="w-full rounded-xl bg-[#292523] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4a403a] disabled:opacity-50"
                  >
                    {loginLoading ? 'Verificando…' : 'Ingresar'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Vista: Lista de registros ── */}
            {adminView === 'list' && (
              <div className="flex flex-col overflow-hidden flex-1">
                {/* Barra superior: buscar + agregar */}
                <div className="flex gap-2 border-b border-[#e9e3dc] px-4 py-3 shrink-0">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#ded7cf] px-3">
                    <Search className="size-4 text-[#a39a92] shrink-0" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar por nombre…"
                      className="w-full py-2.5 text-sm outline-none"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="text-[#a39a92] hover:text-[#292523]">
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                  <button
                    id="btn-add-birthday"
                    onClick={() => openAdd()}
                    className="flex items-center gap-1.5 rounded-xl bg-[#e87358] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c65b45] transition shrink-0"
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Agregar</span>
                  </button>
                </div>

                {/* Lista */}
                <div className="overflow-y-auto flex-1 px-4 py-3">
                  {filteredBirthdays.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-[#a39a92]">
                      <Calendar className="size-8 opacity-40" />
                      {search ? (
                        <>
                          <p>No se encontró &ldquo;{search}&rdquo;.</p>
                          <button
                            onClick={() => openAdd(search)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#e87358] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c65b45] transition shadow-sm"
                          >
                            <Plus className="size-3.5" />
                            Agregar &ldquo;{search.trim()}&rdquo;
                          </button>
                        </>
                      ) : (
                        <p>No hay registros aún. ¡Agrega el primero!</p>
                      )}
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {filteredBirthdays.map(b => (
                        <li
                          key={b.id}
                          className="flex items-center justify-between rounded-xl border border-[#eee8e1] px-4 py-3 hover:bg-[#fbfaf8] transition"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#17254e]">{b.name}</p>
                            <p className="text-xs text-[#a39a92]">{formatDisplayDate(b.date)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-3">
                            <button
                              aria-label={`Editar ${b.name}`}
                              onClick={() => startEditing(b)}
                              className="rounded-lg p-2 text-[#263b78] hover:bg-[#edf0f8] transition"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              aria-label={`Eliminar ${b.name}`}
                              onClick={() => deleteBirthday(b.id, b.name)}
                              className="rounded-lg p-2 text-[#b95b4b] hover:bg-[#fbe9e3] transition"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Pie con conteo */}
                <div className="border-t border-[#e9e3dc] px-5 py-2.5 shrink-0">
                  <p className="text-xs text-[#a39a92]">
                    {filteredBirthdays.length} de {birthdays.length} registros
                  </p>
                </div>
              </div>
            )}

            {/* ── Vista: Agregar ── */}
            {adminView === 'add' && (
              <div className="flex flex-col gap-4 px-6 py-6 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[#292523]">Nombre completo</span>
                    <input
                      id="new-birthday-name"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Ej: María González"
                      className="rounded-xl border border-[#ded7cf] px-4 py-3 text-sm outline-none focus:border-[#e87358] focus:ring-2 focus:ring-[#e87358]/20 transition"
                      autoFocus={!newName.trim()}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[#292523]">Fecha de cumpleaños</span>
                    <input
                      id="new-birthday-date"
                      type="date"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="rounded-xl border border-[#ded7cf] px-4 py-3 text-sm outline-none focus:border-[#e87358] focus:ring-2 focus:ring-[#e87358]/20 transition"
                      autoFocus={Boolean(newName.trim())}
                    />
                  </label>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setAdminView('list')}
                    className="rounded-xl border border-[#ded7cf] px-4 py-2.5 text-sm font-medium text-[#6f665f] hover:bg-[#f5eee8] transition"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-save-new-birthday"
                    onClick={addBirthday}
                    disabled={addLoading || !newName.trim() || !newDate}
                    className="flex items-center gap-2 rounded-xl bg-[#e87358] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c65b45] disabled:opacity-50 transition"
                  >
                    {addLoading ? 'Guardando…' : <><Plus className="size-4" /> Agregar</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Vista: Editar ── */}
            {adminView === 'edit' && editingBirthday && (
              <div className="flex flex-col gap-4 px-6 py-6 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[#292523]">Nombre completo</span>
                    <input
                      id="edit-birthday-name"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Nombre completo"
                      className="rounded-xl border border-[#ded7cf] px-4 py-3 text-sm outline-none focus:border-[#e87358] focus:ring-2 focus:ring-[#e87358]/20 transition"
                      autoFocus
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[#292523]">Fecha de cumpleaños</span>
                    <input
                      id="edit-birthday-date"
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="rounded-xl border border-[#ded7cf] px-4 py-3 text-sm outline-none focus:border-[#e87358] focus:ring-2 focus:ring-[#e87358]/20 transition"
                    />
                  </label>
                </div>
                <div className="flex gap-2 justify-between">
                  <button
                    onClick={() => deleteBirthday(editingBirthday.id, editingBirthday.name)}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-[#b95b4b] hover:bg-[#fbe9e3] transition"
                  >
                    <Trash2 className="size-4" />
                    Eliminar
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setAdminView('list'); setEditingBirthday(null) }}
                      className="rounded-xl border border-[#ded7cf] px-4 py-2.5 text-sm font-medium text-[#6f665f] hover:bg-[#f5eee8] transition"
                    >
                      Cancelar
                    </button>
                    <button
                      id="btn-save-edit-birthday"
                      onClick={saveEdit}
                      disabled={editLoading || !editName.trim() || !editDate}
                      className="rounded-xl bg-[#263b78] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#17254e] disabled:opacity-50 transition"
                    >
                      {editLoading ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Toasts ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </main>
  )
}
