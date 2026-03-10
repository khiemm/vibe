type SectionBreakProps = {
  label?: string
}

export default function SectionBreak({ label }: SectionBreakProps) {
  return (
    <div className="my-10">
      <div className="h-px w-full bg-[color:var(--site-border)]" />
      {label && (
        <p className="mt-2 text-center text-xs uppercase tracking-[0.14em] text-[color:var(--site-muted)]">{label}</p>
      )}
    </div>
  )
}
