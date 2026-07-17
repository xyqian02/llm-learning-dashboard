import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { apiPost, apiPut, apiDelete } from '@/lib/api'
import { cn } from '@/lib/utils'
import { RoadmapTree } from './RoadmapTree'
import { NodeDetail } from './NodeDetail'
import type { RoadmapNode } from '@/types'

/* ------------------------------------------------------------------ */
/*  常用 emoji 列表（学习主题相关）                                      */
/* ------------------------------------------------------------------ */
const EMOJI_OPTIONS = [
  '📚', '📖', '📝', '✏️', '🎓', '🏫', '💡', '🧠',
  '🔬', '💻', '🤖', '📊', '📈', '🗂️', '🔧', '⚙️',
  '🌐', '📡', '🎯', '🚀', '⭐', '🔥', '💎', '🎨',
  '📐', '🧮', '🔢', '📋', '✅', '❌', '⚠️', 'ℹ️',
]

/* ------------------------------------------------------------------ */
/*  节点编辑 / 新增对话框                                                */
/* ------------------------------------------------------------------ */
interface NodeDialogProps {
  mode: 'edit' | 'add'
  nodeId?: number
  parentId?: number | null
  initialTitle?: string
  initialDescription?: string | null
  initialIcon?: string | null
  onClose: () => void
}

function NodeDialog({
  mode,
  nodeId,
  parentId,
  initialTitle = '',
  initialDescription = '',
  initialIcon = '',
  onClose,
}: NodeDialogProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [icon, setIcon] = useState(initialIcon ?? '')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { title: title.trim() }
      if (description.trim()) body.description = description.trim()
      if (icon) body.icon = icon

      if (mode === 'edit' && nodeId) {
        return apiPut(`/roadmap/nodes/${nodeId}`, body)
      }
      // add mode
      if (parentId) body.parent_id = parentId
      return apiPost('/roadmap/nodes', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message || '操作失败')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('标题不能为空')
      return
    }
    setError('')
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      {/* 弹窗 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-card rounded-xl shadow-xl border border-border w-full max-w-lg mx-4 p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            {mode === 'edit' ? '编辑节点' : '新增节点'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入节点标题"
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-colors"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入节点描述（可选）"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-colors resize-none"
            />
          </div>

          {/* 图标 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              图标
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-md border border-border text-xl transition-colors',
                  showEmojiPicker
                    ? 'border-amber-400 bg-amber-50'
                    : 'hover:bg-muted'
                )}
              >
                {icon || '📚'}
              </button>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="或直接输入 emoji"
                className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-colors"
              />
              {icon && (
                <button
                  type="button"
                  onClick={() => setIcon('')}
                  className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {showEmojiPicker && (
              <div className="mt-2 p-2 border border-border rounded-lg bg-background grid grid-cols-8 gap-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setIcon(emoji)
                      setShowEmojiPicker(false)
                    }}
                    className={cn(
                      'flex items-center justify-center w-9 h-9 text-lg rounded-md hover:bg-amber-50 transition-colors',
                      icon === emoji && 'bg-amber-100 ring-1 ring-amber-300'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* 按钮 */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {mutation.isPending
                ? '保存中...'
                : mode === 'edit'
                  ? '保存'
                  : '创建'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  删除确认对话框                                                       */
/* ------------------------------------------------------------------ */
interface DeleteDialogProps {
  node: RoadmapNode
  onClose: () => void
}

function DeleteDialog({ node, onClose }: DeleteDialogProps) {
  const queryClient = useQueryClient()
  const hasChildren = node.children && node.children.length > 0

  const mutation = useMutation({
    mutationFn: () => apiDelete(`/roadmap/nodes/${node.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-card rounded-xl shadow-xl border border-border w-full max-w-sm mx-4 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 flex-shrink-0">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">确认删除</h2>
            <p className="text-sm text-muted-foreground">
              确定要删除节点「{node.title}」吗？
            </p>
          </div>
        </div>

        {hasChildren && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
            该节点包含 {node.children.length} 个子节点，删除后子节点也将被移除。
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? '删除中...' : '删除'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  右键上下文菜单                                                       */
/* ------------------------------------------------------------------ */
interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  node: RoadmapNode
}

/* ------------------------------------------------------------------ */
/*  RoadmapPage 主组件                                                   */
/* ------------------------------------------------------------------ */
interface DialogState {
  mode: 'edit' | 'add'
  nodeId?: number
  parentId?: number | null
  initialTitle?: string
  initialDescription?: string | null
  initialIcon?: string | null
}

export function RoadmapPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const nodeIdParam = searchParams.get('nodeId')
  const selectedId = nodeIdParam ? Number(nodeIdParam) : null

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  // 对话框状态
  const [dialog, setDialog] = useState<DialogState | null>(null)
  // 删除确认状态
  const [deleteTarget, setDeleteTarget] = useState<RoadmapNode | null>(null)

  // 关闭右键菜单（点击页面其他位置）
  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [contextMenu])

  // 调整右键菜单位置避免溢出屏幕
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [adjustedPos, setAdjustedPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    if (!contextMenu) return
    // 用 setTimeout 等待 DOM 渲染完成
    const timer = setTimeout(() => {
      const el = contextMenuRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      let x = contextMenu.x
      let y = contextMenu.y
      if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 8
      if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 8
      setAdjustedPos({ x, y })
    }, 0)
    return () => clearTimeout(timer)
  }, [contextMenu])

  const handleSelect = useCallback(
    (id: number) => {
      setSearchParams({ nodeId: String(id) })
      setContextMenu(null)
    },
    [setSearchParams]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: RoadmapNode) => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, node })
    },
    []
  )

  const handleEditClick = useCallback(
    (data: { id: number; title: string; description: string | null; icon: string | null }) => {
      setDialog({
        mode: 'edit',
        nodeId: data.id,
        initialTitle: data.title,
        initialDescription: data.description,
        initialIcon: data.icon,
      })
    },
    []
  )

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8">
      {/* 左侧：路线树 */}
      <div className="w-full md:w-[35%] md:min-w-[280px] md:max-w-[420px] border-b md:border-b-0 md:border-r border-border bg-card overflow-hidden h-1/3 md:h-auto">
        <RoadmapTree
          selectedId={selectedId}
          onSelect={handleSelect}
          onContextMenu={handleContextMenu}
          onAddRoot={() => setDialog({ mode: 'add' })}
        />
      </div>

      {/* 右侧：节点详情 */}
      <div className="flex-1 overflow-hidden bg-background">
        {selectedId ? (
          <NodeDetail nodeId={selectedId} onEdit={handleEditClick} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="text-4xl mb-3 opacity-30">🗺️</div>
            <p className="text-sm">选择左侧节点查看学习详情</p>
          </div>
        )}
      </div>

      {/* 右键上下文菜单 */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[160px] bg-card rounded-lg shadow-lg border border-border py-1 overflow-hidden"
          style={{ left: adjustedPos.x, top: adjustedPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setDialog({
                mode: 'edit',
                nodeId: contextMenu.node.id,
                initialTitle: contextMenu.node.title,
                initialDescription: contextMenu.node.description,
                initialIcon: contextMenu.node.icon ?? '',
              })
              setContextMenu(null)
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-amber-50 transition-colors"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            编辑节点
          </button>
          <button
            onClick={() => {
              setDialog({
                mode: 'add',
                parentId: contextMenu.node.id,
              })
              setContextMenu(null)
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-amber-50 transition-colors"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            添加子节点
          </button>
          <div className="border-t border-border my-0.5" />
          <button
            onClick={() => {
              setDeleteTarget(contextMenu.node)
              setContextMenu(null)
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            删除节点
          </button>
        </div>
      )}

      {/* 编辑 / 新增对话框 */}
      {dialog && (
        <NodeDialog
          mode={dialog.mode}
          nodeId={dialog.nodeId}
          parentId={dialog.parentId}
          initialTitle={dialog.initialTitle}
          initialDescription={dialog.initialDescription}
          initialIcon={dialog.initialIcon}
          onClose={() => setDialog(null)}
        />
      )}

      {/* 删除确认对话框 */}
      {deleteTarget && (
        <DeleteDialog
          node={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
