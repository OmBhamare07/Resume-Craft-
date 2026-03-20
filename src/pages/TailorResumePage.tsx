import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useResumeStore } from '@/store/resumeStore';
import { Loader2, Sparkles, FileText, Briefcase, ChevronRight, CheckCircle2, Upload, X } from 'lucide-react';

export default function TailorResumePage() {
  const navigate = useNavigate();
  const store = useResumeStore();

  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [fileName, setFileName] = useState('');

  const loadingMessages = [
    '🔍 Reading your resume...',
    '📋 Analyzing job description...',
    '🎯 Matching your skills to job requirements...',
    '✍️ Rewriting summary to match the role...',
    '🔑 Adding ATS keywords from job description...',
    '📊 Optimizing section order for this job...',
    '✅ Finalizing your tailored resume...',
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    try {
      if (file.type === 'text/plain') {
        const text = await file.text();
        setResumeText(text);

      } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Extract text from DOCX using mammoth
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeText(result.value);

      } else if (file.type === 'application/pdf') {
        // Extract text from PDF using pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setResumeText(text);

      } else {
        setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
        setFileName('');
      }
    } catch (err) {
      setError('Could not read file. Please paste your resume text manually.');
      setFileName('');
    }
  };

  const handleGenerate = async () => {
    if (!resumeText.trim()) { setError('Please paste your resume text or upload a file.'); return; }
    if (!jdText.trim()) { setError('Please paste the job description.'); return; }
    setError('');
    setLoading(true);

    // Cycle through loading messages
    let msgIndex = 0;
    setLoadingMsg(loadingMessages[0]);
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIndex]);
    }, 2000);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const prompt = `You are an expert ATS resume optimizer. A user wants to tailor their resume to a specific job description to maximize their ATS score (target: 80+).

USER'S CURRENT RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}

Your task:
1. Extract all real information from the user's resume (don't invent anything)
2. Rewrite/optimize content to match the JD keywords
3. Reorder skills to put most relevant ones first
4. Rewrite the objective/summary to match this specific role
5. Use exact keywords from the JD wherever possible (this is critical for ATS)
6. Keep all real experience, education, projects — just optimize the wording

Return ONLY valid JSON (no markdown, no backticks):
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedinUrl": ""
  },
  "objective": "<rewritten summary specifically targeting this job role using JD keywords>",
  "skillGroups": [
    { "id": "1", "category": "<most relevant category first>", "skills": "<comma separated, most JD-relevant first>" }
  ],
  "experience": [
    { "id": "1", "type": "<job type>", "company": "<company name>", "responsibilities": "<rewritten to emphasize JD-relevant achievements and keywords>", "timePeriod": "<period>" }
  ],
  "projects": [
    { "id": "1", "name": "<project name>", "description": "<rewritten to highlight JD-relevant tech and impact>", "technologies": "<tech stack>" }
  ],
  "education": [
    { "id": "1", "degree": "<degree>", "institute": "<institute>", "period": "<period>", "marks": "<marks/gpa>" }
  ],
  "suggestedTemplate": "<one of: modern, professional, minimal, corporate, simple, executive, tech, creative, compact, elegant — pick best for this job type>",
  "jobTitle": "<the specific job title from the JD>",
  "atsKeywordsAdded": ["<list of 5-8 key ATS keywords you added from the JD>"]
}

Rules:
- NEVER invent experience or skills the user doesn't have
- DO rewrite existing content to use JD's exact terminology
- DO add relevant keywords from JD into responsibilities and summary
- Pick suggestedTemplate based on job type (tech jobs → tech template, executive roles → executive template, etc.)`;

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
      const result = JSON.parse(clean);

      // Load tailored data into store
      store.setResumeData({
        personalInfo: result.personalInfo,
        objective: result.objective,
        skillGroups: result.skillGroups,
        experience: result.experience,
        projects: result.projects,
        education: result.education,
      });

      clearInterval(msgInterval);
      setLoading(false);

      // Navigate to builder with suggested template
      const templateId = result.suggestedTemplate || 'modern';
      navigate(`/builder/${templateId}`, {
        state: {
          tailored: true,
          jobTitle: result.jobTitle,
          atsKeywordsAdded: result.atsKeywordsAdded,
        }
      });

    } catch (err) {
      clearInterval(msgInterval);
      setError('Generation failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container max-w-4xl py-10 px-4">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 text-purple-700 dark:text-purple-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="h-4 w-4" /> AI Job Match
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Tailor Resume to Job Description</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Paste your resume and the company's job description. AI will rewrite your resume with exact ATS keywords to maximize your selection chances.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '📄', title: 'Paste Resume', desc: 'Your existing resume text' },
            { icon: '📋', title: 'Paste Job Description', desc: 'The company\'s JD' },
            { icon: '🎯', title: 'Get Tailored Resume', desc: 'ATS-optimized for that job' },
          ].map((item, i) => (
            <div key={i} className="text-center p-4 rounded-xl border border-border bg-card">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resume Input */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <FileText className="h-4 w-4 text-primary" /> Your Resume
            </label>

            {/* File upload */}
            <div className="mb-3">
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-3 cursor-pointer hover:border-primary hover:bg-muted/50 transition text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                {fileName ? (
                  <span className="flex items-center gap-2 text-primary font-medium">
                    {fileName}
                    <button onClick={(e) => { e.preventDefault(); setFileName(''); setResumeText(''); }} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : 'Upload PDF, DOCX or TXT'}
                <input type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="hidden" onChange={handleFileUpload} />
              </label>
              <div className="text-center text-xs text-muted-foreground my-2">— or paste text below —</div>
            </div>

            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              rows={12}
              placeholder={`Paste your entire resume here...\n\nExample:\nJohn Doe\njohn@email.com | +1 555-1234 | New York\n\nSUMMARY\nSoftware engineer with 3 years...\n\nEXPERIENCE\nTechCorp - Software Engineer\nJan 2022 - Present\n- Built React applications...\n\nSKILLS\nJavaScript, React, Node.js...`}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {resumeText.length > 0 ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {resumeText.length} characters</span> : 'Tip: Copy everything from your resume'}
            </div>
          </div>

          {/* JD Input */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Briefcase className="h-4 w-4 text-primary" /> Job Description
            </label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              rows={15}
              placeholder={`Paste the full job description here...\n\nExample:\nSenior Frontend Developer at Google\n\nWe are looking for a Senior Frontend Developer...\n\nRequirements:\n- 3+ years React experience\n- TypeScript proficiency\n- REST API integration\n- CI/CD experience\n...\n\nResponsibilities:\n- Build scalable web applications\n- Collaborate with cross-functional teams\n...`}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {jdText.length > 0 ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {jdText.length} characters</span> : 'Tip: Copy the full JD including requirements'}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleGenerate}
            disabled={loading || !resumeText.trim() || !jdText.trim()}
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-4 text-base font-bold text-white hover:opacity-90 transition disabled:opacity-40 shadow-lg"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {loadingMsg}</>
            ) : (
              <><Sparkles className="h-5 w-5" /> Generate Tailored Resume <ChevronRight className="h-5 w-5" /></>
            )}
          </button>
          {!loading && (
            <p className="text-xs text-muted-foreground mt-3">
              Takes ~15 seconds · Resume opens in builder ready to edit & download
            </p>
          )}
        </div>

        {/* What AI does */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" /> What the AI does to your resume
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '🎯', text: 'Rewrites summary using exact keywords from the JD' },
              { icon: '🔑', text: 'Adds ATS keywords from JD into your experience' },
              { icon: '📊', text: 'Reorders skills to put most relevant ones first' },
              { icon: '✍️', text: 'Rewrites responsibilities to match job requirements' },
              { icon: '🏆', text: 'Selects the best template for the job type' },
              { icon: '🚫', text: 'Never invents skills or experience you don\'t have' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-lg">{item.icon}</span>
                <span className="text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
