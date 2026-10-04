# 🎂 CumpleAZ — Calendario de Cumpleaños

Aplicación web para la **Asociación de Jubilados y Pensionados CANTV del estado Zulia**.  
Permite visualizar y gestionar los cumpleañeros del mes en un calendario interactivo.

---

## 🚀 Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | PostgreSQL (via `pg`) |
| Fuentes | Playfair Display + Inter (Google Fonts) |
| Datos reactivos | SWR |
| Deploy | Vercel |

---

## ⚙️ Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Cadena de conexión a PostgreSQL (Vercel Postgres, Supabase, Neon, etc.)
DATABASE_URL=postgresql://usuario:contraseña@host:5432/nombre_db

# Clave secreta para el panel de administración
ADMIN_ACCESS_KEY=tu_clave_secreta_aqui
```

> ⚠️ **Nunca subas `.env.local` al repositorio.** Está correctamente ignorado en `.gitignore`.

---

## 🗄️ Esquema de base de datos

Ejecuta este SQL para crear la tabla requerida:

```sql
CREATE TABLE birthdays (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  date       DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🛠️ Desarrollo local

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

La app estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 📦 Deploy en Vercel

1. Conecta el repositorio en [vercel.com](https://vercel.com).
2. Agrega las variables de entorno `DATABASE_URL` y `ADMIN_ACCESS_KEY` en **Settings → Environment Variables**.
3. Haz push a `main` y Vercel desplegará automáticamente.

---

## 🔐 Panel de administración

El panel está protegido por la clave definida en `ADMIN_ACCESS_KEY`.  
Accede desde el botón **Administrar** en la esquina superior derecha.

Desde el panel puedes:
- Ver todos los registros con búsqueda en tiempo real
- Agregar nuevos cumpleañeros
- Editar nombre o fecha
- Eliminar registros

---

## 📄 Licencia

© 2026 Ing. Lucidio Fuenmayor. Todos los derechos reservados.
