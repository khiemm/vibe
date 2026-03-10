type YouTubeEmbedProps = {
  videoId: string
  title: string
  href?: string
  note?: string
}

export default function YouTubeEmbed({
  videoId,
  title,
  href,
  note,
}: YouTubeEmbedProps) {
  const videoHref = href ?? `https://www.youtube.com/watch?v=${videoId}`

  return (
    <section className="mt-8 space-y-3">
      <div className="overflow-hidden border border-[color:var(--site-border)] bg-[color:var(--site-surface)]">
        <div className="aspect-video">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={videoHref}
          target="_blank"
          rel="noreferrer"
          className="inline-block border border-[color:var(--site-border)] bg-[color:var(--site-surface)] px-4 py-2 text-sm text-[color:var(--site-heading)] transition-colors hover:bg-[color:var(--site-surface-hover)]"
        >
          {title}
        </a>
        {note && (
          <span className="text-xs text-[color:var(--site-muted)]">{note}</span>
        )}
      </div>
    </section>
  )
}
