import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { FileText, Pencil, Trash2, Plus, Clock, LayoutTemplate, Loader2, Share2, TrendingUp, Copy, Check, X } from 'lucide-react';

interface ATSScore { score: number; jobRole: string; date: string; }
interface Resume {
  resumeId: string; templateId: string; name: string; updatedAt: string;
  resumeData: any; jobType?: string; atsScores?: ATSScore[];
  shareToken?: string; shareEnabled?: boolean;
}

export default function HistoryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterJobType, setFilterJobType] = useState('All');
  const [showScores, setShowScores] = useState<string | null>(null);

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
    if (!confirm('Delete this resume?')) return;
    setDeletingId(resumeId);
    try {
      await fetch(`/api/resumes/${resumeId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setResumes(r => r.filter(x => x.resumeId !== resumeId));
    } finally { setDeletingId(null); }
  };

  const handleShare = async (resume: Resume) => {
    setSharingId(resume.resumeId);
    try {
      if (resume.shareEnabled && resume.shareToken) {
        const url = `${window.location.origin}/shared/${resume.shareToken}`;
        await navigator.clipboard.writeText(url);
        setCopiedId(resume.resumeId);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        const res = await fetch(`/api/resumes/${resume.resumeId}/share`, {
          method: 'PUT', headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        await navigator.clipboard.writeText(`${window.location.origin}/shared/${data.shareToken}`);
        setCopiedId(resume.resumeId);
        setTimeout(() => setCopiedId(null), 2000);
        setResumes(r => r.map(x => x.resumeId === resume.resumeId ? { ...x, shareToken: data.shareToken, shareEnabled: true } : x));
      }
    } finally { setSharingId(null); }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const jobTypes = ['All', ...Array.from(new Set(resumes.map(r => r.jobType).filter(Boolean) as string[]))];
  const filtered = filterJobType === 'All' ? resumes : resumes.filter(r => r.jobType === filterJobType);

  const templateColors: Record<string, string> = {
    modern: 'bg-blue-100 text-blue-700', professional: 'bg-indigo-100 text-indigo-700',
    minimal: 'bg-slate-100 text-slate-700', corporate: 'bg-gray-100 text-gray-700', simple: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container py-10 max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">My Resumes</h1>
            <p className="text-sm text-muted-foreground mt-1">{resumes.length} resume{resumes.length !== 1 ? 's' : ''} saved</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => navigate('/cover-letters')}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition">
              <FileText className="h-4 w-4" /> Cover Letters
            </button>
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> New Resume
            </button>
          </div>
        </div>

        {/* Job type filter */}
        {jobTypes.length > 1 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {jobTypes.map(jt => (
              <button key={jt} onClick={() => setFilterJobType(jt)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition border ${filterJobType === jt ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                {jt}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-5">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No resumes yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Pick a template and start building</p>
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Create Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(resume => (
              <div key={resume.resumeId} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    {resume.shareEnabled && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Shared</span>}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${templateColors[resume.templateId] || 'bg-muted text-muted-foreground'}`}>
                      {resume.templateId}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground truncate mb-1">{resume.name || 'Untitled Resume'}</h3>
                {resume.resumeData?.personalInfo?.fullName && (
                  <p className="text-xs text-muted-foreground truncate mb-1">{resume.resumeData.personalInfo.fullName}</p>
                )}
                {resume.jobType && (
                  <span className="text-xs text-primary font-medium mb-1">{resume.jobType}</span>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto pt-2">
                  <Clock className="h-3 w-3" />
                  <span>Updated {formatDate(resume.updatedAt)}</span>
                </div>

                {/* ATS Score History mini chart */}
                {resume.atsScores && resume.atsScores.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <button onClick={() => setShowScores(showScores === resume.resumeId ? null : resume.resumeId)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition">
                      <TrendingUp className="h-3.5 w-3.5" />
                      ATS History ({resume.atsScores.length} checks)
                    </button>
                    {showScores === resume.resumeId && (
                      <div className="mt-2">
                        <div className="flex items-end gap-1 h-12">
                          {resume.atsScores.slice(-10).map((s, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                              <span className="text-[9px] text-muted-foreground">{s.score}</span>
                              <div className="w-full rounded-sm"
                                style={{ height: `${(s.score / 100) * 32}px`, background: s.score >= 75 ? '#16a34a' : s.score >= 55 ? '#ca8a04' : '#dc2626' }} />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                          <span>Oldest</span>
                          <span>Latest: {resume.atsScores.at(-1)?.score}/100</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button onClick={() => navigate(`/builder/${resume.templateId}?resumeId=${resume.resumeId}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => navigate(`/resume/${resume.templateId}?resumeId=${resume.resumeId}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-muted py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/80 transition">
                    <LayoutTemplate className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button onClick={() => handleShare(resume)} disabled={sharingId === resume.resumeId}
                    title="Copy share link"
                    className="flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 px-3 py-2 text-xs text-blue-500 hover:bg-blue-100 transition disabled:opacity-50">
                    {sharingId === resume.resumeId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : copiedId === resume.resumeId ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(resume.resumeId)} disabled={deletingId === resume.resumeId}
                    className="flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-xs text-red-500 hover:bg-red-100 transition disabled:opacity-50">
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
