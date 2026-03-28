import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Users, FileText, ShieldCheck, ShieldOff, Crown, Mail, CheckCircle2, XCircle, Clock, BarChart3 } from 'lucide-react';

interface UserStat {
  userId: string;
  name: string;
  email: string;
  role: string;
  adminStatus: string | null;
  verified: boolean;
  createdAt: string | null;
  resumeCount: number;
  coverLetterCount: number;
}

interface Stats {
  totalUsers: number;
  totalResumes: number;
  totalCoverLetters: number;
  users: UserStat[];
}

export default function AdminPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) { setError('Access denied. Admin only.'); setLoading(false); return; }
      if (!res.ok) throw new Error('Failed to load stats');
      setStats(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const grantAdmin = async (userId: string) => {
    setActionLoading(userId + '_grant');
    try {
      await fetch(`/api/admin/users/${userId}/grant`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      fetchStats();
    } finally { setActionLoading(null); }
  };

  const revokeAdmin = async (userId: string) => {
    if (!confirm('Revoke admin access for this user?')) return;
    setActionLoading(userId + '_revoke');
    try {
      await fetch(`/api/admin/users/${userId}/revoke`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      fetchStats();
    } finally { setActionLoading(null); }
  };

  const formatDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const statusBadge = (u: UserStat) => {
    if (u.role === 'admin') return <span className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold"><Crown className="h-3 w-3" /> Admin</span>;
    if (u.adminStatus === 'pending') return <span className="flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full font-semibold"><Clock className="h-3 w-3" /> Pending</span>;
    return <span className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">User</span>;
  };

  if (loading) return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="container max-w-2xl py-16 text-center">
        <ShieldOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="text-sm text-primary hover:underline">Go to Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container max-w-6xl py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Crown className="h-6 w-6 text-purple-500" /> Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage users and monitor platform usage</p>
          </div>
          <button onClick={fetchStats} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted transition">
            <BarChart3 className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Users className="h-5 w-5 text-blue-500" />, label: 'Total Users', value: stats?.totalUsers || 0, bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' },
            { icon: <FileText className="h-5 w-5 text-green-500" />, label: 'Total Resumes', value: stats?.totalResumes || 0, bg: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' },
            { icon: <Mail className="h-5 w-5 text-purple-500" />, label: 'Cover Letters', value: stats?.totalCoverLetters || 0, bg: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800' },
          ].map((card, i) => (
            <div key={i} className={`rounded-2xl border p-5 ${card.bg}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 dark:bg-black/20">{card.icon}</div>
                <div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <div className="text-xs text-muted-foreground">{card.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> All Users ({stats?.users.length || 0})</h2>
            <p className="text-xs text-muted-foreground">Sorted by activity</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Email</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Verified</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Resumes</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Cover Letters</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats?.users.map((u, i) => (
                  <tr key={u.userId} className={`border-b border-border hover:bg-muted/30 transition ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {u.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="font-medium truncate max-w-[120px]">{u.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[160px]">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      {u.verified ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-primary">{u.resumeCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-purple-600">{u.coverLetterCount}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">{statusBadge(u)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {u.userId !== user?.id && u.role !== 'admin' && (
                          <button
                            onClick={() => grantAdmin(u.userId)}
                            disabled={actionLoading === u.userId + '_grant'}
                            title="Grant Admin"
                            className="flex items-center gap-1 rounded-lg bg-purple-100 dark:bg-purple-900 px-2.5 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition disabled:opacity-50"
                          >
                            {actionLoading === u.userId + '_grant' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                            Grant
                          </button>
                        )}
                        {u.userId !== user?.id && u.role === 'admin' && (
                          <button
                            onClick={() => revokeAdmin(u.userId)}
                            disabled={actionLoading === u.userId + '_revoke'}
                            title="Revoke Admin"
                            className="flex items-center gap-1 rounded-lg bg-red-100 dark:bg-red-900 px-2.5 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-200 transition disabled:opacity-50"
                          >
                            {actionLoading === u.userId + '_revoke' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldOff className="h-3 w-3" />}
                            Revoke
                          </button>
                        )}
                        {u.userId === user?.id && <span className="text-xs text-muted-foreground">You</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
