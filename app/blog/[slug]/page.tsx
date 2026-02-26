import { notFound } from 'next/navigation'
import { compileMDX } from 'next-mdx-remote/rsc'
import MDXComponents from '@/components/mdx/MDXComponents'
import { getAllPosts, getPostBySlug } from '@/lib/blog'

type Params = {
  slug: string
}

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const { content } = await compileMDX({
    source: post.content,
    components: MDXComponents,
  })

  return (
    <main className="relative isolate flex min-h-screen px-4 py-16">
      <div className="relative z-10 mx-auto my-auto w-full max-w-4xl">
        <header className="mb-10 space-y-2">
          <h1 className="text-3xl font-light tracking-tight text-gray-100">
            {post.meta.title}
          </h1>
          {post.meta.date && (
            <p className="text-xs font-light text-gray-500">
              {post.meta.date}
            </p>
          )}
        </header>
        <article className="prose prose-invert max-w-none">
          {content}
        </article>
      </div>
    </main>
  )
}

