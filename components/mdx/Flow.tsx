type FlowProps = {
  nodes?: string[] | string
}

function normalizeNodes(nodes: FlowProps['nodes']): string[] {
  if (Array.isArray(nodes)) return nodes.filter(Boolean)
  if (typeof nodes !== 'string') return []
  return nodes
    .split('||')
    .map((node) => node.trim())
    .filter(Boolean)
}

export default function Flow({ nodes }: FlowProps) {
  const normalizedNodes = normalizeNodes(nodes)
  if (!normalizedNodes.length) return null

  return (
    <ol className="mt-6 space-y-2" aria-label="Learning flow">
      {normalizedNodes.map((node, index) => (
        <li key={`${node}-${index}`} className="text-sm text-gray-300">
          <div className="border border-gray-800 bg-gray-900/30 px-3 py-2">{node}</div>
          {index < normalizedNodes.length - 1 && (
            <p className="py-1 text-center text-xs tracking-wide text-gray-500">-&gt;</p>
          )}
        </li>
      ))}
    </ol>
  )
}
