import { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, AlertCircle, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { ResumeData } from '@/store/resumeStore';

interface AISuggestionsProps {
  data: ResumeData;
}

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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('suggestions');

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

    const prompt = `You are an expert resume coach. Analyze this resume and provide specific, actionable improvement suggestions.

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
      "reason": "<1 sentence why this resume fits this role>"
    }
  ]
}

Rules:
- Give 6-8 specific suggestions referencing actual content (company names, skills mentioned, etc)
- Suggest 5 job titles based on their actual skills and experience
- Be direct and specific, not generic
- "improvement" = something missing or weak, "warning" = potential ATS issue, "tip" = quick win`;

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
      const clean = text.replace(/```json|```/g, '').trim();
      setResult(JSON.parse(clean));
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
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
      {/* Slide-in panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-card border-l border-border shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">AI Resume Coach</p>
                <p className="text-xs text-white/70">Personalized suggestions + job matches</p>
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
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                  Our AI coach will analyze your resume and give specific, personalized suggestions to improve it — plus tell you which job titles you're best suited for.
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
                {/* Overall feedback */}
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

                {/* Suggestions */}
                <Accordion
                  id="suggestions"
                  title={`Improvement Suggestions (${result.suggestions?.length || 0})`}
                  expanded={expandedSection}
                  onToggle={setExpandedSection}
                >
                  <div className="space-y-2">
                    {result.suggestions?.map((s, i) => (
                      <div key={i} className={`flex gap-2 rounded-lg border p-2.5 text-xs ${typeColor(s.type)}`}>
                        {typeIcon(s.type)}
                        <div>
                          <span className="font-semibold">{s.section}: </span>
                          {s.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </Accordion>

                {/* Job titles */}
                <Accordion
                  id="jobs"
                  title={`Best Job Titles For You (${result.jobTitles?.length || 0})`}
                  expanded={expandedSection}
                  onToggle={setExpandedSection}
                >
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

                <button onClick={() => { setResult(null); setError(''); }}
                  className="w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition">
                  Re-analyze Resume
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40" onClick={() => setIsOpen(false)} />}

      {/* Trigger button */}
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
