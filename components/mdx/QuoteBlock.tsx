type QuoteBlockProps = {
  quote: string
  author?: string
}

export default function QuoteBlock({ quote, author }: QuoteBlockProps) {
  return (
    <blockquote className="mt-8 border-l border-gray-700 pl-4 text-gray-300">
      <p className="text-base font-light italic">{quote}</p>
      {author && <footer className="mt-2 text-xs tracking-wide text-gray-500">{author}</footer>}
    </blockquote>
  )
}
