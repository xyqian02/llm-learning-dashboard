import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Brain, Target, CalendarDays } from 'lucide-react'
import { apiGet } from '@/lib/api'
import type { DashboardOverview, RoadmapNode } from '@/types'

interface RoadmapNodeWithStatus extends RoadmapNode {
  status?: 'not_started' | 'in_progress' | 'completed'
  children: RoadmapNodeWithStatus[]
}

function RingProgress({ percentage }: { percentage: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="drop-shadow-sm">
      <circle
        cx="36" cy="36" r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="5"
      />
      <motion.circle
        cx="36" cy="36" r={radius}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '36px 36px' }}
      />
      <text
        x="36" y="36"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-bold"
        fill="#374151"
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function HomePage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)

  useEffect(() => {
    apiGet<DashboardOverview>('/dashboard/overview')
      .then(setOverview)
      .catch(() => {})
  }, [])

  const findInProgressNode = (
    nodes: RoadmapNodeWithStatus[]
  ): RoadmapNodeWithStatus | null => {
    for (const node of nodes) {
      if (node.status === 'in_progress') return node
      if (node.children && node.children.length > 0) {
        const found = findInProgressNode(node.children)
        if (found) return found
      }
    }
    return null
  }

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
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/20 to-blue-50/30">
      <motion.div
        className="text-center max-w-lg mx-auto px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: 'backOut' }}
          className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 shadow-lg"
        >
          <Brain className="h-12 w-12 text-amber-600" />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="mb-3 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          LLM Learning Dashboard
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mb-8 text-lg text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          大模型学习路线管理
        </motion.p>

        {/* Statistics Cards */}
        {overview && (
          <motion.div
            className="mb-10 grid grid-cols-3 gap-3"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.div
              variants={cardVariants}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center rounded-xl border border-amber-100 bg-amber-50/80 p-3"
            >
              <RingProgress percentage={overview.total_progress} />
              <span className="mt-1 text-xs font-medium text-amber-700">
                总进度
              </span>
            </motion.div>

            <motion.div
              variants={cardVariants}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50/80 p-3"
            >
              <Target className="h-8 w-8 text-blue-500 mb-1" />
              <span className="text-2xl font-bold text-blue-700">
                {overview.in_progress_count}
              </span>
              <span className="text-xs font-medium text-blue-600">
                进行中
              </span>
            </motion.div>

            <motion.div
              variants={cardVariants}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center rounded-xl border border-green-100 bg-green-50/80 p-3"
            >
              <CalendarDays className="h-8 w-8 text-green-500 mb-1" />
              <span className="text-2xl font-bold text-green-700">
                {overview.recent_days}
              </span>
              <span className="text-xs font-medium text-green-600">
                本周学习
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <motion.button
            onClick={handleContinue}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            继续学习
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>

          <motion.button
            onClick={() => navigate('/dashboard')}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-amber-200 transition-all duration-300 hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-300 active:scale-95"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            进入工作台
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
