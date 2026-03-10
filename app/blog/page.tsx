import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export const dynamic = 'force-static'

export default async function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <h1 className="mb-8 text-center text-3xl font-light tracking-tight text-[color:var(--site-heading)]">
          Blog
        </h1>
        <p className="mb-12 text-center text-sm font-light text-[color:var(--site-muted)]">
          Occasional notes about time, presence, and building on the web.
        </p>
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="space-y-2">
              <h2 className="text-xl font-light tracking-tight text-[color:var(--site-heading)]">
                <Link
                  href={`/blog/${post.slug}`}
                  className="transition-colors hover:text-[color:var(--site-link-hover)]"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="text-xs font-light text-[color:var(--site-muted)]">
                {post.date}
              </p>
              {post.excerpt && (
                <p className="max-w-prose text-sm font-light text-[color:var(--site-text)]">
                  {post.excerpt}
                </p>
              )}
            </article>
          ))}
          {posts.length === 0 && (
            <p className="text-sm font-light text-[color:var(--site-muted)]">
              Nothing here yet. In time, words will arrive.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

