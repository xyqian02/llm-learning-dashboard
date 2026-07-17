import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import type { Note, NoteListItem, Tag, RoadmapNode, PaginatedResponse, NoteDetail } from '@/types'
import { NoteList } from './NoteList'
import { NoteEditor } from './NoteEditor'

const PAGE_SIZE = 20

export function NotesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  // URL 参数
  const urlNoteId = searchParams.get('noteId')
  const isNewFromUrl = searchParams.get('new') === 'true'
  const linkNodeIdFromUrl = searchParams.get('linkNodeId')

  // 状态
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [preloadedNodeIds, setPreloadedNodeIds] = useState<number[]>([])

  // 处理从 URL 来的初始化
  const initializedRef = useRef(false)
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    if (urlNoteId) {
      const id = parseInt(urlNoteId, 10)
      if (!isNaN(id)) {
        setSelectedNoteId(id)
      }
    } else if (isNewFromUrl) {
      setIsNew(true)
      setSelectedNoteId(null)
      if (linkNodeIdFromUrl) {
        const id = parseInt(linkNodeIdFromUrl, 10)
        if (!isNaN(id)) {
          setPreloadedNodeIds([id])
        }
      }
    }
  }, [urlNoteId, isNewFromUrl, linkNodeIdFromUrl])

  // 获取标签列表
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => apiGet<Tag[]>('/tags'),
    staleTime: 5 * 60 * 1000,
  })

  // 获取笔记列表（分页）
  const {
    data: notesPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isNotesLoading,
  } = useInfiniteQuery<PaginatedResponse<NoteListItem>>({
    queryKey: ['notes', { search, tagId: selectedTagId }],
    queryFn: ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        page_size: String(PAGE_SIZE),
        sort: 'updated_at',
      })
      if (search) params.set('search', search)
      if (selectedTagId) params.set('tag_id', String(selectedTagId))
      return apiGet<PaginatedResponse<NoteListItem>>(`/notes?${params.toString()}`)
    },
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.page_size)
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
  })

  // 获取选中的笔记详情
  const { data: noteDetail } = useQuery<NoteDetail>({
    queryKey: ['note', selectedNoteId],
    queryFn: () => apiGet<NoteDetail>(`/notes/${selectedNoteId}`),
    enabled: selectedNoteId !== null,
  })

  // 获取路线图树
  const { data: roadmapTree = [] } = useQuery<RoadmapNode[]>({
    queryKey: ['roadmap-tree'],
    queryFn: () => apiGet<RoadmapNode[]>('/roadmap/tree'),
    staleTime: 5 * 60 * 1000,
  })

  // 保存笔记 mutation
  const saveMutation = useMutation({
    mutationFn: (data: {
      title: string
      content: string
      tag_ids: number[]
      linked_node_ids: number[]
    }) => {
      if (isNew) {
        return apiPost<Note>('/notes', data)
      }
      return apiPut<Note>(`/notes/${selectedNoteId}`, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['note', selectedNoteId] })
      // 如果是新建，切换到编辑模式
      if (isNew && 'id' in data) {
        setIsNew(false)
        setSelectedNoteId(data.id)
        // 更新 URL
        setSearchParams({ noteId: String(data.id) }, { replace: true })
      }
    },
  })

  // 删除笔记 mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (selectedNoteId === null) throw new Error('No note selected')
      return apiDelete(`/notes/${selectedNoteId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setSelectedNoteId(null)
      setSearchParams({}, { replace: true })
    },
  })

  // 创建标签 mutation
  const createTagMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      apiPost<Tag>('/tags', { name, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })

  // 处理选择笔记
  const handleSelectNote = useCallback(
    (id: number) => {
      setIsNew(false)
      setSelectedNoteId(id)
      setSearchParams({ noteId: String(id) }, { replace: true })
    },
    [setSearchParams]
  )

  // 处理新建笔记
  const handleNew = useCallback(() => {
    setIsNew(true)
    setSelectedNoteId(null)
    setSearchParams({ new: 'true' }, { replace: true })
  }, [setSearchParams])

  // 处理搜索
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  // 处理标签筛选
  const handleTagChange = useCallback((tagId: number | null) => {
    setSelectedTagId(tagId)
  }, [])

  // 处理保存
  const handleSave = useCallback(
    (data: { title: string; content: string; tag_ids: number[]; linked_node_ids: number[] }) => {
      saveMutation.mutate(data)
    },
    [saveMutation]
  )

  // 处理删除
  const handleDelete = useCallback(() => {
    deleteMutation.mutate()
  }, [deleteMutation])

  // 处理创建标签
  const handleCreateTag = useCallback(
    (name: string, color: string) => {
      createTagMutation.mutate({ name, color })
    },
    [createTagMutation]
  )

  // 合并分页数据
  const allNotes: NoteListItem[] = notesPages?.pages.flatMap((page) => page.items) ?? []
  const totalNotes = notesPages?.pages[0]?.total ?? 0

  // 构建用于列表的合并数据
  const mergedNotesData: PaginatedResponse<NoteListItem> = {
    items: allNotes,
    total: totalNotes,
    page: notesPages?.pages.length ?? 1,
    page_size: PAGE_SIZE,
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* 左侧：笔记列表 */}
      <div className="w-full lg:w-[40%] lg:min-w-[320px] lg:max-w-[440px] h-2/5 lg:h-auto">
        <NoteList
          notesData={mergedNotesData}
          tags={tags}
          selectedNoteId={selectedNoteId}
          selectedTagId={selectedTagId}
          search={search}
          isLoading={isNotesLoading}
          hasMore={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onSelectNote={handleSelectNote}
          onNew={handleNew}
          onSearchChange={handleSearchChange}
          onTagChange={handleTagChange}
          onLoadMore={() => fetchNextPage()}
        />
      </div>

      {/* 右侧：编辑器 */}
      <div className="flex-1">
        {isNew ? (
          <NoteEditor
            key="new"
            note={null}
            isNew={true}
            isSaving={saveMutation.isPending}
            isDeleting={false}
            allTags={tags}
            roadmapTree={roadmapTree}
            initialNodeIds={preloadedNodeIds}
            onSave={handleSave}
            onDelete={() => {}}
            onCreateTag={handleCreateTag}
          />
        ) : selectedNoteId ? (
          <NoteEditor
            key={selectedNoteId}
            note={noteDetail ?? null}
            isNew={false}
            isSaving={saveMutation.isPending}
            isDeleting={deleteMutation.isPending}
            allTags={tags}
            roadmapTree={roadmapTree}
            onSave={handleSave}
            onDelete={handleDelete}
            onCreateTag={handleCreateTag}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <p className="text-lg">选择一篇笔记或创建新笔记</p>
            <button
              onClick={handleNew}
              className="mt-4 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95"
            >
              创建笔记
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
