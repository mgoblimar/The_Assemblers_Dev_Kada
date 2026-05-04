import { useState } from 'react'
import { createResearchItem } from '@/lib/db/research-repository'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Sparkles, Plus, Database } from 'lucide-react'

interface ResearchFormProps {
  onItemCreated: () => void
}

export function ResearchForm({ onItemCreated }: ResearchFormProps) {
  const [title, setTitle] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !sourceText.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let finalTitle = title
      let finalText = sourceText

      // Detect if it's a URL
      if (sourceText.trim().startsWith('http')) {
        try {
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: sourceText.trim() })
          })
          if (res.ok) {
            const data = await res.json()
            finalText = data.text
            if (title === '') finalTitle = data.title
          }
        } catch (err) {
          console.warn('Scraping failed, using URL as text', err)
        }
      }

      await createResearchItem(finalTitle, finalText)
      setTitle('')
      setSourceText('')
      onItemCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create research item')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setLoading(true)
    try {
      const demoItems = [
        { 
          title: 'The Future of Neural Interfaces', 
          text: 'Recent breakthroughs in high-bandwidth neural interfaces are allowing for direct brain-to-computer communication with lower latency than ever before. Companies like Neuralink and Synchron are leading the way in clinical trials...' 
        },
        { 
          title: 'Sustainable Fusion Energy 2026', 
          text: 'The latest results from the ITER project suggest that Q-factor sustainability is finally within reach. Commercial fusion power plants are being projected for the early 2030s, promising carbon-free baseload power.' 
        }
      ]
      
      for (const item of demoItems) {
        await createResearchItem(item.title, item.text)
      }
      onItemCreated()
    } catch (err) {
      setError('Failed to seed data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-8 border-none shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Plus className="w-6 h-6 text-primary" />
            New Research
          </CardTitle>
          <CardDescription>Capture your thoughts or paste a source</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSeed}
          disabled={loading}
          className="text-xs gap-1.5 font-medium"
        >
          <Database className="w-3.5 h-3.5" />
          Seed Demo
        </Button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep Sea Mining Impact"
              disabled={loading}
              className="h-10 border-muted-foreground/20 focus:border-primary"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content" className="text-sm font-semibold">Content</Label>
            <Textarea
              id="content"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Start typing your research findings..."
              rows={5}
              disabled={loading}
              className="resize-none border-muted-foreground/20 focus:border-primary"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold gap-2">
            <Sparkles className="w-5 h-5" />
            {loading ? 'Creating...' : 'Analyze Research'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
