import { NextRequest } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { db } from '@/lib/firebase'
import { ok, error } from '@/lib/api'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const reportDoc = await db.collection('reports').doc(id).get()
  if (!reportDoc.exists) return error('Reporte no encontrado', 404)

  const formData = await req.formData()
  const file = formData.get('photo') as File

  if (!file) return error('No se recibió ningún archivo', 400)
  if (!file.type.startsWith('image/')) return error('Solo imágenes', 400)
  if (file.size > 5 * 1024 * 1024) return error('Máximo 5MB', 400)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'ruta-accesible', resource_type: 'image' },
      (error, result) => error ? reject(error) : resolve(result as any)
    ).end(buffer)
  })

  await db.collection('reports').doc(id).update({
    url_multimedia: result.secure_url
  })

  await db.collection('photos').add({
    url: result.secure_url,
    reportId: id,
    createdAt: new Date().toISOString(),
  })

  return ok({ url: result.secure_url }, 201)
}