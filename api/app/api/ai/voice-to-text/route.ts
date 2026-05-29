import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ok, err } from '@/lib/api'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('audio') as File

  if (!file) return err('No se recibió ningún archivo de audio', 400)

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: file.type,
        data: base64,
      },
    },
    `Eres un asistente de accesibilidad urbana en Tijuana, México.
    El usuario está reportando un problema peatonal por voz.
    
    Transcribe exactamente lo que dice y clasifica el reporte.
    
    Responde SOLO en formato JSON así:
    {
      "transcripcion": "texto exacto de lo que dijo el usuario",
      "tipo_barrera": "bache|rampa_bloqueada|banqueta|semaforo|otro",
      "descripcion": "descripción limpia del problema mencionado",
      "nivel_peligro": "bajo|medio|alto"
    }`,
  ])

  const text = result.response.text()

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return ok(parsed)
  } catch {
    return err('No se pudo procesar el audio', 500)
  }
}