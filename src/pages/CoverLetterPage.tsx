import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { useResumeStore } from '@/store/resumeStore';
import { Loader2, Sparkles, Download, Save, CheckCircle2, FileText, Building, User, Briefcase } from 'lucide-react';

export default function CoverLetterPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const storeResumeData = useResumeStore(s => s.resumeData);
  const selectedFont = useResumeStore(s => s.selectedFont);

  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('current');
  const [resumeData, setResumeData] = useState(storeResumeData);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [recipientName, setRecipientName] = useState('Hiring Manager');
  const [keyPoints, setKeyPoints] = useState('');
  const [content, setContent] = useState('');
  const [letterName, setLetterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [letterId, setLetterId] = useState<string | null>(null);

  // Fetch user's saved resumes
  useEffect(() => {
    if (!token) return;
    setLoadingResumes(true);
    fetch('/api/resumes', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setResumes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingResumes(false));
  }, [token]);

  // When selected resume changes, load its data
  useEffect(() => {
    if (selectedResumeId === 'current') {
      setResumeData(storeResumeData);
    } else {
      const found = resumes.find(r => r.resumeId === selectedResumeId);
      if (found?.resumeData) setResumeData(found.resumeData);
    }
  }, [selectedResumeId, resumes, storeResumeData]);

  const generate = async () => {
    if (!jobTitle || !company) return;
    setLoading(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const resumeText = `
Name: ${resumeData.personalInfo.fullName}
Email: ${resumeData.personalInfo.email}
Summary: ${resumeData.objective}
Experience: ${resumeData.experience.map(e => `${e.type} at ${e.company} (${e.timePeriod}): ${e.responsibilities}`).join(' | ')}
Skills: ${resumeData.skillGroups.map(g => `${g.category}: ${g.skills}`).join(', ')}
Projects: ${resumeData.projects.map(p => `${p.name}: ${p.description}`).join(' | ')}
Education: ${resumeData.education.map(e => `${e.degree} from ${e.institute}`).join(' | ')}
    `.trim();

    const prompt = `Write a professional, ATS-optimized cover letter for the following:

Applicant Resume:
${resumeText}

Job Details:
- Job Title: ${jobTitle}
- Company: ${company}
- Recipient: ${recipientName}
${keyPoints ? `- Key points to highlight: ${keyPoints}` : ''}

Instructions:
- Write in first person
- 3-4 paragraphs: opening hook, relevant experience, why this company, closing call to action
- Use specific details from the resume (real company names, real skills, real achievements)
- Match keywords relevant to ${jobTitle}
- Professional but warm tone
- Do NOT use generic phrases like "I am writing to express my interest"
- End with the applicant's name: ${resumeData.personalInfo.fullName || 'Your Name'}
- Return ONLY the cover letter text, no subject line, no extra formatting`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 },
          }),
        }
      );
      const raw = await response.json();
      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      setContent(text);
      setLetterName(`${jobTitle} at ${company}`);
    } catch {
      alert('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!content || !token) return;
    setSaving(true);
    setSaveError('');
    try {
      const finalName = letterName.trim() || (jobTitle && company ? `${jobTitle} at ${company}` : 'Cover Letter');
      const url = letterId ? `/api/cover-letters/${letterId}` : '/api/cover-letters';
      const method = letterId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: finalName, content, jobTitle, company }),
      });
      const responseText = await res.text();
      let data: any = {};
      try { data = JSON.parse(responseText); } catch {}
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      if (!letterId && data.letterId) setLetterId(data.letterId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || 'Save failed. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    if (!content) return;
    setDownloading(true);
    try {
      const el = document.getElementById('cover-letter-preview');
      if (!el) return;
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save(`${(resumeData.personalInfo.fullName || 'Cover').replace(/\s+/g, '_')}_CoverLetter.pdf`);
    } catch { alert('Download failed'); }
    finally { setDownloading(false); }
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[420px_1fr]">
        {/* Form */}
        <aside className="overflow-y-auto border-r border-border bg-card p-6">
          <div className="mb-5">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Cover Letter Builder
            </h1>
            <p className="text-xs text-muted-foreground mt-1">AI generates a personalized cover letter from your resume</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Job Title *
              </label>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Senior Frontend Developer" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" /> Company Name *
              </label>
              <input value={company} onChange={e => setCompany(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Google" />
            </div>

            {/* Resume selector */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Use Resume As Reference *
              </label>
              {loadingResumes ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your resumes...
                </div>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={e => setSelectedResumeId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="current">Current resume in editor</option>
                  {resumes.map(r => (
                    <option key={r.resumeId} value={r.resumeId}>
                      {r.name || r.resumeData?.personalInfo?.fullName || 'Untitled'} — {r.templateId}
                    </option>
                  ))}
                </select>
              )}
              {selectedResumeId !== 'current' && resumeData?.personalInfo?.fullName && (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Using: {resumeData.personalInfo.fullName}'s resume
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Recipient Name
              </label>
              <input value={recipientName} onChange={e => setRecipientName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. John Smith or Hiring Manager" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Key Points to Highlight (optional)
              </label>
              <textarea value={keyPoints} onChange={e => setKeyPoints(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                rows={3} placeholder="e.g. 5 years React experience, led team of 8, reduced load time by 60%" />
            </div>

            <button onClick={generate} disabled={!jobTitle || !company || loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Cover Letter</>}
            </button>

            {content && (
              <>
                <div className="pt-2 border-t border-border">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Letter Name</label>
                  <input value={letterName} onChange={e => setLetterName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Cover letter name..." />
                </div>

                {saveError && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 px-3 py-2 text-xs text-red-600">{saveError}</div>
                )}
                <div className="flex gap-2">
                  <button onClick={save} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Save className="h-4 w-4" />}
                    {saved ? 'Saved!' : 'Save'}
                  </button>
                  <button onClick={downloadPDF} disabled={downloading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF
                  </button>
                </div>
              </>
            )}

            <button onClick={() => navigate('/history')}
              className="w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition">
              View Saved Cover Letters →
            </button>
          </div>
        </aside>

        {/* Preview */}
        <main className="overflow-y-auto bg-muted p-8 flex justify-center">
          {!content ? (
            <div className="flex flex-col items-center justify-center text-center max-w-sm">
              <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">Fill in the details and click Generate</p>
              <p className="text-xs text-muted-foreground mt-1">Your personalized cover letter will appear here</p>
            </div>
          ) : (
            <div id="cover-letter-preview"
              className="w-full max-w-[800px] bg-white shadow-elevated ring-1 ring-border p-16 min-h-[1130px]"
              style={{ fontFamily: selectedFont }}>
              {/* Header */}
              <div className="mb-8">
                <div className="text-xl font-bold text-slate-800">{resumeData.personalInfo.fullName || 'Your Name'}</div>
                <div className="text-sm text-slate-500 mt-1">
                  {[resumeData.personalInfo.email, resumeData.personalInfo.phone, resumeData.personalInfo.location].filter(Boolean).join(' · ')}
                </div>
              </div>

              {/* Date */}
              <div className="text-sm text-slate-600 mb-6">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>

              {/* Recipient */}
              <div className="text-sm text-slate-700 mb-6">
                <div className="font-medium">{recipientName}</div>
                <div>{company}</div>
              </div>

              {/* Subject */}
              <div className="text-sm font-semibold text-slate-800 mb-6">Re: {jobTitle} Position</div>

              {/* Content */}
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
