import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ok, error } from '@/lib/api'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('photo') as File

  if (!file) return error('No se recibió ningún archivo', 400)
  if (!file.type.startsWith('image/')) return error('Solo imágenes', 400)

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: file.type,
        data: base64,
      },
    },
    `Eres un asistente de accesibilidad urbana en Tijuana, México.
    Analiza esta imagen y describe en español:
    1. Qué tipo de barrera u obstáculo peatonal hay (bache, rampa bloqueada, banqueta dañada, semáforo descompuesto, u otro)
    2. Una descripción breve del problema
    3. Nivel de peligro: bajo, medio o alto
    
    Responde SOLO en formato JSON así:
    {
      "tipo_barrera": "bache|rampa_bloqueada|banqueta|semaforo|otro",
      "descripcion": "descripción breve del problema",
      "nivel_peligro": "bajo|medio|alto"
    }`,
  ])

  const text = result.response.text()

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return ok(parsed)
  } catch {
    return error('No se pudo analizar la imagen', 500)
  }
}