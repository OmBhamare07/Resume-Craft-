import { useState } from 'react';
import {
  ShieldCheck, X, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle2, Info, Zap, TrendingUp, Briefcase,
  FileText, Loader2, BookOpen, Cpu, AlignLeft, Plus, Wand2, BarChart3
} from 'lucide-react';
import { ResumeData, useResumeStore } from '@/store/resumeStore';

interface ATSCheckerProps { data: ResumeData; resumeId?: string | null; token?: string | null; onScore?: (score: number, jobRole: string) => void; }

interface ATSResult {
  overallScore: number;
  grade: string;
  summary: string;
  sections: {
    contactInfo:      { score: number; max: number; feedback: string; issues: string[] };
    summary:          { score: number; max: number; feedback: string; issues: string[] };
    workExperience:   { score: number; max: number; feedback: string; issues: string[] };
    skills:           { score: number; max: number; feedback: string; issues: string[] };
    education:        { score: number; max: number; feedback: string; issues: string[] };
    projects:         { score: number; max: number; feedback: string; issues: string[] };
    atsFormatting:    { score: number; max: number; feedback: string; issues: string[] };
    keywordMatch:     { score: number; max: number; feedback: string; issues: string[] };
  };
  spellErrors: string[];
  synonymSuggestions: { original: string; better: string[] }[];
  missingKeywords: string[];
  foundKeywords: string[];
  actionVerbSuggestions: string[];
  jobDescriptionMatch: number;
  formattingIssues: string[];
  topRecommendations: string[];
}

const JOB_ROLES: Record<string, { title: string; category: string }> = {
  'frontend-developer':        { title: 'Frontend Developer',           category: 'Software Engineering' },
  'backend-developer':         { title: 'Backend Developer',            category: 'Software Engineering' },
  'fullstack-developer':       { title: 'Full Stack Developer',         category: 'Software Engineering' },
  'mobile-developer':          { title: 'Mobile Developer',             category: 'Software Engineering' },
  'software-engineer':         { title: 'Software Engineer',            category: 'Software Engineering' },
  'data-scientist':            { title: 'Data Scientist',               category: 'Data & AI' },
  'data-engineer':             { title: 'Data Engineer',                category: 'Data & AI' },
  'data-analyst':              { title: 'Data Analyst',                 category: 'Data & AI' },
  'ml-engineer':               { title: 'ML Engineer',                  category: 'Data & AI' },
  'ai-engineer':               { title: 'AI Engineer',                  category: 'Data & AI' },
  'devops-engineer':           { title: 'DevOps Engineer',              category: 'Cloud & DevOps' },
  'cloud-engineer':            { title: 'Cloud Engineer',               category: 'Cloud & DevOps' },
  'sre':                       { title: 'Site Reliability Engineer',    category: 'Cloud & DevOps' },
  'cybersecurity-engineer':    { title: 'Cybersecurity Engineer',       category: 'Security' },
  'security-analyst':          { title: 'Security Analyst',             category: 'Security' },
  'product-manager':           { title: 'Product Manager',              category: 'Product & Design' },
  'ui-ux-designer':            { title: 'UI/UX Designer',               category: 'Product & Design' },
  'qa-engineer':               { title: 'QA Engineer',                  category: 'QA & Testing' },
  'database-administrator':    { title: 'Database Administrator',       category: 'Database' },
  'network-engineer':          { title: 'Network Engineer',             category: 'Networking' },
  'blockchain-developer':      { title: 'Blockchain Developer',         category: 'Blockchain' },
  'embedded-systems-engineer': { title: 'Embedded Systems Engineer',    category: 'Embedded' },
  'it-support':                { title: 'IT Support Engineer',          category: 'IT Support' },
  'salesforce-developer':      { title: 'Salesforce Developer',         category: 'CRM' },
};

const JOB_CATEGORIES = [...new Set(Object.values(JOB_ROLES).map(j => j.category))];

export const ATSChecker = ({ data, resumeId, token, onScore }: ATSCheckerProps) => {
  const store = useResumeStore();

  const applyKeyword = (keyword: string) => {
    // Add keyword to skills if not already there
    const skillGroups = [...data.skillGroups];
    if (skillGroups.length === 0) {
      store.addSkillGroup();
      setTimeout(() => {
        const updated = useResumeStore.getState().resumeData.skillGroups;
        if (updated.length > 0) {
          store.updateSkillGroup(updated[0].id, { category: 'Additional Skills', skills: keyword });
        }
      }, 50);
    } else {
      const last = skillGroups[skillGroups.length - 1];
      const existing = last.skills ? last.skills + ', ' + keyword : keyword;
      store.updateSkillGroup(last.id, { skills: existing });
    }
  };

  const applyRecommendation = (rec: string) => {
    // Add recommendation as a note to the objective/summary
    const current = data.objective || '';
    if (!current.includes(rec.substring(0, 20))) {
      store.setObjective(current ? current + ' ' + rec : rec);
    }
  };
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [step, setStep] = useState<'setup' | 'result'>('setup');
  const [scoreSaved, setScoreSaved] = useState(false);

  const buildResumeText = () => {
    const d = data;
    return `
NAME: ${d.personalInfo.fullName}
EMAIL: ${d.personalInfo.email}
PHONE: ${d.personalInfo.phone}
LOCATION: ${d.personalInfo.location}
LINKEDIN: ${d.personalInfo.linkedinUrl}

SUMMARY/OBJECTIVE:
${d.objective}

WORK EXPERIENCE:
${d.experience.map(e => `- ${e.type} at ${e.company} (${e.timePeriod})\n  ${e.responsibilities}`).join('\n')}

SKILLS:
${d.skillGroups.map(g => `${g.category}: ${g.skills}`).join('\n')}

PROJECTS:
${d.projects.map(p => `- ${p.name}: ${p.description} [Tech: ${p.technologies}]`).join('\n')}

EDUCATION:
${d.education.map(e => `- ${e.degree} from ${e.institute} (${e.period}) | ${e.marks}`).join('\n')}
    `.trim();
  };

  const analyze = async () => {
    if (!selectedJob) return;
    setLoading(true);
    setError('');
    setScoreSaved(false);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const jobTitle = JOB_ROLES[selectedJob]?.title || selectedJob;
    const resumeText = buildResumeText();

    const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer with deep NLP capabilities, trained on millions of real job postings. Analyze this resume for the role of "${jobTitle}".

RESUME:
${resumeText}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}` : ''}

Perform a comprehensive analysis including:
1. NLP understanding — understand the MEANING of words, not just exact matches. Detect synonyms (e.g. "led" and "managed" mean the same, "built" and "developed" are synonyms).
2. Keyword matching — check both exact and semantic matches against typical ${jobTitle} job requirements
3. Spell check — identify misspelled words
4. Formatting analysis — detect ATS-unfriendly patterns (special chars, missing sections, poor structure)
5. Action verb quality — rate the strength and variety of action verbs used
6. Quantification — check if achievements are backed by numbers/metrics
7. Job description match — if JD provided, calculate how well resume aligns

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "overallScore": <0-100 integer>,
  "grade": <"Excellent"|"Good"|"Average"|"Below Average"|"Poor">,
  "summary": "<2-3 sentence overall assessment mentioning specific strengths and weaknesses>",
  "sections": {
    "contactInfo":    { "score": <0-10>, "max": 10, "feedback": "<specific feedback>", "issues": ["<issue1>","<issue2>"] },
    "summary":        { "score": <0-15>, "max": 15, "feedback": "<specific feedback>", "issues": [] },
    "workExperience": { "score": <0-25>, "max": 25, "feedback": "<specific feedback>", "issues": [] },
    "skills":         { "score": <0-20>, "max": 20, "feedback": "<specific feedback>", "issues": [] },
    "education":      { "score": <0-10>, "max": 10, "feedback": "<specific feedback>", "issues": [] },
    "projects":       { "score": <0-10>, "max": 10, "feedback": "<specific feedback>", "issues": [] },
    "atsFormatting":  { "score": <0-5>,  "max": 5,  "feedback": "<specific feedback>", "issues": [] },
    "keywordMatch":   { "score": <0-15>, "max": 15, "feedback": "<specific feedback, mention synonyms found>", "issues": [] }
  },
  "spellErrors": ["<misspelled word: suggested correction>"],
  "synonymSuggestions": [
    { "original": "<weak word used>", "better": ["<stronger synonym1>", "<stronger synonym2>"] }
  ],
  "missingKeywords": ["<keyword1>","<keyword2>","<keyword3>","<keyword4>","<keyword5>","<keyword6>"],
  "foundKeywords": ["<keyword1>","<keyword2>","<keyword3>","<keyword4>","<keyword5>","<keyword6>","<keyword7>","<keyword8>"],
  "actionVerbSuggestions": ["<verb1>","<verb2>","<verb3>","<verb4>","<verb5>"],
  "jobDescriptionMatch": <0-100 integer, 50 if no JD provided>,
  "formattingIssues": ["<issue1>","<issue2>"],
  "topRecommendations": ["<recommendation1>","<recommendation2>","<recommendation3>","<recommendation4>","<recommendation5>"]
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 },
          }),
        }
      );

      const raw = await response.json();
      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: ATSResult = JSON.parse(clean);
      setResult(parsed);

      // Notify parent to save score (parent has resumeId and handles retry)
      if (onScore) {
        onScore(parsed.overallScore, selectedJob || 'General');
        setScoreSaved(true);
      }
      setStep('result');
      // Auto-expand lowest scoring section
      const sectionEntries = Object.entries(parsed.sections);
      const worst = sectionEntries.sort(([,a],[,b]) => (a.score/a.max) - (b.score/b.max))[0][0];
      setExpanded(worst);
    } catch (err) {
      setError('Analysis failed. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setResult(null); setStep('setup'); setExpanded(null); setError(''); };

  const scoreColor = (s: number) => s >= 75 ? '#16a34a' : s >= 55 ? '#ca8a04' : '#dc2626';
  const sectionPct = (score: number, max: number) => Math.round((score / max) * 100);
  const sectionBg = (score: number, max: number) => {
    const p = sectionPct(score, max);
    if (p >= 75) return 'border-green-200 bg-green-50';
    if (p >= 50) return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  const SECTION_LABELS: Record<string, string> = {
    contactInfo: 'Contact Information',
    summary: 'Professional Summary',
    workExperience: 'Work Experience',
    skills: 'Skills & Keywords',
    education: 'Education',
    projects: 'Projects',
    atsFormatting: 'ATS Formatting',
    keywordMatch: 'NLP Keyword Match',
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-20 z-50 flex w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" style={{ maxHeight: '610px' }}>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">AI-Powered ATS Checker</p>
                <p className="text-xs text-white/70">NLP · Synonyms · Spell Check · Formatting</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Setup step */}
            {step === 'setup' && (
              <div className="space-y-4">
                {/* Feature badges */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { icon: <Cpu className="h-3 w-3" />, label: 'NLP Analysis' },
                    { icon: <BookOpen className="h-3 w-3" />, label: 'Synonym Detection' },
                    { icon: <AlignLeft className="h-3 w-3" />, label: 'Spell Check' },
                    { icon: <ShieldCheck className="h-3 w-3" />, label: 'ATS Formatting' },
                    { icon: <TrendingUp className="h-3 w-3" />, label: 'Job Match Score' },
                    { icon: <FileText className="h-3 w-3" />, label: 'JD Matching' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                      {f.icon}{f.label}
                    </div>
                  ))}
                </div>

                {/* Job role selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Target Job Role *
                  </label>
                  <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                    <option value="">-- Select a job role --</option>
                    {JOB_CATEGORIES.map(cat => (
                      <optgroup key={cat} label={cat}>
                        {Object.entries(JOB_ROLES)
                          .filter(([,v]) => v.category === cat)
                          .map(([k,v]) => <option key={k} value={k}>{v.title}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Job description */}
                <div>
                  <button onClick={() => setShowJD(p => !p)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition">
                    <FileText className="h-3.5 w-3.5" />
                    Paste Job Description (optional — for better accuracy)
                    {showJD ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {showJD && (
                    <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                      rows={5} placeholder="Paste the full job description here for precise JD matching..." />
                  )}
                  {jobDescription && <p className="text-xs text-emerald-600 mt-1">✓ Job description added</p>}
                </div>

                {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</div>}

                <button onClick={analyze} disabled={!selectedJob || loading}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2">
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing with AI...</>
                    : <><Zap className="h-4 w-4" /> Analyze with AI</>}
                </button>
                <p className="text-center text-xs text-muted-foreground">Powered by Gemini AI · Takes ~10 seconds</p>
              </div>
            )}

            {/* Result step */}
            {step === 'result' && result && (
              <div className="space-y-3">
                {/* Score ring + section bars */}
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 shrink-0">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                        <circle cx="50" cy="50" r="42" fill="none"
                          stroke={scoreColor(result.overallScore)} strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.overallScore / 100)}`}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold" style={{ color: scoreColor(result.overallScore) }}>{result.overallScore}</span>
                        <span className="text-[10px] text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold mb-0.5" style={{ color: scoreColor(result.overallScore) }}>{result.grade}</div>
                      {scoreSaved && resumeId && (
                        <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 mt-1">
                          <BarChart3 className="h-3 w-3" /> Score saved to tracker
                        </div>
                      )}
                      {!resumeId && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                          Save resume to track scores
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mb-2">{JOB_ROLES[selectedJob]?.title} ATS Score</div>
                      {Object.entries(result.sections).map(([key, sec]) => (
                        <div key={key} className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] text-muted-foreground w-16 truncate">{SECTION_LABELS[key]?.split(' ')[0]}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${sectionPct(sec.score, sec.max)}%`, background: scoreColor(sectionPct(sec.score, sec.max)) }} />
                          </div>
                          <span className="text-[9px] font-medium w-7 text-right">{sec.score}/{sec.max}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed border-t border-border pt-3">{result.summary}</p>
                </div>

                {/* JD match */}
                {jobDescription && (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-teal-700">Job Description Match</span>
                      <span className="text-sm font-bold text-teal-700">{result.jobDescriptionMatch}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-teal-100 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${result.jobDescriptionMatch}%` }} />
                    </div>
                  </div>
                )}

                {/* Section accordions */}
                {Object.entries(result.sections).map(([key, sec]) => (
                  <div key={key} className={`rounded-xl border overflow-hidden ${sectionBg(sec.score, sec.max)}`}>
                    <button onClick={() => setExpanded(expanded === key ? null : key)}
                      className="flex w-full items-center justify-between px-3 py-2.5 hover:opacity-80 transition">
                      <div className="flex items-center gap-2">
                        {sectionPct(sec.score, sec.max) >= 75
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                        <span className="text-xs font-semibold">{SECTION_LABELS[key]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{sec.score}/{sec.max}</span>
                        {expanded === key ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </div>
                    </button>
                    {expanded === key && (
                      <div className="border-t border-current/10 px-3 py-2.5 bg-white/50 space-y-2">
                        <p className="text-xs text-slate-600">{sec.feedback}</p>
                        {sec.issues.length > 0 && (
                          <ul className="space-y-1">
                            {sec.issues.map((issue, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                                <span className="text-red-600">{issue}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Top recommendations */}
                {result.topRecommendations?.length > 0 && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                    <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" /> Top Recommendations
                    </p>
                    <ul className="space-y-1.5">
                      {result.topRecommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-indigo-700">
                          <span className="font-bold shrink-0">{i + 1}.</span>
                          <span className="flex-1">{r}</span>
                          <button onClick={() => applyRecommendation(r)}
                            className="shrink-0 flex items-center gap-1 text-[10px] bg-indigo-600 text-white rounded-full px-2 py-0.5 hover:bg-indigo-700 transition font-semibold whitespace-nowrap">
                            <Wand2 className="h-2.5 w-2.5" /> Apply
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Spell errors */}
                {result.spellErrors?.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> Spelling Errors Found
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.spellErrors.map((e, i) => (
                        <span key={i} className="rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-xs text-red-700">{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synonym suggestions */}
                {result.synonymSuggestions?.length > 0 && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                    <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Stronger Word Alternatives (NLP)
                    </p>
                    <div className="space-y-1.5">
                      {result.synonymSuggestions.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-orange-600 font-medium line-through">{s.original}</span>
                          <span className="text-orange-400">→</span>
                          <div className="flex gap-1">
                            {s.better.map((b, j) => (
                              <span key={j} className="rounded-full bg-orange-100 border border-orange-300 px-2 py-0.5 text-orange-700 font-medium">{b}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formatting issues */}
                {result.formattingIssues?.length > 0 && (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                    <p className="text-xs font-semibold text-yellow-700 mb-2 flex items-center gap-1.5">
                      <AlignLeft className="h-3.5 w-3.5" /> ATS Formatting Issues
                    </p>
                    <ul className="space-y-1">
                      {result.formattingIssues.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-yellow-700">
                          <span className="shrink-0">⚠</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Found keywords */}
                {result.foundKeywords?.length > 0 && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                    <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Keywords Found ({result.foundKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.foundKeywords.map((k, i) => (
                        <span key={i} className="rounded-full bg-green-100 border border-green-300 px-2 py-0.5 text-xs font-medium text-green-700">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing keywords */}
                {result.missingKeywords?.length > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" /> Missing Keywords — Add These
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.missingKeywords.map((k, i) => (
                        <span key={i} className="rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-xs font-medium text-blue-700">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action verb suggestions */}
                {result.actionVerbSuggestions?.length > 0 && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
                    <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> Suggested Action Verbs
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.actionVerbSuggestions.map((v, i) => (
                        <span key={i} className="rounded-full bg-purple-100 border border-purple-300 px-2 py-0.5 text-xs font-medium text-purple-700">{v}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handleReset} className="w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition">
                  ← Change Job Role / Re-analyze
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(p => !p)}
        className="fixed bottom-4 right-20 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg transition-transform hover:scale-105 active:scale-95"
        title="AI ATS Checker">
        {isOpen ? <X className="h-6 w-6 text-white" /> : <ShieldCheck className="h-6 w-6 text-white" />}
      </button>
    </>
  );
};
