import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useResumeStore, templates } from '@/store/resumeStore';
import { Loader2, Upload, FileText, X, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

export default function UploadResumePage() {
  const navigate = useNavigate();
  const store = useResumeStore();
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  const msgs = [
    '📄 Reading your resume...',
    '🔍 Extracting your information...',
    '✍️ Structuring your data...',
    '🎨 Applying template format...',
    '✅ Almost done...',
  ];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
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
          .replace(/<w:br[^>]*\/>/gi, '\n')
          .replace(/<w:p[ >]/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
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
      }
    } catch {
      setError('Could not read file. Paste your resume text below.');
      setFileName('');
    }
  };

  const convert = async () => {
    if (!resumeText.trim()) { setError('Please upload or paste your resume.'); return; }
    setError('');
    setLoading(true);
    let i = 0;
    setLoadingMsg(msgs[0]);
    const interval = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]); }, 2000);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const prompt = `Extract all information from this resume and return structured JSON.

RESUME TEXT:
${resumeText}

Return ONLY valid JSON (no markdown):
{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "linkedinUrl": "" },
  "objective": "<professional summary or objective from the resume>",
  "skillGroups": [{ "id": "1", "category": "<category>", "skills": "<comma separated skills>" }],
  "experience": [{ "id": "1", "type": "<Full-time/Part-time/Internship>", "company": "<company>", "responsibilities": "<responsibilities>", "timePeriod": "<period>" }],
  "projects": [{ "id": "1", "name": "<name>", "description": "<description>", "technologies": "<tech stack>" }],
  "education": [{ "id": "1", "degree": "<degree>", "institute": "<institute>", "period": "<period>", "marks": "<marks/gpa>" }]
}

Rules:
- Extract ONLY real information from the resume, don't invent anything
- If a section has no data, use empty array []
- For objective, if not present write a brief one based on their experience
- Clean up and properly format the data`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } }) }
      );
      const raw = await res.json();
      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const result = JSON.parse(text.replace(/```json|```/g, '').trim());
      store.setResumeData(result);
      clearInterval(interval);
      setLoading(false);
      navigate(`/builder/${selectedTemplate}`);
    } catch {
      clearInterval(interval);
      setError('Conversion failed. Please try again.');
      setLoading(false);
    }
  };

  const templateColors: Record<string, string> = {
    modern: 'border-blue-400 bg-blue-50', professional: 'border-indigo-400 bg-indigo-50',
    minimal: 'border-slate-400 bg-slate-50', corporate: 'border-gray-400 bg-gray-50',
    simple: 'border-green-400 bg-green-50', executive: 'border-teal-400 bg-teal-50',
    tech: 'border-violet-400 bg-violet-50', creative: 'border-orange-400 bg-orange-50',
    compact: 'border-zinc-400 bg-zinc-50', elegant: 'border-amber-400 bg-amber-50',
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container max-w-4xl py-10 px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Upload className="h-4 w-4" /> Import Resume
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Convert Your Resume to Any Template</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Upload your existing resume in any format. AI extracts all your information and fills it into your chosen template instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upload */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <FileText className="h-4 w-4 text-primary" /> Your Resume
            </label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-muted/50 transition mb-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
              {fileName ? (
                <span className="flex items-center gap-2 text-primary font-medium text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> {fileName}
                  <button onClick={e => { e.preventDefault(); setFileName(''); setResumeText(''); }}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </span>
              ) : <span className="text-sm text-muted-foreground">Upload PDF, DOCX or TXT</span>}
              <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFile} />
            </label>
            <p className="text-xs text-center text-muted-foreground mb-2">— or paste your resume text —</p>
            <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              rows={10} placeholder="Paste your resume text here..." />
            {resumeText && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {resumeText.length} characters</p>}
          </div>

          {/* Template picker */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Sparkles className="h-4 w-4 text-primary" /> Choose Target Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(t => (
                <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm transition ${selectedTemplate === t.id ? (templateColors[t.id] || 'border-primary bg-primary/5') + ' border-opacity-100' : 'border-border hover:border-primary/40'}`}>
                  <div className="font-semibold text-xs">{t.name.replace(' ATS Template', '')}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.category}</div>
                  {selectedTemplate === t.id && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-1" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="text-center">
          <button onClick={convert} disabled={loading || !resumeText.trim()}
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-4 text-base font-bold text-white hover:opacity-90 transition disabled:opacity-40 shadow-lg">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" />{loadingMsg}</> : <><Sparkles className="h-5 w-5" />Convert & Open in Builder<ChevronRight className="h-5 w-5" /></>}
          </button>
          {!loading && <p className="text-xs text-muted-foreground mt-3">Takes ~10 seconds · Opens in builder ready to edit</p>}
        </div>
      </main>
    </div>
  );
}
