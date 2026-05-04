import { useEffect, useState } from 'react'
import { ResearchItem } from '@/lib/db/database'
import { getResearchItems } from '@/lib/db/research-repository'
import { ResearchAI } from './ResearchAI'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Calendar, ChevronRight, FileText, Loader2 } from 'lucide-react'

interface ResearchListProps {
  refreshTrigger: number
}

export function ResearchList({ refreshTrigger }: ResearchListProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getResearchItems()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load research items')
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary/30" />
        <p className="text-muted-foreground font-medium">Loading your research...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-2 py-20 bg-gray-50/50">
        <CardContent className="text-center space-y-3">
          <div className="bg-gray-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <CardTitle className="text-xl">No research yet</CardTitle>
          <CardDescription>Create your first research item above to get started.</CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold tracking-tight">Recent Insights</h2>
        <Badge variant="secondary" className="px-3 py-1 font-bold">
          {items.length} Items
        </Badge>
      </div>
      
      <div className="grid gap-6">
        {items.map((item) => (
          <Card
            key={item.id}
            className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    item.syncStatus === 'synced'
                      ? 'success'
                      : item.syncStatus === 'error'
                      ? 'destructive'
                      : 'warning'
                  }
                  className="capitalize shadow-none"
                >
                  {item.syncStatus}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                {item.sourceText}
              </p>
              
              <ResearchAI researchItemId={item.id} />
            </CardContent>

            <CardFooter className="bg-gray-50/50 border-t px-6 py-3 flex justify-between items-center">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white" />
              </div>
              <Button variant="ghost" size="sm" className="gap-2 group/btn font-semibold text-primary hover:text-primary hover:bg-primary/5">
                View Details
                <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
