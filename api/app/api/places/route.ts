import { NextRequest } from 'next/server'
import { ok, error } from '@/lib/api'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// GET /api/places?lat=32.5&lng=-117.0&category=hospital
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const category = searchParams.get('category') ?? 'hospital'

  if (!lat || !lng) return error('lat y lng son requeridos', 400)

  // Mapear categorías a tipos de Google Places
  const typeMap: Record<string, string> = {
    hospital: 'hospital',
    banco: 'bank',
    gobierno: 'local_government_office',
    super: 'supermarket',
    farmacia: 'pharmacy',
  }

  const type = typeMap[category] ?? 'hospital'

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=${type}&language=es&key=${PLACES_API_KEY}`

  const response = await fetch(url)
  const data = await response.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    return error(`Google Places error: ${data.status}`, 500)
  }

  const places = data.results.map((p: any) => ({
    id: p.place_id,
    name: p.name,
    category,
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
    address: p.vicinity,
    rating: p.rating ?? null,
    open_now: p.opening_hours?.open_now ?? null,
  }))

  return ok(places)
}