import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const accessKey = typeof body?.accessKey === 'string' ? body.accessKey.trim() : ''
    const configuredKey = process.env.ADMIN_ACCESS_KEY ? process.env.ADMIN_ACCESS_KEY.trim() : ''

    if (!configuredKey || accessKey !== configuredKey) {
      return NextResponse.json({ valid: false, error: 'Clave incorrecta' }, { status: 401 })
    }

    return NextResponse.json({ valid: true })
  } catch (err) {
    console.error('[POST /api/admin/verify]', err)
    return NextResponse.json({ valid: false, error: 'Error interno de verificación' }, { status: 500 })
  }
}
