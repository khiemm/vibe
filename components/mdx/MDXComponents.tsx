import type { MDXComponents } from 'mdx/types'

const components: MDXComponents = {
  h1: (props) => (
    <h1
      {...props}
      className="mt-8 text-3xl font-light tracking-tight text-gray-100"
    />
  ),
  h2: (props) => (
    <h2
      {...props}
      className="mt-8 text-2xl font-light tracking-tight text-gray-100"
    />
  ),
  p: (props) => (
    <p
      {...props}
      className="mt-4 text-base font-light leading-relaxed text-gray-300"
    />
  ),
  a: (props) => (
    <a
      {...props}
      className="underline decoration-gray-500 underline-offset-4 hover:text-gray-100 transition-colors"
    />
  ),
  ul: (props) => (
    <ul
      {...props}
      className="mt-4 list-disc list-inside space-y-1 text-gray-300"
    />
  ),
  ol: (props) => (
    <ol
      {...props}
      className="mt-4 list-decimal list-inside space-y-1 text-gray-300"
    />
  ),
  li: (props) => <li {...props} className="leading-relaxed" />,
  code: (props) => (
    <code
      {...props}
      className="rounded-sm bg-gray-900/60 px-1.5 py-0.5 text-xs text-gray-200"
    />
  ),
}

export default components

