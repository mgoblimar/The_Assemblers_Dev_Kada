import { Button } from '@/shared/components/ui/button'
import {
  BookOpen,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Search,
  PenLine,
  Users,
  BarChart3,
  Lightbulb,
  Library,
  Bookmark,
  Play,
  ChevronRight,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import './landing.css'
import logoWhite from '@/assets/Logo/LogoWhiteBG-removebg-preview.png'

// ── Placeholder video URL — replace with actual demo link ──
const VIDEO_DEMO_URL = '#video-demo'

interface LandingPageProps {
  isAuthenticated?: boolean
}

export function LandingPage({ isAuthenticated }: LandingPageProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen academic-bg text-foreground font-body selection:bg-primary/20 selection:text-primary overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border h-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logoWhite} alt="PeerEvAI Logo" className="h-7 w-auto object-contain" />
            <span className="text-lg font-extrabold tracking-tight font-heading select-none">
              Peer<span className="text-primary italic">EvAI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#chapters" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Chapter Builder</a>
            <a href="#tools"    className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Tools</a>
            <a href="#how"      className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">How It Works</a>
            <a
              href={VIDEO_DEMO_URL}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
            >
              <Play className="w-3 h-3 fill-primary" /> Watch Demo
            </a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} size="sm" className="gap-2 px-4">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                  Sign In
                </Link>
                <Button asChild size="sm" className="px-4">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-border">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mx-auto">
            <GraduationCap className="w-3.5 h-3.5" />
            AI-Guided Academic Research Builder
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight font-heading leading-tight text-foreground max-w-4xl mx-auto">
            Your Research Paper,<br />
            <span className="text-primary italic">Chapter by Chapter</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            PeerEvAI walks you through every section of your academic paper — asking the right questions,
            generating structured drafts, and carrying context from Chapter 1 all the way to Chapter 3.
            Like a thesis adviser, but always available.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} size="lg" className="h-12 px-8 text-sm font-semibold uppercase tracking-widest gap-2">
                Continue Research <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-12 px-8 text-sm font-semibold uppercase tracking-widest gap-2">
                  <Link to="/signup">Start Writing <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-sm font-semibold uppercase tracking-widest border-primary/40 text-primary hover:bg-primary/5 transition-all gap-2">
                  <Link to="/demo">✦ Try Demo — No Sign-in</Link>
                </Button>
              </>
            )}
          </div>

          {/* Video demo link */}
          <div className="pt-2">
            <a
              href={VIDEO_DEMO_URL}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Play className="w-3 h-3 text-primary fill-primary ml-0.5" />
              </span>
              Watch the 2-minute demo video
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* App preview strip */}
        <div className="mt-16 mx-auto max-w-4xl rounded-2xl border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            </div>
            <div className="flex-1 h-5 bg-muted/40 rounded flex items-center px-3">
              <span className="text-[10px] text-muted-foreground">peerevai.app/dashboard</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-0 h-52">
            <div className="border-r border-border bg-card px-3 py-4 space-y-2">
              {['Dashboard','Research Builder','Topic Builder','My Research','Citations','Improve Writing','Peer Review'].map(item => (
                <div key={item} className={`h-5 rounded px-2 flex items-center ${item === 'Research Builder' ? 'bg-primary/10 text-primary' : ''}`}>
                  <div className={`h-1.5 rounded ${item === 'Research Builder' ? 'w-3/4 bg-primary/50' : 'w-2/3 bg-muted'}`} />
                </div>
              ))}
            </div>
            <div className="col-span-3 p-5 space-y-3">
              <div className="flex gap-2 border-b border-border pb-3">
                {['Chapter 1','Chapter 2','Chapter 3'].map((ch, i) => (
                  <div key={ch} className={`px-3 py-1 rounded text-[10px] font-semibold border ${i === 0 ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>{ch}</div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-2.5 w-1/3 bg-primary/30 rounded" />
                <div className="h-1.5 w-full bg-muted rounded" />
                <div className="h-1.5 w-5/6 bg-muted rounded" />
                <div className="h-1.5 w-4/6 bg-muted rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded border border-primary/20 bg-primary/5 p-2 space-y-1">
                  <div className="h-1.5 w-1/2 bg-primary/30 rounded" />
                  <div className="h-1.5 w-full bg-muted rounded" />
                  <div className="h-1.5 w-3/4 bg-muted rounded" />
                </div>
                <div className="rounded border border-border bg-muted/20 p-2 space-y-1">
                  <div className="h-1.5 w-1/2 bg-muted/60 rounded" />
                  <div className="h-1.5 w-full bg-muted rounded" />
                  <div className="h-1.5 w-3/4 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chapter Builder ── */}
      <section id="chapters" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-border">
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <BookOpen className="w-3.5 h-3.5" /> Core Feature
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading">The Chapter Builder</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The only tool that understands that research chapters are sequentially dependent —
            and guides you through each one accordingly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChapterCard
            number="01"
            title="Chapter 1"
            subtitle="The Problem"
            color="primary"
            sections={['Background of the Study','Statement of the Problem','Research Objectives','Significance of the Study','Scope and Delimitation','Definition of Terms']}
            description="Start with your research topic. PeerEvAI generates research questions and objectives, then writes every section of Chapter 1 — with references."
          />
          <ChapterCard
            number="02"
            title="Chapter 2"
            subtitle="Review of Literature"
            color="primary"
            sections={['Foreign Literature & Studies','Local Literature & Studies','Theoretical Framework','Conceptual Framework','Synthesis']}
            description="Themes are pre-filled from Chapter 1. PeerEvAI suggests citations and writes the full literature review section by section."
            locked
          />
          <ChapterCard
            number="03"
            title="Chapter 3"
            subtitle="Research Methodology"
            color="primary"
            sections={['Research Design (AI Recommended)','Locale & Participants','Sampling Technique','Research Instruments','Data Collection Procedure','Data Analysis','Ethical Considerations']}
            description="AI reads your Chapter 2 and recommends Quantitative, Qualitative, or Mixed Methods — with rationale. Then writes the full methodology."
            locked
          />
        </div>

        <div className="mt-10 rounded-xl border border-primary/20 bg-primary/5 px-6 py-4 flex flex-col sm:flex-row items-center gap-4 max-w-3xl mx-auto">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            Each chapter <strong>unlocks only after the previous one is complete</strong> — preserving the research coherence that makes your paper defensible.
          </p>
          <Button asChild size="sm" className="shrink-0 gap-1.5" variant="outline">
            <Link to="/demo">Try it now <ArrowRight className="w-3.5 h-3.5" /></Link>
          </Button>
        </div>
      </section>

      {/* ── Supplementary Tools ── */}
      <section id="tools" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-border">
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="w-3.5 h-3.5" /> Supplementary Suite
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading">Every Tool a Researcher Needs</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Beyond chapter writing, PeerEvAI ships a full suite of AI-powered research utilities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolCard icon={Search}      title="Research Items"     tag="Library"    description="Save, annotate, and organize your collected sources in one place." />
          <ToolCard icon={Lightbulb}   title="Topic Builder"      tag="Discovery"  description="Not sure where to start? Explore and narrow down your research topic with AI guidance." />
          <ToolCard icon={Bookmark}    title="Citations"          tag="APA"        description="Generate properly formatted APA citations from any source." />
          <ToolCard icon={PenLine}     title="Improve Writing"    tag="Drafting"   description="Paste any section and get targeted rewrite suggestions." />
          <ToolCard icon={Users}       title="Peer Review"        tag="Feedback"   description="Structured feedback on your writing as if from a peer reviewer." />
          <ToolCard icon={Library}     title="Ask My Library"     tag="AI Chat"    description="Query across all your saved research items using natural language." />
          <ToolCard icon={BarChart3}   title="Analysis Advisor"   tag="Methods"    description="Get guidance on the right statistical or qualitative analysis method." />
          <ToolCard icon={FlaskConical} title="Methodology Check" tag="Validation" description="Verify your chosen research design against your objectives and RQs." />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-24 bg-muted/30 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From blank page to complete three-chapter draft — in one guided session.
            </p>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            {[
              { n: '1', t: 'Enter your research topic',          d: 'Give PeerEvAI your subject area and it takes it from there.' },
              { n: '2', t: 'Pick your Research Questions',       d: 'AI generates RQs — you select, edit, or keep them all.' },
              { n: '3', t: 'Confirm your Objectives',            d: 'Objectives are generated to mirror your RQs exactly.' },
              { n: '4', t: 'Chapter 1 generates section by section', d: 'Background, Problem Statement, Significance, Scope, Definitions — all drafted for you.' },
              { n: '5', t: 'Chapter 2 builds on Chapter 1',      d: 'Themes pre-filled, citations suggested, literature written automatically.' },
              { n: '6', t: 'Chapter 3 reads your literature',    d: 'AI recommends Quantitative / Qualitative / Mixed with rationale, then writes the full methodology.' },
              { n: '7', t: 'Download your draft',                d: 'Each chapter exports as a clean, formatted .md file ready to submit.' },
            ].map(({ n, t, d }) => (
              <div key={n} className="flex items-start gap-4 rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-extrabold font-heading text-sm flex items-center justify-center shrink-0">
                  {n}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Video Demo ── */}
      <section id="video-demo" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-border">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Play className="w-3.5 h-3.5" /> Demo Video
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading">See PeerEvAI in Action</h2>
          <p className="text-muted-foreground">
            Watch how a complete Chapter 1 is generated from a single research topic in under 5 minutes.
          </p>

          {/* Video placeholder — replace href and this block with an actual embed when ready */}
          <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 aspect-video flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/10 transition-colors group"
               onClick={() => window.open(VIDEO_DEMO_URL, '_blank')}>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Play className="w-7 h-7 text-primary fill-primary ml-1" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Demo video coming soon</p>
              <p className="text-xs text-muted-foreground mt-1">Replace <code className="text-primary">VIDEO_DEMO_URL</code> in LandingPage.tsx with your link</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button asChild size="lg" className="h-12 px-8 text-sm font-semibold uppercase tracking-widest gap-2">
              <Link to="/demo">Try Demo Now <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-sm font-semibold uppercase tracking-widest gap-1.5">
              <Link to="/signup"><GraduationCap className="w-4 h-4" /> Create Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <img src={logoWhite} alt="PeerEvAI Logo" className="h-6 w-auto object-contain" />
              <span className="font-bold tracking-tight font-heading">Peer<span className="text-primary italic">EvAI</span></span>
            </div>
            <div className="flex gap-6">
              <a href="#chapters" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Chapter Builder</a>
              <a href="#tools"    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Tools</a>
              <a href="#how"      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">How It Works</a>
              <a href={VIDEO_DEMO_URL} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Demo Video</a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-border/50 gap-3">
            <p className="text-[11px] text-muted-foreground">© 2026 PeerEvAI · DevKada Hackathon · The Assemblers · Build Anything, Build from Anywhere</p>
            <p className="text-[11px] text-muted-foreground">Data stored locally in your browser</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ChapterCard({ number, title, subtitle, sections, description, locked }: {
  number: string; title: string; subtitle: string; color: string
  sections: string[]; description: string; locked?: boolean
}) {
  return (
    <div className={`rounded-xl border bg-card p-6 flex flex-col gap-4 transition-all hover:shadow-md ${locked ? 'opacity-80' : 'border-primary/30 shadow-sm'}`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Step {number}</span>
          <h3 className="text-lg font-extrabold font-heading leading-tight mt-0.5">{title}</h3>
          <p className="text-xs text-primary font-semibold">{subtitle}</p>
        </div>
        {locked && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">Unlocks after prev.</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      <ul className="space-y-1">
        {sections.map(s => (
          <li key={s} className="flex items-center gap-2 text-[11px] text-foreground/80">
            <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ToolCard({ icon: Icon, title, tag, description }: {
  icon: React.ElementType; title: string; tag: string; description: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5 flex gap-4 items-start hover:border-primary/30 hover:bg-muted/10 transition-all group">
      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-110 transition-transform">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold font-heading">{title}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 border border-border rounded px-1.5 py-0.5">{tag}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
