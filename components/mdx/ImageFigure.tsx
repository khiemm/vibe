type ImageFigureProps = {
  src: string
  alt: string
  caption?: string
  credit?: string
}

export default function ImageFigure({
  src,
  alt,
  caption,
  credit,
}: ImageFigureProps) {
  return (
    <figure className="mt-8 space-y-2">
      <img src={src} alt={alt} className="w-full border border-[color:var(--site-border)] bg-[color:var(--site-surface)]" />
      {(caption || credit) && (
        <figcaption className="text-xs leading-relaxed text-[color:var(--site-muted)]">
          {caption && <span>{caption}</span>}
          {caption && credit && <span> </span>}
          {credit && <span>{credit}</span>}
        </figcaption>
      )}
    </figure>
  )
}
