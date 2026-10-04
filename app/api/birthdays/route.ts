import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// ── Pool perezoso: solo se crea cuando se necesita ──────────────────────────
// Esto evita que Vercel falle al importar el módulo si DATABASE_URL no está.
let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    const connStr = process.env.DATABASE_URL
    if (!connStr || !connStr.trim()) {
      throw new Error('DATABASE_URL no configurada en las variables de entorno del servidor.')
    }

    const requiresSsl =
      process.env.NODE_ENV === 'production' ||
      connStr.includes('sslmode=require') ||
      connStr.includes('supabase') ||
      connStr.includes('neon.tech') ||
      connStr.includes('pooler.supabase')

    _pool = new Pool({
      connectionString: connStr.trim(),
      ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 10000,
    })
  }
  return _pool
}

type BirthdayInput = { name?: unknown; date?: unknown }

function isValidBirthday(input: BirthdayInput) {
  return (
    typeof input.name === 'string' &&
    input.name.trim().length > 0 &&
    typeof input.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}/.test(input.date)
  )
}

function authorized(request: Request) {
  const headerKey = request.headers.get('x-admin-key')
  const configuredKey = process.env.ADMIN_ACCESS_KEY
  return (
    Boolean(configuredKey) &&
    headerKey?.trim() === configuredKey?.trim()
  )
}

export async function GET() {
  try {
    const result = await getPool().query(
      'SELECT id, name, date::text AS date FROM birthdays ORDER BY EXTRACT(MONTH FROM date), EXTRACT(DAY FROM date), name ASC'
    )
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('[GET /api/birthdays]', err)
    return NextResponse.json(
      { error: 'No se pudo conectar a la base de datos.' },
      { status: 503 }
    )
  }
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const body = await request.json().catch(() => null) as BirthdayInput | null
    if (!body || !isValidBirthday(body)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    const cleanDate = typeof body.date === 'string' ? body.date.slice(0, 10) : ''
    const result = await getPool().query(
      'INSERT INTO birthdays (name, date) VALUES ($1, $2) RETURNING id, name, date::text AS date',
      [(body.name as string).trim(), cleanDate]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err) {
    console.error('[POST /api/birthdays]', err)
    return NextResponse.json({ error: 'Error al guardar el registro.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const body = await request.json().catch(() => null) as (BirthdayInput & { id?: unknown }) | null
    if (!body || !isValidBirthday(body) || typeof body.id !== 'number') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    const cleanDate = typeof body.date === 'string' ? body.date.slice(0, 10) : ''
    const result = await getPool().query(
      'UPDATE birthdays SET name = $1, date = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, date::text AS date',
      [(body.name as string).trim(), cleanDate, body.id]
    )
    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('[PUT /api/birthdays]', err)
    return NextResponse.json({ error: 'Error al actualizar el registro.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const body = await request.json().catch(() => null) as { id?: unknown } | null
    if (!body || typeof body.id !== 'number') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    await getPool().query('DELETE FROM birthdays WHERE id = $1', [body.id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/birthdays]', err)
    return NextResponse.json({ error: 'Error al eliminar el registro.' }, { status: 500 })
  }
}
