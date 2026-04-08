import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, FileText, Loader2, ArrowRight, BarChart3 } from 'lucide-react';

interface ATSScore { score: number; jobRole: string; date: string; }
interface Resume { resumeId: string; name: string; templateId: string; atsScores?: ATSScore[]; }

// Distinct colours for each resume line
const LINE_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', '#65a30d', '#db2777'];

export default function ScoreTrackerPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [allResumes, setAllResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'single'>('all');
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/resumes', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const withScores = (Array.isArray(data) ? data : [])
          .filter((r: Resume) => r.atsScores && r.atsScores.length > 0)
          .sort((a: Resume, b: Resume) => (b.atsScores?.length || 0) - (a.atsScores?.length || 0));
        setAllResumes(withScores);
        if (withScores.length > 0) setSelected(withScores[0].resumeId);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // ── ALL-RESUMES chart: merge all scores by date on one graph ─────────────
  // Each resume gets its own line. X-axis = chronological check number
  const buildAllChart = () => {
    // Find max checks across all resumes
    const maxChecks = Math.max(...allResumes.map(r => r.atsScores?.length || 0));
    const rows: any[] = [];
    for (let i = 0; i < maxChecks; i++) {
      const row: any = { check: `#${i + 1}` };
      allResumes.forEach(r => {
        const s = r.atsScores?.[i];
        if (s) row[r.resumeId] = s.score;
      });
      rows.push(row);
    }
    return rows;
  };

  // ── SINGLE-RESUME chart ──────────────────────────────────────────────────
  const currentResume = allResumes.find(r => r.resumeId === selected);
  const singleScores = currentResume?.atsScores || [];
  const singleChartData = singleScores.map((s, i) => ({
    check: `#${i + 1}`,
    score: s.score,
    role: s.jobRole,
    date: new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  // ── Stats ────────────────────────────────────────────────────────────────
  const allScoresFlat = allResumes.flatMap(r => r.atsScores || []);
  const totalChecks = allScoresFlat.length;
  const highestScore = totalChecks > 0 ? Math.max(...allScoresFlat.map(s => s.score)) : 0;
  const latestScore = allScoresFlat.length > 0
    ? [...allScoresFlat].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].score
    : 0;

  // Single resume stats
  const singleLatest = singleScores.at(-1)?.score || 0;
  const singleFirst = singleScores[0]?.score || 0;
  const improvement = singleLatest - singleFirst;

  const scoreColor = (s: number) => s >= 80 ? '#16a34a' : s >= 60 ? '#ca8a04' : '#dc2626';
  const gradeBg = (s: number) => s >= 80 ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300'
    : s >= 60 ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300'
    : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300';

  const CustomTooltipAll = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border bg-card shadow-lg p-3 text-xs min-w-[140px]">
        <div className="font-semibold mb-1.5 text-muted-foreground">Check {label}</div>
        {payload.map((p: any, i: number) => {
          const resume = allResumes.find(r => r.resumeId === p.dataKey);
          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <span style={{ color: p.color }} className="font-medium truncate max-w-[90px]">
                {resume?.name || 'Resume'}
              </span>
              <span className="font-bold">{p.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const CustomTooltipSingle = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-xl border border-border bg-card shadow-lg p-3 text-xs">
        <div className="font-bold text-sm" style={{ color: scoreColor(d.score) }}>{d.score}/100</div>
        <div className="text-muted-foreground">{d.date}</div>
        {d.role && <div className="text-primary mt-1">{d.role}</div>}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </div>
  );

  if (allResumes.length === 0) return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="flex flex-col items-center justify-center py-24 text-center container">
        <BarChart3 className="h-14 w-14 text-muted-foreground/30 mb-4" />
        <h2 className="font-semibold text-lg mb-2">No ATS scores yet</h2>
        <p className="text-sm text-muted-foreground mb-2 max-w-sm">
          Open any resume in the builder, then click the green <strong>ATS Check</strong> button. After the check, your score will appear here automatically.
        </p>
        <p className="text-xs text-muted-foreground mb-6">You can check multiple resumes — each will appear as a separate line on the graph.</p>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
          Go to My Resumes <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container max-w-5xl py-8 px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" /> ATS Score Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tracking {allResumes.length} resume{allResumes.length > 1 ? 's' : ''} · {totalChecks} total ATS checks
            </p>
          </div>
          {/* View toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden text-sm">
            <button onClick={() => setView('all')}
              className={`px-4 py-2 font-medium transition ${view === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              All Resumes
            </button>
            <button onClick={() => setView('single')}
              className={`px-4 py-2 font-medium transition ${view === 'single' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              Single Resume
            </button>
          </div>
        </div>

        {/* Overall stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Checks</div>
            <div className="text-3xl font-bold text-primary">{totalChecks}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">Resumes Tracked</div>
            <div className="text-3xl font-bold">{allResumes.length}</div>
          </div>
          <div className={`rounded-2xl border p-4 ${gradeBg(latestScore)}`}>
            <div className="text-xs opacity-70 mb-1">Latest Score</div>
            <div className="text-3xl font-bold">{latestScore}</div>
          </div>
          <div className={`rounded-2xl border p-4 ${gradeBg(highestScore)}`}>
            <div className="text-xs opacity-70 mb-1">Best Score Ever</div>
            <div className="text-3xl font-bold">{highestScore}</div>
          </div>
        </div>

        {/* ── ALL RESUMES VIEW ── */}
        {view === 'all' && (
          <>
            <div className="rounded-2xl border border-border bg-card p-6 mb-6">
              <h2 className="font-semibold text-sm mb-1">All Resumes — Score History</h2>
              <p className="text-xs text-muted-foreground mb-4">Each line is a different resume. X-axis = ATS check number.</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={buildAllChart()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="check" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltipAll />} />
                  <Legend formatter={(value) => {
                    const r = allResumes.find(r => r.resumeId === value);
                    return <span style={{ fontSize: 11 }}>{r?.name || 'Resume'}</span>;
                  }} />
                  <ReferenceLine y={80} stroke="#16a34a" strokeDasharray="4 4" />
                  <ReferenceLine y={60} stroke="#ca8a04" strokeDasharray="4 4" />
                  {allResumes.map((r, i) => (
                    <Line key={r.resumeId} type="monotone" dataKey={r.resumeId}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }}
                      connectNulls={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Resume cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allResumes.map((r, i) => {
                const latest = r.atsScores?.at(-1)?.score || 0;
                const first = r.atsScores?.[0]?.score || 0;
                const diff = latest - first;
                return (
                  <div key={r.resumeId} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                      style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] + '20', border: `2px solid ${LINE_COLORS[i % LINE_COLORS.length]}` }}>
                      <FileText className="h-5 w-5" style={{ color: LINE_COLORS[i % LINE_COLORS.length] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{r.name || 'Untitled Resume'}</div>
                      <div className="text-xs text-muted-foreground">{r.atsScores?.length} checks</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold" style={{ color: scoreColor(latest) }}>{latest}</div>
                      {diff !== 0 && (
                        <div className={`text-xs font-medium flex items-center gap-0.5 justify-end ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {diff > 0 ? '+' : ''}{diff}
                        </div>
                      )}
                    </div>
                    <button onClick={() => { setSelected(r.resumeId); setView('single'); }}
                      className="text-xs text-primary hover:underline shrink-0">Detail →</button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── SINGLE RESUME VIEW ── */}
        {view === 'single' && (
          <>
            {/* Resume selector */}
            <div className="flex flex-wrap gap-2 mb-5">
              {allResumes.map((r, i) => (
                <button key={r.resumeId} onClick={() => setSelected(r.resumeId)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${selected === r.resumeId ? 'text-white border-transparent' : 'border-border hover:bg-muted'}`}
                  style={selected === r.resumeId ? { backgroundColor: LINE_COLORS[i % LINE_COLORS.length] } : {}}>
                  <FileText className="h-3.5 w-3.5" />
                  {r.name || 'Untitled'} ({r.atsScores?.length})
                </button>
              ))}
            </div>

            {/* Single stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className={`rounded-2xl border p-4 ${gradeBg(singleLatest)}`}>
                <div className="text-xs opacity-70 mb-1">Latest Score</div>
                <div className="text-3xl font-bold">{singleLatest}<span className="text-base font-normal">/100</span></div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-xs text-muted-foreground mb-1">First Score</div>
                <div className="text-3xl font-bold text-muted-foreground">{singleFirst}</div>
              </div>
              <div className={`rounded-2xl border p-4 ${improvement > 0 ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : improvement < 0 ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' : 'bg-muted border-border'}`}>
                <div className="text-xs text-muted-foreground mb-1">Total Change</div>
                <div className={`text-3xl font-bold flex items-center gap-1 ${improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {improvement > 0 ? <TrendingUp className="h-6 w-6" /> : improvement < 0 ? <TrendingDown className="h-6 w-6" /> : <Minus className="h-5 w-5" />}
                  {improvement > 0 ? '+' : ''}{improvement}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-xs text-muted-foreground mb-1">Total Checks</div>
                <div className="text-3xl font-bold text-primary">{singleScores.length}</div>
              </div>
            </div>

            {/* Single chart */}
            <div className="rounded-2xl border border-border bg-card p-6 mb-5">
              <h2 className="font-semibold text-sm mb-4">{currentResume?.name || 'Resume'} — Score Over Time</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={singleChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltipSingle />} />
                  <ReferenceLine y={80} stroke="#16a34a" strokeDasharray="4 4" label={{ value: 'Good (80)', position: 'right', fontSize: 10, fill: '#16a34a' }} />
                  <ReferenceLine y={60} stroke="#ca8a04" strokeDasharray="4 4" label={{ value: 'Fair (60)', position: 'right', fontSize: 10, fill: '#ca8a04' }} />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* History list */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">Full Check History</div>
              <div className="divide-y divide-border">
                {[...singleScores].reverse().map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold" style={{ color: scoreColor(s.score) }}>{s.score}/100</span>
                      {s.jobRole && <span className="text-xs text-muted-foreground">· {s.jobRole}</span>}
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
