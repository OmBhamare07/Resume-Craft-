import { templates } from '@/store/resumeStore';
import { TemplateCard } from '@/components/TemplateCard';
import { AppHeader } from '@/components/AppHeader';
import { Sparkles, Upload, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container py-12">
        <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Build a resume that machines can read and humans want to hire.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose an ATS-optimized template to get started. Single-column layouts designed for maximum compatibility.
            </p>
          </div>

          {/* Action buttons top right */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate('/upload-resume')}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted transition shadow-sm">
              <Upload className="h-4 w-4" /> Import Resume
            </button>
            <button onClick={() => navigate('/tailor')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition shadow-sm">
              <Sparkles className="h-4 w-4" /> AI Job Match
            </button>
            <button onClick={() => navigate('/job-match')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition shadow-sm">
              <Briefcase className="h-4 w-4" /> Live Jobs
            </button>
          </div>
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
