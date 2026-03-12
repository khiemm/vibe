import { vi, describe, it, expect, beforeEach } from 'vitest'

// cache() must be a pass-through so the memoized wrapper doesn't hide fs calls between tests
vi.mock('react', () => ({ cache: (fn: unknown) => fn }))
vi.mock('fs')

import fs from 'fs'
import { getAllPosts, getPostBySlug, getPostSlugs } from '@/lib/blog'

const mockExistsSync = vi.mocked(fs.existsSync)
const mockReaddirSync = vi.mocked(fs.readdirSync)
const mockReadFileSync = vi.mocked(fs.readFileSync)

function makeMdx(frontmatter: Record<string, string>, content = 'body'): string {
  const lines = Object.entries(frontmatter).map(([k, v]) => `${k}: "${v}"`)
  return `---\n${lines.join('\n')}\n---\n${content}`
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('getAllPosts', () => {
  it('returns empty array when blog directory does not exist', async () => {
    mockExistsSync.mockReturnValue(false)

    const { getAllPosts: fresh } = await import('@/lib/blog')
    expect(fresh()).toEqual([])
  })

  it('returns posts sorted by date descending', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['a.mdx', 'b.mdx', 'c.mdx'] as unknown as ReturnType<typeof fs.readdirSync>)
    mockReadFileSync
      .mockReturnValueOnce(makeMdx({ title: 'A', date: '2024-01-01', slug: 'a' }))
      .mockReturnValueOnce(makeMdx({ title: 'B', date: '2024-03-01', slug: 'b' }))
      .mockReturnValueOnce(makeMdx({ title: 'C', date: '2024-02-01', slug: 'c' }))

    const { getAllPosts: fresh } = await import('@/lib/blog')
    const posts = fresh()

    expect(posts.map((p) => p.slug)).toEqual(['b', 'c', 'a'])
  })

  it('throws when a slug is empty', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['bad.mdx'] as unknown as ReturnType<typeof fs.readdirSync>)
    mockReadFileSync.mockReturnValueOnce(makeMdx({ title: 'Bad', date: '2024-01-01', slug: '   ' }))

    const { getAllPosts: fresh } = await import('@/lib/blog')
    expect(() => fresh()).toThrow('Blog slug cannot be empty')
  })

  it('throws when two posts share the same slug', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['x.mdx', 'y.mdx'] as unknown as ReturnType<typeof fs.readdirSync>)
    mockReadFileSync
      .mockReturnValueOnce(makeMdx({ title: 'X', date: '2024-01-01', slug: 'same' }))
      .mockReturnValueOnce(makeMdx({ title: 'Y', date: '2024-02-01', slug: 'same' }))

    const { getAllPosts: fresh } = await import('@/lib/blog')
    expect(() => fresh()).toThrow('Duplicate blog slug found: "same"')
  })

  it('falls back to filename as slug when slug frontmatter is missing', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['my-post.mdx'] as unknown as ReturnType<typeof fs.readdirSync>)
    mockReadFileSync.mockReturnValueOnce('---\ntitle: "My Post"\n---\nbody')

    const { getAllPosts: fresh } = await import('@/lib/blog')
    const posts = fresh()

    expect(posts[0].slug).toBe('my-post')
  })
})

describe('getPostSlugs', () => {
  it('returns only the slug strings', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['p1.mdx', 'p2.mdx'] as unknown as ReturnType<typeof fs.readdirSync>)
    mockReadFileSync
      .mockReturnValueOnce(makeMdx({ title: 'P1', date: '2024-01-01', slug: 'p1' }))
      .mockReturnValueOnce(makeMdx({ title: 'P2', date: '2024-02-01', slug: 'p2' }))

    const { getPostSlugs: fresh } = await import('@/lib/blog')
    expect(fresh()).toEqual(expect.arrayContaining(['p1', 'p2']))
  })
})

describe('getPostBySlug', () => {
  it('returns the matching post with content', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['hello.mdx'] as unknown as ReturnType<typeof fs.readdirSync>)
    mockReadFileSync.mockReturnValueOnce(makeMdx({ title: 'Hello', date: '2024-01-01', slug: 'hello' }, 'Hello world'))

    const { getPostBySlug: fresh } = await import('@/lib/blog')
    const post = fresh('hello')

    expect(post).not.toBeNull()
    expect(post?.meta.title).toBe('Hello')
    expect(post?.content).toContain('Hello world')
  })

  it('returns null for an unknown slug', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['hello.mdx'] as unknown as ReturnType<typeof fs.readdirSync>)
    mockReadFileSync.mockReturnValueOnce(makeMdx({ title: 'Hello', date: '2024-01-01', slug: 'hello' }))

    const { getPostBySlug: fresh } = await import('@/lib/blog')
    expect(fresh('nope')).toBeNull()
  })
})
