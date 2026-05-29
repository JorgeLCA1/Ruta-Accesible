import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { z } from "zod";
import { ok, error } from "@/lib/api";
import { report } from "process";

const ReportSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    lat : z.number().min(-90).max(90),
    lng : z.number().min(-180).max(180),
    tipo_barrera : z.enum(["bache", "rampa_bloqueada", "banqueta_destruida", "semaforo_danado", "otro"]),
    metodo_ingreso : z.enum(["voz", "texto"]),
    descripcion : z.string().optional(),
    url_multimedia : z.string().url().optional(),
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const result = ReportSchema.safeParse(body);
    
    if (!result.success) return error(result.error.message, 400)
        const report = {
            ...result.data,
            estado: "Activo",
            confirmaciones: 0,
            negaciones: 0,
            createdAt: new Date().toISOString(),
        }
    const ref = await db.collection("reports").add(report)
    return ok({ id: ref.id, ...report }, 201)
}

//GET api/reports?lat=32.5&lng=-117.0&radius=5
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get("lat") ?? "0")
    const lng = parseFloat(searchParams.get("lng") ?? "0")
    const radius = parseFloat(searchParams.get("radius") ?? "5")
    const tipo = searchParams.get("tipo_barrera")

    if (!lat || !lng) return error("Latitud y longitud son requeridas", 400)

    const snapshot = await db.collection('reports')
        .where('estado', '!=', 'resuelto')
        .get()
    let reports = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((report: any) => haversine(lat, lng, report.lat, report.lng) <= radius)

    if (tipo) {
        reports = reports.filter((report: any) => report.tipo_barrera === tipo)
    }

    const sorted = reports
    .map((r: any) => ({
      ...r,
      distance_km: +haversine(lat, lng, r.lat, r.lng).toFixed(2),
    }))
    .sort((a: any, b: any) => a.distance_km - b.distance_km)

    return ok(sorted)
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));    
}
