import { NextRequest } from 'next/server'
import { db } from '@/lib/firebase'
import { ok, error } from '@/lib/api'
import { z } from 'zod'

const ValidateSchema = z.object({
  userId:   z.string().min(1),
  confirma: z.boolean(), // true = sigue ahí, false = ya no está
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json()
  const result = ValidateSchema.safeParse(body)
  if (!result.success) return error(result.error.message, 400)

  const { userId, confirma } = result.data
  const { id } = await params

  // Verificar que el reporte existe
  const reportRef = db.collection('reports').doc(id)
  const reportDoc = await reportRef.get()
  if (!reportDoc.exists) return error('Reporte no encontrado', 404)

  // Evitar que el mismo usuario valide dos veces
  const existing = await db.collection('validations')
    .where('reportId', '==', id)
    .where('userId', '==', userId)
    .get()

  if (!existing.empty) return error('Ya validaste este reporte', 409)

  // Guardar validación
  await db.collection('validations').add({
    reportId: id,
    userId,
    confirma,
    fecha: new Date().toISOString(),
  })

  // Actualizar contadores en el reporte
  const data = reportDoc.data() as any
  const confirmaciones = data.confirmaciones + (confirma ? 1 : 0)
  const negaciones = data.negaciones + (confirma ? 0 : 1)

  // Si 5 o más niegan, marcar como resuelto
  const estado = negaciones >= 5 ? 'resuelto' : data.estado

  await reportRef.update({ confirmaciones, negaciones, estado })

  // Sumar reputación al usuario que reportó si confirman
  if (confirma) {
    const userRef = db.collection('users').doc(data.userId)
    const userDoc = await userRef.get()
    if (userDoc.exists) {
      await userRef.update({
        reputacion: (userDoc.data() as any).reputacion + 1
      })
    }
  }

  return ok({ confirmaciones, negaciones, estado })
}