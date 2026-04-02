import { NextRequest, NextResponse } from 'next/server'

const PAPERCLIP_URL = process.env.PAPERCLIP_URL || 'http://204.168.221.20:3101'

async function proxyRequest(req: NextRequest, method: string, params: Promise<{ path: string[] }>) {
  const { path } = await params
  const url = `${PAPERCLIP_URL}/api/${path.join('/')}`
  const searchParams = req.nextUrl.searchParams.toString()
  const fullUrl = searchParams ? `${url}?${searchParams}` : url

  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }

    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const body = await req.json()
        options.body = JSON.stringify(body)
      } catch {
        // No body
      }
    }

    const res = await fetch(fullUrl, options)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Paperclip niet bereikbaar' }, { status: 502 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, 'GET', params)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, 'POST', params)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, 'PATCH', params)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, 'PUT', params)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, 'DELETE', params)
}
