type FlowProps = {
  nodes: string[]
}

export default function Flow({ nodes }: FlowProps) {
  if (!nodes.length) return null

  return (
    <ol className="mt-6 space-y-2" aria-label="Learning flow">
      {nodes.map((node, index) => (
        <li key={`${node}-${index}`} className="text-sm text-gray-300">
          <div className="border border-gray-800 bg-gray-900/30 px-3 py-2">{node}</div>
          {index < nodes.length - 1 && (
            <p className="py-1 text-center text-xs tracking-wide text-gray-500">-&gt;</p>
          )}
        </li>
      ))}
    </ol>
  )
}
