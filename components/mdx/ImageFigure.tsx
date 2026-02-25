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
      <img src={src} alt={alt} className="w-full border border-gray-800 bg-gray-900/20" />
      {(caption || credit) && (
        <figcaption className="text-xs leading-relaxed text-gray-500">
          {caption && <span>{caption}</span>}
          {caption && credit && <span> </span>}
          {credit && <span>{credit}</span>}
        </figcaption>
      )}
    </figure>
  )
}
