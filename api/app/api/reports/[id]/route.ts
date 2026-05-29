import { NextRequest } from 'next/server'
import { db } from '@/lib/firebase'
import { ok, error } from '@/lib/api'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doc = await db.collection('reports').doc(id).get()
  if (!doc.exists) return error('Reporte no encontrado', 404)
  return ok({ id: doc.id, ...doc.data() })
}