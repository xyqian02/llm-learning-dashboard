import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { RoadmapNode } from '@/types'

interface NodeSelectorProps {
  selected: number[]
  onChange: (ids: number[]) => void
}

function TreeNode({
  node,
  selected,
  onToggle,
  depth = 0,
}: {
  node: RoadmapNode
  selected: number[]
  onToggle: (id: number) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selected.includes(node.id)

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-1 rounded hover:bg-amber-50 cursor-pointer text-sm',
          isSelected && 'bg-amber-100 text-amber-800'
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => onToggle(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="p-0.5 hover:bg-amber-200 rounded flex-shrink-0"
            aria-label={expanded ? '折叠' : '展开'}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(node.id)}
          className="h-3.5 w-3.5 accent-amber-600 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
        <span className="truncate">{node.title}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selected={selected}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function NodeSelector({ selected, onChange }: NodeSelectorProps) {
  const { data: tree, isLoading, isError } = useQuery({
    queryKey: ['roadmap-tree'],
    queryFn: () => apiGet<RoadmapNode[]>('/roadmap/tree'),
    staleTime: 60_000,
  })

  const handleToggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-2">加载节点树...</p>
    )
  }

  if (isError || !tree || tree.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">暂无学习节点</p>
    )
  }

  return (
    <div className="border border-border rounded-lg p-2 max-h-48 overflow-y-auto bg-background">
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          selected={selected}
          onToggle={handleToggle}
        />
      ))}
    </div>
  )
}
