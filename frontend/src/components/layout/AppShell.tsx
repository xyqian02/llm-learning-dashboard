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
  const { isCollapsed } = useSidebarStore()

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main
        className={cn(
          'flex-1 transition-all duration-300 ease-in-out',
          isCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-6 lg:p-8">
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
