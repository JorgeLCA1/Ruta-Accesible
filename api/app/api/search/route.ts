import { NextRequest } from 'next/server'
import { ok, error } from '@/lib/api'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// GET /api/search?q=hospital+general&lat=32.5&lng=-117.0
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!q) return error('q es requerido', 400)

  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&language=es&key=${PLACES_API_KEY}`

  if (lat && lng) {
    url += `&location=${lat},${lng}&radius=5000`
  }

  const response = await fetch(url)
  const data = await response.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    return error(`Google Places error: ${data.status}`, 500)
  }

  const places = (data.results ?? []).map((p: any) => ({
    id: p.place_id,
    name: p.name,
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
    address: p.formatted_address ?? p.vicinity ?? 'Sin dirección',
    rating: p.rating ?? null,
    open_now: p.opening_hours?.open_now ?? null,
  }))

  return ok(places)
}
