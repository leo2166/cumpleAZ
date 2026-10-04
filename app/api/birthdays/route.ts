import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

type BirthdayInput = { name?: unknown; date?: unknown }

function isValidBirthday(input: BirthdayInput) {
  return (
    typeof input.name === 'string' &&
    input.name.trim().length > 0 &&
    typeof input.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.date)
  )
}

function authorized(request: Request) {
  const headerKey = request.headers.get('x-admin-key')
  return (
    Boolean(process.env.ADMIN_ACCESS_KEY) &&
    headerKey === process.env.ADMIN_ACCESS_KEY
  )
}

export async function GET() {
  const result = await pool.query(
    'SELECT id, name, date::text AS date FROM birthdays ORDER BY EXTRACT(MONTH FROM date), EXTRACT(DAY FROM date), name ASC'
  )
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = await request.json().catch(() => null) as BirthdayInput | null
  if (!body || !isValidBirthday(body)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const result = await pool.query(
    'INSERT INTO birthdays (name, date) VALUES ($1, $2) RETURNING id, name, date::text AS date',
    [(body.name as string).trim(), body.date]
  )
  return NextResponse.json(result.rows[0], { status: 201 })
}

export async function PUT(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = await request.json().catch(() => null) as (BirthdayInput & { id?: unknown }) | null
  if (!body || !isValidBirthday(body) || typeof body.id !== 'number') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const result = await pool.query(
    'UPDATE birthdays SET name = $1, date = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, date::text AS date',
    [(body.name as string).trim(), body.date, body.id]
  )
  if (!result.rows[0]) {
    return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
  }
  return NextResponse.json(result.rows[0])
}

export async function DELETE(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = await request.json().catch(() => null) as { id?: unknown } | null
  if (!body || typeof body.id !== 'number') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  await pool.query('DELETE FROM birthdays WHERE id = $1', [body.id])
  return NextResponse.json({ ok: true })
}
