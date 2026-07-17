import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { useSidebarStore } from '@/stores/useSidebarStore'
import { cn } from '@/lib/utils'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export function AppShell() {
  const location = useLocation()
  const { isCollapsed, setCollapsed } = useSidebarStore()

  // 窄屏自动折叠侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize() // 初始检查
    return () => window.removeEventListener('resize', handleResize)
  }, [setCollapsed])

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main
        className={cn(
          'flex-1 transition-all duration-300 ease-in-out',
          isCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
