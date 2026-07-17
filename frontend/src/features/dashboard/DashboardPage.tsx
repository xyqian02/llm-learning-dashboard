import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Target,
  CalendarDays,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Edit3,
  Bookmark,
} from 'lucide-react'
import { apiGet } from '@/lib/api'
import type { DashboardOverview, StageProgress, RecentActivity } from '@/types'

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function getActivityIcon(type: string): React.ComponentType<{ className?: string }> {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    progress: TrendingUp,
    completion: CheckCircle,
    note: Edit3,
    bookmark: Bookmark,
  }
  return map[type] ?? BookOpen
}

function getActivityDotColor(type: string): string {
  const map: Record<string, string> = {
    progress: 'bg-blue-500',
    completion: 'bg-green-500',
    note: 'bg-amber-500',
    bookmark: 'bg-purple-500',
  }
  return map[type] ?? 'bg-gray-400'
}

const stageColorList = [
  'bg-amber-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
]

function getStageBarColor(index: number): string {
  return stageColorList[index % stageColorList.length]
}

// ---------------------------------------------------------------------------
// 数字递增动画组件
// ---------------------------------------------------------------------------

function AnimatedNumber({
  value,
  suffix = '',
}: {
  value: number
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const startValue = prevValue.current
    const duration = 1500
    const startTime = performance.now()
    let animationId: number

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (value - startValue) * eased
      setDisplay(Math.round(current))

      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animationId = requestAnimationFrame(animate)
    prevValue.current = value

    return () => cancelAnimationFrame(animationId)
  }, [value])

  return (
    <span>
      {display}
      {suffix}
    </span>
  )
}

// ---------------------------------------------------------------------------
// 骨架卡片
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 h-4 w-20 rounded bg-gray-200" />
      <div className="mb-2 h-10 w-16 rounded bg-gray-200" />
      <div className="h-3 w-24 rounded bg-gray-100" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// 路线树节点（用于"继续学习"）
// ---------------------------------------------------------------------------

interface RoadmapNodeWithStatus {
  id: number
  status?: string
  children: RoadmapNodeWithStatus[]
}

function findInProgressNode(
  nodes: RoadmapNodeWithStatus[]
): RoadmapNodeWithStatus | null {
  for (const node of nodes) {
    if (node.status === 'in_progress') return node
    if (node.children && node.children.length > 0) {
      const found = findInProgressNode(node.children)
      if (found) return found
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const navigate = useNavigate()

  // 数据获取
  const { data: overview, isLoading: overviewLoading, isError: overviewError, refetch: refetchOverview } =
    useQuery<DashboardOverview>({
      queryKey: ['dashboard', 'overview'],
      queryFn: () => apiGet('/dashboard/overview'),
    })

  const { data: stageProgress, isLoading: stageLoading, isError: stageError, refetch: refetchStage } = useQuery<
    StageProgress[]
  >({
    queryKey: ['dashboard', 'stage-progress'],
    queryFn: () => apiGet('/dashboard/stage-progress'),
  })

  const { data: activities, isLoading: activityLoading, isError: activityError, refetch: refetchActivity } = useQuery<
    RecentActivity[]
  >({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => apiGet('/dashboard/recent-activity'),
  })

  const isLoading = overviewLoading || stageLoading || activityLoading
  const hasError = overviewError || stageError || activityError

  // "继续学习"按钮逻辑
  const handleContinue = async () => {
    try {
      const tree = await apiGet<RoadmapNodeWithStatus[]>('/roadmap/tree')
      const node = findInProgressNode(tree)
      if (node) {
        navigate(`/roadmap?nodeId=${node.id}`)
      } else {
        navigate('/roadmap')
      }
    } catch {
      // API 失败时留在仪表盘
    }
  }

  // -----------------------------------------------------------------------
  // 加载态：骨架屏
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">仪表盘</h1>
        </div>

        {/* 3 张骨架卡片 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* 两栏骨架 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 阶段进度骨架 */}
          <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 h-5 w-28 rounded bg-gray-200" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="mb-4">
                <div className="mb-1.5 flex justify-between">
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="h-3 w-10 rounded bg-gray-200" />
                </div>
                <div className="h-2.5 rounded-full bg-gray-100" />
              </div>
            ))}
          </div>

          {/* 活动时间线骨架 */}
          <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 h-5 w-28 rounded bg-gray-200" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="mb-5 flex gap-3">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="mb-2 h-3 w-40 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // 错误态
  // -----------------------------------------------------------------------
  if (hasError && !overview && !stageProgress && !activities) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">仪表盘</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-border bg-card">
          <p className="text-red-500 mb-2 text-lg">⚠️ 数据加载失败</p>
          <p className="text-sm text-muted-foreground mb-4">请检查后端服务是否运行</p>
          <button
            onClick={() => { refetchOverview(); refetchStage(); refetchActivity(); }}
            className="text-sm text-amber-600 hover:underline active:scale-95 transition-transform"
          >
            点击重试
          </button>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // 正常渲染
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* 标题栏 + 继续学习按钮 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">仪表盘</h1>
        <motion.button
          onClick={handleContinue}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-200 transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg active:scale-95"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          继续学习
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>

      {/* ---- 顶部 3 张指标卡片 ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 卡片 1：总进度 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200/60">
              <TrendingUp className="h-5 w-5 text-amber-700" />
            </div>
            <span className="text-sm font-medium text-amber-700">
              总学习进度
            </span>
          </div>
          <div className="text-4xl font-bold text-amber-800">
            <AnimatedNumber
              value={overview?.total_progress ?? 0}
              suffix="%"
            />
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-amber-200">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600"
              style={{ transition: 'width 1s ease-out' }}
              initial={{ width: 0 }}
              animate={{ width: `${overview?.total_progress ?? 0}%` }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </motion.div>

        {/* 卡片 2：进行中 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-200/60">
              <Target className="h-5 w-5 text-blue-700" />
            </div>
            <span className="text-sm font-medium text-blue-700">进行中</span>
          </div>
          <div className="text-4xl font-bold text-blue-800">
            <AnimatedNumber value={overview?.in_progress_count ?? 0} />
          </div>
          <p className="mt-1 text-sm text-blue-600/70">
            {overview?.in_progress_count ?? 0} 个任务进行中
          </p>
        </motion.div>

        {/* 卡片 3：本周学习 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-green-100/50 p-6 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-200/60">
              <CalendarDays className="h-5 w-5 text-green-700" />
            </div>
            <span className="text-sm font-medium text-green-700">
              本周学习
            </span>
          </div>
          <div className="text-4xl font-bold text-green-800">
            <AnimatedNumber value={overview?.recent_days ?? 0} />
          </div>
          <p className="mt-1 text-sm text-green-600/70">
            {(overview?.recent_days ?? 0) > 0
              ? `${overview?.recent_days ?? 0} 天`
              : '本周暂无学习'}
          </p>
        </motion.div>
      </div>

      {/* ---- 下方两栏：阶段进度 + 活动时间线 ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左栏：各阶段完成率 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <h2 className="mb-5 text-lg font-semibold text-foreground">
            各阶段完成率
          </h2>
          <div className="space-y-5">
            {(stageProgress ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">暂无阶段数据</p>
            )}
            {(stageProgress ?? []).map((stage, index) => (
              <div key={stage.stage}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {stage.stage}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stage.completed}/{stage.total} &middot;{' '}
                    {Math.round(stage.percentage)}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted">
                  <motion.div
                    className={`h-2.5 rounded-full ${getStageBarColor(index)}`}
                    style={{ transition: 'width 1s ease-out' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.percentage}%` }}
                    transition={{
                      duration: 1,
                      delay: 0.5 + index * 0.08,
                      ease: 'easeOut',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 右栏：最近活动时间线 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <h2 className="mb-5 text-lg font-semibold text-foreground">
            最近活动
          </h2>

          {!activities || activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BookOpen className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">暂无学习活动记录</p>
            </div>
          ) : (
            <div className="relative">
              {/* 左侧竖线 */}
              <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border" />

              <div className="space-y-0">
                {activities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type)
                  const dotColor = getActivityDotColor(activity.type)
                  return (
                    <div
                      key={index}
                      className="relative flex gap-4 pb-5 last:pb-0"
                    >
                      {/* 圆点 */}
                      <div
                        className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${dotColor} shadow-sm`}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>

                      {/* 内容 */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {activity.title}
                        </p>
                        {activity.node_title && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {activity.node_title}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          {timeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
