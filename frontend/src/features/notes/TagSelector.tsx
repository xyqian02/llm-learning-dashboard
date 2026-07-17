import { useState } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types'

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
]

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: number[]
  onToggle: (tagId: number) => void
  onCreateTag: (name: string, color: string) => void
  onClose: () => void
}

export function TagSelector({
  tags,
  selectedTagIds,
  onToggle,
  onCreateTag,
  onClose,
}: TagSelectorProps) {
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = () => {
    const name = newTagName.trim()
    if (!name) return
    onCreateTag(name, newTagColor)
    setNewTagName('')
    setIsCreating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">选择标签</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 已有标签列表 */}
        <div className="mb-3 max-h-48 space-y-1 overflow-y-auto">
          {tags.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">暂无标签，请创建新标签</p>
          ) : (
            tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => onToggle(tag.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-left">{tag.name}</span>
                  {tag.used_count !== undefined && (
                    <span className="text-xs text-muted-foreground">{tag.used_count}</span>
                  )}
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              )
            })
          )}
        </div>

        {/* 创建新标签 */}
        {isCreating ? (
          <div className="space-y-2 border-t border-border pt-3">
            <input
              type="text"
              placeholder="标签名称"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setIsCreating(false)
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-all',
                    newTagColor === color
                      ? 'border-foreground scale-110'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="rounded-md px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTagName.trim()}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            新建标签
          </button>
        )}
      </div>
    </div>
  )
}
