import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types'

interface TagSelectorProps {
  selected: number[]
  onChange: (ids: number[]) => void
}

export function TagSelector({ selected, onChange }: TagSelectorProps) {
  const [newTagName, setNewTagName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const queryClient = useQueryClient()

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiGet<Tag[]>('/tags'),
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiPost<Tag>('/tags', { name, color: '#d97706' }),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      onChange([...selected, newTag.id])
      setNewTagName('')
      setIsCreating(false)
    },
    onError: () => {
      setNewTagName('')
      setIsCreating(false)
    },
  })

  const handleToggle = (tagId: number) => {
    if (selected.includes(tagId)) {
      onChange(selected.filter((id) => id !== tagId))
    } else {
      onChange([...selected, tagId])
    }
  }

  const handleCreate = () => {
    const trimmed = newTagName.trim()
    if (trimmed) {
      createMutation.mutate(trimmed)
    }
  }

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">加载标签...</p>
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto">
        {tags.length === 0 && !isCreating && (
          <p className="text-xs text-muted-foreground">暂无标签，点击下方新建</p>
        )}
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleToggle(tag.id)}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 border',
              selected.includes(tag.id)
                ? 'text-white shadow-sm'
                : 'bg-secondary text-muted-foreground border-border hover:bg-amber-50 hover:text-amber-700'
            )}
            style={
              selected.includes(tag.id)
                ? { backgroundColor: tag.color, borderColor: tag.color }
                : undefined
            }
          >
            {tag.name}
          </button>
        ))}
      </div>

      {isCreating ? (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') {
                setIsCreating(false)
                setNewTagName('')
              }
            }}
            placeholder="输入标签名..."
            className="flex-1 px-2.5 py-1.5 text-xs border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 bg-background"
            autoFocus
            disabled={createMutation.isPending}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newTagName.trim() || createMutation.isPending}
            className="px-2.5 py-1.5 text-xs bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {createMutation.isPending ? '...' : '添加'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false)
              setNewTagName('')
            }}
            className="p-1 text-muted-foreground hover:text-foreground rounded flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
        >
          <Plus className="h-3 w-3" />
          新建标签
        </button>
      )}
    </div>
  )
}
