type SectionBreakProps = {
  label?: string
}

export default function SectionBreak({ label }: SectionBreakProps) {
  return (
    <div className="my-10">
      <div className="h-px w-full bg-gray-800" />
      {label && (
        <p className="mt-2 text-center text-xs uppercase tracking-[0.14em] text-gray-500">
          {label}
        </p>
      )}
    </div>
  )
}
