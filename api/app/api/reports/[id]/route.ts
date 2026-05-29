import { NextRequest } from "next/server";
import { db } from "@/lib/firebase";
import { z } from "zod";
import { ok, error } from "@/lib/api";
import { report } from "process";

// GET /api/reports/[id] - detalle de un reporte
export async function GET(
    _req: NextRequest,
    {params}: { params: { id: string } }
) {
    const doc = await db.collection("reports").doc(params.id).get()
    if (!doc.exists) return error("Reporte no encontrado", 404)
    return ok({ id: doc.id, ...doc.data() })
} 
