import { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, AlertCircle, Briefcase, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import { ResumeData, useResumeStore } from '@/store/resumeStore';

interface AISuggestionsProps { data: ResumeData; }

interface Suggestion {
  section: string;
  type: 'improvement' | 'warning' | 'tip';
  text: string;
}

interface AIResult {
  overallFeedback: string;
  suggestions: Suggestion[];
  jobTitles: { title: string; match: string; reason: string }[];
  strengthSummary: string;
}

export const AISuggestions = ({ data }: AISuggestionsProps) => {
  const store = useResumeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('suggestions');
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null);
  const [appliedIdxs, setAppliedIdxs] = useState<Set<number>>(new Set());

  const analyze = async () => {
    setLoading(true);
    setError('');
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const resumeText = `
Name: ${data.personalInfo.fullName}
Email: ${data.personalInfo.email}
Location: ${data.personalInfo.location}
LinkedIn: ${data.personalInfo.linkedinUrl}
Summary: ${data.objective}
Experience: ${data.experience.map(e => `${e.type} at ${e.company} (${e.timePeriod}): ${e.responsibilities}`).join(' | ')}
Skills: ${data.skillGroups.map(g => `${g.category}: ${g.skills}`).join(', ')}
Projects: ${data.projects.map(p => `${p.name}: ${p.description} [${p.technologies}]`).join(' | ')}
Education: ${data.education.map(e => `${e.degree} from ${e.institute} (${e.period}) ${e.marks}`).join(' | ')}
    `.trim();

    const prompt = `You are an expert resume coach. Analyze this resume and provide specific, actionable suggestions.

RESUME:
${resumeText}

Return ONLY valid JSON (no markdown):
{
  "overallFeedback": "<2-3 sentence honest overall assessment>",
  "strengthSummary": "<1-2 sentences about what's strong>",
  "suggestions": [
    {
      "section": "<Contact Info|Summary|Experience|Skills|Projects|Education>",
      "type": "<improvement|warning|tip>",
      "text": "<very specific actionable suggestion mentioning exact details from their resume>"
    }
  ],
  "jobTitles": [
    {
      "title": "<job title>",
      "match": "<Strong|Good|Fair>",
      "reason": "<1 sentence why>"
    }
  ]
}

Rules:
- Give 6-8 specific suggestions referencing actual content
- Suggest 5 job titles based on actual skills and experience
- Be direct and specific, not generic`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 },
          }),
        }
      );
      const raw = await response.json();
      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      setResult(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply a suggestion — AI rewrites the specific section properly replacing old content
  const applySuggestion = async (suggestion: Suggestion, idx: number) => {
    setApplyingIdx(idx);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const section = suggestion.section.toLowerCase();

    try {
      // Contact info — mark applied, no AI needed
      if (section.includes('contact')) {
        setAppliedIdxs(prev => new Set(prev).add(idx));
        setApplyingIdx(null);
        return;
      }

      // Build a targeted prompt per section type
      let prompt = '';

      if (section.includes('summary') || section.includes('objective')) {
        prompt = `You are an expert resume writer. Rewrite this professional summary to implement the suggestion below.

SUGGESTION TO IMPLEMENT: ${suggestion.text}

CURRENT SUMMARY:
${data.objective || '(empty)'}

PERSON'S BACKGROUND:
- Name: ${data.personalInfo.fullName}
- Experience: ${data.experience.map(e => `${e.type} at ${e.company} (${e.timePeriod})`).join(', ')}
- Skills: ${data.skillGroups.map(g => g.skills).join(', ')}

Return ONLY this JSON (no markdown, no explanation):
{ "objective": "<completely rewritten summary that implements the suggestion, 2-3 sentences, ATS-optimized, professional>" }

Rules:
- REPLACE the old summary entirely with an improved version
- Implement the suggestion directly into the new text
- Use strong action verbs and quantifiable achievements
- Keep it 2-3 sentences maximum`;

      } else if (section.includes('experience')) {
        // Find most relevant experience entry
        const expContext = data.experience.map(e => `ID: ${e.id} | Company: ${e.company} (${e.timePeriod}) | Type: ${e.type} | Responsibilities: ${e.responsibilities}`).join(' /// ');

        prompt = `You are an expert resume writer. Rewrite the responsibilities in the experience section to implement the suggestion below.

SUGGESTION TO IMPLEMENT: ${suggestion.text}

CURRENT EXPERIENCE ENTRIES:
${expContext}

Return ONLY this JSON (no markdown, no explanation):
{
  "experience": [
    ${data.experience.map(e => `{ "id": "${e.id}", "responsibilities": "<rewritten responsibilities for ${e.company} that implements the suggestion — use strong action verbs, add metrics where possible, keep it factual>" }`).join(',\n    ')}
  ]
}

Rules:
- Rewrite responsibilities for each entry to implement the suggestion
- Use strong action verbs: Led, Built, Developed, Increased, Reduced, Managed
- Add metrics where you reasonably can based on existing content
- Do NOT change company names, IDs, or time periods
- Keep each entry 1-3 sentences`;

      } else if (section.includes('skill')) {
        prompt = `You are an expert resume writer. Improve the skills section to implement this suggestion.

SUGGESTION TO IMPLEMENT: ${suggestion.text}

CURRENT SKILLS:
${data.skillGroups.map(g => `ID: ${g.id} | Category: ${g.category} | Skills: ${g.skills}`).join(' | ')}

Return ONLY this JSON (no markdown, no explanation):
{
  "skillGroups": [
    ${data.skillGroups.map(g => `{ "id": "${g.id}", "category": "${g.category}", "skills": "<improved, reordered, or expanded skills list for this category>" }`).join(',\n    ')}
  ]
}

Rules:
- Keep the same IDs and categories
- Reorder skills to put most ATS-relevant ones first
- Add missing relevant skills if the suggestion mentions them
- Keep skills comma-separated`;

      } else if (section.includes('project')) {
        const projContext = data.projects.map(p => `ID: ${p.id} | Name: ${p.name} | Description: ${p.description} | Tech: ${p.technologies}`).join(' /// ');

        prompt = `You are an expert resume writer. Rewrite project descriptions to implement the suggestion.

SUGGESTION TO IMPLEMENT: ${suggestion.text}

CURRENT PROJECTS:
${projContext}

Return ONLY this JSON (no markdown, no explanation):
{
  "projects": [
    ${data.projects.map(p => `{ "id": "${p.id}", "description": "<rewritten description for ${p.name} that implements the suggestion — highlight impact, metrics, and ATS keywords>" }`).join(',\n    ')}
  ]
}

Rules:
- Rewrite descriptions to be more impactful
- Highlight technical achievements and real-world impact
- Keep descriptions concise (1-2 sentences)
- Do NOT change project names, IDs, or technologies`;

      } else if (section.includes('education')) {
        prompt = `You are an expert resume writer. The suggestion is about the education section.

SUGGESTION TO IMPLEMENT: ${suggestion.text}

CURRENT EDUCATION:
${data.education.map(e => `ID: ${e.id} | Degree: ${e.degree} | Institute: ${e.institute} | Period: ${e.period} | Marks: ${e.marks}`).join(' | ')}

Return ONLY this JSON (no markdown, no explanation):
{
  "education": [
    ${data.education.map(e => `{ "id": "${e.id}", "degree": "${e.degree}", "institute": "${e.institute}", "period": "${e.period}", "marks": "<improved marks/gpa display if needed, or keep same: ${e.marks}>" }`).join(',\n    ')}
  ]
}

Rules:
- Only modify what the suggestion actually asks to improve
- Keep all IDs, degree names, and institutes exactly the same`;

      } else {
        // Fallback: apply to summary
        prompt = `Rewrite this resume summary to implement this suggestion: ${suggestion.text}
Current: ${data.objective}
Return ONLY JSON: { "objective": "<improved summary>" }`;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
          }),
        }
      );
      const raw = await response.json();
      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const improved = JSON.parse(text.replace(/```json|```/g, '').trim());

      // Apply changes — REPLACE existing content, never append
      if (improved.objective !== undefined) {
        store.setObjective(improved.objective);
      }

      if (improved.experience?.length) {
        improved.experience.forEach((e: any) => {
          const match = data.experience.find(x => x.id === e.id);
          if (match && e.responsibilities) {
            store.updateExperience(match.id, { responsibilities: e.responsibilities });
          }
        });
      }

      if (improved.skillGroups?.length) {
        improved.skillGroups.forEach((g: any) => {
          const match = data.skillGroups.find(x => x.id === g.id);
          if (match) {
            store.updateSkillGroup(match.id, {
              ...(g.skills ? { skills: g.skills } : {}),
              ...(g.category ? { category: g.category } : {}),
            });
          }
        });
      }

      if (improved.projects?.length) {
        improved.projects.forEach((p: any) => {
          const match = data.projects.find(x => x.id === p.id);
          if (match && p.description) {
            store.updateProject(match.id, { description: p.description });
          }
        });
      }

      if (improved.education?.length) {
        improved.education.forEach((e: any) => {
          const match = data.education.find(x => x.id === e.id);
          if (match) {
            store.updateEducation(match.id, {
              ...(e.marks ? { marks: e.marks } : {}),
              ...(e.degree ? { degree: e.degree } : {}),
            });
          }
        });
      }

      setAppliedIdxs(prev => new Set(prev).add(idx));
    } catch {
      // Failed silently — user can retry
    } finally {
      setApplyingIdx(null);
    }
  };

  const typeIcon = (type: string) => {
    if (type === 'warning') return <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />;
    if (type === 'tip') return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />;
    return <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />;
  };

  const typeColor = (type: string) => {
    if (type === 'warning') return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:text-amber-300';
    if (type === 'tip') return 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
    return 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950 dark:text-purple-300';
  };

  const matchColor = (match: string) => {
    if (match === 'Strong') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    if (match === 'Good') return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-card border-l border-border shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">AI Resume Coach</p>
                <p className="text-xs text-white/70">Click Apply on each suggestion to improve that section</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!result && !loading && (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                <p className="text-sm font-semibold mb-1">Get AI-Powered Feedback</p>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Get specific suggestions for each section. Click the Apply button next to any suggestion to automatically improve that section using AI.
                </p>
                {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                <button onClick={analyze}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" /> Analyze My Resume
                </button>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Analyzing your resume...</p>
                <p className="text-xs text-muted-foreground mt-1">This takes about 10 seconds</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Overall */}
                <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800 p-3">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Overall Assessment</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 leading-relaxed">{result.overallFeedback}</p>
                </div>

                {/* Strengths */}
                <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-3">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Your Strengths
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 leading-relaxed">{result.strengthSummary}</p>
                </div>

                {/* Suggestions with Apply buttons */}
                <Accordion id="suggestions" title={`Improvement Suggestions (${result.suggestions?.length || 0})`} expanded={expandedSection} onToggle={setExpandedSection}>
                  <div className="space-y-2">
                    {result.suggestions?.map((s, i) => (
                      <div key={i} className={`rounded-lg border p-2.5 ${typeColor(s.type)}`}>
                        <div className="flex gap-2 items-start">
                          {typeIcon(s.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">{s.section}</div>
                            <p className="text-xs leading-relaxed">{s.text}</p>
                          </div>
                        </div>
                        {/* Apply button */}
                        <div className="mt-2 flex justify-end">
                          {appliedIdxs.has(i) ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-100 dark:bg-green-900 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="h-3 w-3" /> Applied!
                            </span>
                          ) : (
                            <button
                              onClick={() => applySuggestion(s, i)}
                              disabled={applyingIdx === i}
                              className="flex items-center gap-1.5 text-[10px] font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                              {applyingIdx === i ? <><Loader2 className="h-3 w-3 animate-spin" /> Applying...</> : <><Wand2 className="h-3 w-3" /> Apply to {s.section}</>}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Accordion>

                {/* Job titles */}
                <Accordion id="jobs" title={`Best Job Titles For You (${result.jobTitles?.length || 0})`} expanded={expandedSection} onToggle={setExpandedSection}>
                  <div className="space-y-2">
                    {result.jobTitles?.map((j, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-background p-2.5">
                        <Briefcase className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold">{j.title}</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${matchColor(j.match)}`}>{j.match}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{j.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Accordion>

                <button onClick={() => { setResult(null); setError(''); setAppliedIdxs(new Set()); }}
                  className="w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition">
                  Re-analyze Resume
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40" onClick={() => setIsOpen(false)} />}

      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition shadow-sm"
      >
        <Sparkles className="h-4 w-4" /> AI Suggestions
      </button>
    </>
  );
};

const Accordion = ({ id, title, expanded, onToggle, children }: {
  id: string; title: string; expanded: string | null;
  onToggle: (id: string | null) => void; children: React.ReactNode;
}) => {
  const isOpen = expanded === id;
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button onClick={() => onToggle(isOpen ? null : id)}
        className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-muted transition text-left">
        <span className="text-xs font-semibold">{title}</span>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {isOpen && <div className="border-t border-border p-3 bg-muted/30">{children}</div>}
    </div>
  );
};
