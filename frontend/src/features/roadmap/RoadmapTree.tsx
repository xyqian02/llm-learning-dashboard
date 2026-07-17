import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Plus, Search, X } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { RoadmapNode } from '@/types'

export interface RoadmapTreeProps {
  selectedId: number | null
  onSelect: (id: number) => void
  onContextMenu: (e: React.MouseEvent, node: RoadmapNode) => void
  onAddRoot: () => void
}

function StatusIcon({ status }: { status?: string }) {
  if (status === 'completed') {
    return (
      <span className="flex items-center justify-center w-5 h-5 text-emerald-600 flex-shrink-0">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <circle cx="10" cy="10" r="8" />
          <path
            d="M7 10l2 2 4-4"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="flex items-center justify-center w-5 h-5 text-amber-500 flex-shrink-0 animate-pulse">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M10 2a8 8 0 100 16V2z" />
        </svg>
      </span>
    )
  }
  // not_started
  return (
    <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-4 h-4 text-muted-foreground"
      >
        <circle cx="10" cy="10" r="8" />
      </svg>
    </span>
  )
}

interface TreeNodeProps {
  node: RoadmapNode
  level: number
  selectedId: number | null
  onSelect: (id: number) => void
  onContextMenu: (e: React.MouseEvent, node: RoadmapNode) => void
  searchTerm: string
}

function TreeNode({
  node,
  level,
  selectedId,
  onSelect,
  onContextMenu,
  searchTerm,
}: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  const isHighlighted =
    searchTerm && node.title.toLowerCase().includes(searchTerm.toLowerCase())

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors group select-none',
          'hover:bg-amber-50',
          selectedId === node.id && 'bg-amber-100 text-amber-800 font-medium'
        )}
        style={{ paddingLeft: level * 16 + 8 }}
        onClick={() => onSelect(node.id)}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }}
            className="flex items-center justify-center w-4 h-4 hover:bg-amber-200 rounded flex-shrink-0"
          >
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                isOpen && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <StatusIcon status={node.status} />

        <span
          className={cn(
            'text-sm truncate',
            isHighlighted && 'bg-amber-200 rounded px-1'
          )}
        >
          {node.title}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                searchTerm={searchTerm}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * 递归过滤树节点：如果节点标题匹配或其任一后代匹配，则保留该节点
 */
function filterTree(
  tree: RoadmapNode[],
  lowerTerm: string
): RoadmapNode[] {
  return tree
    .map((node) => {
      const titleMatch = node.title.toLowerCase().includes(lowerTerm)
      const filteredChildren = node.children
        ? filterTree(node.children, lowerTerm)
        : []

      if (titleMatch || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren }
      }
      return null
    })
    .filter((n): n is RoadmapNode => n !== null)
}

export function RoadmapTree({
  selectedId,
  onSelect,
  onContextMenu,
  onAddRoot,
}: RoadmapTreeProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['roadmap', 'tree'],
    queryFn: () => apiGet<RoadmapNode[]>('/roadmap/tree'),
    staleTime: 30_000,
  })

  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return tree
    return filterTree(tree, searchTerm.toLowerCase())
  }, [tree, searchTerm])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">学习路线</h2>
        </div>
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          加载中...
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">学习路线</h2>
        <button
          onClick={onAddRoot}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-amber-50 text-muted-foreground hover:text-amber-700 transition-colors"
          title="新增根节点"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索节点..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {filteredTree.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            {searchTerm ? '无匹配节点' : '暂无节点，点击上方 + 新增'}
          </div>
        ) : (
          filteredTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              selectedId={selectedId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>
    </div>
  )
}
