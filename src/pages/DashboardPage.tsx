import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { templates, useResumeStore } from '@/store/resumeStore';
import { Plus, FileText, Clock, Trash2, Pencil, LayoutTemplate, ChevronRight } from 'lucide-react';

interface ResumeRecord {
  id: number;
  title: string;
  template_id: string;
  created_at: string;
  updated_at: string;
}

const templatePreviews: Record<string, string> = {
  modern: '#2563eb',
  professional: '#1e3a5f',
  minimal: '#111',
  corporate: '#0f172a',
  simple: '#374151',
};

const DashboardPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const store = useResumeStore();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const fetchResumes = async () => {
    const res = await fetch('/api/resumes', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setResumes(data);
    setLoading(false);
  };

  useEffect(() => { fetchResumes(); }, []);

  const openExisting = async (resume: ResumeRecord) => {
    const res = await fetch(`/api/resumes/${resume.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    store.setCurrentResumeId(resume.id);
    store.setResumeData(data.data);
    store.setSelectedTemplate(resume.template_id);
    navigate(`/builder/${resume.template_id}`);
  };

  const deleteResume = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this resume?')) return;
    setDeletingId(id);
    await fetch(`/api/resumes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setResumes(p => p.filter(r => r.id !== id));
    setDeletingId(null);
  };

  const startNew = (templateId: string) => {
    store.resetData();
    store.setCurrentResumeId(null);
    store.setSelectedTemplate(templateId);
    setShowTemplates(false);
    navigate(`/builder/${templateId}`);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container py-10 max-w-5xl">
        {/* Welcome header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">Your resume workspace — create, edit and track all your resumes.</p>
          </div>
          <button
            onClick={() => setShowTemplates(p => !p)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            New Resume
          </button>
        </div>

        {/* Template picker (shown when New Resume clicked) */}
        {showTemplates && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Choose a template</h2>
                <p className="text-xs text-muted-foreground mt-0.5">All templates are ATS-optimized</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => startNew(t.id)}
                  className="group flex flex-col items-center gap-2 rounded-xl border-2 border-border p-3 hover:border-primary transition"
                >
                  <div className="w-full h-16 rounded-lg flex items-center justify-center" style={{ background: templatePreviews[t.id] }}>
                    <LayoutTemplate className="h-6 w-6 text-white/70 group-hover:text-white transition" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{t.name.replace(' ATS Template', '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resume list */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-muted-foreground">No resumes yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Click "New Resume" to get started</p>
            <button
              onClick={() => setShowTemplates(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" /> Create your first resume
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map(resume => (
              <div
                key={resume.id}
                onClick={() => openExisting(resume)}
                className="group relative flex flex-col rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md transition cursor-pointer overflow-hidden"
              >
                {/* Color banner */}
                <div className="h-2 w-full" style={{ background: templatePreviews[resume.template_id] || '#666' }} />
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{resume.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <LayoutTemplate className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize">{resume.template_id}</span>
                      </div>
                    </div>
                    <button
                      onClick={e => deleteResume(resume.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      disabled={deletingId === resume.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Edited {formatDate(resume.updated_at)}</span>
                  </div>
                </div>
                <div className="px-5 pb-4 flex items-center justify-between">
                  <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Edit resume
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                </div>
              </div>
            ))}

            {/* Quick add card */}
            <button
              onClick={() => setShowTemplates(true)}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition min-h-[148px] gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">New Resume</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
