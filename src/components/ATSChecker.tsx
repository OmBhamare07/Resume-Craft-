import { useState } from 'react';
import { ShieldCheck, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info, Zap, TrendingUp, Briefcase, FileText } from 'lucide-react';
import { ResumeData } from '@/store/resumeStore';

interface ATSCheckerProps { data: ResumeData; }
interface CheckResult {
  totalScore: number;
  grade: string;
  gradeColor: string;
  sections: Record<string, { score: number; max: number; label: string; items: { pass: boolean; text: string }[] }>;
  missingKeywords: string[];
  foundKeywords: string[];
  jobMatchScore: number;
  jobMatchKeywords: string[];
  missingJobKeywords: string[];
  actionVerbs: string[];
  missingVerbs: string[];
  jobDescriptionMatches: string[];
}

// ── Action verbs ──────────────────────────────────────────────────────
const ACTION_VERBS = [
  'achieved','analyzed','built','collaborated','coordinated','created','delivered',
  'designed','developed','drove','enhanced','established','executed','generated',
  'identified','implemented','improved','increased','launched','led','managed',
  'optimized','oversaw','performed','planned','produced','reduced','resolved',
  'spearheaded','streamlined','supervised','transformed','utilized','architected',
  'automated','deployed','maintained','mentored','negotiated','presented','trained',
  'migrated','integrated','debugged','tested','reviewed','documented','configured'
];

// ── Job-specific keyword banks ────────────────────────────────────────
const JOB_KEYWORDS: Record<string, { title: string; category: string; keywords: string[]; tools: string[] }> = {
  // Software Engineering
  'frontend-developer': {
    title: 'Frontend Developer', category: 'Software Engineering',
    keywords: ['html','css','javascript','typescript','react','vue','angular','responsive design','ui/ux','web performance','accessibility','cross-browser','rest api','git','npm'],
    tools: ['webpack','vite','tailwind','sass','figma','jest','storybook','redux','next.js','graphql']
  },
  'backend-developer': {
    title: 'Backend Developer', category: 'Software Engineering',
    keywords: ['node.js','python','java','rest api','microservices','sql','postgresql','mongodb','redis','authentication','authorization','docker','ci/cd','git','server'],
    tools: ['express','fastapi','spring boot','django','flask','kafka','rabbitmq','nginx','kubernetes','aws','terraform']
  },
  'fullstack-developer': {
    title: 'Full Stack Developer', category: 'Software Engineering',
    keywords: ['javascript','typescript','react','node.js','rest api','sql','mongodb','docker','git','html','css','authentication','microservices','cloud','agile'],
    tools: ['next.js','express','postgresql','redis','aws','kubernetes','jest','webpack','graphql','ci/cd']
  },
  'mobile-developer': {
    title: 'Mobile Developer', category: 'Software Engineering',
    keywords: ['react native','flutter','ios','android','swift','kotlin','mobile ui','push notifications','app store','play store','api integration','offline storage','performance','testing'],
    tools: ['xcode','android studio','firebase','redux','expo','fastlane','jest','figma','restful api','git']
  },
  'software-engineer': {
    title: 'Software Engineer', category: 'Software Engineering',
    keywords: ['data structures','algorithms','object oriented','design patterns','rest api','sql','git','agile','code review','testing','debugging','documentation','scalability','performance'],
    tools: ['docker','kubernetes','aws','jenkins','jira','github','postman','linux','python','java']
  },
  // Data & AI
  'data-scientist': {
    title: 'Data Scientist', category: 'Data & AI',
    keywords: ['machine learning','python','statistics','data analysis','predictive modeling','feature engineering','deep learning','nlp','data visualization','sql','big data','hypothesis testing','regression','classification'],
    tools: ['tensorflow','pytorch','scikit-learn','pandas','numpy','jupyter','matplotlib','spark','hadoop','tableau']
  },
  'data-engineer': {
    title: 'Data Engineer', category: 'Data & AI',
    keywords: ['etl','data pipeline','sql','python','data warehouse','spark','hadoop','kafka','airflow','data modeling','database optimization','cloud','big data','schema design'],
    tools: ['apache spark','kafka','airflow','dbt','snowflake','redshift','bigquery','aws','azure','databricks']
  },
  'data-analyst': {
    title: 'Data Analyst', category: 'Data & AI',
    keywords: ['sql','data analysis','excel','visualization','reporting','statistics','kpi','dashboard','business intelligence','python','data cleaning','pivot tables','trend analysis','forecasting'],
    tools: ['tableau','power bi','looker','excel','python','r','google analytics','sql server','mysql','postgresql']
  },
  'ml-engineer': {
    title: 'Machine Learning Engineer', category: 'Data & AI',
    keywords: ['machine learning','deep learning','python','model deployment','mlops','feature engineering','neural networks','data preprocessing','model optimization','api','docker','cloud','tensorflow','pytorch'],
    tools: ['mlflow','kubeflow','sagemaker','vertex ai','docker','kubernetes','fastapi','spark','airflow','dvc']
  },
  'ai-engineer': {
    title: 'AI Engineer', category: 'Data & AI',
    keywords: ['artificial intelligence','llm','prompt engineering','langchain','rag','generative ai','fine-tuning','embeddings','vector database','nlp','computer vision','python','api','model deployment'],
    tools: ['openai','langchain','hugging face','pinecone','chroma','fastapi','docker','kubernetes','aws','azure openai']
  },
  // Cloud & DevOps
  'devops-engineer': {
    title: 'DevOps Engineer', category: 'Cloud & DevOps',
    keywords: ['ci/cd','docker','kubernetes','automation','infrastructure as code','monitoring','linux','scripting','cloud','git','deployment','configuration management','security','networking'],
    tools: ['jenkins','github actions','terraform','ansible','prometheus','grafana','aws','azure','gcp','helm']
  },
  'cloud-engineer': {
    title: 'Cloud Engineer', category: 'Cloud & DevOps',
    keywords: ['aws','azure','gcp','cloud architecture','terraform','kubernetes','docker','networking','security','iam','cost optimization','migration','serverless','monitoring','infrastructure'],
    tools: ['cloudformation','terraform','ansible','kubernetes','docker','lambda','ec2','s3','rds','vpc']
  },
  'site-reliability-engineer': {
    title: 'Site Reliability Engineer (SRE)', category: 'Cloud & DevOps',
    keywords: ['reliability','sla','slo','incident management','monitoring','automation','kubernetes','docker','python','linux','capacity planning','performance','on-call','observability'],
    tools: ['prometheus','grafana','pagerduty','kubernetes','terraform','ansible','datadog','splunk','elk stack','aws']
  },
  // Security
  'cybersecurity-engineer': {
    title: 'Cybersecurity Engineer', category: 'Security',
    keywords: ['penetration testing','vulnerability assessment','siem','incident response','network security','firewall','encryption','iam','compliance','threat analysis','risk management','linux','python','security auditing'],
    tools: ['splunk','crowdstrike','nessus','burp suite','metasploit','wireshark','aws security','azure sentinel','qualys','nmap']
  },
  'security-analyst': {
    title: 'Security Analyst', category: 'Security',
    keywords: ['soc','threat detection','incident response','siem','log analysis','vulnerability management','compliance','network monitoring','malware analysis','risk assessment','phishing','endpoint security'],
    tools: ['splunk','ibm qradar','crowdstrike','microsoft defender','wireshark','nessus','servicenow','jira','mitre att&ck','nmap']
  },
  // Product & Design
  'product-manager': {
    title: 'Product Manager', category: 'Product & Design',
    keywords: ['product roadmap','agile','scrum','user stories','stakeholder management','kpi','a/b testing','user research','go-to-market','prioritization','metrics','product strategy','cross-functional','backlog'],
    tools: ['jira','confluence','figma','mixpanel','amplitude','google analytics','miro','productboard','notion','slack']
  },
  'ui-ux-designer': {
    title: 'UI/UX Designer', category: 'Product & Design',
    keywords: ['user research','wireframing','prototyping','usability testing','design systems','interaction design','information architecture','accessibility','responsive design','design thinking','visual design','user flows'],
    tools: ['figma','sketch','adobe xd','invision','miro','zeplin','principle','framer','maze','hotjar']
  },
  // QA & Testing
  'qa-engineer': {
    title: 'QA Engineer', category: 'QA & Testing',
    keywords: ['test automation','manual testing','regression testing','api testing','performance testing','test cases','bug tracking','agile','selenium','test planning','quality assurance','ci/cd','load testing'],
    tools: ['selenium','cypress','jest','postman','jmeter','appium','jira','testng','junit','katalon']
  },
  // Database
  'database-administrator': {
    title: 'Database Administrator', category: 'Database',
    keywords: ['sql','database optimization','backup recovery','performance tuning','replication','schema design','stored procedures','indexing','database security','postgresql','mysql','oracle','monitoring','migration'],
    tools: ['postgresql','mysql','oracle','sql server','mongodb','redis','elasticsearch','aws rds','azure sql','pgadmin']
  },
  // Networking
  'network-engineer': {
    title: 'Network Engineer', category: 'Networking',
    keywords: ['tcp/ip','routing','switching','firewall','vpn','network security','lan/wan','bgp','ospf','network monitoring','troubleshooting','cisco','load balancing','dns','dhcp'],
    tools: ['cisco','juniper','palo alto','wireshark','nagios','solarwinds','aws vpc','azure networking','fortinet','checkpoint']
  },
  // Blockchain
  'blockchain-developer': {
    title: 'Blockchain Developer', category: 'Blockchain',
    keywords: ['solidity','smart contracts','ethereum','web3','defi','nft','blockchain architecture','cryptography','consensus mechanisms','truffle','hardhat','ipfs','tokenomics','dao'],
    tools: ['ethereum','solidity','web3.js','ethers.js','hardhat','truffle','metamask','ipfs','chainlink','polygon']
  },
  // Embedded & Hardware
  'embedded-systems-engineer': {
    title: 'Embedded Systems Engineer', category: 'Embedded & Hardware',
    keywords: ['c','c++','rtos','microcontrollers','firmware','hardware interfaces','uart','spi','i2c','embedded linux','iot','pcb design','debugging','low-level programming','arm'],
    tools: ['arduino','raspberry pi','stm32','keil','iar','jtag','oscilloscope','linux kernel','freertos','yocto']
  },
  // IT Support
  'it-support': {
    title: 'IT Support Engineer', category: 'IT Support',
    keywords: ['troubleshooting','hardware support','software installation','active directory','windows','linux','networking','ticketing system','end user support','remote desktop','vpn','documentation','customer service'],
    tools: ['servicenow','jira','active directory','microsoft 365','azure ad','windows server','vmware','cisco','zoom','slack']
  },
  // Salesforce
  'salesforce-developer': {
    title: 'Salesforce Developer', category: 'CRM',
    keywords: ['salesforce','apex','visualforce','lightning','soql','crm','integration','rest api','triggers','workflows','reports','dashboards','deployment','testing'],
    tools: ['salesforce','apex','lwc','salesforce dx','workbench','copado','jira','postman','git','vs code']
  },
};

const JOB_CATEGORIES = [...new Set(Object.values(JOB_KEYWORDS).map(j => j.category))];

const MEASURE_PATTERNS = [/\d+%/,/\$[\d,]+/,/\d+x/,/\d+ (users|clients|teams|members|projects|systems)/i,/increased by \d+/i,/reduced by \d+/i,/\d+ (years|months)/i];

function extractWords(text: string): string[] {
  return text.toLowerCase().split(/[\s,.\-\/|]+/).filter(w => w.length > 2);
}

function runATSCheck(data: ResumeData, jobKey: string, jobDescription: string): CheckResult {
  const allText = JSON.stringify(data).toLowerCase();
  const job = JOB_KEYWORDS[jobKey];
  const allResp = data.experience.map(e => e.responsibilities).join(' ');
  const allSkills = data.skillGroups.map(g => g.skills).join(' ').toLowerCase();
  const allContent = (allText + ' ' + allResp + ' ' + allSkills).toLowerCase();

  // ── 1. Contact (15pts) ────────────────────────────────────────────
  const contactItems = [
    { pass: !!data.personalInfo.fullName?.trim(), text: 'Full name present' },
    { pass: !!data.personalInfo.email?.trim(), text: 'Email address present' },
    { pass: !!data.personalInfo.phone?.trim(), text: 'Phone number present' },
    { pass: !!data.personalInfo.location?.trim(), text: 'Location/city present' },
    { pass: !!data.personalInfo.linkedinUrl?.trim(), text: 'LinkedIn URL present' },
  ];
  const contactScore = contactItems.filter(i => i.pass).length * 3;

  // ── 2. Summary (10pts) ────────────────────────────────────────────
  const summaryLen = data.objective?.trim().length || 0;
  const summaryItems = [
    { pass: summaryLen > 0, text: 'Professional summary exists' },
    { pass: summaryLen >= 100, text: 'Summary is at least 100 characters' },
    { pass: summaryLen >= 200, text: 'Summary is detailed (200+ characters)' },
    { pass: summaryLen <= 600, text: 'Summary is concise (under 600 characters)' },
    { pass: job ? job.keywords.some(k => (data.objective||'').toLowerCase().includes(k)) : false, text: `Summary mentions ${job?.title || 'role'}-relevant keywords` },
  ];
  const summaryScore = summaryItems.filter(i => i.pass).length * 2;

  // ── 3. Experience (25pts) ─────────────────────────────────────────
  const foundVerbs = ACTION_VERBS.filter(v => allResp.toLowerCase().includes(v));
  const hasMeasurements = MEASURE_PATTERNS.some(p => p.test(allResp));
  const expItems = [
    { pass: data.experience.length > 0, text: 'At least 1 work experience entry' },
    { pass: data.experience.length >= 2, text: '2 or more experience entries' },
    { pass: data.experience.every(e => !!e.timePeriod?.trim()), text: 'All experiences have time periods' },
    { pass: data.experience.every(e => !!e.company?.trim()), text: 'All experiences have company names' },
    { pass: data.experience.every(e => (e.responsibilities?.length||0) > 50), text: 'Detailed responsibilities (50+ chars each)' },
    { pass: foundVerbs.length >= 3, text: `Strong action verbs used (${foundVerbs.length} found)` },
    { pass: foundVerbs.length >= 6, text: 'Excellent variety of action verbs (6+)' },
    { pass: hasMeasurements, text: 'Quantified achievements with numbers/metrics' },
    { pass: data.experience.some(e => e.type?.trim()), text: 'Job titles/types specified' },
  ];
  const expScore = Math.min(expItems.filter(i => i.pass).length * 3, 25);

  // ── 4. Skills (15pts base) ────────────────────────────────────────
  const skillItems = [
    { pass: data.skillGroups.length > 0, text: 'Skills section exists' },
    { pass: data.skillGroups.length >= 2, text: 'Multiple skill categories' },
    { pass: data.skillGroups.length >= 3, text: '3+ skill categories (ideal for ATS)' },
    { pass: data.skillGroups.every(g => g.skills.split(',').length >= 3), text: 'Each category has 3+ skills' },
    { pass: allSkills.length > 50, text: 'Sufficient skills listed' },
  ];
  const skillScore = Math.min(skillItems.filter(i => i.pass).length * 3, 15);

  // ── 5. Job Match (20pts) ──────────────────────────────────────────
  let jobMatchScore = 0;
  let jobMatchKeywords: string[] = [];
  let missingJobKeywords: string[] = [];
  if (job) {
    const allJobKw = [...job.keywords, ...job.tools];
    jobMatchKeywords = allJobKw.filter(k => allContent.includes(k.toLowerCase()));
    missingJobKeywords = allJobKw.filter(k => !allContent.includes(k.toLowerCase())).slice(0, 10);
    jobMatchScore = Math.round((jobMatchKeywords.length / allJobKw.length) * 20);
  }

  // ── 6. Education (10pts) ──────────────────────────────────────────
  const eduItems = [
    { pass: data.education.length > 0, text: 'Education section exists' },
    { pass: data.education.every(e => !!e.degree?.trim()), text: 'Degree/qualification specified' },
    { pass: data.education.every(e => !!e.institute?.trim()), text: 'Institution name present' },
    { pass: data.education.every(e => !!e.period?.trim()), text: 'Education dates present' },
    { pass: data.education.some(e => !!e.marks?.trim()), text: 'GPA/marks/grades included' },
  ];
  const eduScore = eduItems.filter(i => i.pass).length * 2;

  // ── 7. Projects (10pts) ───────────────────────────────────────────
  const projItems = [
    { pass: data.projects.length > 0, text: 'Projects section exists' },
    { pass: data.projects.length >= 2, text: '2 or more projects listed' },
    { pass: data.projects.every(p => !!p.technologies?.trim()), text: 'Technologies listed for each project' },
    { pass: data.projects.every(p => (p.description?.length||0) > 50), text: 'Detailed project descriptions' },
    { pass: job ? data.projects.some(p => job.keywords.some(k => (p.technologies||'').toLowerCase().includes(k))) : false, text: `Projects use ${job?.title||'role'}-relevant technologies` },
  ];
  const projScore = Math.min(projItems.filter(i => i.pass).length * 2, 10);

  // ── 8. Job Description Match (bonus) ─────────────────────────────
  let jobDescriptionMatches: string[] = [];
  if (jobDescription.trim()) {
    const jdWords = extractWords(jobDescription);
    const uniqueJDWords = [...new Set(jdWords)].filter(w => w.length > 3);
    jobDescriptionMatches = uniqueJDWords.filter(w => allContent.includes(w));
  }

  // ── Total ─────────────────────────────────────────────────────────
  const baseScore = contactScore + summaryScore + expScore + skillScore + eduScore + projScore;
  const totalScore = Math.min(Math.round(baseScore * 0.8 + jobMatchScore * 1.0), 100);

  let grade = 'Poor'; let gradeColor = '#dc2626';
  if (totalScore >= 85) { grade = 'Excellent'; gradeColor = '#16a34a'; }
  else if (totalScore >= 70) { grade = 'Good'; gradeColor = '#16a34a'; }
  else if (totalScore >= 55) { grade = 'Average'; gradeColor = '#ca8a04'; }
  else if (totalScore >= 40) { grade = 'Below Average'; gradeColor = '#ea580c'; }

  const foundKeywords = job ? jobMatchKeywords.slice(0, 8) : [];
  const missingVerbs = ACTION_VERBS.filter(v => !allResp.toLowerCase().includes(v)).slice(0, 6);

  return {
    totalScore, grade, gradeColor,
    sections: {
      contact:    { score: contactScore,  max: 15, label: 'Contact Information', items: contactItems },
      summary:    { score: summaryScore,  max: 10, label: 'Professional Summary', items: summaryItems },
      experience: { score: expScore,      max: 25, label: 'Work Experience',      items: expItems },
      skills:     { score: skillScore,    max: 15, label: 'Skills Section',        items: skillItems },
      jobMatch:   { score: jobMatchScore, max: 20, label: `${job?.title||'Job'} Keyword Match`, items: [
        { pass: jobMatchScore >= 10, text: `${jobMatchKeywords.length} of ${job ? [...job.keywords,...job.tools].length : 0} role keywords found` },
        { pass: jobMatchScore >= 15, text: 'Strong keyword alignment with job role' },
        { pass: jobMatchKeywords.length >= 5, text: '5+ role-specific keywords present' },
      ]},
      education:  { score: eduScore,      max: 10, label: 'Education',            items: eduItems },
      projects:   { score: projScore,     max: 10, label: 'Projects',             items: projItems },
    },
    missingKeywords: missingJobKeywords,
    foundKeywords,
    jobMatchScore,
    jobMatchKeywords,
    missingJobKeywords,
    actionVerbs: foundVerbs.slice(0, 8),
    missingVerbs,
    jobDescriptionMatches,
  };
}

export const ATSChecker = ({ data }: ATSCheckerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [step, setStep] = useState<'setup' | 'result'>('setup');

  const handleCheck = () => {
    if (!selectedJob) return;
    const res = runATSCheck(data, selectedJob, jobDescription);
    setResult(res);
    setStep('result');
    const worst = Object.entries(res.sections).sort(([,a],[,b]) => (a.score/a.max) - (b.score/b.max))[0][0];
    setExpanded(worst);
  };

  const handleReset = () => { setResult(null); setStep('setup'); setExpanded(null); };

  const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 50 ? '#ca8a04' : '#dc2626';
  const sectionBg = (score: number, max: number) => {
    const pct = score / max;
    if (pct >= 0.75) return 'bg-green-50 border-green-200';
    if (pct >= 0.5) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-20 z-50 flex w-[390px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" style={{ maxHeight: '600px' }}>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">ATS Resume Checker</p>
                <p className="text-xs text-white/70">Job-specific · Industry-grade</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {step === 'setup' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Select Your Target Job Role *
                  </label>
                  <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                    <option value="">-- Select a job role --</option>
                    {JOB_CATEGORIES.map(cat => (
                      <optgroup key={cat} label={cat}>
                        {Object.entries(JOB_KEYWORDS)
                          .filter(([,v]) => v.category === cat)
                          .map(([k,v]) => (
                            <option key={k} value={k}>{v.title}</option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {selectedJob && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1.5">Top keywords for this role:</p>
                    <div className="flex flex-wrap gap-1">
                      {JOB_KEYWORDS[selectedJob]?.keywords.slice(0, 8).map((k,i) => (
                        <span key={i} className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

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
                      rows={5} placeholder="Paste the full job description here for a more accurate match score..." />
                  )}
                  {jobDescription && (
                    <p className="text-xs text-emerald-600 mt-1">✓ Job description added — scoring will be more precise</p>
                  )}
                </div>

                <button onClick={handleCheck} disabled={!selectedJob}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" /> Analyze Resume
                </button>
              </div>
            )}

            {step === 'result' && result && (
              <div className="space-y-3">
                {/* Score */}
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                        <circle cx="50" cy="50" r="42" fill="none"
                          stroke={scoreColor(result.totalScore)} strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.totalScore / 100)}`}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold" style={{ color: scoreColor(result.totalScore) }}>{result.totalScore}</span>
                        <span className="text-[10px] text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold" style={{ color: result.gradeColor }}>{result.grade}</div>
                      <div className="text-xs text-muted-foreground mb-2">{JOB_KEYWORDS[selectedJob]?.title} Match</div>
                      {Object.entries(result.sections).map(([key, sec]) => (
                        <div key={key} className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] text-muted-foreground w-14 truncate">{sec.label.split(' ')[0]}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(sec.score/sec.max)*100}%`, background: scoreColor((sec.score/sec.max)*100) }} />
                          </div>
                          <span className="text-[9px] font-medium w-7 text-right">{sec.score}/{sec.max}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Job description match */}
                {result.jobDescriptionMatches.length > 0 && (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
                    <p className="text-xs font-semibold text-teal-700 mb-1.5">✓ Job Description Matches ({result.jobDescriptionMatches.length} keywords)</p>
                    <div className="flex flex-wrap gap-1">
                      {result.jobDescriptionMatches.slice(0,12).map((k,i) => (
                        <span key={i} className="rounded-full bg-teal-100 border border-teal-300 px-2 py-0.5 text-xs font-medium text-teal-700">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section accordions */}
                {Object.entries(result.sections).map(([key, sec]) => (
                  <div key={key} className={`rounded-xl border overflow-hidden ${sectionBg(sec.score, sec.max)}`}>
                    <button onClick={() => setExpanded(expanded === key ? null : key)}
                      className="flex w-full items-center justify-between px-3 py-2.5 hover:opacity-80 transition">
                      <div className="flex items-center gap-2">
                        {sec.score/sec.max >= 0.75
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                        <span className="text-xs font-semibold">{sec.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{sec.score}/{sec.max}</span>
                        {expanded === key ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
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
                      <span className="text-xs font-semibold text-green-700">Role Keywords Found ({result.foundKeywords.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.foundKeywords.map((k,i) => (
                        <span key={i} className="rounded-full bg-green-100 border border-green-300 px-2 py-0.5 text-xs font-medium text-green-700">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing keywords */}
                {result.missingJobKeywords.length > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Info className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">Missing Role Keywords — Add These</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.missingJobKeywords.map((k,i) => (
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
                      <span className="text-xs font-semibold text-purple-700">Suggested Action Verbs</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.missingVerbs.map((v,i) => (
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
        title="ATS Checker">
        {isOpen ? <X className="h-6 w-6 text-white" /> : <ShieldCheck className="h-6 w-6 text-white" />}
      </button>
    </>
  );
};
