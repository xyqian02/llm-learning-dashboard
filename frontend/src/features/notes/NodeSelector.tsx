import { useState } from 'react'
import { X, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RoadmapNode } from '@/types'

interface NodeSelectorProps {
  tree: RoadmapNode[]
  selectedNodeIds: number[]
  onToggle: (nodeId: number) => void
  onClose: () => void
}

interface TreeNodeItemProps {
  node: RoadmapNode
  selectedNodeIds: number[]
  onToggle: (nodeId: number) => void
  expandedIds: Set<number>
  onExpandToggle: (nodeId: number) => void
  depth?: number
}

function TreeNodeItem({
  node,
  selectedNodeIds,
  onToggle,
  expandedIds,
  onExpandToggle,
  depth = 0,
}: TreeNodeItemProps) {
  const isSelected = selectedNodeIds.includes(node.id)
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md py-1.5 pr-2 text-sm transition-colors hover:bg-muted/50',
          'cursor-pointer'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onToggle(node.id)}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExpandToggle(node.id)
            }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* Checkbox */}
        <div
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30'
          )}
        >
          {isSelected && (
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* 节点名称 */}
        <span className={cn('flex-1 truncate', isSelected ? 'font-medium text-primary' : 'text-foreground')}>
          {node.title}
        </span>

        {/* stage 标签 */}
        {node.stage && (
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {node.stage}
          </span>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              selectedNodeIds={selectedNodeIds}
              onToggle={onToggle}
              expandedIds={expandedIds}
              onExpandToggle={onExpandToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function NodeSelector({
  tree,
  selectedNodeIds,
  onToggle,
  onClose,
}: NodeSelectorProps) {
  // 默认展开第一层
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    const ids = new Set<number>()
    tree.forEach((node) => ids.add(node.id))
    return ids
  })

  const handleExpandToggle = (nodeId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const selectedCount = selectedNodeIds.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">关联学习节点</h3>
            {selectedCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                已选 {selectedCount} 个
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {tree.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无学习节点数据</p>
          ) : (
            tree.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                selectedNodeIds={selectedNodeIds}
                onToggle={onToggle}
                expandedIds={expandedIds}
                onExpandToggle={handleExpandToggle}
              />
            ))
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
