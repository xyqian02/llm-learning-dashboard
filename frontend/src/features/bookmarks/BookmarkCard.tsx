import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Video,
  Code2,
  BookOpen,
  ExternalLink,
  Tag,
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Bookmark } from '@/types'

const typeIconMap = {
  paper: FileText,
  video: Video,
  github: Code2,
  book: BookOpen,
} as const

const typeColorMap = {
  paper: 'text-blue-500',
  video: 'text-red-500',
  github: 'text-purple-500',
  book: 'text-green-500',
} as const

const typeBgMap = {
  paper: 'bg-blue-50',
  video: 'bg-red-50',
  github: 'bg-purple-50',
  book: 'bg-green-50',
} as const

const typeActionLabel = {
  paper: '原文链接',
  video: '观看视频',
  github: 'GitHub',
  book: '配套仓库',
} as const

const READ_STATUS_OPTIONS = ['未读', '一刷', '二刷', '精读'] as const

interface BookmarkCardProps {
  bookmark: Bookmark
  onClick: () => void
  onStatusChange: (
    id: number,
    extra_fields: Record<string, unknown>
  ) => void
  onToggleRun: (
    id: number,
    extra_fields: Record<string, unknown>
  ) => void
}

export function BookmarkCard({
  bookmark,
  onClick,
  onStatusChange,
  onToggleRun,
}: BookmarkCardProps) {
  const navigate = useNavigate()
  const Icon = typeIconMap[bookmark.type]
  const colorClass = typeColorMap[bookmark.type]
  const bgClass = typeBgMap[bookmark.type]
  const extraFields: Record<string, unknown> =
    bookmark.extra_fields ?? {}

  const handleTitleClick = () => {
    if (bookmark.url) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer')
    } else {
      onClick()
    }
  }

  const handleOpenUrl = () => {
    if (bookmark.url) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleStatusChange = (status: string) => {
    onStatusChange(bookmark.id, { ...extraFields, read_status: status })
  }

  const handleToggleRunClick = () => {
    const current = extraFields.run_status === '已跑通'
    onToggleRun(bookmark.id, {
      ...extraFields,
      run_status: current ? '未跑通' : '已跑通',
    })
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card p-5',
        'hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer',
        'flex flex-col'
      )}
      onClick={onClick}
    >
      {/* Type icon with colored background */}
      <div
        className={cn(
          'mb-3 w-10 h-10 rounded-lg flex items-center justify-center',
          bgClass
        )}
      >
        <Icon className={cn('h-5 w-5', colorClass)} />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-base font-semibold text-foreground leading-snug flex items-start gap-1.5">
        <span
          className="flex-1 hover:text-amber-600 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            handleTitleClick()
          }}
          title={bookmark.url ? '在新标签页打开' : '查看详情'}
        >
          {bookmark.title}
        </span>
        {bookmark.url && (
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-1" />
        )}
      </h3>

      {/* Type-specific info */}
      <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
        {/* Paper */}
        {bookmark.type === 'paper' && (
          <>
            {(extraFields.author || extraFields.year) && (
              <p>
                {extraFields.author ? (extraFields.author as string) : ''}
                {extraFields.author && extraFields.year ? ' · ' : ''}
                {extraFields.year ? (extraFields.year as string) : ''}
              </p>
            )}
            {extraFields.conference && (
              <p className="font-medium">
                {extraFields.conference as string}
              </p>
            )}
          </>
        )}

        {/* Video */}
        {bookmark.type === 'video' && (
          <p>
            {extraFields.platform
              ? (extraFields.platform as string)
              : '视频'}
            {extraFields.author
              ? ` · ${extraFields.author as string}`
              : ''}
          </p>
        )}

        {/* GitHub */}
        {bookmark.type === 'github' && (
          <p>
            {extraFields.stars
              ? `⭐ ${extraFields.stars as string}`
              : ''}
            {extraFields.language
              ? `${extraFields.stars ? ' · ' : ''}${extraFields.language as string}`
              : ''}
          </p>
        )}

        {/* Book */}
        {bookmark.type === 'book' && (
          <>
            {extraFields.author && (
              <p>作者：{extraFields.author as string}</p>
            )}
          </>
        )}
      </div>

      {/* URL action button */}
      {bookmark.url && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleOpenUrl()
          }}
          className="text-xs text-amber-600 hover:text-amber-700 font-medium mb-2 transition-colors text-left"
        >
          🔗 {typeActionLabel[bookmark.type]}
        </button>
      )}

      {/* Tags */}
      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <Tag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          {bookmark.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Linked nodes */}
      {bookmark.linked_nodes && bookmark.linked_nodes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          {bookmark.linked_nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/roadmap?nodeId=${node.id}`)
              }}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
              title={`跳转到：${node.title}`}
            >
              {node.title}
            </button>
          ))}
        </div>
      )}

      {/* Spacer to push controls to bottom */}
      <div className="flex-1" />

      {/* Status controls */}
      {(bookmark.type === 'paper' || bookmark.type === 'book') && (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={(extraFields.read_status as string) || '未读'}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer w-full"
          >
            {READ_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      )}

      {bookmark.type === 'github' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleToggleRunClick}
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 flex-shrink-0',
              extraFields.run_status === '已跑通'
                ? 'bg-green-500'
                : 'bg-gray-300'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm',
                extraFields.run_status === '已跑通'
                  ? 'translate-x-4'
                  : 'translate-x-0.5'
              )}
            />
          </button>
          <span className="text-xs text-muted-foreground">
            {extraFields.run_status === '已跑通' ? '已跑通' : '未跑通'}
          </span>
        </div>
      )}
    </div>
  )
}
