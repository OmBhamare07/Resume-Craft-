import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { templateComponents } from '@/templates/ResumeTemplates';
import { Loader2, FileText } from 'lucide-react';

export default function SharedResumePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/shared/${shareToken}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(d => setData(d))
      .catch(() => setError('This resume link is invalid or has been disabled.'))
      .finally(() => setLoading(false));
  }, [shareToken]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <FileText className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-lg font-semibold">Resume Not Found</h1>
      <p className="text-sm text-muted-foreground">{error}</p>
      <Link to="/" className="text-sm text-primary hover:underline">Go to ResumeCraft</Link>
    </div>
  );

  const TemplateComponent = data?.templateId ? templateComponents[data.templateId] : null;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <FileText className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold">ResumeCraft</span>
        </div>
        <div className="text-xs text-muted-foreground">{data?.name}</div>
        <Link to="/signup" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
          Create Your Resume
        </Link>
      </div>

      {/* Resume */}
      <main className="container py-8">
        <div className="mx-auto max-w-[800px]">
          <div className="aspect-[1/1.414] w-full bg-white shadow-elevated ring-1 ring-border">
            {TemplateComponent && data?.resumeData && <TemplateComponent data={data.resumeData} />}
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Created with <Link to="/" className="text-primary hover:underline">ResumeCraft</Link> — Build your own ATS-optimized resume for free
        </p>
      </main>
    </div>
  );
}
