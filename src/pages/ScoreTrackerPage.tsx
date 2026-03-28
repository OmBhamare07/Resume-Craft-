import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, FileText, Loader2, ArrowRight } from 'lucide-react';

interface ATSScore { score: number; jobRole: string; date: string; }
interface Resume { resumeId: string; name: string; templateId: string; atsScores?: ATSScore[]; }

export default function ScoreTrackerPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    fetch('/api/resumes', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const withScores = (Array.isArray(data) ? data : []).filter((r: Resume) => r.atsScores && r.atsScores.length > 0);
        setResumes(withScores);
        if (withScores.length > 0) setSelected(withScores[0].resumeId);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const current = resumes.find(r => r.resumeId === selected);
  const scores = current?.atsScores || [];
  const chartData = scores.map((s, i) => ({
    name: `Check ${i + 1}`,
    score: s.score,
    role: s.jobRole,
    date: new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  const latest = scores.at(-1)?.score || 0;
  const first = scores[0]?.score || 0;
  const improvement = latest - first;
  const trend = improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'flat';

  const scoreColor = (s: number) => s >= 80 ? '#16a34a' : s >= 60 ? '#ca8a04' : '#dc2626';
  const gradeBg = (s: number) => s >= 80 ? 'bg-green-50 border-green-200 text-green-700' : s >= 60 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-red-50 border-red-200 text-red-700';

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-xl border border-border bg-card shadow-lg p-3 text-xs">
        <div className="font-bold text-sm">{d.score}/100</div>
        <div className="text-muted-foreground">{d.date}</div>
        {d.role && <div className="text-primary mt-1">{d.role}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container max-w-4xl py-10 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> ATS Score Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track how your resume score improves over time</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h2 className="font-semibold mb-2">No score history yet</h2>
            <p className="text-sm text-muted-foreground mb-4">Run the ATS checker on your resume to start tracking your score</p>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
              Build a Resume <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Resume selector */}
            {resumes.length > 1 && (
              <div className="mb-6">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Select Resume</label>
                <div className="flex flex-wrap gap-2">
                  {resumes.map(r => (
                    <button key={r.resumeId} onClick={() => setSelected(r.resumeId)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${selected === r.resumeId ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'}`}>
                      <FileText className="h-3.5 w-3.5" /> {r.name || 'Untitled'}
                      <span className="text-xs text-muted-foreground">({r.atsScores?.length} checks)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className={`rounded-2xl border p-4 ${gradeBg(latest)}`}>
                <div className="text-xs font-medium opacity-70 mb-1">Latest Score</div>
                <div className="text-3xl font-bold">{latest}</div>
                <div className="text-xs opacity-70">out of 100</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground mb-1">First Score</div>
                <div className="text-3xl font-bold text-muted-foreground">{first}</div>
                <div className="text-xs text-muted-foreground">starting point</div>
              </div>
              <div className={`rounded-2xl border p-4 ${improvement > 0 ? 'bg-green-50 border-green-200' : improvement < 0 ? 'bg-red-50 border-red-200' : 'bg-muted border-border'}`}>
                <div className="text-xs font-medium text-muted-foreground mb-1">Total Change</div>
                <div className={`text-3xl font-bold flex items-center gap-1 ${improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {trend === 'up' ? <TrendingUp className="h-6 w-6" /> : trend === 'down' ? <TrendingDown className="h-6 w-6" /> : <Minus className="h-6 w-6" />}
                  {improvement > 0 ? '+' : ''}{improvement}
                </div>
                <div className="text-xs text-muted-foreground">points {improvement > 0 ? 'gained' : improvement < 0 ? 'lost' : 'change'}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground mb-1">Total Checks</div>
                <div className="text-3xl font-bold text-primary">{scores.length}</div>
                <div className="text-xs text-muted-foreground">ATS scans done</div>
              </div>
            </div>

            {/* Chart */}
            <div className="rounded-2xl border border-border bg-card p-6 mb-6">
              <h2 className="font-semibold mb-4 text-sm">Score History</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={80} stroke="#16a34a" strokeDasharray="4 4" label={{ value: 'Good (80)', position: 'right', fontSize: 10, fill: '#16a34a' }} />
                  <ReferenceLine y={60} stroke="#ca8a04" strokeDasharray="4 4" label={{ value: 'Fair (60)', position: 'right', fontSize: 10, fill: '#ca8a04' }} />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Score history list */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">Check History</div>
              <div className="divide-y divide-border">
                {[...scores].reverse().map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <span className={`text-lg font-bold`} style={{ color: scoreColor(s.score) }}>{s.score}/100</span>
                      {s.jobRole && <span className="text-xs text-muted-foreground ml-2">· {s.jobRole}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
