# Ruta Accesible — Backend API

API REST para la aplicación **Ruta Accesible**, una plataforma de reportes colaborativos de barreras peatonales para adultos mayores y personas con discapacidad en Tijuana, Baja California.

Desarrollado para el **Google Hackathon 2026**.

---

##  Deploy

**Producción:** [`https://ruta-accesible.vercel.app`](https://ruta-accesible.vercel.app)

```bash
GET https://ruta-accesible.vercel.app/api/health
# → { "status": "ok", "time": "..." }
```

---

## Stack

| Tecnología | Uso |
|-----------|-----|
| **Next.js 16** | Framework backend (App Router + Route Handlers) |
| **Firebase Admin** | Firestore (base de datos) |
| **Google Places API** | Puntos de interés cercanos |
| **Gemini 2.5 Flash** | IA — análisis de fotos, voz a texto, navegación por voz |
| **Cloudinary** | Almacenamiento de fotos |
| **Vercel** | Deploy y hosting |
| **Zod** | Validación de datos |

---

##  Estructura del proyecto

```
api/
├── app/
│   └── api/
│       ├── health/
│       │   └── route.ts           # GET /api/health
│       ├── reports/
│       │   ├── route.ts           # GET y POST /api/reports
│       │   └── [id]/
│       │       ├── route.ts       # GET /api/reports/[id]
│       │       ├── validate/
│       │       │   └── route.ts   # POST /api/reports/[id]/validate
│       │       └── photos/
│       │           └── route.ts   # POST /api/reports/[id]/photos
│       ├── places/
│       │   └── route.ts           # GET /api/places
│       └── ai/
│           ├── describe-photo/
│           │   └── route.ts       # POST /api/ai/describe-photo
│           ├── voice-to-text/
│           │   └── route.ts       # POST /api/ai/voice-to-text
│           └── voice-navigation/
│               └── route.ts       # POST /api/ai/voice-navigation
├── lib/
│   ├── firebase.ts                # Inicialización Firebase Admin
│   ├── api.ts                     # Helpers ok() y err()
│   └── auth.ts                    # Verificación de tokens
├── proxy.ts                       # Middleware CORS
└── next.config.ts
```

---

##  Endpoints

### Health
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Verifica que el servidor está activo |

### Reportes
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/reports` | Lista reportes cercanos por lat/lng/radio |
| `POST` | `/api/reports` | Crea un nuevo reporte de barrera |
| `GET` | `/api/reports/[id]` | Detalle completo de un reporte |
| `POST` | `/api/reports/[id]/validate` | Confirma o niega si la barrera sigue activa |
| `POST` | `/api/reports/[id]/photos` | Sube foto del reporte a Cloudinary |

### Lugares
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/places` | Puntos de interés cercanos (Google Places) |

### Inteligencia Artificial
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/ai/describe-photo` | Gemini analiza una foto y describe la barrera |
| `POST` | `/api/ai/voice-to-text` | Gemini transcribe audio a reporte estructurado |
| `POST` | `/api/ai/voice-navigation` | Gemini entiende destino por voz o texto |

---

##  Instalación local

### Requisitos
- Node.js v18+
- Cuenta en Firebase
- API Keys: Google Places, Gemini, Cloudinary

### Pasos

```bash
# 1. Clonar el repo
git clone https://github.com/JorgeLCA1/Ruta-Accesible.git
cd Ruta-Accesible/api

# 2. Instalar dependencias
npm install

# 3. Crear variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales

# 4. Correr en desarrollo
npm run dev
```

### Variables de entorno

Crea un archivo `.env.local` en la carpeta `api/`:

```env
# Firebase
FIREBASE_PROJECT_ID="tu-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxx@tu-proyecto.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google
GOOGLE_PLACES_API_KEY="tu-api-key"

# Gemini
GEMINI_API_KEY="tu-api-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="tu-cloud-name"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"
```

>  Nunca subas `.env.local` al repositorio. Está incluido en `.gitignore`.

---

## 🗄️ Colecciones en Firestore

### `reports`
```json
{
  "userId": "string",
  "lat": "number",
  "lng": "number",
  "tipo_barrera": "bache | rampa_bloqueada | banqueta | semaforo | otro",
  "metodo_ingreso": "texto | voz",
  "descripcion": "string",
  "url_multimedia": "string (URL Cloudinary)",
  "estado": "activo | verificado | resuelto",
  "confirmaciones": "number",
  "negaciones": "number",
  "createdAt": "string (ISO)"
}
```

### `photos`
```json
{
  "url": "string (URL Cloudinary)",
  "reportId": "string",
  "createdAt": "string (ISO)"
}
```

### `validations`
```json
{
  "reportId": "string",
  "userId": "string",
  "confirma": "boolean",
  "fecha": "string (ISO)"
}
```

### `users`
```json
{
  "tipo_movilidad": "string",
  "reputacion": "number",
  "createdAt": "string (ISO)"
}
```

---

##  Integración con Gemini

### Descripción de foto
El usuario toma una foto de una barrera y Gemini detecta automáticamente:
- Tipo de barrera (`bache`, `rampa_bloqueada`, etc.)
- Descripción del problema
- Nivel de peligro (`bajo`, `medio`, `alto`)

### Voz a texto
El usuario graba un audio describiendo la barrera. Gemini transcribe y clasifica el reporte sin que el usuario escriba nada.

### Navegación por voz
El usuario dice "quiero ir al hospital más cercano". Gemini interpreta la intención y devuelve la categoría y query para buscar en Google Places.

---

##  Lógica de estados de reportes

```
activo ──→ verificado   (cuando confirmaciones >= 3)
activo ──→ resuelto     (cuando negaciones >= 5)
```

Los reportes con estado `resuelto` no aparecen en `GET /api/reports`.

---

##  Integración con FlutterFlow

La app móvil está construida con **FlutterFlow** y consume esta API via HTTP.

**Flujo principal de reporte con IA:**
1. Usuario presiona el botón gigante de reporte
2. Toma foto con la cámara
3. FlutterFlow llama `POST /api/ai/describe-photo`
4. Gemini devuelve tipo y descripción automáticamente
5. Usuario confirma y se crea el reporte con `POST /api/reports`
6. La foto se sube con `POST /api/reports/[id]/photos`

**Flujo de navegación por voz:**
1. Usuario presiona el micrófono
2. FlutterFlow llama `POST /api/ai/voice-navigation`
3. Gemini interpreta el destino
4. FlutterFlow llama `GET /api/places` con la categoría
5. Resultados aparecen como markers en el mapa

---

##  Equipo

Desarrollado para el Google Hackathon 2026 en Tijuana, Baja California.

- **Backend:** Next.js API — Jorge LCA
- **Frontend:** FlutterFlow — Itzel

---

##  Licencia

MIT