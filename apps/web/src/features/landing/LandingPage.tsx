import { Button } from '@/shared/components/ui/button'
import { 
  BrainCircuit, 
  BookOpen, 
  ArrowRight, 
  GraduationCap, 
  Shield, 
  Sparkles, 
  Search, 
  PenLine,
  Users,
  BarChart3
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '@/shared/components/ui/badge'
import './landing.css'

interface LandingPageProps {
  isAuthenticated?: boolean
}

export function LandingPage({ isAuthenticated }: LandingPageProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen academic-bg text-foreground font-body selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground shadow-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight font-heading">
              AIPeer<span className="text-primary">.</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#workflow" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Workflow</a>
            <a href="#trust" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Trust</a>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} size="sm" className="gap-2 px-4">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
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

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-border">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mx-auto">
            <GraduationCap className="w-3.5 h-3.5" />
            Institutional Grade Research Agent
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight font-heading leading-tight text-foreground max-w-4xl mx-auto">
            Elevate Your Scholarship with <span className="text-primary italic">Surgical</span> Precision
          </h1>
          
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            The perfect synergy of AI intelligence and rigorous academic peer review. 
            Organize, analyze, and validate your research library with an agentic peer in your pocket.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} size="lg" className="h-12 px-8 text-sm font-semibold uppercase tracking-widest gap-2">
                Continue Research <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-12 px-8 text-sm font-semibold uppercase tracking-widest gap-2">
                  <Link to="/signup">
                    Start Your Library <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-sm font-semibold uppercase tracking-widest border-border hover:bg-muted/50 transition-all">
                  <Link to="/login">View Live Demo</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-20 mx-auto max-w-5xl rounded-2xl border bg-card shadow-2xl p-4 overflow-hidden relative">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
            </div>
            <div className="h-5 flex-1 bg-muted/30 rounded flex items-center px-3">
              <span className="text-[10px] text-muted-foreground">aipeer.academic/dashboard</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[300px]">
            <div className="bg-muted/20 rounded-xl border border-border/50 p-4 space-y-4">
              <div className="h-3 w-1/2 bg-primary/20 rounded" />
              <div className="space-y-2">
                <div className="h-2 w-full bg-muted rounded" />
                <div className="h-2 w-5/6 bg-muted rounded" />
              </div>
              <div className="h-24 bg-background rounded-lg border border-border/30" />
            </div>
            <div className="md:col-span-2 bg-muted/10 rounded-xl border border-border/50 p-6 space-y-6">
              <div className="flex justify-between">
                <div className="h-4 w-1/4 bg-primary/30 rounded" />
                <div className="h-4 w-12 bg-muted rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-background rounded-lg border border-border/30" />
                <div className="h-20 bg-background rounded-lg border border-border/30" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-muted rounded" />
                <div className="h-2 w-full bg-muted rounded" />
                <div className="h-2 w-3/4 bg-muted rounded" />
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-card to-transparent" />
        </div>
      </section>

      {/* Feature Section (Dashboard Vibe) */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              The Scholarly Suite
            </div>
            <h2 className="text-3xl font-bold font-heading">Beyond Simple AI</h2>
            <p className="text-muted-foreground max-w-xl">
              Mirroring the rigorous standards of top-tier academic journals, our tools are built for validation and critical synthesis.
            </p>
          </div>
          <Button variant="outline" className="text-[11px] uppercase tracking-widest font-bold h-9">
            Explore All Tools
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard 
            icon={Sparkles}
            title="Analysis Advisor"
            description="Choose the optimal academic methodology for each unique research item."
            tag="Strategic"
          />
          <FeatureCard 
            icon={BookOpen}
            title="Citation Engine"
            description="Automatically collect and format references with institutional precision."
            tag="Scholarly"
          />
          <FeatureCard 
            icon={PenLine}
            title="Improve Writing"
            description="Check clarity, identify argument gaps, and strengthen your academic prose."
            tag="Drafting"
          />
          <FeatureCard 
            icon={BrainCircuit}
            title="Topic Builder"
            description="Synthesize scattered findings into cohesive outlines and research topics."
            tag="Synthesis"
          />
        </div>
      </section>

      {/* Workflow Section (The Flow Card) */}
      <section id="workflow" className="py-24 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold font-heading text-foreground">The Academic Flow</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Follow the journey from raw research input to verified scholarly output.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-8 shadow-sm max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-3 mb-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">The Journey</p>
                <h2 className="mt-1 text-xl font-bold font-heading">Input to Verification</h2>
              </div>
              <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider">Methodology</Badge>
            </div>

            <div className="space-y-4">
              <WorkflowStep 
                number="01"
                icon={Search}
                title="Deep Capture"
                description="Import papers, URLs, or notes into a structured, searchable local library."
              />
              <WorkflowStep 
                number="02"
                icon={BarChart3}
                title="Agentic Analysis"
                description="Our multi-step AI workflow extracts themes and methodological clues."
              />
              <WorkflowStep 
                number="03"
                icon={Users}
                title="Peer Synthesis"
                description="Finalize your research with peer review checks and topic expansion."
              />
            </div>
            
            <div className="mt-10 p-4 rounded-xl border bg-muted/50 text-[11px] text-muted-foreground leading-relaxed italic text-center">
              "The dashboard explains the journey; My Research stores the working set."
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Credentials */}
      <section id="trust" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold font-heading">Institutional Trust</h2>
              <p className="text-muted-foreground leading-relaxed">
                Built for researchers who demand more than just chatbots. AIPeer is designed to handle the complexity of professional academic workflows.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold font-heading text-primary">Offline-First</div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Local Persistence</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold font-heading text-primary">Privacy Focus</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Secure Data</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold font-heading text-primary">Academic Grade</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Peer Standards</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold font-heading text-primary">99.9% Sync</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Reliable Cloud</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <TestimonialCard 
              quote="AIPeer has completely transformed how I handle my literature reviews. The agentic workflow is like having a postdoc assistant 24/7."
              author="Dr. Sarah Chen"
              role="Senior Researcher"
            />
            <TestimonialCard 
              quote="The offline-first approach is a lifesaver. I can work in the field without worrying about connection, and everything syncs perfectly later."
              author="Marcus Thorne"
              role="Field Scientist"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground">
                <BrainCircuit className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight font-heading">AIPeer<span className="text-primary">.</span></span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Terms</a>
              <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border/50 gap-4">
            <p className="text-[11px] text-muted-foreground">© 2026 AIPeer. DevKada 2026 Hackathon | The Assemblers.</p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Secure Manuscript Storage</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, tag }: { icon: any, title: string, description: string, tag: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 transition-all hover:border-primary/40 hover:bg-muted/10 group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">{tag}</Badge>
      </div>
      <h3 className="text-base font-bold mb-2 font-heading">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function WorkflowStep({ number, icon: Icon, title, description }: { number: string, icon: any, title: string, description: string }) {
  return (
    <div className="w-full rounded-xl border border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/30">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-heading font-bold text-sm">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Process Stage</span>
          </div>
          <p className="font-bold leading-tight font-heading">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-4">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => <Sparkles key={i} className="w-3 h-3 text-primary" />)}
      </div>
      <p className="text-sm text-foreground leading-relaxed italic">"{quote}"</p>
      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
          {author.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-xs font-bold">{author}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{role}</div>
        </div>
      </div>
    </div>
  )
}

