import { ReactNode } from 'react'

type CompareProps = {
  leftTitle: string
  rightTitle: string
  left: ReactNode
  right: ReactNode
}

export default function Compare({
  leftTitle,
  rightTitle,
  left,
  right,
}: CompareProps) {
  return (
    <section className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="border border-gray-800 bg-gray-900/30 p-4">
        <h3 className="text-xs uppercase tracking-[0.12em] text-gray-400">{leftTitle}</h3>
        <div className="mt-2 text-sm leading-relaxed text-gray-300">{left}</div>
      </div>
      <div className="border border-gray-800 bg-gray-900/30 p-4">
        <h3 className="text-xs uppercase tracking-[0.12em] text-gray-400">{rightTitle}</h3>
        <div className="mt-2 text-sm leading-relaxed text-gray-300">{right}</div>
      </div>
    </section>
  )
}
