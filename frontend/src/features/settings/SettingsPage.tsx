import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Upload,
  FileUp,
  FileDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Bookmark,
  ChevronDown,
  RefreshCw,
  Check,
  Sun,
  Moon,
} from 'lucide-react'
import { apiGet } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { NoteListItem, PaginatedResponse } from '@/types'

/* ------------------------------------------------------------------ */
/*  类型定义                                                           */
/* ------------------------------------------------------------------ */

interface ImportPreview {
  nodes_count: number
  papers_count: number
  github_count: number
  videos_count: number
  books_count: number
}

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

/* ------------------------------------------------------------------ */
/*  工具函数                                                           */
/* ------------------------------------------------------------------ */

async function downloadFile(url: string, filename: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`下载失败: ${response.status}`)
  const blob = await response.blob()
  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(downloadUrl)
}

/* ------------------------------------------------------------------ */
/*  Toast 组件                                                         */
/* ------------------------------------------------------------------ */

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg border',
            toast.type === 'success' &&
              'bg-green-50 border-green-200 text-green-800',
            toast.type === 'error' &&
              'bg-red-50 border-red-200 text-red-800',
            toast.type === 'info' &&
              'bg-blue-50 border-blue-200 text-blue-800'
          )}
        >
          {toast.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
          {toast.type === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
          {toast.type === 'info' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          <span>{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="ml-1 opacity-60 hover:opacity-100">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  确认对话框                                                          */
/* ------------------------------------------------------------------ */

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  confirmColor?: 'red' | 'amber'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = '确认',
  confirmColor = 'red',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-xl shadow-xl border border-border w-full max-w-sm mx-4 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0',
              confirmColor === 'red' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg text-white transition-colors disabled:opacity-60',
              confirmColor === 'red'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-600 hover:bg-amber-700'
            )}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? '处理中...' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  多选笔记面板                                                        */
/* ------------------------------------------------------------------ */

interface NoteSelectPanelProps {
  notes: NoteListItem[]
  selectedIds: Set<number>
  onToggle: (id: number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onExport: () => void
  loading: boolean
  onClose: () => void
}

function NoteSelectPanel({
  notes,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onExport,
  loading,
  onClose,
}: NoteSelectPanelProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-xl shadow-xl border border-border w-full max-w-md mx-4 max-h-[70vh] flex flex-col"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">导出笔记</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              已选 {selectedIds.size}/{notes.length} 条
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* 全选按钮 */}
        <div className="flex gap-2 px-4 py-2 border-b border-border/50 bg-muted/30">
          <button
            onClick={onSelectAll}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            全选
          </button>
          <button
            onClick={onDeselectAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            取消全选
          </button>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-2">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">暂无笔记</p>
          ) : (
            notes.map((note) => (
              <label
                key={note.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-amber-50/60',
                  selectedIds.has(note.id) && 'bg-amber-50'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-5 h-5 rounded border-2 flex-shrink-0 transition-colors',
                    selectedIds.has(note.id)
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-gray-300'
                  )}
                  onClick={() => onToggle(note.id)}
                >
                  {selectedIds.has(note.id) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-sm text-foreground truncate">{note.title}</span>
              </label>
            ))
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={onExport}
            disabled={loading || selectedIds.size === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? '导出中...' : '导出选中'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  主组件                                                              */
/* ------------------------------------------------------------------ */

export function SettingsPage() {
  // ---- Dark Mode ----
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
      document.documentElement.classList.add('dark')
      return true
    }
    return false
  })

  const toggleDarkMode = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // ---- Toast ----
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ---- 1. 数据备份 ----
  const [backupLoading, setBackupLoading] = useState(false)

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      const dateStr = new Date().toISOString().slice(0, 10)
      await downloadFile('/api/settings/backup', `backup_${dateStr}.json`)
      addToast('success', '备份已下载')
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : '备份失败')
    } finally {
      setBackupLoading(false)
    }
  }

  // ---- 2. 数据恢复 ----
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const restoreInputRef = useRef<HTMLInputElement>(null)

  const handleRestoreSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setRestoreFile(file)
    }
  }

  const handleRestore = async () => {
    if (!restoreFile) return
    setRestoreLoading(true)
    setShowRestoreConfirm(false)
    try {
      const formData = new FormData()
      formData.append('file', restoreFile)
      const res = await fetch('/api/settings/restore', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.detail || `恢复失败: ${res.status}`)
      }
      addToast('success', '数据已恢复，页面即将刷新')
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : '恢复失败')
    } finally {
      setRestoreLoading(false)
    }
  }

  // ---- 3. 导入学习路线 ----
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importConfirmLoading, setImportConfirmLoading] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  const handleImportSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportPreview(null)

    // 上传获取预览
    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/settings/import-roadmap', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.detail || `解析失败: ${res.status}`)
      }
      const preview: ImportPreview = await res.json()
      setImportPreview(preview)
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : '文件解析失败')
      setImportFile(null)
      if (importInputRef.current) importInputRef.current.value = ''
    } finally {
      setImportLoading(false)
    }
  }

  const handleImportConfirm = async () => {
    if (!importFile) return
    setImportConfirmLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await fetch('/api/settings/import-roadmap?confirm=true', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.detail || `导入失败: ${res.status}`)
      }
      addToast('success', '学习路线已导入，页面即将刷新')
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : '导入失败')
    } finally {
      setImportConfirmLoading(false)
    }
  }

  const clearImport = () => {
    setImportFile(null)
    setImportPreview(null)
    if (importInputRef.current) importInputRef.current.value = ''
  }

  // ---- 4. 导出数据 ----
  const [exportRoadmapLoading, setExportRoadmapLoading] = useState(false)
  const [exportNotesLoading, setExportNotesLoading] = useState(false)
  const [exportBookmarkLoading, setExportBookmarkLoading] = useState<string | null>(null)

  // 笔记选择面板
  const [showNotePanel, setShowNotePanel] = useState(false)
  const [notes, setNotes] = useState<NoteListItem[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesLoaded, setNotesLoaded] = useState(false)
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<number>>(new Set())

  const openNotePanel = async () => {
    setShowNotePanel(true)
    if (notesLoaded) return
    setNotesLoading(true)
    try {
      const data = await apiGet<PaginatedResponse<NoteListItem>>('/notes?page_size=200')
      setNotes(data.items)
      setSelectedNoteIds(new Set(data.items.map((n) => n.id)))
      setNotesLoaded(true)
    } catch {
      addToast('error', '获取笔记列表失败')
    } finally {
      setNotesLoading(false)
    }
  }

  const toggleNote = (id: number) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllNotes = () => {
    setSelectedNoteIds(new Set(notes.map((n) => n.id)))
  }

  const deselectAllNotes = () => {
    setSelectedNoteIds(new Set())
  }

  const handleExportNotes = async () => {
    if (selectedNoteIds.size === 0) return
    setExportNotesLoading(true)
    try {
      const ids = Array.from(selectedNoteIds).join(',')
      const dateStr = new Date().toISOString().slice(0, 10)
      await downloadFile(`/api/settings/export-notes?ids=${ids}`, `notes_${dateStr}.md`)
      addToast('success', '笔记已导出')
      setShowNotePanel(false)
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : '导出笔记失败')
    } finally {
      setExportNotesLoading(false)
    }
  }

  const handleExportRoadmap = async () => {
    setExportRoadmapLoading(true)
    try {
      const dateStr = new Date().toISOString().slice(0, 10)
      await downloadFile('/api/settings/export-roadmap', `roadmap_${dateStr}.md`)
      addToast('success', '学习路线已导出')
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : '导出路线失败')
    } finally {
      setExportRoadmapLoading(false)
    }
  }

  const handleExportBookmarks = async (type: string) => {
    setExportBookmarkLoading(type)
    try {
      const dateStr = new Date().toISOString().slice(0, 10)
      await downloadFile(
        `/api/settings/export-bookmarks?type=${type}`,
        `bookmarks_${type}_${dateStr}.md`
      )
      addToast('success', `「${type}」收藏已导出`)
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : '导出收藏失败')
    } finally {
      setExportBookmarkLoading(null)
    }
  }

  // 自动清除文件输入
  useEffect(() => {
    return () => {
      setRestoreFile(null)
      setImportFile(null)
    }
  }, [])

  // -------------------------------------------------------------------
  // 渲染
  // -------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">设置</h1>
      </div>

      {/* ============================================================= */}
      {/*  区块零：外观设置（暗色模式）                                     */}
      {/* ============================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          {isDark ? (
            <Moon className="h-5 w-5 text-indigo-500" />
          ) : (
            <Sun className="h-5 w-5 text-amber-500" />
          )}
          外观设置
        </h2>

        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
              isDark ? 'bg-indigo-100' : 'bg-amber-100'
            )}>
              {isDark ? (
                <Moon className="h-5 w-5 text-indigo-600" />
              ) : (
                <Sun className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">暗色模式</p>
              <p className="text-xs text-muted-foreground">
                {isDark ? '当前为暗色主题' : '当前为亮色主题'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0',
              isDark ? 'bg-indigo-600' : 'bg-gray-300'
            )}
          >
            <span
              className={cn(
                'inline-flex h-5 w-5 items-center justify-center transform rounded-full bg-white shadow-sm transition-transform duration-200',
                isDark ? 'translate-x-5' : 'translate-x-0.5'
              )}
            >
              {isDark ? (
                <Moon className="h-3 w-3 text-indigo-600" />
              ) : (
                <Sun className="h-3 w-3 text-amber-500" />
              )}
            </span>
          </button>
        </div>
      </motion.div>

      {/* ============================================================= */}
      {/*  区块一：数据备份 + 数据恢复                                    */}
      {/* ============================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <Download className="h-5 w-5 text-amber-600" />
          数据管理
        </h2>

        <div className="space-y-4">
          {/* ---- 备份 ---- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-50/50 border border-amber-100 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">数据备份</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                导出全部数据为 JSON 文件，用于迁移或备份
              </p>
            </div>
            <button
              onClick={handleBackup}
              disabled={backupLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-all duration-200 disabled:opacity-50 flex-shrink-0 active:scale-95"
            >
              {backupLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {backupLoading ? '导出中...' : '导出备份'}
            </button>
          </div>

          {/* ---- 恢复 ---- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-red-50/50 border border-red-100 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">数据恢复</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                从备份文件恢复数据（将覆盖现有全部数据）
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 隐藏的原生 input */}
              <input
                ref={restoreInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreSelect}
                className="hidden"
                id="restore-file-input"
              />
              <label
                htmlFor="restore-file-input"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <FileUp className="h-3.5 w-3.5" />
                {restoreFile ? restoreFile.name : '选择文件'}
              </label>
              <button
                onClick={() => setShowRestoreConfirm(true)}
                disabled={!restoreFile || restoreLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200 disabled:opacity-50 active:scale-95"
              >
                {restoreLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {restoreLoading ? '恢复中...' : '恢复'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================= */}
      {/*  区块二：导入学习路线                                            */}
      {/* ============================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <FileUp className="h-5 w-5 text-blue-600" />
          导入学习路线
        </h2>

        <div className="rounded-xl bg-blue-50/50 border border-blue-100 px-4 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1.5">
                从 .md 文件导入学习路线
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".md"
                  onChange={handleImportSelect}
                  className="hidden"
                  id="import-file-input"
                />
                <label
                  htmlFor="import-file-input"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <FileUp className="h-3.5 w-3.5" />
                  {importFile ? importFile.name : '选择 .md 文件'}
                </label>
              </div>
            </div>

            {importPreview && (
              <button
                onClick={handleImportConfirm}
                disabled={importConfirmLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 flex-shrink-0 active:scale-95"
              >
                {importConfirmLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {importConfirmLoading ? '导入中...' : '确认导入'}
              </button>
            )}
          </div>

          {/* 加载中 */}
          {importLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
              正在解析文件...
            </div>
          )}

          {/* 预览结果 */}
          {importPreview && (
            <div className="mt-3 p-3 rounded-lg bg-white border border-blue-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">解析结果：</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  节点数: {importPreview.nodes_count}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  论文: {importPreview.papers_count}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                  GitHub: {importPreview.github_count}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  视频: {importPreview.videos_count}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                  书籍: {importPreview.books_count}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                即将导入以上数据，请确认后点击「确认导入」
              </p>
            </div>
          )}

          {/* 重选提示 */}
          {importFile && importPreview && (
            <button
              onClick={clearImport}
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              重新选择文件
            </button>
          )}
        </div>
      </motion.div>

      {/* ============================================================= */}
      {/*  区块三：导出数据                                                */}
      {/* ============================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <FileDown className="h-5 w-5 text-emerald-600" />
          导出数据
        </h2>

        <div className="space-y-3">
          {/* 导出学习路线 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-emerald-50/50 border border-emerald-100 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">导出学习路线</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                下载思维导图 Markdown 文件
              </p>
            </div>
            <button
              onClick={handleExportRoadmap}
              disabled={exportRoadmapLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 flex-shrink-0 active:scale-95"
            >
              {exportRoadmapLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {exportRoadmapLoading ? '导出中...' : '导出路线'}
            </button>
          </div>

          {/* 导出笔记 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-violet-50/50 border border-violet-100 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">导出笔记</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                选择要导出的笔记，生成 Markdown 文件
              </p>
            </div>
            <button
              onClick={openNotePanel}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-all duration-200 flex-shrink-0 active:scale-95"
            >
              <FileText className="h-3.5 w-3.5" />
              导出笔记
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 导出收藏 */}
          <div className="flex flex-col gap-3 rounded-xl bg-rose-50/50 border border-rose-100 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">导出收藏</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                按类型导出收藏数据
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { type: 'paper', label: '论文', color: 'bg-blue-600 hover:bg-blue-700' },
                  { type: 'video', label: '视频', color: 'bg-amber-600 hover:bg-amber-700' },
                  { type: 'github', label: 'GitHub', color: 'bg-purple-600 hover:bg-purple-700' },
                  { type: 'book', label: '书籍', color: 'bg-emerald-600 hover:bg-emerald-700' },
                ] as const
              ).map(({ type, label, color }) => (
                <button
                  key={type}
                  onClick={() => handleExportBookmarks(type)}
                  disabled={exportBookmarkLoading !== null}
                  className={cn(
                    'inline-flex items-center gap-1 px-3.5 py-1.5 text-xs rounded-lg text-white transition-all duration-200 disabled:opacity-50 active:scale-95',
                    color
                  )}
                >
                  {exportBookmarkLoading === type ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Bookmark className="h-3 w-3" />
                  )}
                  {exportBookmarkLoading === type ? '导出中...' : label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================= */}
      {/*  弹层                                                           */}
      {/* ============================================================= */}

      {/* 恢复确认对话框 */}
      {showRestoreConfirm && (
        <ConfirmDialog
          title="确认恢复数据"
          message="即将覆盖现有全部数据，此操作不可撤销。是否继续？"
          confirmLabel="确认恢复"
          confirmColor="red"
          loading={restoreLoading}
          onConfirm={handleRestore}
          onCancel={() => setShowRestoreConfirm(false)}
        />
      )}

      {/* 笔记选择面板 */}
      {showNotePanel && (
        <NoteSelectPanel
          notes={notes}
          selectedIds={selectedNoteIds}
          onToggle={toggleNote}
          onSelectAll={selectAllNotes}
          onDeselectAll={deselectAllNotes}
          onExport={handleExportNotes}
          loading={exportNotesLoading || notesLoading}
          onClose={() => setShowNotePanel(false)}
        />
      )}

      {/* Toast 容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
