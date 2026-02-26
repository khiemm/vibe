type BackgroundImageSectionProps = {
  src: string
  alt: string
  darkness?: 'light' | 'medium' | 'strong'
}

const DARKNESS_CLASSES: Record<NonNullable<BackgroundImageSectionProps['darkness']>, string> = {
  light: 'bg-black/30',
  medium: 'bg-black/55',
  strong: 'bg-black/70',
}

export default function BackgroundImageSection({
  src,
  alt,
  darkness = 'medium',
}: BackgroundImageSectionProps) {
  const backgroundImage = src ? `url(${src})` : undefined

  return (
    <>
      <span className="sr-only">{alt}</span>
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage }}
        />
        <div className={`absolute inset-0 ${DARKNESS_CLASSES[darkness]}`} />
      </div>
    </>
  )
}
