import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { FileText, Plus, Trash2, Pencil, Clock, Loader2 } from 'lucide-react';

interface CoverLetter {
  letterId: string; name: string; jobTitle: string; company: string; updatedAt: string; content: string;
}

export default function CoverLettersListPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cover-letters', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setLetters(Array.isArray(data) ? data : []))
      .catch(() => setLetters([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cover letter?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/cover-letters/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setLetters(l => l.filter(x => x.letterId !== id));
    } finally { setDeletingId(null); }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container py-10 max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">My Cover Letters</h1>
            <p className="text-sm text-muted-foreground mt-1">{letters.length} cover letter{letters.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => navigate('/cover-letter')}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> New Cover Letter
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : letters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-5">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No cover letters yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Create AI-powered cover letters tailored to each job</p>
            <button onClick={() => navigate('/cover-letter')}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Create Cover Letter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {letters.map(letter => (
              <div key={letter.letterId} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900 mb-4">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold truncate mb-1">{letter.name}</h3>
                {letter.jobTitle && <p className="text-xs text-primary font-medium">{letter.jobTitle}</p>}
                {letter.company && <p className="text-xs text-muted-foreground">{letter.company}</p>}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto pt-3">
                  <Clock className="h-3 w-3" /><span>Updated {formatDate(letter.updatedAt)}</span>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button onClick={() => navigate('/cover-letter')}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(letter.letterId)} disabled={deletingId === letter.letterId}
                    className="flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-xs text-red-500 hover:bg-red-100 transition disabled:opacity-50">
                    {deletingId === letter.letterId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
