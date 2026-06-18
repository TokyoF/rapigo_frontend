# RapiGo — Frontend

Next.js 16 · App Router · TypeScript · Tailwind v4 · pnpm

## Requisitos

- Node.js >= 20
- pnpm >= 9

## Instalación

```bash
pnpm install
```

## Variables de entorno

Copia el archivo de ejemplo y ajusta los valores si es necesario:

```bash
cp .env.example .env.local
```

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend Spring Boot | `http://localhost:8080` |
| `NEXT_PUBLIC_JENKINS_URL` | URL del servidor Jenkins | `http://localhost:8081` |

## Ejecutar en desarrollo

```bash
pnpm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Vista principal — catálogo de restaurantes, menú y carrito |
| `/ops` | Centro de Operaciones — tickets, estado Jenkins y KPIs |

## Demo de bugs intencionales

La aplicación expone tres bugs del backend de forma visible:

- **RG-204** — Aplicar el cupón `DELI10` varias veces acumula descuentos; el total puede volverse negativo.
- **RG-205** — El total del checkout no incluye el costo de envío (S/5.00).
- **RG-207** — Buscar restaurantes con la cocina en minúscula (p. ej. `pizza`) no devuelve resultados; el chip "Pizza" (capitalizado) sí funciona.
