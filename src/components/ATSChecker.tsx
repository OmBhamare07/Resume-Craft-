import { useState } from 'react';
import { ShieldCheck, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info, Zap, TrendingUp } from 'lucide-react';
import { ResumeData } from '@/store/resumeStore';

interface ATSCheckerProps { data: ResumeData; }

interface Section { score: number; max: number; label: string; items: { pass: boolean; text: string }[]; }
interface CheckResult {
  totalScore: number;
  grade: string;
  gradeColor: string;
  sections: Record<string, Section>;
  missingKeywords: string[];
  foundKeywords: string[];
  actionVerbs: string[];
  missingVerbs: string[];
}

// ── Industry keyword banks ──────────────────────────────────────────
const ACTION_VERBS = [
  'achieved','analyzed','built','collaborated','coordinated','created','delivered',
  'designed','developed','drove','enhanced','established','executed','generated',
  'identified','implemented','improved','increased','launched','led','managed',
  'optimized','oversaw','performed','planned','produced','reduced','resolved',
  'spearheaded','streamlined','supervised','transformed','utilized','architected',
  'automated','deployed','maintained','mentored','negotiated','presented','trained'
];

const TECH_KEYWORDS = [
  'javascript','typescript','python','java','react','angular','vue','node','express',
  'sql','mysql','postgresql','mongodb','aws','azure','gcp','docker','kubernetes',
  'git','github','ci/cd','rest','api','graphql','html','css','linux','agile','scrum',
  'machine learning','data analysis','cloud','microservices','devops','testing',
  'figma','tableau','excel','powerpoint','salesforce','jira','confluence'
];

const SOFT_KEYWORDS = [
  'leadership','communication','teamwork','problem solving','analytical','detail-oriented',
  'time management','adaptable','creative','strategic','collaborative','innovative'
];

const MEASURE_PATTERNS = [/\d+%/,/\$[\d,]+/,/\d+x/,/\d+ (users|clients|teams|members|projects|systems|applications)/i,/increased by \d+/i,/reduced by \d+/i,/saved \$\d+/i,/\d+ (years|months)/i];

function runATSCheck(data: ResumeData): CheckResult {
  const allText = JSON.stringify(data).toLowerCase();
  const allTextRaw = JSON.stringify(data);

  // ── 1. Contact Info (15 pts) ─────────────────────────────────────
  const contactItems = [
    { pass: !!data.personalInfo.fullName?.trim(), text: 'Full name present' },
    { pass: !!data.personalInfo.email?.trim(), text: 'Email address present' },
    { pass: !!data.personalInfo.phone?.trim(), text: 'Phone number present' },
    { pass: !!data.personalInfo.location?.trim(), text: 'Location/city present' },
    { pass: !!data.personalInfo.linkedinUrl?.trim(), text: 'LinkedIn URL present' },
  ];
  const contactScore = contactItems.filter(i => i.pass).length * 3;

  // ── 2. Professional Summary (10 pts) ────────────────────────────
  const summaryLen = data.objective?.trim().length || 0;
  const summaryItems = [
    { pass: summaryLen > 0, text: 'Professional summary exists' },
    { pass: summaryLen >= 100, text: 'Summary is at least 100 characters' },
    { pass: summaryLen >= 200, text: 'Summary is detailed (200+ characters)' },
    { pass: summaryLen <= 600, text: 'Summary is concise (under 600 characters)' },
    { pass: /years? of experience|results-driven|proven|passionate|dedicated|experienced/i.test(data.objective || ''), text: 'Summary includes professional tone keywords' },
  ];
  const summaryScore = summaryItems.filter(i => i.pass).length * 2;

  // ── 3. Work Experience (25 pts) ──────────────────────────────────
  const allResp = data.experience.map(e => e.responsibilities).join(' ');
  const foundVerbs = ACTION_VERBS.filter(v => allResp.toLowerCase().includes(v));
  const hasMeasurements = MEASURE_PATTERNS.some(p => p.test(allResp));
  const expItems = [
    { pass: data.experience.length > 0, text: 'At least 1 work experience entry' },
    { pass: data.experience.length >= 2, text: '2 or more experience entries' },
    { pass: data.experience.every(e => !!e.timePeriod?.trim()), text: 'All experiences have time periods' },
    { pass: data.experience.every(e => !!e.company?.trim()), text: 'All experiences have company names' },
    { pass: data.experience.every(e => e.responsibilities?.length > 50), text: 'Detailed responsibilities (50+ chars each)' },
    { pass: foundVerbs.length >= 3, text: `Strong action verbs used (${foundVerbs.length} found)` },
    { pass: foundVerbs.length >= 6, text: 'Excellent variety of action verbs (6+)' },
    { pass: hasMeasurements, text: 'Quantified achievements with numbers/metrics' },
    { pass: data.experience.some(e => e.type?.trim()), text: 'Job titles/types specified' },
  ];
  const expScore = Math.min(expItems.filter(i => i.pass).length * 3, 25);

  // ── 4. Skills (20 pts) ───────────────────────────────────────────
  const allSkills = data.skillGroups.map(g => g.skills).join(' ').toLowerCase();
  const foundTech = TECH_KEYWORDS.filter(k => allSkills.includes(k));
  const foundSoft = SOFT_KEYWORDS.filter(k => allSkills.includes(k));
  const skillItems = [
    { pass: data.skillGroups.length > 0, text: 'Skills section exists' },
    { pass: data.skillGroups.length >= 2, text: 'Multiple skill categories' },
    { pass: data.skillGroups.length >= 3, text: '3+ skill categories (ideal for ATS)' },
    { pass: foundTech.length >= 3, text: `Technical skills present (${foundTech.length} found)` },
    { pass: foundTech.length >= 6, text: 'Strong technical keyword coverage (6+)' },
    { pass: foundSoft.length >= 1, text: 'Soft skills mentioned' },
    { pass: data.skillGroups.every(g => g.skills.split(',').length >= 3), text: 'Each category has 3+ skills' },
  ];
  const skillScore = Math.min(skillItems.filter(i => i.pass).length * 3, 20);

  // ── 5. Education (15 pts) ────────────────────────────────────────
  const eduItems = [
    { pass: data.education.length > 0, text: 'Education section exists' },
    { pass: data.education.every(e => !!e.degree?.trim()), text: 'Degree/qualification specified' },
    { pass: data.education.every(e => !!e.institute?.trim()), text: 'Institution name present' },
    { pass: data.education.every(e => !!e.period?.trim()), text: 'Education dates present' },
    { pass: data.education.some(e => !!e.marks?.trim()), text: 'GPA/marks/grades included' },
  ];
  const eduScore = eduItems.filter(i => i.pass).length * 3;

  // ── 6. Projects (10 pts) ─────────────────────────────────────────
  const projItems = [
    { pass: data.projects.length > 0, text: 'Projects section exists' },
    { pass: data.projects.length >= 2, text: '2 or more projects listed' },
    { pass: data.projects.every(p => !!p.technologies?.trim()), text: 'Technologies listed for each project' },
    { pass: data.projects.every(p => p.description?.length > 50), text: 'Detailed project descriptions' },
  ];
  const projScore = projItems.filter(i => i.pass).length * 2 + (data.projects.length > 0 ? 2 : 0);

  // ── 7. ATS Formatting (5 pts) ────────────────────────────────────
  const formatItems = [
    { pass: !/<[^>]+>/.test(allTextRaw), text: 'No HTML/special characters in content' },
    { pass: data.personalInfo.email?.includes('@') || false, text: 'Valid email format' },
    { pass: (data.personalInfo.phone?.replace(/\D/g, '').length || 0) >= 10, text: 'Valid phone number format' },
    { pass: allText.length > 500, text: 'Sufficient content length for ATS parsing' },
    { pass: allText.length < 10000, text: 'Content not excessively long' },
  ];
  const formatScore = formatItems.filter(i => i.pass).length;

  // ── Total ─────────────────────────────────────────────────────────
  const totalScore = Math.min(
    contactScore + summaryScore + expScore + skillScore + eduScore + projScore + formatScore,
    100
  );

  // ── Grade ─────────────────────────────────────────────────────────
  let grade = 'Poor';
  let gradeColor = '#dc2626';
  if (totalScore >= 90) { grade = 'Excellent'; gradeColor = '#16a34a'; }
  else if (totalScore >= 75) { grade = 'Good'; gradeColor = '#16a34a'; }
  else if (totalScore >= 60) { grade = 'Average'; gradeColor = '#ca8a04'; }
  else if (totalScore >= 40) { grade = 'Below Average'; gradeColor = '#ea580c'; }

  // ── Keywords ──────────────────────────────────────────────────────
  const foundKeywords = [...foundTech, ...foundSoft].slice(0, 8);
  const missingKeywords = TECH_KEYWORDS.filter(k => !allText.includes(k)).slice(0, 8);
  const missingVerbs = ACTION_VERBS.filter(v => !allResp.toLowerCase().includes(v)).slice(0, 6);

  return {
    totalScore,
    grade,
    gradeColor,
    sections: {
      contact:    { score: contactScore,  max: 15, label: 'Contact Information', items: contactItems },
      summary:    { score: summaryScore,  max: 10, label: 'Professional Summary', items: summaryItems },
      experience: { score: expScore,      max: 25, label: 'Work Experience',      items: expItems },
      skills:     { score: skillScore,    max: 20, label: 'Skills & Keywords',    items: skillItems },
      education:  { score: eduScore,      max: 15, label: 'Education',            items: eduItems },
      projects:   { score: projScore,     max: 10, label: 'Projects',             items: projItems },
      format:     { score: formatScore,   max: 5,  label: 'ATS Formatting',       items: formatItems },
    },
    missingKeywords,
    foundKeywords,
    actionVerbs: foundVerbs.slice(0, 8),
    missingVerbs,
  };
}

export const ATSChecker = ({ data }: ATSCheckerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleCheck = () => {
    const res = runATSCheck(data);
    setResult(res);
    // Auto-expand worst section
    if (res.sections) {
      const worst = Object.entries(res.sections)
        .sort(([,a],[,b]) => (a.score/a.max) - (b.score/b.max))[0][0];
      setExpanded(worst);
    }
  };

  const scoreColor = (s: number) => s >= 75 ? '#16a34a' : s >= 55 ? '#ca8a04' : '#dc2626';
  const sectionBg = (score: number, max: number) => {
    const pct = score / max;
    if (pct >= 0.75) return 'bg-green-50 border-green-200';
    if (pct >= 0.5) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };
  const sectionIcon = (score: number, max: number) => {
    const pct = score / max;
    if (pct >= 0.75) return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    if (pct >= 0.5) return <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />;
    return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />;
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-20 z-50 flex w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" style={{ maxHeight: '580px' }}>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">ATS Resume Checker</p>
                <p className="text-xs text-white/70">Industry-grade analysis · 7 categories</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!result ? (
              <div className="text-center py-6">
                <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-semibold mb-1">Industry-Grade ATS Analysis</p>
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">Checks 30+ criteria across 7 categories — same standards used by Jobscan, Resume Worded & TopResume.</p>
                <div className="grid grid-cols-2 gap-1.5 mb-5 text-left">
                  {['Contact Info','Summary Quality','Work Experience','Skills & Keywords','Education','Projects','ATS Formatting'].map(c => (
                    <div key={c} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />{c}
                    </div>
                  ))}
                </div>
                <button onClick={handleCheck} className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" /> Analyze Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Score ring */}
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                        <circle cx="50" cy="50" r="42" fill="none"
                          stroke={scoreColor(result.totalScore)}
                          strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.totalScore / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold" style={{ color: scoreColor(result.totalScore) }}>{result.totalScore}</span>
                        <span className="text-[10px] text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold" style={{ color: result.gradeColor }}>{result.grade}</div>
                      <div className="text-xs text-muted-foreground mt-1 mb-2">ATS Compatibility Score</div>
                      {/* Section bars */}
                      {Object.entries(result.sections).map(([key, sec]) => (
                        <div key={key} className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] text-muted-foreground w-16 truncate">{sec.label.split(' ')[0]}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${(sec.score / sec.max) * 100}%`, background: scoreColor((sec.score / sec.max) * 100) }} />
                          </div>
                          <span className="text-[10px] font-medium w-8 text-right">{sec.score}/{sec.max}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section accordions */}
                {Object.entries(result.sections).map(([key, sec]) => (
                  <div key={key} className={`rounded-xl border overflow-hidden ${sectionBg(sec.score, sec.max)}`}>
                    <button onClick={() => setExpanded(expanded === key ? null : key)}
                      className="flex w-full items-center justify-between px-3 py-2.5 hover:opacity-80 transition">
                      <div className="flex items-center gap-2">
                        {sectionIcon(sec.score, sec.max)}
                        <span className="text-xs font-semibold">{sec.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{sec.score}/{sec.max}</span>
                        {expanded === key ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </button>
                    {expanded === key && (
                      <div className="border-t border-current/10 px-3 py-2.5 bg-white/50 space-y-1.5">
                        {sec.items.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            {item.pass
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                              : <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />}
                            <span className={item.pass ? 'text-slate-600' : 'text-red-600 font-medium'}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Found keywords */}
                {result.foundKeywords.length > 0 && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-semibold text-green-700">Keywords Found ({result.foundKeywords.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.foundKeywords.map((k, i) => (
                        <span key={i} className="rounded-full bg-green-100 border border-green-300 px-2 py-0.5 text-xs font-medium text-green-700">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing keywords */}
                {result.missingKeywords.length > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Info className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">Suggested Keywords to Add</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.missingKeywords.map((k, i) => (
                        <span key={i} className="rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-xs font-medium text-blue-700">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing action verbs */}
                {result.missingVerbs.length > 0 && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700">Action Verbs to Use</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.missingVerbs.map((v, i) => (
                        <span key={i} className="rounded-full bg-purple-100 border border-purple-300 px-2 py-0.5 text-xs font-medium text-purple-700">{v}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handleCheck} className="w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition">
                  Re-analyze Resume
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(p => !p)}
        className="fixed bottom-4 right-20 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg transition-transform hover:scale-105 active:scale-95"
        title="ATS Checker">
        {isOpen ? <X className="h-6 w-6 text-white" /> : <ShieldCheck className="h-6 w-6 text-white" />}
      </button>
    </>
  );
};
