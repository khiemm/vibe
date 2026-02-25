type StepItem = {
  title: string
  detail?: string
}

type StepsProps = {
  items: StepItem[]
}

export default function Steps({ items }: StepsProps) {
  if (!items.length) return null

  return (
    <ol className="mt-6 space-y-3">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="border border-gray-800 bg-gray-900/30 p-4">
          <p className="text-sm tracking-wide text-gray-500">{String(index + 1).padStart(2, '0')}</p>
          <p className="mt-1 text-base font-light text-gray-100">{item.title}</p>
          {item.detail && (
            <p className="mt-1 text-sm leading-relaxed text-gray-400">{item.detail}</p>
          )}
        </li>
      ))}
    </ol>
  )
}
