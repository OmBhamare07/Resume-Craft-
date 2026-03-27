import { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { useResumeStore } from '@/store/resumeStore';
import { Loader2, Briefcase, MapPin, Building2, ExternalLink, Sparkles, Upload, X, CheckCircle2, Search, IndianRupee, Clock } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  created: string;
  redirect_url: string;
  category: string;
  source: string;
}

export default function JobMatchPage() {
  const storeData = useResumeStore(s => s.resumeData);

  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [location, setLocation] = useState('India');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [keywords, setKeywords] = useState('');
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [searched, setSearched] = useState(false);
  const [useStoreResume, setUseStoreResume] = useState(false);

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
      }
    } catch { setError('Could not read file. Paste resume text below.'); setFileName(''); }
  };

  const getResumeContent = () => {
    if (useStoreResume) {
      const d = storeData;
      return `
Name: ${d.personalInfo.fullName}
Skills: ${d.skillGroups.map(g => `${g.category}: ${g.skills}`).join(', ')}
Experience: ${d.experience.map(e => `${e.type} at ${e.company}: ${e.responsibilities}`).join(' | ')}
Projects: ${d.projects.map(p => `${p.name}: ${p.technologies}`).join(' | ')}
Education: ${d.education.map(e => `${e.degree} from ${e.institute}`).join(' | ')}
      `.trim();
    }
    return resumeText;
  };

  const extractKeywords = async () => {
    const content = getResumeContent();
    if (!content.trim()) { setError('Please provide your resume first.'); return; }
    setExtracting(true);
    setError('');
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const prompt = `Extract the top 3-5 job search keywords from this resume for job matching. Focus on job titles and key technical skills.

RESUME:
${content}

Return ONLY valid JSON (no markdown):
{
  "primaryKeyword": "<most relevant job title e.g. 'Software Engineer' or 'Cloud Engineer'>",
  "keywords": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "jobTitles": ["<title1>", "<title2>", "<title3>"],
  "location": "<city from resume if found, else empty>"
}`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } }) }
      );
      const raw = await res.json();
      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const result = JSON.parse(text.replace(/```json|```/g, '').trim());
      setKeywords(result.primaryKeyword);
      if (result.location) setLocation(result.location + ', India');
    } catch { setError('Keyword extraction failed.'); }
    finally { setExtracting(false); }
  };

  const searchJobs = async () => {
    if (!keywords.trim()) { setError('Please extract keywords first or enter them manually.'); return; }
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(`/api/jobs/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&page=1`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const jobList: Job[] = (data.results || []);
      setJobs(jobList);

      // Calculate match scores using AI
      if (jobList.length > 0) {
        const content = getResumeContent();
        const scorePrompt = `Rate how well this resume matches each job on a scale of 0-100. Consider skills, experience, and job requirements.

RESUME SUMMARY:
${content.substring(0, 800)}

JOBS:
${jobList.slice(0, 10).map((j, i) => `${i}: ${j.title} at ${j.company} — ${j.description.substring(0, 150)}`).join('\n')}

Return ONLY JSON (no markdown):
{ "scores": [<score0>, <score1>, <score2>, ...] }`;

        try {
          const scoreRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: scorePrompt }] }], generationConfig: { temperature: 0.1 } }) }
          );
          const scoreRaw = await scoreRes.json();
          const scoreText = scoreRaw?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          const scoreResult = JSON.parse(scoreText.replace(/```json|```/g, '').trim());
          const scores: Record<string, number> = {};
          scoreResult.scores?.forEach((score: number, i: number) => {
            if (jobList[i]) scores[jobList[i].id] = score;
          });
          setMatchScores(scores);
        } catch {}
      }
    } catch (err: any) {
      setError(err.message || 'Job search failed. Please try again.');
    } finally { setLoading(false); }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    const fmt = (n: number) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${(n/1000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return null;
  };

  const timeAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days/7)}w ago`;
    return `${Math.floor(days/30)}mo ago`;
  };

  const scoreColor = (s: number) => s >= 75 ? 'text-green-600 bg-green-50 border-green-200' : s >= 55 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-slate-500 bg-slate-50 border-slate-200';

  const hasStoreResume = storeData.personalInfo.fullName || storeData.experience.length > 0 || storeData.skillGroups.length > 0;

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container max-w-5xl py-10 px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Briefcase className="h-4 w-4" /> Live Job Matching
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Find Jobs Matching Your Resume</h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Upload your resume — AI extracts your skills and finds real current job openings that match your profile.
          </p>
        </div>

        {/* Resume Input */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Step 1: Provide Your Resume</h2>

          {/* Use current resume toggle */}
          {hasStoreResume && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-700 dark:text-green-300">Resume found in builder</p>
                <p className="text-xs text-green-600 dark:text-green-400">{storeData.personalInfo.fullName || 'Your resume'} — {storeData.skillGroups.length} skill groups, {storeData.experience.length} experience entries</p>
              </div>
              <button onClick={() => setUseStoreResume(!useStoreResume)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${useStoreResume ? 'bg-green-600 text-white' : 'border border-green-400 text-green-700 hover:bg-green-100'}`}>
                {useStoreResume ? '✓ Using this' : 'Use this'}
              </button>
            </div>
          )}

          {!useStoreResume && (
            <>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-muted/30 transition mb-3">
                <Upload className="h-4 w-4 text-muted-foreground" />
                {fileName
                  ? <span className="flex items-center gap-2 text-primary font-medium text-sm"><CheckCircle2 className="h-4 w-4 text-green-500" />{fileName}
                      <button onClick={e => { e.preventDefault(); setFileName(''); setResumeText(''); }}><X className="h-3.5 w-3.5 text-muted-foreground" /></button></span>
                  : <span className="text-sm text-muted-foreground">Upload PDF, DOCX or TXT</span>}
                <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFile} />
              </label>
              <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                rows={4} placeholder="Or paste your resume text here..." />
            </>
          )}
        </div>

        {/* Keywords + Search */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Search className="h-4 w-4 text-primary" /> Step 2: Extract Keywords & Search</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Job Keywords (auto-extracted or type manually)</label>
              <input value={keywords} onChange={e => setKeywords(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Cloud Engineer, AWS, DevOps..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Pune, India" />
            </div>
          </div>

          {error && <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 px-4 py-2.5 text-sm text-red-600">{error}</div>}

          <div className="flex gap-3 flex-wrap">
            <button onClick={extractKeywords} disabled={extracting || (!resumeText.trim() && !useStoreResume)}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted transition disabled:opacity-40">
              {extracting ? <><Loader2 className="h-4 w-4 animate-spin" /> Extracting...</> : <><Sparkles className="h-4 w-4 text-purple-500" /> Auto-Extract Keywords</>}
            </button>
            <button onClick={searchJobs} disabled={loading || !keywords.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 transition disabled:opacity-40 shadow-sm">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching live jobs...</> : <><Briefcase className="h-4 w-4" /> Find Matching Jobs</>}
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="font-semibold">Searching live job listings...</p>
            <p className="text-sm text-muted-foreground mt-1">Fetching from thousands of job boards in real time</p>
          </div>
        )}

        {!loading && searched && jobs.length === 0 && (
          <div className="text-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-semibold">No jobs found</p>
            <p className="text-sm text-muted-foreground mt-1">Try different keywords or a broader location like "India"</p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-semibold text-lg">{jobs.length} Jobs Found (Last 7 Days)</h2>
              <div className="flex gap-2 flex-wrap">
                {['Adzuna', 'Remotive (Remote)', 'The Muse'].map(src => {
                  const count = jobs.filter(j => j.source === src).length;
                  return count > 0 ? (
                    <span key={src} className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                      {src}: {count}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            <div className="space-y-4">
              {jobs
                .sort((a, b) => (matchScores[b.id] || 0) - (matchScores[a.id] || 0))
                .map(job => {
                  const score = matchScores[job.id];
                  const salary = formatSalary(job.salary_min, job.salary_max);
                  return (
                    <div key={job.id} className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-base">{job.title}</h3>
                            {score !== undefined && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreColor(score)}`}>
                                {score}% match
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.company}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                            {salary && <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{salary}</span>}
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeAgo(job.created)}</span>
                          </div>
                        </div>
                        <a href={job.redirect_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition shrink-0">
                          Apply <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>

                      {/* Category tag */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {job.category && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{job.category}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          job.source === 'Adzuna' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          job.source?.includes('Remotive') ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        }`}>{job.source}</span>
                      </div>

                      {/* Description preview */}
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {job.description.replace(/<[^>]+>/g, '').substring(0, 200)}...
                      </p>
                    </div>
                  );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Jobs sourced from Adzuna · Remotive · The Muse — all posted within last 7 days
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
