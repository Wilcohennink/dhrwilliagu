import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const url = `http://127.0.0.1:3100/api/${path.join('/')}`
  const searchParams = req.nextUrl.searchParams.toString()
  const fullUrl = searchParams ? `${url}?${searchParams}` : url
  try {
    const res = await fetch(fullUrl)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Paperclip niet bereikbaar' }, { status: 502 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const url = `http://127.0.0.1:3100/api/${path.join('/')}`
  try {
    const body = await req.json()
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Paperclip niet bereikbaar' }, { status: 502 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const url = `http://127.0.0.1:3100/api/${path.join('/')}`
  try {
    const body = await req.json()
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Paperclip niet bereikbaar' }, { status: 502 })
  }
}
