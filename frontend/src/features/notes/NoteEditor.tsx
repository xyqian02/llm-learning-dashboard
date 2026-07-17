import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Save, Trash2, Plus, X, Link2, Loader2, Check } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import type { Note, Tag, RoadmapNode } from '@/types'
import { TagSelector } from './TagSelector'
import { NodeSelector } from './NodeSelector'

interface NoteEditorProps {
  note: Note | null
  isNew: boolean
  isSaving: boolean
  isDeleting: boolean
  allTags: Tag[]
  roadmapTree: RoadmapNode[]
  initialNodeIds?: number[]
  onSave: (data: {
    title: string
    content: string
    tag_ids: number[]
    linked_node_ids: number[]
  }) => void
  onDelete: () => void
  onCreateTag: (name: string, color: string) => void
}

export function NoteEditor({
  note,
  isNew,
  isSaving,
  isDeleting,
  allTags,
  roadmapTree,
  initialNodeIds = [],
  onSave,
  onDelete,
  onCreateTag,
}: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([])
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [showNodeSelector, setShowNodeSelector] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [savedTip, setSavedTip] = useState(false)

  // 当 note 或 isNew 改变时重置本地状态
  useEffect(() => {
    if (isNew) {
      setTitle('')
      setContent('')
      setSelectedTagIds([])
      setSelectedNodeIds(initialNodeIds)
    } else if (note) {
      setTitle(note.title || '')
      setContent(note.content || '')
      setSelectedTagIds(note.tags?.map((t) => t.id) ?? [])
      setSelectedNodeIds(note.linked_nodes?.map((n) => n.id) ?? [])
    }
  }, [note, isNew, initialNodeIds])

  const handleSave = useCallback(() => {
    onSave({
      title,
      content,
      tag_ids: selectedTagIds,
      linked_node_ids: selectedNodeIds,
    })
    setSavedTip(true)
    setTimeout(() => setSavedTip(false), 2000)
  }, [title, content, selectedTagIds, selectedNodeIds, onSave])

  // 键盘快捷键 Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleToggleNode = (nodeId: number) => {
    setSelectedNodeIds((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    )
  }

  const handleDeleteTag = (tagId: number) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId))
  }

  const handleRemoveNode = (nodeId: number) => {
    setSelectedNodeIds((prev) => prev.filter((id) => id !== nodeId))
  }

  const getTagById = (id: number) => allTags.find((t) => t.id === id)

  // 从当前笔记或 roadmap tree 中获取已选节点的名称
  const linkedNodesMap = new Map<number, { title: string; stage?: string | null }>()
  if (note?.linked_nodes) {
    note.linked_nodes.forEach((n) => linkedNodesMap.set(n.id, { title: n.title, stage: n.stage }))
  }

  const isEmpty = !title.trim() && !content.trim()

  return (
    <div className="flex h-full flex-col bg-card">
      {/* 工具栏 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            {isNew ? '新建笔记' : '编辑笔记'}
          </h2>
          {savedTip && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
              <Check className="h-3 w-3" />
              已保存
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving || (isEmpty && isNew)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存
          </button>
          {!isNew && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 disabled:opacity-50 active:scale-95"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              删除
            </button>
          )}
        </div>
      </div>

      {/* 标题输入 */}
      <div className="border-b border-border px-4 py-3">
        <input
          type="text"
          placeholder="笔记标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-xl font-bold text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Markdown 编辑器 */}
      <div className="flex-1 overflow-hidden">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val ?? '')}
          height="100%"
          preview="live"
          visibleDragbar={false}
          hideToolbar={false}
          enableScroll={true}
          className="h-full"
        />
      </div>

      {/* 底部元数据管理 */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex flex-col gap-3">
          {/* 标签管理 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="mr-1 text-xs text-muted-foreground">标签:</span>
            {selectedTagIds.map((tagId) => {
              const tag = getTagById(tagId)
              return tag ? (
                <span
                  key={tagId}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                    border: `1px solid ${tag.color}40`,
                  }}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  <button
                    onClick={() => handleDeleteTag(tagId)}
                    className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ) : null
            })}
            <button
              onClick={() => setShowTagSelector(true)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 关联节点 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="mr-1 text-xs text-muted-foreground">关联节点:</span>
            {selectedNodeIds.map((nodeId) => {
              const node = linkedNodesMap.get(nodeId)
              return (
                <span
                  key={nodeId}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground"
                >
                  {node?.title ?? `节点 #${nodeId}`}
                  <button
                    onClick={() => handleRemoveNode(nodeId)}
                    className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )
            })}
            {selectedNodeIds.length === 0 && (
              <span className="text-xs text-muted-foreground">未关联</span>
            )}
            <button
              onClick={() => setShowNodeSelector(true)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 标签选择器弹窗 */}
      {showTagSelector && (
        <TagSelector
          tags={allTags}
          selectedTagIds={selectedTagIds}
          onToggle={handleToggleTag}
          onCreateTag={onCreateTag}
          onClose={() => setShowTagSelector(false)}
        />
      )}

      {/* 节点选择器弹窗 */}
      {showNodeSelector && (
        <NodeSelector
          tree={roadmapTree}
          selectedNodeIds={selectedNodeIds}
          onToggle={handleToggleNode}
          onClose={() => setShowNodeSelector(false)}
        />
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg"
          >
            <h3 className="mb-2 text-base font-semibold text-foreground">确认删除</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              确定要删除笔记「{note?.title || '无标题'}」吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onDelete()
                  setShowDeleteConfirm(false)
                }}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 active:scale-95 transition-transform"
              >
                确认删除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
