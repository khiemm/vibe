import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { cache } from 'react'

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
  return getAllPosts().map((post) => post.slug)
}

function readRawPostFromFile(fileName: string): RawPost {
  const fullPath = path.join(BLOG_DIR, fileName)
  const fileSlug = fileName.replace(/\.mdx$/, '')
  const fileContents = readFileSafe(fullPath)
  const { data, content } = matter(fileContents)

  const meta: BlogFrontmatter = {
    title: String(data.title ?? fileSlug),
    date: String(data.date ?? ''),
    slug: String(data.slug ?? fileSlug),
    excerpt: data.excerpt ? String(data.excerpt) : undefined,
  }

  return { meta, content }
}

const readAllRawPosts = cache((): RawPost[] => {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith('.mdx'))
  const posts = files.map((file) => readRawPostFromFile(file))
  const seen = new Set<string>()

  for (const post of posts) {
    if (!post.meta.slug.trim()) {
      throw new Error('Blog slug cannot be empty')
    }
    if (seen.has(post.meta.slug)) {
      throw new Error(`Duplicate blog slug found: "${post.meta.slug}"`)
    }
    seen.add(post.meta.slug)
  }

  return posts
})

export function getAllPosts(): BlogPostMeta[] {
  const posts = readAllRawPosts().map((post) => post.meta)

  return posts.sort((a, b) => {
    if (!a.date || !b.date) return 0
    return a.date < b.date ? 1 : -1
  })
}

export function getPostBySlug(slug: string): RawPost | null {
  const post = readAllRawPosts().find((item) => item.meta.slug === slug)
  return post ?? null
}

