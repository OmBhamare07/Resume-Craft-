import { useState } from 'react';
import { ShieldCheck, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info, Zap } from 'lucide-react';
import { ResumeData } from '@/store/resumeStore';

interface ATSCheckerProps {
  data: ResumeData;
}

interface CheckResult {
  score: number;
  grade: string;
  strengths: string[];
  improvements: string[];
  keywords: string[];
  tips: string[];
}

const ACTION_VERBS = ['led','built','developed','designed','implemented','managed','created','improved','increased','reduced','delivered','launched','optimized','automated','collaborated','architected','deployed','maintained','analyzed','established','mentored','spearheaded','streamlined','achieved','coordinated'];

const TECH_KEYWORDS = ['javascript','typescript','python','react','node','sql','aws','docker','git','api','css','html','java','cloud','agile','scrum','ci/cd','linux','rest','graphql','kubernetes','machine learning','data','testing','devops'];

function runATSCheck(data: ResumeData): CheckResult {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const tips: string[] = [];
  let score = 0;

  // 1. Contact info (20 pts)
  const { fullName, email, phone, location, linkedinUrl } = data.personalInfo;
  if (fullName) score += 4;
  if (email) score += 4;
  if (phone) score += 4;
  if (location) score += 4;
  if (linkedinUrl) { score += 4; strengths.push('LinkedIn URL included — great for recruiter verification'); }
  if (!email || !phone) improvements.push('Missing contact info: email and phone are required by ATS');
  if (!linkedinUrl) tips.push('Add your LinkedIn URL — many ATS systems rank profiles with LinkedIn higher');

  // 2. Objective / Summary (10 pts)
  if (data.objective) {
    score += 5;
    if (data.objective.length > 80) { score += 5; strengths.push('Career summary is detailed and descriptive'); }
    else tips.push('Expand your career summary to 2–3 sentences for better ATS scoring');
  } else {
    improvements.push('No career objective/summary — this is the first thing ATS and recruiters read');
  }

  // 3. Work Experience (20 pts)
  if (data.experience.length === 0) {
    improvements.push('No work experience added — this heavily impacts ATS ranking');
  } else {
    score += 8;
    if (data.experience.length >= 2) { score += 4; strengths.push(`${data.experience.length} experience entries show a solid career history`); }
    const allResp = data.experience.map(e => e.responsibilities.toLowerCase()).join(' ');
    const foundVerbs = ACTION_VERBS.filter(v => allResp.includes(v));
    if (foundVerbs.length >= 3) { score += 8; strengths.push(`Strong action verbs used: ${foundVerbs.slice(0,4).join(', ')}`); }
    else { improvements.push('Use more action verbs (led, built, improved, delivered) in experience descriptions'); }
  }

  // 4. Skills (20 pts)
  if (data.skillGroups.length === 0) {
    improvements.push('No skills section — ATS systems heavily scan for skill keywords');
  } else {
    score += 8;
    const allSkills = data.skillGroups.map(g => g.skills.toLowerCase()).join(' ');
    const foundTech = TECH_KEYWORDS.filter(k => allSkills.includes(k));
    if (foundTech.length >= 3) { score += 8; strengths.push(`${foundTech.length} technical keywords detected by ATS scanner`); }
    else { score += 4; tips.push('Add more specific technical skills — ATS matches job descriptions against your skill keywords'); }
    if (data.skillGroups.length >= 2) { score += 4; strengths.push('Skills organized in categories — ideal for ATS parsing'); }
  }

  // 5. Education (15 pts)
  if (data.education.length === 0) {
    improvements.push('No education section — required by most ATS systems');
  } else {
    score += 8;
    const hasGPA = data.education.some(e => e.marks);
    if (hasGPA) { score += 4; strengths.push('GPA/marks included — adds credibility for early-career roles'); }
    if (data.education[0]?.degree) score += 3;
  }

  // 6. Projects (10 pts)
  if (data.projects.length === 0) {
    tips.push('Add projects to demonstrate hands-on experience — especially important for developers');
  } else {
    score += 5;
    const hasTech = data.projects.some(p => p.technologies);
    if (hasTech) { score += 5; strengths.push('Projects include technologies — ATS picks up these as additional skill keywords'); }
    else tips.push('Add technologies used in each project — they count as additional keyword matches');
  }

  // 7. Content length check (5 pts)
  const totalContent = [data.objective, ...data.experience.map(e=>e.responsibilities), ...data.projects.map(p=>p.description)].join(' ');
  if (totalContent.length > 400) score += 5;
  else tips.push('Add more detail to experience and project descriptions for better ATS keyword coverage');

  // Missing keywords suggestion
  const allText = JSON.stringify(data).toLowerCase();
  const missing = TECH_KEYWORDS.filter(k => !allText.includes(k)).slice(0, 6);
  const keywords = missing.length > 0 ? missing : ['quantified results', 'team size', 'budget managed', 'tools used', 'certifications', 'industry terms'];

  // Grade
  const clampedScore = Math.min(score, 100);
  let grade = 'Poor';
  if (clampedScore >= 85) grade = 'Excellent';
  else if (clampedScore >= 70) grade = 'Good';
  else if (clampedScore >= 50) grade = 'Fair';

  if (improvements.length === 0) strengths.push('All major ATS sections are complete');

  return { score: clampedScore, grade, strengths, improvements, keywords, tips };
}

export const ATSChecker = ({ data }: ATSCheckerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [expanded, setExpanded] = useState<string | null>('improvements');

  const handleCheck = () => {
    const res = runATSCheck(data);
    setResult(res);
    setExpanded(res.improvements.length > 0 ? 'improvements' : 'strengths');
  };

  const scoreColor = (s: number) => s >= 80 ? '#16a34a' : s >= 55 ? '#ca8a04' : '#dc2626';
  const gradeBg = (s: number) => s >= 80 ? 'bg-green-100 text-green-700' : s >= 55 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-20 z-50 flex w-[370px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" style={{ maxHeight: '560px' }}>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">ATS Resume Checker</p>
                <p className="text-xs text-white/70">Instant · No API needed</p>
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
                <p className="text-sm font-semibold mb-1">Check your ATS compatibility</p>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                  Analyzes contact info, keywords, action verbs, section completeness and more — instantly, no API needed.
                </p>
                <button onClick={handleCheck} className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" /> Analyze Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Score ring */}
                <div className="rounded-xl border border-border p-4 text-center">
                  <div className="relative mx-auto mb-2 h-24 w-24">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                      <circle cx="50" cy="50" r="42" fill="none"
                        stroke={scoreColor(result.score)}
                        strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.score / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold" style={{ color: scoreColor(result.score) }}>{result.score}</span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${gradeBg(result.score)}`}>{result.grade} ATS Match</span>
                </div>

                {result.improvements.length > 0 && (
                  <Accordion id="improvements" title={`Issues (${result.improvements.length})`} icon={<AlertCircle className="h-4 w-4 text-red-500" />} expanded={expanded} onToggle={setExpanded}>
                    <ul className="space-y-2">
                      {result.improvements.map((s, i) => (
                        <li key={i} className="flex gap-2 text-xs"><span className="text-red-500 mt-0.5 shrink-0">✕</span>{s}</li>
                      ))}
                    </ul>
                  </Accordion>
                )}

                {result.strengths.length > 0 && (
                  <Accordion id="strengths" title={`Strengths (${result.strengths.length})`} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} expanded={expanded} onToggle={setExpanded}>
                    <ul className="space-y-2">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-xs"><span className="text-green-500 mt-0.5 shrink-0">✓</span>{s}</li>
                      ))}
                    </ul>
                  </Accordion>
                )}

                {result.tips.length > 0 && (
                  <Accordion id="tips" title={`Tips (${result.tips.length})`} icon={<Info className="h-4 w-4 text-blue-500" />} expanded={expanded} onToggle={setExpanded}>
                    <ul className="space-y-2">
                      {result.tips.map((t, i) => (
                        <li key={i} className="flex gap-2 text-xs"><span className="text-blue-500 mt-0.5 shrink-0">{i + 1}.</span>{t}</li>
                      ))}
                    </ul>
                  </Accordion>
                )}

                <Accordion id="keywords" title="Suggested Keywords" icon={<Info className="h-4 w-4 text-purple-500" />} expanded={expanded} onToggle={setExpanded}>
                  <p className="text-xs text-muted-foreground mb-2">Consider adding these to your skills or experience:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.map((k, i) => (
                      <span key={i} className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">{k}</span>
                    ))}
                  </div>
                </Accordion>

                <button onClick={handleCheck} className="w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition">
                  Re-check Resume
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(p => !p)}
        className="fixed bottom-4 right-20 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg transition-transform hover:scale-105 active:scale-95"
        title="ATS Checker"
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <ShieldCheck className="h-6 w-6 text-white" />}
      </button>
    </>
  );
};

const Accordion = ({ id, title, icon, expanded, onToggle, children }: {
  id: string; title: string; icon: React.ReactNode;
  expanded: string | null; onToggle: (id: string | null) => void; children: React.ReactNode;
}) => {
  const isOpen = expanded === id;
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button onClick={() => onToggle(isOpen ? null : id)} className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-muted transition">
        <div className="flex items-center gap-2">{icon}<span className="text-xs font-semibold">{title}</span></div>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {isOpen && <div className="border-t border-border px-3 py-2.5 bg-muted/30">{children}</div>}
    </div>
  );
};
