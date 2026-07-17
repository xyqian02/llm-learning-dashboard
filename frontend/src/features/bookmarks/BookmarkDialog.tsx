import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { apiPost, apiPut, apiDelete } from '@/lib/api'
import { cn } from '@/lib/utils'
import { NodeSelector } from '@/components/shared/NodeSelector'
import { TagSelector } from '@/components/shared/TagSelector'
import type { Bookmark } from '@/types'

const BOOKMARK_TYPES = [
  { value: 'paper', label: '论文' },
  { value: 'video', label: '视频' },
  { value: 'github', label: 'GitHub' },
  { value: 'book', label: '书籍' },
] as const

const READ_STATUS_OPTIONS = ['未读', '一刷', '二刷', '精读'] as const

interface BookmarkDialogProps {
  open: boolean
  onClose: () => void
  bookmark?: Bookmark | null
  defaultType?: string
  defaultLinkNodeId?: number
}

export function BookmarkDialog({
  open,
  onClose,
  bookmark,
  defaultType,
  defaultLinkNodeId,
}: BookmarkDialogProps) {
  const queryClient = useQueryClient()
  const isEdit = !!bookmark

  // ---- Form state ----
  const [type, setType] = useState(bookmark?.type || defaultType || 'paper')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [linkedNodeIds, setLinkedNodeIds] = useState<number[]>([])
  const [tagIds, setTagIds] = useState<number[]>([])

  // Extra fields
  const [author, setAuthor] = useState('')
  const [year, setYear] = useState('')
  const [conference, setConference] = useState('')
  const [readStatus, setReadStatus] = useState('未读')
  const [platform, setPlatform] = useState('')
  const [stars, setStars] = useState('')
  const [language, setLanguage] = useState('')
  const [runStatus, setRunStatus] = useState(false)

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ---- Reset form when dialog opens ----
  const resetForm = useCallback(() => {
    if (bookmark) {
      setType(bookmark.type)
      setTitle(bookmark.title || '')
      setUrl(bookmark.url || '')
      setNotes(bookmark.notes || '')
      setLinkedNodeIds(bookmark.linked_nodes?.map((n) => n.id) ?? [])
      setTagIds(bookmark.tags?.map((t) => t.id) ?? [])

      const ef = bookmark.extra_fields ?? {}
      setAuthor((ef.author as string) || '')
      setYear((ef.year as string) || '')
      setConference((ef.conference as string) || '')
      setReadStatus((ef.read_status as string) || '未读')
      setPlatform((ef.platform as string) || '')
      setStars((ef.stars as string) || '')
      setLanguage((ef.language as string) || '')
      setRunStatus(ef.run_status === '已跑通')
    } else {
      setType(defaultType || 'paper')
      setTitle('')
      setUrl('')
      setNotes('')
      setLinkedNodeIds(defaultLinkNodeId ? [defaultLinkNodeId] : [])
      setTagIds([])
      setAuthor('')
      setYear('')
      setConference('')
      setReadStatus('未读')
      setPlatform('')
      setStars('')
      setLanguage('')
      setRunStatus(false)
    }
    setShowDeleteConfirm(false)
  }, [bookmark, defaultType, defaultLinkNodeId])

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open, resetForm])

  // ---- Build extra_fields ----
  const buildExtraFields = (): Record<string, unknown> => {
    const ef: Record<string, unknown> = {}

    if (type === 'paper') {
      if (author.trim()) ef.author = author.trim()
      if (year.trim()) ef.year = year.trim()
      if (conference.trim()) ef.conference = conference.trim()
      ef.read_status = readStatus
    } else if (type === 'video') {
      if (platform) ef.platform = platform
      if (author.trim()) ef.author = author.trim()
    } else if (type === 'github') {
      if (stars.trim()) ef.stars = stars.trim()
      if (language.trim()) ef.language = language.trim()
      ef.run_status = runStatus ? '已跑通' : '未跑通'
    } else if (type === 'book') {
      if (author.trim()) ef.author = author.trim()
      ef.read_status = readStatus
    }

    return ef
  }

  // ---- Save mutation ----
  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (isEdit) {
        return apiPut<Bookmark>(`/bookmarks/${bookmark!.id}`, data)
      }
      return apiPost<Bookmark>('/bookmarks', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      onClose()
    },
  })

  // ---- Delete mutation ----
  const deleteMutation = useMutation({
    mutationFn: () => apiDelete(`/bookmarks/${bookmark!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      onClose()
    },
  })

  // ---- Submit ----
  const handleSave = () => {
    if (!title.trim()) return

    const body: Record<string, unknown> = {
      type,
      title: title.trim(),
      extra_fields: buildExtraFields(),
    }

    if (url.trim()) body.url = url.trim()
    if (notes.trim()) body.notes = notes.trim()
    if (linkedNodeIds.length > 0) body.linked_node_ids = linkedNodeIds
    if (tagIds.length > 0) body.tag_ids = tagIds

    saveMutation.mutate(body)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10 rounded-t-xl">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? '编辑收藏' : '添加收藏'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              类型
            </label>
            <div className="flex gap-1.5">
              {BOOKMARK_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                    type === t.value
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-secondary text-muted-foreground border-transparent hover:bg-amber-50 hover:text-amber-700'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title (required) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              标题 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入标题..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow"
            />
          </div>

          {/* ---- Type-specific fields ---- */}

          {/* Paper fields */}
          {type === 'paper' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  作者
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="作者名（如 Vaswani et al.）"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    年份
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="如 2017"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    会议/期刊
                  </label>
                  <input
                    type="text"
                    value={conference}
                    onChange={(e) => setConference(e.target.value)}
                    placeholder="如 NeurIPS 2017"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  阅读状态
                </label>
                <select
                  value={readStatus}
                  onChange={(e) => setReadStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                >
                  {READ_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Video fields */}
          {type === 'video' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  平台
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                >
                  <option value="">选择平台</option>
                  <option value="B站">B站</option>
                  <option value="YouTube">YouTube</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  作者 / UP主
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="如 Andrej Karpathy"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow"
                />
              </div>
            </>
          )}

          {/* GitHub fields */}
          {type === 'github' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Star 数
                  </label>
                  <input
                    type="text"
                    value={stars}
                    onChange={(e) => setStars(e.target.value)}
                    placeholder="如 40K+"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    编程语言
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="如 Python"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">
                  已跑通
                </span>
                <button
                  type="button"
                  onClick={() => setRunStatus(!runStatus)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 flex-shrink-0 ${
                    runStatus ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                      runStatus ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </>
          )}

          {/* Book fields */}
          {type === 'book' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  作者
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="作者名（如 黄佳）"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  阅读状态
                </label>
                <select
                  value={readStatus}
                  onChange={(e) => setReadStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                >
                  {READ_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              备注
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="备注..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow resize-none"
            />
          </div>

          {/* Linked nodes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              关联学习节点
            </label>
            <NodeSelector
              selected={linkedNodeIds}
              onChange={setLinkedNodeIds}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              标签
            </label>
            <TagSelector selected={tagIds} onChange={setTagIds} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border sticky bottom-0 bg-card rounded-b-xl">
          <div>
            {isEdit && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                删除
              </button>
            )}
            {showDeleteConfirm && (
              <span className="text-sm text-muted-foreground">
                确认删除？
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="ml-2 px-2 py-1 text-xs bg-destructive text-white rounded-md hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? '...' : '确认'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="ml-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md"
                >
                  取消
                </button>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim() || saveMutation.isPending}
              className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saveMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* Error message */}
        {saveMutation.isError && (
          <div className="px-6 pb-4">
            <p className="text-sm text-destructive">
              保存失败，请重试
            </p>
          </div>
        )}
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  )
}
