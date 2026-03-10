import { notFound } from 'next/navigation'
import { compileMDX } from 'next-mdx-remote/rsc'
import BlogPostShell from '@/components/blog/BlogPostShell'
import getMDXComponents from '@/components/mdx/MDXComponents'
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
    components: getMDXComponents(),
  })

  return (
    <BlogPostShell
      title={post.meta.title}
      date={post.meta.date}
    >
      {content}
    </BlogPostShell>
  )
}

