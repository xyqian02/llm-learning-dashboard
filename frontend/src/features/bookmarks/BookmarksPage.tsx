import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Star,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react'
import { apiGet, apiPut } from '@/lib/api'
import { cn } from '@/lib/utils'
import { BookmarkCard } from './BookmarkCard'
import { BookmarkDialog } from './BookmarkDialog'
import type { Bookmark, Tag } from '@/types'

// ---- Constants ----

const BOOKMARK_TYPES = [
  { value: 'paper', label: '论文' },
  { value: 'video', label: '视频' },
  { value: 'github', label: 'GitHub' },
  { value: 'book', label: '书籍' },
] as const

const PAGE_SIZE = 20

// ---- Types ----

interface PaginatedResponse {
  items: Bookmark[]
  total: number
  page: number
  page_size: number
}

// ---- Helper: fetch count for a single type ----

function useTypeCount(type: string) {
  return useQuery({
    queryKey: ['bookmarks-count', type],
    queryFn: () =>
      apiGet<PaginatedResponse>(`/bookmarks?type=${type}&page_size=1`),
    select: (data) => data.total,
    staleTime: 30_000,
  })
}

// ---- Main Component ----

export function BookmarksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  // ---- Read URL state ----
  const activeType = searchParams.get('type') || 'paper'
  const search = searchParams.get('search') || ''
  const tagId = searchParams.get('tag_id') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const isNew = searchParams.get('new') === 'true'
  const linkNodeId = searchParams.get('linkNodeId')
    ? parseInt(searchParams.get('linkNodeId')!, 10)
    : undefined

  // ---- Local UI state ----
  const [searchInput, setSearchInput] = useState(search)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [dialogDefaultLinkNodeId, setDialogDefaultLinkNodeId] = useState<
    number | undefined
  >(undefined)

  // Sync searchInput when URL search changes externally
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  // ---- Fetch type counts ----
  const paperCount = useTypeCount('paper')
  const videoCount = useTypeCount('video')
  const githubCount = useTypeCount('github')
  const bookCount = useTypeCount('book')

  // ---- Fetch tags (for filter toolbar) ----
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiGet<Tag[]>('/tags'),
    staleTime: 30_000,
  })

  // ---- Fetch bookmarks list ----
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bookmarks', { type: activeType, search, tagId, page }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('type', activeType)
      params.set('page', page.toString())
      params.set('page_size', PAGE_SIZE.toString())
      if (search) params.set('search', search)
      if (tagId) params.set('tag_id', tagId)
      return apiGet<PaginatedResponse>(`/bookmarks?${params.toString()}`)
    },
    placeholderData: (prev) => prev,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // ---- Status update mutation ----
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      extra_fields,
    }: {
      id: number
      extra_fields: Record<string, unknown>
    }) => apiPut(`/bookmarks/${id}`, { extra_fields }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })

  // ---- Handlers ----

  const handleTypeChange = useCallback(
    (type: string) => {
      const params = new URLSearchParams()
      params.set('type', type)
      params.set('page', '1')
      if (search) params.set('search', search)
      if (tagId) params.set('tag_id', tagId)
      setSearchParams(params)
    },
    [setSearchParams, search, tagId]
  )

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams()
    params.set('type', activeType)
    params.set('page', '1')
    if (searchInput.trim()) params.set('search', searchInput.trim())
    if (tagId) params.set('tag_id', tagId)
    setSearchParams(params)
  }, [setSearchParams, activeType, searchInput, tagId])

  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    const params = new URLSearchParams()
    params.set('type', activeType)
    params.set('page', '1')
    if (tagId) params.set('tag_id', tagId)
    setSearchParams(params)
  }, [setSearchParams, activeType, tagId])

  const handleTagFilter = useCallback(
    (tid: string) => {
      const params = new URLSearchParams()
      params.set('type', activeType)
      params.set('page', '1')
      if (search) params.set('search', search)
      if (tid === tagId) {
        // Toggle off
      } else {
        params.set('tag_id', tid)
      }
      setSearchParams(params)
    },
    [setSearchParams, activeType, search, tagId]
  )

  const handleClearTag = useCallback(() => {
    const params = new URLSearchParams()
    params.set('type', activeType)
    params.set('page', '1')
    if (search) params.set('search', search)
    setSearchParams(params)
  }, [setSearchParams, activeType, search])

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams)
      params.set('page', newPage.toString())
      setSearchParams(params)
    },
    [setSearchParams, searchParams]
  )

  const handleOpenNew = useCallback(() => {
    setEditingBookmark(null)
    setDialogDefaultLinkNodeId(undefined)
    setDialogOpen(true)
  }, [])

  const handleOpenEdit = useCallback((bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setDialogDefaultLinkNodeId(undefined)
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
    setEditingBookmark(null)
  }, [])

  const handleStatusChange = useCallback(
    (id: number, extra_fields: Record<string, unknown>) => {
      updateMutation.mutate({ id, extra_fields })
    },
    [updateMutation]
  )

  const handleToggleRun = useCallback(
    (id: number, extra_fields: Record<string, unknown>) => {
      updateMutation.mutate({ id, extra_fields })
    },
    [updateMutation]
  )

  // Open dialog for ?new=true on mount
  useEffect(() => {
    if (isNew && !dialogOpen) {
      setDialogDefaultLinkNodeId(linkNodeId)
      setDialogOpen(true)
      // Clean the URL params
      const params = new URLSearchParams(searchParams)
      params.delete('new')
      params.delete('linkNodeId')
      setSearchParams(params, { replace: true })
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Helpers ----

  const getCount = (type: string): number => {
    switch (type) {
      case 'paper':
        return paperCount.data ?? 0
      case 'video':
        return videoCount.data ?? 0
      case 'github':
        return githubCount.data ?? 0
      case 'book':
        return bookCount.data ?? 0
      default:
        return 0
    }
  }

  const getCountLoading = (type: string): boolean => {
    switch (type) {
      case 'paper':
        return paperCount.isLoading
      case 'video':
        return videoCount.isLoading
      case 'github':
        return githubCount.isLoading
      case 'book':
        return bookCount.isLoading
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
          资料收藏
        </h1>
      </div>

      {/* ---- Type Tabs ---- */}
      <div className="flex gap-0.5 border-b border-border">
        {BOOKMARK_TYPES.map((t) => {
          const isActive = activeType === t.value
          const count = getCount(t.value)
          const countLoading = getCountLoading(t.value)
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
                'border-b-2 -mb-px',
                isActive
                  ? 'border-amber-500 text-amber-700 bg-amber-50/50'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              {t.label}
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold transition-colors',
                  isActive
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {countLoading ? '...' : count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ---- Search & Filter Toolbar ---- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch()
            }}
            placeholder="搜索标题..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Tag filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:flex-1 pb-1">
          <span className="text-xs text-muted-foreground flex-shrink-0">
            标签:
          </span>
          {tagId && (
            <button
              type="button"
              onClick={handleClearTag}
              className="flex items-center gap-0.5 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors flex-shrink-0"
            >
              {tags.find((t) => t.id === parseInt(tagId))?.name ?? '已选'}
              <X className="h-3 w-3" />
            </button>
          )}
          <div className="flex gap-1 overflow-x-auto">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagFilter(tag.id.toString())}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs border transition-all flex-shrink-0',
                  tag.id.toString() === tagId
                    ? 'text-white shadow-sm'
                    : 'text-muted-foreground border-border hover:bg-amber-50 hover:text-amber-700'
                )}
                style={
                  tag.id.toString() === tagId
                    ? { backgroundColor: tag.color, borderColor: tag.color }
                    : undefined
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Content area ---- */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-red-500 mb-2">⚠️ 加载失败</p>
          <p className="text-sm text-muted-foreground mb-4">
            {(error as Error)?.message || '未知错误'}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['bookmarks'] })}
            className="text-sm text-amber-600 hover:underline active:scale-95 transition-transform"
          >
            点击重试
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-5xl">
            {search || tagId ? '🔍' : '📑'}
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            {search || tagId ? '没有找到匹配的收藏' : '还没有收藏'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {search || tagId
              ? '尝试调整搜索条件或清除筛选'
              : '点击下方按钮添加第一条收藏'}
          </p>
          {!search && !tagId && (
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:scale-95 transition-all duration-200 font-medium"
            >
              <Plus className="h-4 w-4" />
              添加{BOOKMARK_TYPES.find((t) => t.value === activeType)?.label}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ---- Card Grid ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onClick={() => handleOpenEdit(bookmark)}
                onStatusChange={handleStatusChange}
                onToggleRun={handleToggleRun}
              />
            ))}
          </div>

          {/* ---- Add button row ---- */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-all duration-200 font-medium active:scale-95"
            >
              <Plus className="h-4 w-4" />
              添加
              {BOOKMARK_TYPES.find((t) => t.value === activeType)?.label}
            </button>
          </div>

          {/* ---- Pagination ---- */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ---- Add/Edit Dialog ---- */}
      <BookmarkDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        bookmark={editingBookmark}
        defaultType={activeType}
        defaultLinkNodeId={dialogDefaultLinkNodeId}
      />
    </div>
  )
}
