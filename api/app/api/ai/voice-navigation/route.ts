import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ok, error } from '@/lib/api'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audio = formData.get('audio') as File | null
  const text = formData.get('text') as string | null

  if (!audio && !text) return error('Se requiere audio o texto', 400)

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  let prompt = ''

  if (audio) {
    const bytes = await audio.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: audio.type,
          data: base64,
        },
      },
      `Eres un asistente de navegacion urbana en Tijuana, Mexico.
      El usuario esta diciendo a donde quiere ir.
      
      Transcribe lo que dice e identifica el destino.
      
      Responde SOLO en formato JSON:
      {
        "transcripcion": "texto exacto de lo que dijo",
        "category": "hospital|banco|gobierno|super|farmacia|otro",
        "query": "termino de busqueda en español para Google Places",
        "entendido": true
      }
      
      Si no entiendes el destino, responde con "entendido": false y "category": "otro".`
    ])

    const text = result.response.text()
    const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
    return ok(JSON.parse(clean))
  }

  // Si viene texto directo (modo texto)
  const result = await model.generateContent([
    `Eres un asistente de navegacion urbana en Tijuana, Mexico.
    El usuario escribio: "${text}"
    
    Identifica a donde quiere ir.
    
    Responde SOLO en formato JSON:
    {
      "transcripcion": "${text}",
      "category": "hospital|banco|gobierno|super|farmacia|otro",
      "query": "termino de busqueda en español para Google Places",
      "entendido": true
    }
    
    Si no entiendes el destino, responde con "entendido": false.`
  ])

  const response = result.response.text()
  const clean = response.replace(/\`\`\`json|\`\`\`/g, '').trim()
  return ok(JSON.parse(clean))
}