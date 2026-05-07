import { useRef, useState } from 'react'
import { createResearchItem } from '@/lib/db/research-repository'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/use-toast'
import { Sparkles, Plus, Database, Loader2, FileText, ExternalLink, X, Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResearchFormProps {
  userId?: string
  onItemCreated: () => void
}

/** Convert a Google Docs edit URL to a plain-text export URL the scraper can handle. */
function toGoogleDocsExport(url: string): string {
  // https://docs.google.com/document/d/ID/edit → .../pub?output=txt
  const m = url.match(/docs\.google\.com\/document\/d\/([^/]+)/)
  if (m) return `https://docs.google.com/document/d/${m[1]}/pub?output=txt`
  return url
}

/** Extract readable text from a PDF ArrayBuffer using a heuristic byte scan. Works for text-embedded PDFs. */
function extractTextFromPdfBytes(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const decoder = new TextDecoder('latin1')
  const raw = decoder.decode(bytes)
  // Grab text between BT…ET markers (PDF text objects)
  const segments: string[] = []
  const btEt = raw.matchAll(/BT\s*([\s\S]*?)ET/g)
  for (const match of btEt) {
    const inner = match[1]
    const strings = inner.matchAll(/\(([^)]{2,})\)/g)
    for (const s of strings) {
      const t = s[1].replace(/\\(\d{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
                      .replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '\n')
      if (t.trim().length > 1) segments.push(t.trim())
    }
  }
  const text = segments.join(' ').replace(/\s{2,}/g, ' ').trim()
  return text.slice(0, 15000)
}

export function ResearchForm({ userId, onItemCreated }: ResearchFormProps) {
  const [title, setTitle] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: 'pdf' | 'gdoc' } | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const handleVoiceNote = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Voice input is not supported in this browser. Try Chrome.')
      return
    }
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognitionRef.current = recognition
    recognition.onstart = () => setIsRecording(true)
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => { setIsRecording(false); setError('Voice recognition failed. Please try again.') }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results as ArrayLike<{ 0: { transcript: string } }>)
        .map((r) => r[0].transcript)
        .join(' ')
      setSourceText(prev => prev ? `${prev} ${transcript}` : transcript)
      setAttachedFile(null)
    }
    setError(null)
    recognition.start()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) {
      setError('Only PDF files are supported')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const buffer = await file.arrayBuffer()
      const extracted = extractTextFromPdfBytes(buffer)
      if (extracted.length < 50) {
        setError('Could not extract text from this PDF (may be scanned/image-based). Please paste text manually.')
        return
      }
      if (!title) setTitle(file.name.replace('.pdf', ''))
      setSourceText(extracted)
      setAttachedFile({ name: file.name, type: 'pdf' })
      toast({ title: 'PDF loaded', description: `Extracted ${extracted.length.toLocaleString()} characters from ${file.name}` })
    } catch {
      setError('Failed to read PDF file')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearAttachment = () => {
    setAttachedFile(null)
    setSourceText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() && !sourceText.trim()) {
      setError('Please fill in at least the content')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let finalTitle = title
      let finalText = sourceText

      // Detect if it's a URL (including Google Docs)
      if (sourceText.trim().startsWith('http')) {
        setScraping(true)
        const isGdoc = sourceText.includes('docs.google.com')
        const scrapeUrl = isGdoc ? toGoogleDocsExport(sourceText.trim()) : sourceText.trim()
        if (isGdoc) setAttachedFile({ name: 'Google Doc', type: 'gdoc' })
        toast({
          title: "Scraping deep content...",
          description: "Our agent is reading the academic portal. This may take a few seconds.",
        })
        
        try {
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: scrapeUrl })
          })
          if (res.ok) {
            const data = await res.json()
            finalText = data.text
            if (title === '') finalTitle = data.title
            toast({
              variant: "success",
              title: "Scrape successful",
              description: `Extracted ${finalText.length} characters from ${finalTitle}`,
            })
          } else {
            throw new Error('Scraping failed')
          }
        } catch (err) {
          console.warn('Scraping failed, using URL as text', err)
          toast({
            variant: "destructive",
            title: "Scraping partially failed",
            description: "Could not extract deep content, using URL as source.",
          })
        } finally {
          setScraping(false)
        }
      }

      await createResearchItem(finalTitle || 'Untitled Research', finalText, userId)
      setTitle('')
      setSourceText('')
      setAttachedFile(null)
      onItemCreated()
      
      toast({
        title: "Research item created",
        description: "Your data is saved locally and queued for sync.",
      })
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
        await createResearchItem(item.title, item.text, userId)
      }
      onItemCreated()
      toast({
        title: "Demo data seeded",
        description: "Added sample research items to your dashboard.",
      })
    } catch (err) {
      setError('Failed to seed data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold font-heading flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            New Research Input
          </CardTitle>
          <CardDescription className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground/60">
            Scholarly Source Ingestion
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSeed}
          disabled={loading}
          className="h-8 text-[10px] uppercase tracking-widest font-bold gap-1.5 border-border hover:bg-muted"
        >
          <Database className="w-3 h-3" />
          Seed Demo
        </Button>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded border border-destructive/20 text-xs font-bold uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep Sea Mining Impact Analysis"
              disabled={loading}
              className="h-10 border-border focus:border-primary focus:ring-primary/10 rounded-lg text-sm"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="content" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Content, URL, or Document</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <SourceButton
                  icon={FileText}
                  label="PDF"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                />
                <SourceButton
                  icon={ExternalLink}
                  label="GDoc"
                  onClick={() => {
                    const url = prompt('Paste your Google Docs share URL:')
                    if (url?.includes('docs.google.com')) {
                      setSourceText(url.trim())
                      setAttachedFile({ name: 'Google Doc', type: 'gdoc' })
                    }
                  }}
                  disabled={loading}
                />
                <SourceButton
                  icon={isRecording ? MicOff : Mic}
                  label="Voice"
                  active={isRecording}
                  onClick={handleVoiceNote}
                  disabled={loading}
                />
              </div>
            </div>

            {attachedFile && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-[10px] font-bold uppercase tracking-wider mb-2">
                {attachedFile.type === 'pdf'
                  ? <FileText className="w-3 h-3 text-primary shrink-0" />
                  : <ExternalLink className="w-3 h-3 text-primary shrink-0" />
                }
                <span className="flex-1 truncate text-primary">{attachedFile.name}</span>
                <button type="button" onClick={clearAttachment} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <Textarea
              id="content"
              value={sourceText}
              onChange={(e) => { setSourceText(e.target.value); setAttachedFile(null) }}
              placeholder="Paste a URL (Nature, ScienceDirect), upload a PDF, or type your research notes..."
              rows={6}
              disabled={loading}
              className="resize-none border-border focus:border-primary focus:ring-primary/10 rounded-lg text-sm p-4 leading-relaxed"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-bold uppercase tracking-[0.2em] gap-2 shadow-sm border-none">
            {scraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ingesting Portal...
              </>
            ) : loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving to Vault...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Research
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function SourceButton({ icon: Icon, label, onClick, disabled, active }: { icon: any, label: string, onClick: () => void, disabled: boolean, active?: boolean }) {
  return (
    <Button
      type="button"
      variant={active ? 'destructive' : 'outline'}
      size="sm"
      className={cn(
        "h-7 text-[9px] font-bold uppercase tracking-widest gap-1.5 px-2.5",
        !active && "border-border hover:bg-muted"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="w-2.5 h-2.5" />
      {label}
    </Button>
  )
}

