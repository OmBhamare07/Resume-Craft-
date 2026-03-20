import { templates } from '@/store/resumeStore';
import { TemplateCard } from '@/components/TemplateCard';
import { AppHeader } from '@/components/AppHeader';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container py-12">

        {/* AI Job Match Banner */}
        <div className="mb-10 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-20 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5" /> NEW FEATURE
            </div>
            <h2 className="text-2xl font-bold mb-2">Tailor Your Resume to Any Job</h2>
            <p className="text-white/80 text-sm max-w-lg mb-5">
              Paste your resume + company's job description. AI rewrites your resume with exact ATS keywords to maximize selection chances. Target score: 80+
            </p>
            <button
              onClick={() => navigate('/tailor')}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition shadow-lg text-sm"
            >
              <Sparkles className="h-4 w-4" />
              AI Job Match — Tailor Resume to JD
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Templates section */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">
            Or choose a template and build from scratch
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            10 ATS-optimized templates — single-column layouts designed for maximum compatibility.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
