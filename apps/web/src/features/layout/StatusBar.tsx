import { Database, Cloud, CloudOff, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusBarProps {
  itemCount: number
  online: boolean
  outboxCount: number
}

export function StatusBar({ itemCount, online, outboxCount }: StatusBarProps) {
  return (
    <div className="h-7 border-t bg-muted/20 flex items-center px-4 gap-0 text-[11px] text-muted-foreground font-medium shrink-0">
      <span className="flex items-center gap-1.5 w-1/3">
        <Database className="w-3 h-3 shrink-0" />
        IndexedDB · {itemCount} stored locally
      </span>

      <span className="flex items-center justify-center gap-1.5 flex-1">
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', online ? 'bg-emerald-500' : 'bg-amber-400')} />
        {online ? 'Groq API · Connected' : 'Offline Mode · Local only'}
      </span>

      <span className="flex items-center justify-end gap-1.5 w-1/3">
        {online ? <Cloud className="w-3 h-3 shrink-0" /> : <CloudOff className="w-3 h-3 shrink-0" />}
        <Inbox className="w-3 h-3 shrink-0" />
        Outbox · {outboxCount} pending
      </span>
    </div>
  )
}
