import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  FileText,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
} from 'lucide-react'
import { useSidebarStore } from '@/stores/useSidebarStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/roadmap', icon: Map, label: '学习路线' },
  { to: '/notes', icon: FileText, label: '学习笔记' },
  { to: '/bookmarks', icon: Bookmark, label: '资料收藏' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div
          className={cn(
            'flex items-center gap-3 overflow-hidden transition-all duration-300',
            isCollapsed && 'w-0 opacity-0'
          )}
        >
          <Brain className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-foreground whitespace-nowrap">
            LLM Dashboard
          </span>
        </div>
        {isCollapsed && (
          <Brain className="h-7 w-7 text-primary mx-auto" />
        )}
        <button
          onClick={toggle}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            isCollapsed && 'hidden'
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'hover:bg-amber-50 hover:text-amber-700',
                isActive
                  ? 'bg-amber-100 text-amber-800 shadow-sm'
                  : 'text-muted-foreground',
                isCollapsed && 'justify-center px-2'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap overflow-hidden transition-all duration-300',
                isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={toggle}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </aside>
  )
}
