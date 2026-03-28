import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { Crown, Loader2, CheckCircle2, Shield } from 'lucide-react';

export default function AdminRequestPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const requestAccess = async () => {
    if (!user || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, name: user.name, email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user is already admin, redirect to dashboard
  if (user?.role === 'admin') {
    navigate('/admin');
    return null;
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container max-w-lg py-16 px-4">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mx-auto mb-5">
            <Crown className="h-8 w-8 text-white" />
          </div>

          {sent ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">Request Sent!</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Your admin access request has been sent to the administrator. You will receive an email once your request is reviewed.
              </p>
              <button onClick={() => navigate('/')} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
                Back to Home
              </button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-2">Request Admin Access</h1>
              <p className="text-sm text-muted-foreground mb-2">
                Admin access allows you to view platform statistics and manage users.
              </p>
              <div className="my-5 rounded-xl bg-muted p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Admin can:</p>
                {['View total users, resumes and cover letters', 'See user registration info', 'Grant or revoke admin access to other users'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-purple-500 shrink-0" /> {item}
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 mb-5 text-left">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Your request will be sent to <strong>ombhamare178@gmail.com</strong> for approval. You will be notified by email once approved.
                </p>
              </div>

              <div className="mb-5 rounded-xl bg-muted/50 p-3 text-left">
                <p className="text-xs text-muted-foreground">Requesting as:</p>
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>

              {error && <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 px-4 py-2.5 text-sm text-red-600">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => navigate('/')} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition">
                  Cancel
                </button>
                <button onClick={requestAccess} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Crown className="h-4 w-4" /> Request Access</>}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
