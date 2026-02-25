import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export const dynamic = 'force-static'

export default async function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-light tracking-tight mb-8 text-center text-gray-100">
          Blog
        </h1>
        <p className="text-sm font-light text-gray-500 text-center mb-12">
          Occasional notes about time, presence, and building on the web.
        </p>
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="space-y-2">
              <h2 className="text-xl font-light tracking-tight text-gray-100">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:text-gray-300 transition-colors"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="text-xs font-light text-gray-500">
                {post.date}
              </p>
              {post.excerpt && (
                <p className="text-sm font-light text-gray-400 max-w-prose">
                  {post.excerpt}
                </p>
              )}
            </article>
          ))}
          {posts.length === 0 && (
            <p className="text-sm font-light text-gray-500">
              Nothing here yet. In time, words will arrive.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

