import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, ExternalLink, FileText, BookmarkPlus, Loader2, AlertTriangle } from 'lucide-react'
import { apiGet, apiPut } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { RoadmapNodeDetail } from '@/types'

const BOOKMARK_TYPE_MAP: Record<string, { icon: string; label: string }> = {
  paper: { icon: '📄', label: '论文' },
  video: { icon: '🎬', label: '视频' },
  github: { icon: '📂', label: '仓库' },
  book: { icon: '📚', label: '书籍' },
}

const STATUS_OPTIONS = [
  { value: 'not_started', label: '未开始', icon: '○' },
  { value: 'in_progress', label: '进行中', icon: '◐' },
  { value: 'completed', label: '已完成', icon: '✓' },
] as const

export interface NodeDetailProps {
  nodeId: number
  onEdit: (data: {
    id: number
    title: string
    description: string | null
    icon: string | null
  }) => void
}

export function NodeDetail({ nodeId, onEdit }: NodeDetailProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: node, isLoading, isError } = useQuery({
    queryKey: ['roadmap', 'node', nodeId],
    queryFn: () => apiGet<RoadmapNodeDetail>(`/roadmap/nodes/${nodeId}`),
    enabled: !!nodeId,
  })

  const progressMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number
      status: 'not_started' | 'in_progress' | 'completed'
    }) => apiPut(`/roadmap/nodes/${id}/progress`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">加载节点详情...</p>
      </div>
    )
  }

  if (isError || !node) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
        <p className="text-red-500 mb-2">⚠️ 节点数据加载失败</p>
        <p className="text-sm text-muted-foreground">请尝试重新选择节点</p>
      </div>
    )
  }

  const currentStatus = node.progress?.status ?? 'not_started'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {node.icon && <span className="text-xl">{node.icon}</span>}
              <h1 className="text-xl font-bold text-foreground truncate">
                {node.title}
              </h1>
            </div>
            {node.stage && (
              <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                {node.stage}
              </span>
            )}
          </div>
          <button
            onClick={() =>
              onEdit({
                id: node.id,
                title: node.title,
                description: node.description,
                icon: node.icon,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors flex-shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            编辑
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Progress Status */}
        <section>
          <h3 className="text-sm font-medium text-foreground mb-3">学习状态</h3>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  progressMutation.mutate({ id: node.id, status: option.value })
                }
                disabled={progressMutation.isPending}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                  currentStatus === option.value
                    ? option.value === 'completed'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : option.value === 'in_progress'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-muted border-border text-muted-foreground'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted'
                )}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Description */}
        {node.description && (
          <section>
            <h3 className="text-sm font-medium text-foreground mb-2">描述</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {node.description}
            </p>
          </section>
        )}

        {/* Linked Notes */}
        <section>
          <h3 className="text-sm font-medium text-foreground mb-2">
            关联笔记
          </h3>
          {node.linked_notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无关联笔记</p>
          ) : (
            <div className="space-y-1.5">
              {node.linked_notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => navigate(`/notes?noteId=${note.id}`)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-left hover:bg-amber-50 transition-colors group"
                >
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate text-foreground">
                    {note.title}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() =>
              navigate(`/notes?new=true&linkNodeId=${node.id}`)
            }
            className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground hover:text-amber-700 transition-colors"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            添加笔记
          </button>
        </section>

        {/* Linked Bookmarks */}
        <section>
          <h3 className="text-sm font-medium text-foreground mb-2">
            关联资源
          </h3>
          {node.linked_bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无关联资源</p>
          ) : (
            <div className="space-y-1.5">
              {node.linked_bookmarks.map((bookmark) => {
                const typeInfo = BOOKMARK_TYPE_MAP[bookmark.type] ?? {
                  icon: '📎',
                  label: bookmark.type,
                }
                return (
                  <a
                    key={bookmark.id}
                    href={bookmark.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-amber-50 transition-colors group no-underline"
                  >
                    <span className="text-base flex-shrink-0">
                      {typeInfo.icon}
                    </span>
                    <span className="flex-1 truncate text-foreground">
                      {bookmark.title}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {typeInfo.label}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </a>
                )
              })}
            </div>
          )}
          <button
            onClick={() =>
              navigate(`/bookmarks?new=true&linkNodeId=${node.id}`)
            }
            className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground hover:text-amber-700 transition-colors"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            添加资源
          </button>
        </section>
      </div>
    </div>
  )
}
