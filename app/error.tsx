'use client'

import { useEffect } from 'react'
import { Sparkles, RotateCcw } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error no capturado en la aplicación:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-[#fbfaf8] flex items-center justify-center p-5 text-[#292523]">
      <div className="max-w-md w-full rounded-2xl border border-[#e9e3dc] bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#fbe9e3] text-[#e87358]">
          <Sparkles className="size-7" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#263b78] mb-1">
          Asociación de Jubilados CANTV Zulia
        </p>
        <h1 className="font-serif text-2xl font-bold text-[#17254e] mb-3">
          Ocurrió un inconveniente
        </h1>
        <p className="text-sm text-[#6f665f] mb-6 leading-relaxed">
          La aplicación encontró una situación inesperada al cargar los datos. Puedes intentar recargar la vista.
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#e87358] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#c65b45] active:scale-[0.98] transition"
          >
            <RotateCcw className="size-4" />
            Reintentar
          </button>
          <a
            href="/"
            className="text-xs font-medium text-[#263b78] hover:underline py-1"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </main>
  )
}
