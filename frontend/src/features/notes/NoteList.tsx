import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NoteListItem, Tag, PaginatedResponse } from '@/types'

interface NoteListProps {
  notesData: PaginatedResponse<NoteListItem> | undefined
  tags: Tag[]
  selectedNoteId: number | null
  selectedTagId: number | null
  search: string
  isLoading: boolean
  hasMore: boolean
  isFetchingNextPage: boolean
  onSelectNote: (id: number) => void
  onNew: () => void
  onSearchChange: (search: string) => void
  onTagChange: (tagId: number | null) => void
  onLoadMore: () => void
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`
  return date.toLocaleDateString('zh-CN')
}

function getContentPreview(content: string | undefined | null): string {
  if (!content) return ''
  return content.replace(/[#*`>\-[\]!\n\r]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)
}

export function NoteList({
  notesData,
  tags,
  selectedNoteId,
  selectedTagId,
  search,
  isLoading,
  hasMore,
  isFetchingNextPage,
  onSelectNote,
  onNew,
  onSearchChange,
  onTagChange,
  onLoadMore,
}: NoteListProps) {
  const [localSearch, setLocalSearch] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const handleSearchInput = useCallback(
    (value: string) => {
      setLocalSearch(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSearchChange(value)
      }, 300)
    },
    [onSearchChange]
  )

  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isFetchingNextPage, onLoadMore])

  const notes = notesData?.items ?? []

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* 搜索框 */}
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索笔记..."
            value={localSearch}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          onClick={onNew}
          className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          新建
        </button>
      </div>

      {/* 标签筛选 */}
      {tags.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-border px-3 py-2 scrollbar-thin">
          <button
            onClick={() => onTagChange(null)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              selectedTagId === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onTagChange(selectedTagId === tag.id ? null : tag.id)}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                selectedTagId === tag.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* 笔记列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && notes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-5xl">📝</div>
            <h3 className="text-sm font-medium text-gray-600">
              {search || selectedTagId ? '没有找到匹配的笔记' : '还没有笔记'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || selectedTagId
                ? '尝试调整搜索条件或清除筛选'
                : '点击上方"新建"开始创建'}
            </p>
          </div>
        ) : (
          <div>
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={cn(
                  'w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50',
                  selectedNoteId === note.id && 'bg-amber-50 hover:bg-amber-50'
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {note.title || '无标题'}
                  </h3>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatTime(note.updated_at)}
                  </span>
                </div>
                <p className="mb-1.5 line-clamp-2 text-xs text-muted-foreground">
                  {getContentPreview(note.content)}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}

            {/* 加载更多触发器 */}
            <div ref={loadMoreRef} className="flex items-center justify-center py-4">
              {isFetchingNextPage ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : hasMore ? (
                <button
                  onClick={onLoadMore}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  加载更多
                </button>
              ) : notes.length > 0 ? (
                <span className="text-xs text-muted-foreground">已加载全部笔记</span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
