export interface RoadmapNode {
  id: number
  parent_id: number | null
  title: string
  description: string | null
  sort_order: number
  stage: string | null
  depth: number
  icon: string | null
  children: RoadmapNode[]
  created_at: string
  updated_at: string
}

export interface LearningProgress {
  id: number
  node_id: number
  status: 'not_started' | 'in_progress' | 'completed'
  started_at: string | null
  completed_at: string | null
}

export interface Note {
  id: number
  title: string
  content: string
  linked_nodes: RoadmapNode[]
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: number
  type: 'paper' | 'video' | 'github' | 'book'
  title: string
  url: string | null
  notes: string | null
  extra_fields: Record<string, unknown>
  linked_nodes: RoadmapNode[]
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  color: string
}

export interface DashboardOverview {
  total_progress: number
  in_progress_count: number
  recent_days: number
}

export interface StageProgress {
  stage: string
  total: number
  completed: number
  percentage: number
}

export interface RecentActivity {
  type: string
  title: string
  node_title?: string
  timestamp: string
}
