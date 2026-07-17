import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Brain } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()

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
          className="mb-10 text-lg text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          大模型学习路线管理
        </motion.p>

        {/* CTA Button */}
        <motion.button
          onClick={() => navigate('/dashboard')}
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-amber-200 transition-all duration-300 hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-300 active:scale-95"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          进入工作台
          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </motion.button>
      </motion.div>
    </div>
  )
}
