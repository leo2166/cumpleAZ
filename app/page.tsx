'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, LockKeyhole, Plus, Search, Settings2, Sparkles, X } from 'lucide-react'

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
type Birthday = { id: number; name: string; date: string }
const fetcher = (url: string) => fetch(url).then(response => response.json())

const initialBirthdays: Birthday[] = [
  { id: 1, name: 'María González', date: '2026-10-04' },
  { id: 2, name: 'Carlos Méndez', date: '2026-10-09' },
  { id: 3, name: 'Lucía Ramírez', date: '2026-10-17' },
  { id: 4, name: 'Andrés Torres', date: '2026-10-23' },
  { id: 5, name: 'Sofía Herrera', date: '2026-10-28' },
]

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const start = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: Math.ceil((start + days) / 7) * 7 }, (_, index) => {
    const day = index - start + 1
    return day > 0 && day <= days ? day : null
  })
}

export default function Page() {
  const today = new Date()
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth())
  const [visibleYear, setVisibleYear] = useState(today.getFullYear())
  const { data: storedBirthdays, mutate } = useSWR<Birthday[]>('/api/birthdays', fetcher)
  const birthdays = storedBirthdays ?? []
  const [adminOpen, setAdminOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')

  const shiftMonth = (amount: number) => {
    const next = new Date(visibleYear, visibleMonth + amount, 1)
    setVisibleMonth(next.getMonth())
    setVisibleYear(next.getFullYear())
  }

  const monthBirthdays = useMemo(() => birthdays.filter((birthday) => {
    const date = new Date(`${birthday.date}T12:00:00`)
    return date.getMonth() === visibleMonth && date.getFullYear() === visibleYear
  }), [birthdays, visibleMonth, visibleYear])
  const filteredBirthdays = birthdays.filter((birthday) => birthday.name.toLowerCase().includes(search.toLowerCase()))

  const addBirthday = async () => {
    if (!newName.trim() || !newDate) return
    const response = await fetch('/api/birthdays', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': password }, body: JSON.stringify({ name: newName.trim(), date: newDate }) })
    if (!response.ok) return
    await mutate()
    setNewName(''); setNewDate('')
  }

  const startEditing = (birthday: Birthday) => {
    setEditingBirthday(birthday)
    setEditName(birthday.name)
    setEditDate(birthday.date)
  }

  const deleteBirthday = async (id: number) => {
    const response = await fetch('/api/birthdays', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-key': password }, body: JSON.stringify({ id }) })
    if (response.ok) await mutate()
  }

  const saveBirthdayEdit = async () => {
    if (!editingBirthday || !editName.trim() || !editDate) return
    const response = await fetch('/api/birthdays', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-key': password }, body: JSON.stringify({ id: editingBirthday.id, name: editName.trim(), date: editDate }) })
    if (!response.ok) return
    await mutate()
    setEditingBirthday(null)
    setEditName('')
    setEditDate('')
  }

  const login = async () => {
    const response = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessKey: password }),
    })
    if (response.ok) {
      setLoginError(false)
      setAuthenticated(true)
    } else {
      setLoginError(true)
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#292523]">
      <header className="border-b border-[#e9e3dc] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#e87358] text-white"><Sparkles /></div><div><p className="text-lg font-semibold tracking-tight">Asociación de jubilados y pensionados Cantv Zulia</p><p className="text-xs tracking-[0.18em] text-[#a39a92] uppercase">Jubilados del Zulia</p></div></div>
          <button onClick={() => setAdminOpen(true)} className="flex items-center gap-2 rounded-full border border-[#ded7cf] px-4 py-2 text-sm font-medium text-[#6f665f] transition hover:border-[#e87358] hover:text-[#e87358]"><Settings2 data-icon="inline-start" /> Administrar</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-9 lg:px-8 lg:py-14">
        <section className="mb-9 flex flex-col items-center gap-5 text-center"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#263b78]">Cumpleañeros del mes</p><h1 className="font-serif text-4xl leading-tight tracking-tight text-[#17254e] md:text-5xl">Jubilados del Zulia</h1><p className="mt-3 max-w-lg text-[#5d6680]">Acompañemos juntos cada fecha especial.</p></div><div className="flex items-center gap-2"><button aria-label="Mes anterior" onClick={() => shiftMonth(-1)} className="rounded-full border border-[#cbd2e5] bg-white p-3 text-[#263b78] hover:bg-[#edf0f8]"><ChevronLeft /></button><div className="min-w-36 text-center"><p className="font-serif text-xl text-[#17254e]">{monthNames[visibleMonth]}</p><p className="text-sm text-[#6b7592]">{visibleYear}</p></div><button aria-label="Mes siguiente" onClick={() => shiftMonth(1)} className="rounded-full border border-[#cbd2e5] bg-white p-3 text-[#263b78] hover:bg-[#edf0f8]"><ChevronRight /></button></div></section>

        {/* Segunda versión de diseño: la versión anterior se conserva en Git para volver atrás si hace falta. */}
        <section className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="rounded-2xl border border-[#d9dce8] bg-[#f4f6fb] px-5 py-5 text-center shadow-[0_12px_32px_rgba(20,31,61,0.08)]">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#263b78]">Cumpleañeros del mes</p>
            {monthBirthdays.length > 0 ? <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[#17254e]">{monthBirthdays.map(birthday => { const [year, month, day] = birthday.date.split('-'); return <li key={birthday.id} className="font-serif text-lg">{`${Number(day)}/${Number(month)} ${birthday.name}`}</li> })}</ul> : <p className="text-sm text-[#5d6680]">No hay cumpleañeros registrados este mes.</p>}
          </div>

          <div className="rounded-2xl border border-[#d9dce8] bg-white p-3 shadow-[0_16px_44px_rgba(20,31,61,0.1)] sm:p-5">
            <div className="grid grid-cols-7 border-b border-[#d9dce8] pb-3">{weekDays.map(day => <div key={day} className="text-center text-xs font-bold uppercase tracking-wider text-[#263b78]">{day}</div>)}</div>
            <div className="grid grid-cols-7">{getCalendarDays(visibleYear, visibleMonth).map((day, index) => { const entries = day ? monthBirthdays.filter(b => new Date(`${b.date}T12:00:00`).getDate() === day) : []; const isToday = day === today.getDate() && visibleMonth === today.getMonth() && visibleYear === today.getFullYear(); return <div key={index} className="relative min-h-24 border-b border-r border-[#e5e7ef] p-2 last:border-r-0 sm:min-h-28 sm:p-3"><span className={`inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-[#ef6b52] text-white' : day ? 'text-[#263b78]' : 'text-transparent'}`}>{day || '0'}</span>{entries.length > 0 && <span title={`${entries.length} ${entries.length === 1 ? 'cumpleañero' : 'cumpleañeros'} este día`} aria-label={`${entries.length} ${entries.length === 1 ? 'cumpleañero' : 'cumpleañeros'} este día`} className="absolute right-2 top-10 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#3f8f5b] text-xs font-bold text-white shadow-md transition hover:scale-110 sm:right-3 sm:top-11">{entries.length}</span>}</div> })}</div>
          </div>

          <aside className="rounded-2xl border border-[#d9dce8] bg-[#eef1f8] px-5 py-4 text-center text-sm leading-6 text-[#4f5b7d] shadow-[0_8px_24px_rgba(20,31,61,0.06)]" aria-label="Nota sobre la información">
            La información contenida en la base de datos es heredada y en su mayoría suministrada por asociados y familiares, ya que no contamos con el apoyo del departamento Gestión humana para mantener actualizada dicha base de datos.
          </aside>
        </section>

        <footer className="mt-8 text-center text-xs tracking-wide text-[#7b849f]">
          Copyright Ing. Lucidio Fuenmayor 2026
        </footer>
      </div>

      {authenticated && editingBirthday && <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#292523]/25 p-5"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#e87358]">Modificar registro</p><h2 className="font-serif text-2xl text-[#17254e]">Editar cumpleaños</h2></div><button aria-label="Cancelar edición" onClick={() => setEditingBirthday(null)} className="rounded-full p-2 hover:bg-[#f5eee8]"><X /></button></div><div className="flex flex-col gap-3"><input aria-label="Nombre completo" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre completo" className="rounded-xl border border-[#ded7cf] px-4 py-3 outline-none focus:border-[#e87358]"/><input aria-label="Fecha" type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="rounded-xl border border-[#ded7cf] px-4 py-3 outline-none focus:border-[#e87358]"/><div className="flex justify-end gap-2"><button onClick={() => setEditingBirthday(null)} className="rounded-xl border border-[#ded7cf] px-4 py-3 font-medium text-[#6f665f]">Cancelar</button><button onClick={saveBirthdayEdit} className="rounded-xl bg-[#263b78] px-4 py-3 font-semibold text-white hover:bg-[#17254e]">Guardar cambios</button></div></div></div></div>}

      {adminOpen && <div className="fixed inset-0 z-10 flex items-end justify-center bg-[#292523]/25 p-0 sm:items-center sm:p-5"><div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl"><div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#e87358]">Zona privada</p><h2 className="font-serif text-3xl">Administrar cumpleaños</h2></div><button aria-label="Cerrar" onClick={() => setAdminOpen(false)} className="rounded-full p-2 hover:bg-[#f5eee8]"><X /></button></div>{!authenticated ? <div className="mx-auto max-w-sm py-7 text-center"><div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#fbe9e3] text-[#e87358]"><LockKeyhole /></div><p className="mb-5 text-sm text-[#81776e]">Ingresa la clave de acceso para gestionar los registros.</p><input type="password" placeholder="Clave de acceso" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) login() }} className="mb-3 w-full rounded-xl border border-[#ded7cf] px-4 py-3 outline-none focus:border-[#e87358]"/><button onClick={login} className="w-full rounded-xl bg-[#292523] px-4 py-3 font-semibold text-white hover:bg-[#4a403a]">Ingresar</button>{loginError && <p className="mt-3 text-sm text-red-600">La clave no es correcta.</p>}</div> : <><div className="mb-5 grid gap-3 sm:grid-cols-[1fr_170px_auto]"><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre completo" className="rounded-xl border border-[#ded7cf] px-4 py-3 outline-none focus:border-[#e87358]"/><input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="rounded-xl border border-[#ded7cf] px-4 py-3 outline-none focus:border-[#e87358]"/><button onClick={addBirthday} className="flex items-center justify-center gap-2 rounded-xl bg-[#e87358] px-4 py-3 font-semibold text-white hover:bg-[#c65b45]"><Plus /> Añadir</button></div><div className="mb-4 flex items-center gap-2 rounded-xl border border-[#ded7cf] px-3"><Search className="text-[#a39a92]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cumpleañero" className="w-full py-3 outline-none" /></div><div className="flex flex-col gap-2">{filteredBirthdays.map(b => <div key={b.id} className="flex items-center justify-between rounded-xl border border-[#eee8e1] px-4 py-3"><div><p className="font-medium">{b.name}</p><p className="text-xs text-[#a39a92]">{new Date(`${b.date}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div><button onClick={() => setBirthdays(birthdays.filter(item => item.id !== b.id))} className="text-sm font-medium text-[#b95b4b] hover:underline">Eliminar</button></div>)}</div></>}</div></div>}
      {authenticated && adminOpen && !editingBirthday && <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-2xl rounded-t-2xl border border-[#d9dce8] bg-white p-4 shadow-2xl sm:bottom-5 sm:rounded-2xl"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-[#17254e]">Modificar un registro</p><p className="text-xs text-[#81776e]">Selecciona un cumpleañero</p></div><div className="flex max-h-32 flex-wrap gap-2 overflow-auto">{filteredBirthdays.map(birthday => <div key={birthday.id} className="flex items-center gap-2 rounded-full border border-[#cbd2e5] pl-3 text-sm text-[#263b78]"><button onClick={() => startEditing(birthday)} className="py-2 hover:text-[#e87358]">{birthday.name}</button><button aria-label={`Eliminar ${birthday.name}`} onClick={() => deleteBirthday(birthday.id)} className="rounded-full p-2 text-[#a39a92] hover:bg-[#fbe9e3] hover:text-[#e87358]"><X /></button></div>)}</div></div>}
    </main>
  )
}
