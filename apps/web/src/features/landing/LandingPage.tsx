import { Button } from '@/shared/components/ui/button'
import { Brain, Database, BookOpen, ArrowRight, GraduationCap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

interface LandingPageProps {
  isAuthenticated?: boolean
}

export function LandingPage({ isAuthenticated }: LandingPageProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Brain className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">AIPeer</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Button onClick={() => navigate('/dashboard')} variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Link 
                    to="/login"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-6">
            <GraduationCap className="w-3.5 h-3.5" />
            Your AI Research Peer Reviewer
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Elevate Your Research with <span className="text-indigo-600">AIPeer</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The perfect synergy of AI intelligence and rigorous peer review. Organize, analyze, and validate your research library with an agentic peer in your pocket.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 gap-2">
                Continue to App <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Link to="/signup">
                    Start Your Library <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg border-slate-200 text-slate-600 hover:bg-slate-50">
                  <Link to="/login">View Demo</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Advanced Research Tools</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              A comprehensive suite of tools built to handle the complexities of modern academic workflows.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Brain}
              title="AI Analysis"
              description="Get instant summaries, key takeaways, and critical analysis of your research papers with our agentic AI workflows."
            />
            <FeatureCard 
              icon={Database}
              title="Research Database"
              description="Keep all your papers, notes, and findings in one place. Synced across devices and accessible anywhere."
            />
            <FeatureCard 
              icon={BookOpen}
              title="Citation Engine"
              description="Automatically generate and manage citations. Build topics and connect ideas across multiple sources."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-900 mb-8">The Research Methodology</h2>
              <div className="space-y-8">
                <Step 
                  number="01"
                  title="Collect"
                  description="Import your research papers and documents into your secure local library."
                />
                <Step 
                  number="02"
                  title="Analyze"
                  description="Use our AI workflows to extract insights, identify methodologies, and evaluate findings."
                />
                <Step 
                  number="03"
                  title="Synthesize"
                  description="Build topics, generate citations, and transform scattered research into a cohesive knowledge base."
                />
              </div>
            </div>
            <div className="flex-1 w-full max-w-xl">
              <div className="aspect-square bg-indigo-50 rounded-2xl border border-indigo-100 p-8 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:20px_20px]"></div>
                <div className="relative z-10 space-y-4 w-full">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                        <div className="h-2 bg-slate-50 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900">AIPeer</span>
          </div>
          <p className="text-sm text-slate-500">© 2026 AIPeer. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Privacy</a>
            <a href="#" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Terms</a>
            <a href="#" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all group">
      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-6">
      <div className="text-2xl font-black text-indigo-100 tracking-tighter leading-none shrink-0 pt-1">{number}</div>
      <div>
        <h4 className="text-lg font-bold text-slate-900 mb-1">{title}</h4>
        <p className="text-slate-600">{description}</p>
      </div>
    </div>
  )
}
