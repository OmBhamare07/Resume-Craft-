import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useResumeStore, templates } from '@/store/resumeStore';
import { Loader2, Upload, FileText, X, CheckCircle2, ChevronRight, Sparkles, ShieldCheck, Pencil } from 'lucide-react';

type Mode = 'upload' | 'choose';

export default function UploadResumePage() {
  const navigate = useNavigate();
  const store = useResumeStore();
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('upload');
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsResult, setAtsResult] = useState<any>(null);

  const msgs = ['📄 Reading resume...', '🔍 Extracting info...', '✍️ Structuring data...', '🎨 Applying template...', '✅ Almost done...'];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    setAtsResult(null);
    try {
      if (file.type === 'text/plain') {
        setResumeText(await file.text());
      } else if (file.name.endsWith('.docx')) {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const xmlFile = zip.file('word/document.xml');
        if (!xmlFile) throw new Error('Invalid DOCX');
        const xml = await xmlFile.async('string');
        const text = xml
          .replace(/<w:br[^>]*\/>/gi, '\n').replace(/<w:p[ >]/gi, '\n')
          .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>').replace(/&quot;/g, '"')
          .replace(/\n\s*\n\s*\n/g, '\n\n').trim();
        setResumeText(text);
      } else if (file.type === 'application/pdf') {
        const pdfjs = (window as any).pdfjsLib;
        if (!pdfjs) {
          await new Promise<void>((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            s.onload = () => res(); s.onerror = () => rej();
            document.head.appendChild(s);
          });
        }
        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const c = await page.getTextContent();
          text += c.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setResumeText(text);
      } else {
        setError('Please upload PDF, DOCX or TXT');
        setFileName('');
        return;
      }
      // Show options after successful upload
      setMode('choose');
    } catch {
      setError('Could not read file. Paste your resume text below.');
      setFileName('');
    }
  };

  const checkATS = async () => {
    if (!resumeText.trim()) return;
    setAtsLoading(true);
    setError('');
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const prompt = `You are an ATS expert. Analyze this resume and give a detailed ATS score.

RESUME:
${resumeText}

Return ONLY valid JSON (no markdown):
{
  "score": <0-100>,
  "grade": "<A+/A/B+/B/C/D>",
  "summary": "<2 sentence overall assessment>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": [
    { "section": "<section name>", "issue": "<specific issue>", "fix": "<how to fix it>" }
  ],
  "missingKeywords": ["<keyword1>", "<keyword2>"],
  "formatIssues": ["<issue1>", "<issue2>"],
  "verdict": "<one line verdict>"
}`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } }) }
      );
      const raw = await res.json();
      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      setAtsResult(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch { setError('ATS check failed. Please try again.'); }
    finally { setAtsLoading(false); }
  };

  const convert = async () => {
    if (!resumeText.trim()) { setError('Please upload or paste your resume.'); return; }
    setError('');
    setLoading(true);
    let i = 0; setLoadingMsg(msgs[0]);
    const interval = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]); }, 2000);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const prompt = `Extract all information from this resume and return structured JSON.
RESUME TEXT:
${resumeText}
Return ONLY valid JSON (no markdown):
{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "linkedinUrl": "" },
  "objective": "<professional summary>",
  "skillGroups": [{ "id": "1", "category": "<category>", "skills": "<comma separated>" }],
  "experience": [{ "id": "1", "type": "<Full-time/Internship>", "company": "<company>", "responsibilities": "<responsibilities>", "timePeriod": "<period>" }],
  "projects": [{ "id": "1", "name": "<name>", "description": "<description>", "technologies": "<tech>" }],
  "education": [{ "id": "1", "degree": "<degree>", "institute": "<institute>", "period": "<period>", "marks": "<marks>" }]
}`;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } }) }
      );
      const raw = await res.json();
      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      store.setResumeData(JSON.parse(text.replace(/```json|```/g, '').trim()));
      clearInterval(interval); setLoading(false);
      navigate(`/builder/${selectedTemplate}`);
    } catch { clearInterval(interval); setError('Conversion failed. Please try again.'); setLoading(false); }
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = (s: number) => s >= 80 ? 'bg-green-50 border-green-200' : s >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  const templateColors: Record<string, string> = {
    modern: 'border-blue-400', professional: 'border-indigo-400', minimal: 'border-slate-400',
    corporate: 'border-gray-400', simple: 'border-green-400', executive: 'border-teal-400',
    tech: 'border-violet-400', creative: 'border-orange-400', compact: 'border-zinc-400', elegant: 'border-amber-400',
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container max-w-4xl py-10 px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Upload className="h-4 w-4" /> Import Resume
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Import Your Resume</h1>
          <p className="text-muted-foreground text-sm">Upload PDF, DOCX or TXT — then check ATS score or convert to any template</p>
        </div>

        {/* Upload area */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-6">
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary hover:bg-muted/30 transition">
            <Upload className="h-8 w-8 text-muted-foreground" />
            {fileName ? (
              <div className="flex items-center gap-2 text-primary font-medium">
                <CheckCircle2 className="h-5 w-5 text-green-500" /> {fileName}
                <button onClick={e => { e.preventDefault(); setFileName(''); setResumeText(''); setMode('upload'); setAtsResult(null); }}
                  className="text-muted-foreground hover:text-destructive ml-2"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm font-medium">Drop your resume here or click to browse</div>
                <div className="text-xs text-muted-foreground mt-1">Supports PDF, DOCX, TXT</div>
              </div>
            )}
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFile} />
          </label>

          <div className="mt-3">
            <p className="text-xs text-center text-muted-foreground mb-2">— or paste your resume text directly —</p>
            <textarea value={resumeText} onChange={e => { setResumeText(e.target.value); if (e.target.value.trim()) setMode('choose'); }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              rows={5} placeholder="Paste your resume text here..." />
          </div>
          {resumeText && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {resumeText.length} characters ready</p>}
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}

        {/* Action options — shown after upload */}
        {mode === 'choose' && resumeText && (
          <div className="space-y-4">
            {/* Two option cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Check ATS */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Check ATS Score</div>
                    <div className="text-xs text-muted-foreground">Analyze your uploaded resume</div>
                  </div>
                </div>
                <button onClick={checkATS} disabled={atsLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50">
                  {atsLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <><ShieldCheck className="h-4 w-4" /> Run ATS Check</>}
                </button>
              </div>

              {/* Option 2: Convert to template */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
                    <Pencil className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Edit in Builder</div>
                    <div className="text-xs text-muted-foreground">Convert to a template & edit</div>
                  </div>
                </div>
                <div className="mb-3">
                  <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name.replace(' ATS Template', '')} — {t.category}</option>)}
                  </select>
                </div>
                <button onClick={convert} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{loadingMsg}</> : <><Sparkles className="h-4 w-4" /> Convert & Edit<ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>

            {/* ATS Results */}
            {atsResult && (
              <div className={`rounded-2xl border p-6 ${scoreBg(atsResult.score)}`}>
                {/* Score header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className={`text-4xl font-bold ${scoreColor(atsResult.score)}`}>{atsResult.score}<span className="text-lg">/100</span></div>
                    <div className={`text-sm font-semibold ${scoreColor(atsResult.score)}`}>Grade: {atsResult.grade}</div>
                    <div className="text-xs text-muted-foreground mt-1">{atsResult.verdict}</div>
                  </div>
                  <div className="text-right">
                    <div className="w-24 h-24 rounded-full border-8 flex items-center justify-center"
                      style={{ borderColor: atsResult.score >= 80 ? '#16a34a' : atsResult.score >= 60 ? '#ca8a04' : '#dc2626' }}>
                      <span className={`text-2xl font-bold ${scoreColor(atsResult.score)}`}>{atsResult.grade}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{atsResult.summary}</p>

                {/* Strengths */}
                {atsResult.strengths?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                    </div>
                    <div className="space-y-1">
                      {atsResult.strengths.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-400">
                          <span className="text-green-500 shrink-0">✓</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {atsResult.improvements?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-2">🔧 Improvements Needed</div>
                    <div className="space-y-2">
                      {atsResult.improvements.map((imp: any, i: number) => (
                        <div key={i} className="rounded-lg bg-white/60 dark:bg-black/20 border border-white/40 p-2.5 text-xs">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{imp.section}</div>
                          <div className="text-red-600 dark:text-red-400 mt-0.5">{imp.issue}</div>
                          <div className="text-green-700 dark:text-green-400 mt-0.5">→ {imp.fix}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing keywords */}
                {atsResult.missingKeywords?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">❌ Missing Keywords</div>
                    <div className="flex flex-wrap gap-1.5">
                      {atsResult.missingKeywords.map((k: string, i: number) => (
                        <span key={i} className="rounded-full bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 px-2 py-0.5 text-xs text-red-700 dark:text-red-300">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA after ATS */}
                <div className="mt-5 pt-4 border-t border-white/40">
                  <p className="text-xs text-muted-foreground mb-3">Want to improve this score? Convert to a template and edit with AI assistance.</p>
                  <button onClick={convert} disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Convert & Fix in Builder
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
