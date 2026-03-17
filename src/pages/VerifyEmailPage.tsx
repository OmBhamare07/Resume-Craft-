import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.message) { setStatus('success'); setMessage(data.message); }
        else { setStatus('error'); setMessage(data.error || 'Verification failed'); }
      })
      .catch(() => { setStatus('error'); setMessage('Server error. Please try again.'); });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-xl border border-slate-100 p-10">
        {status === 'loading' && (
          <><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Verifying your email...</p></>
        )}
        {status === 'success' && (
          <><CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Email Verified!</h2>
          <p className="text-slate-500 text-sm mb-6">{message}</p>
          <Link to="/login" className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">Go to Login</Link></>
        )}
        {status === 'error' && (
          <><XCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Verification Failed</h2>
          <p className="text-slate-500 text-sm mb-6">{message}</p>
          <Link to="/signup" className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">Try Again</Link></>
        )}
      </div>
    </div>
  );
}
