import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { FileText, Pencil, Trash2, Plus, Clock, LayoutTemplate, Loader2 } from 'lucide-react';

interface Resume {
  resumeId: string;
  templateId: string;
  name: string;
  updatedAt: string;
  resumeData: any;
}

export default function HistoryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchResumes = async () => {
    try {
      const res = await fetch('/api/resumes', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setResumes(Array.isArray(data) ? data : []);
    } catch { setResumes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResumes(); }, []);

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    setDeletingId(resumeId);
    try {
      await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      setResumes(r => r.filter(x => x.resumeId !== resumeId));
    } finally { setDeletingId(null); }
  };

  const handleEdit = (resume: Resume) => {
    navigate(`/builder/${resume.templateId}?resumeId=${resume.resumeId}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const templateLabels: Record<string, string> = {
    modern: 'Modern', professional: 'Professional', minimal: 'Minimal',
    corporate: 'Corporate', simple: 'Simple'
  };

  const templateColors: Record<string, string> = {
    modern: 'bg-blue-100 text-blue-700',
    professional: 'bg-indigo-100 text-indigo-700',
    minimal: 'bg-slate-100 text-slate-700',
    corporate: 'bg-gray-100 text-gray-700',
    simple: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container py-10 max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Resumes</h1>
            <p className="text-sm text-muted-foreground mt-1">{resumes.length} resume{resumes.length !== 1 ? 's' : ''} saved</p>
          </div>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> New Resume
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-5">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No resumes yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Pick a template and start building your first resume</p>
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Create Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {resumes.map(resume => (
              <div key={resume.resumeId} className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition">
                {/* Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${templateColors[resume.templateId] || 'bg-muted text-muted-foreground'}`}>
                    {templateLabels[resume.templateId] || resume.templateId}
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-semibold text-foreground truncate mb-1">
                  {resume.name || resume.resumeData?.personalInfo?.fullName || 'Untitled Resume'}
                </h3>
                {resume.resumeData?.personalInfo?.fullName && resume.name !== resume.resumeData.personalInfo.fullName && (
                  <p className="text-xs text-muted-foreground truncate mb-1">{resume.resumeData.personalInfo.fullName}</p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto pt-3">
                  <Clock className="h-3 w-3" />
                  <span>Updated {formatDate(resume.updatedAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button onClick={() => handleEdit(resume)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => navigate(`/resume/${resume.templateId}?resumeId=${resume.resumeId}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-muted py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/80 transition">
                    <LayoutTemplate className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button onClick={() => handleDelete(resume.resumeId)} disabled={deletingId === resume.resumeId}
                    className="flex items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 hover:bg-red-100 transition disabled:opacity-50">
                    {deletingId === resume.resumeId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
