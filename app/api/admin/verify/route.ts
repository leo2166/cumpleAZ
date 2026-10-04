import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const accessKey = typeof body?.accessKey === 'string' ? body.accessKey : ''
  const configuredKey = process.env.ADMIN_ACCESS_KEY

  if (!configuredKey || accessKey !== configuredKey) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  return NextResponse.json({ valid: true })
}
