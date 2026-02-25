import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export type BlogFrontmatter = {
  title: string
  date: string
  slug: string
  excerpt?: string
}

export type BlogPostMeta = BlogFrontmatter

type RawPost = {
  meta: BlogFrontmatter
  content: string
}

function readFileSafe(filePath: string) {
  return fs.readFileSync(filePath, 'utf8')
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
}

function readRawPost(slug: string): RawPost {
  const fullPath = path.join(BLOG_DIR, `${slug}.mdx`)
  const fileContents = readFileSafe(fullPath)
  const { data, content } = matter(fileContents)

  const meta: BlogFrontmatter = {
    title: String(data.title ?? slug),
    date: String(data.date ?? ''),
    slug: String(data.slug ?? slug),
    excerpt: data.excerpt ? String(data.excerpt) : undefined,
  }

  return { meta, content }
}

export function getAllPosts(): BlogPostMeta[] {
  const slugs = getPostSlugs()
  const posts = slugs.map((slug) => readRawPost(slug).meta)

  return posts.sort((a, b) => {
    if (!a.date || !b.date) return 0
    return a.date < b.date ? 1 : -1
  })
}

export function getPostBySlug(slug: string): RawPost {
  return readRawPost(slug)
}

