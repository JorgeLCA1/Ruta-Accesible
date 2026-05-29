import { NextRequest } from 'next/server'
import { ok, error } from '@/lib/api'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// GET /api/route?originLat=32.5&originLng=-117.0&destLat=32.6&destLng=-117.1
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const originLat = searchParams.get('originLat')
  const originLng = searchParams.get('originLng')
  const destLat = searchParams.get('destLat')
  const destLng = searchParams.get('destLng')

  if (!originLat || !originLng || !destLat || !destLng) {
    return error('originLat, originLng, destLat y destLng son requeridos', 400)
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=walking&language=es&key=${PLACES_API_KEY}`

  const response = await fetch(url)
  const data = await response.json()

  if (data.status !== 'OK') {
    return error(`Directions error: ${data.status}`, 500)
  }

  const points = data.routes[0]?.overview_polyline?.points ?? ''
  return ok({ points })
}
