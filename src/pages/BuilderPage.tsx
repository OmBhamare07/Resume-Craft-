import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useResumeStore, templates, ATS_FONTS } from '@/store/resumeStore';
import { templateComponents } from '@/templates/ResumeTemplates';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, CheckCircle2, Loader2, GripVertical, Type } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AISuggestions } from '@/components/AISuggestions';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SectionKey = 'personalInfo' | 'objective' | 'skills' | 'projects' | 'experience' | 'education' | 'certifications';

const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'personalInfo', 'objective', 'skills', 'projects', 'experience', 'education', 'certifications'
];

const SECTION_LABELS: Record<SectionKey, string> = {
  personalInfo: 'Personal Information',
  objective: 'Career Objective',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
};

// ── Sortable Section Wrapper ──────────────────────────────────────────
const SortableSection = ({
  id, title, children, onAdd, addLabel,
}: {
  id: string; title: string; children: React.ReactNode;
  onAdd?: () => void; addLabel?: string;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <div className="mb-3 flex items-center justify-between group">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-primary transition opacity-40 group-hover:opacity-100 p-1 rounded"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3 w-3" /> {addLabel}
          </button>
        )}
      </div>
      <div className="space-y-3 pl-6">{children}</div>
    </div>
  );
};

const BuilderPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [searchParams] = useSearchParams();
  const resumeIdParam = searchParams.get('resumeId');
  const navigate = useNavigate();
  const store = useResumeStore();
  const selectedFont = useResumeStore(s => s.selectedFont);
  const setSelectedFont = useResumeStore(s => s.setSelectedFont);
  const setCurrentResumeId = useResumeStore(s => s.setCurrentResumeId);
  const { token } = useAuth();
  const location = useLocation();
  const tailoredState = location.state as { tailored?: boolean; jobTitle?: string; atsKeywordsAdded?: string[] } | null;
  const [showTailoredBanner, setShowTailoredBanner] = useState(!!tailoredState?.tailored);

  const [resumeId, setResumeId] = useState<string | null>(resumeIdParam);
  const [resumeName, setResumeName] = useState('Untitled Resume');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(DEFAULT_SECTION_ORDER);
  const [jobType, setJobType] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // Sync resumeId to global store so ATSChecker can save scores
  useEffect(() => {
    if (resumeId) setCurrentResumeId(resumeId as any);
  }, [resumeId]);

  // dnd-kit sensors — supports both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder(prev => {
        const oldIndex = prev.indexOf(active.id as SectionKey);
        const newIndex = prev.indexOf(over.id as SectionKey);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    if (templateId) store.setSelectedTemplate(templateId);
  }, [templateId]);

  useEffect(() => {
    if (!resumeIdParam || !token) return;
    fetch(`/api/resumes/${resumeIdParam}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          store.setResumeData(data.resumeData);
          setResumeName(data.name || 'Untitled Resume');
          setResumeId(data.resumeId);
          if (data.sectionOrder) setSectionOrder(data.sectionOrder);
          if (data.jobType) setJobType(data.jobType);
        }
      })
      .catch(console.error)
      .finally(() => { isFirstLoad.current = false; });
  }, [resumeIdParam, token]);

  useEffect(() => {
    if (!resumeIdParam) isFirstLoad.current = false;
  }, []);

  const autoSave = useCallback(async (data: typeof store.resumeData, name: string) => {
    if (!token || isFirstLoad.current) return;
    setSaveStatus('saving');
    try {
      if (resumeId) {
        await fetch(`/api/resumes/${resumeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ templateId, resumeData: data, name, jobType }),
        });
      } else {
        const res = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ templateId, resumeData: data, name, jobType }),
        });
        const created = await res.json();
        if (created.resumeId) { setResumeId(created.resumeId); setCurrentResumeId(created.resumeId as any); }
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [resumeId, token, templateId, jobType]);

  useEffect(() => {
    if (isFirstLoad.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => autoSave(store.resumeData, resumeName), 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [store.resumeData, resumeName]);

  const template = templates.find(t => t.id === templateId);
  const TemplateComponent = templateId ? templateComponents[templateId] : null;

  if (!template || !TemplateComponent) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Template not found.</div>;
  }

  const { resumeData: data } = store;

  const renderSectionContent = (key: SectionKey) => {
    switch (key) {
      case 'personalInfo':
        return (
          <>
            <Field label="Full Name" value={data.personalInfo.fullName} onChange={v => store.updatePersonalInfo({ fullName: v })} />
            <Field label="Email" value={data.personalInfo.email} onChange={v => store.updatePersonalInfo({ email: v })} />
            <Field label="Phone" value={data.personalInfo.phone} onChange={v => store.updatePersonalInfo({ phone: v })} />
            <Field label="Location" value={data.personalInfo.location} onChange={v => store.updatePersonalInfo({ location: v })} />
            <Field label="LinkedIn URL" value={data.personalInfo.linkedinUrl} onChange={v => store.updatePersonalInfo({ linkedinUrl: v })} />
          </>
        );
      case 'objective':
        return (
          <div>
            <Label className="text-xs text-muted-foreground">Objective</Label>
            <Textarea className="mt-1" rows={3} value={data.objective} onChange={e => store.setObjective(e.target.value)} placeholder="Write a brief career objective..." />
          </div>
        );
      case 'skills':
        return (
          <>
            {data.skillGroups.map(g => (
              <div key={g.id} className="relative rounded border border-border p-3">
                <button onClick={() => store.removeSkillGroup(g.id)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <Field label="Category" value={g.category} onChange={v => store.updateSkillGroup(g.id, { category: v })} />
                <Field label="Skills (comma separated)" value={g.skills} onChange={v => store.updateSkillGroup(g.id, { skills: v })} />
              </div>
            ))}
          </>
        );
      case 'projects':
        return (
          <>
            {data.projects.map(p => (
              <div key={p.id} className="relative rounded border border-border p-3">
                <button onClick={() => store.removeProject(p.id)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <Field label="Project Name" value={p.name} onChange={v => store.updateProject(p.id, { name: v })} />
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea className="mt-1" rows={2} value={p.description} onChange={e => store.updateProject(p.id, { description: e.target.value })} />
                </div>
                <Field label="Technologies" value={p.technologies} onChange={v => store.updateProject(p.id, { technologies: v })} />
                <Field label="GitHub URL (optional)" value={p.githubUrl || ''} onChange={v => store.updateProject(p.id, { githubUrl: v })} />
              </div>
            ))}
          </>
        );
      case 'experience':
        return (
          <>
            {data.experience.map(e => (
              <div key={e.id} className="relative rounded border border-border p-3">
                <button onClick={() => store.removeExperience(e.id)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <Field label="Experience Type" value={e.type} onChange={v => store.updateExperience(e.id, { type: v })} />
                <Field label="Company" value={e.company} onChange={v => store.updateExperience(e.id, { company: v })} />
                <div>
                  <Label className="text-xs text-muted-foreground">Responsibilities</Label>
                  <Textarea className="mt-1" rows={2} value={e.responsibilities} onChange={e2 => store.updateExperience(e.id, { responsibilities: e2.target.value })} />
                </div>
                <Field label="Time Period" value={e.timePeriod} onChange={v => store.updateExperience(e.id, { timePeriod: v })} />
              </div>
            ))}
          </>
        );
      case 'certifications':
        return (
          <>
            {(data.certifications || []).map(c => (
              <div key={c.id} className="relative rounded border border-border p-3">
                <button onClick={() => store.removeCertification(c.id)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <Field label="Certification Name" value={c.name} onChange={v => store.updateCertification(c.id, { name: v })} />
                <Field label="Issuing Organization" value={c.issuer} onChange={v => store.updateCertification(c.id, { issuer: v })} />
                <Field label="Date (e.g. March 2024)" value={c.date} onChange={v => store.updateCertification(c.id, { date: v })} />
                <Field label="Credential URL (optional)" value={c.credentialUrl || ''} onChange={v => store.updateCertification(c.id, { credentialUrl: v })} />
              </div>
            ))}
          </>
        );
      case 'education':
        return (
          <>
            {data.education.map(e => (
              <div key={e.id} className="relative rounded border border-border p-3">
                <button onClick={() => store.removeEducation(e.id)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <Field label="Degree" value={e.degree} onChange={v => store.updateEducation(e.id, { degree: v })} />
                <Field label="Institute" value={e.institute} onChange={v => store.updateEducation(e.id, { institute: v })} />
                <Field label="Period" value={e.period} onChange={v => store.updateEducation(e.id, { period: v })} />
                <Field label="Marks / CGPA" value={e.marks} onChange={v => store.updateEducation(e.id, { marks: v })} />
              </div>
            ))}
          </>
        );
      default:
        return null;
    }
  };

  const getAddHandler = (key: SectionKey) => {
    switch (key) {
      case 'skills': return { onAdd: store.addSkillGroup, addLabel: 'Add Skill Group' };
      case 'projects': return { onAdd: store.addProject, addLabel: 'Add Project' };
      case 'experience': return { onAdd: store.addExperience, addLabel: 'Add Experience' };
      case 'certifications':
        return (
          <>
            {(data.certifications || []).map(c => (
              <div key={c.id} className="relative rounded border border-border p-3">
                <button onClick={() => store.removeCertification(c.id)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <Field label="Certification Name" value={c.name} onChange={v => store.updateCertification(c.id, { name: v })} />
                <Field label="Issuing Organization" value={c.issuer} onChange={v => store.updateCertification(c.id, { issuer: v })} />
                <Field label="Date (e.g. March 2024)" value={c.date} onChange={v => store.updateCertification(c.id, { date: v })} />
                <Field label="Credential URL (optional)" value={c.credentialUrl || ''} onChange={v => store.updateCertification(c.id, { credentialUrl: v })} />
              </div>
            ))}
          </>
        );
      case 'education': return { onAdd: store.addEducation, addLabel: 'Add Education' };
      case 'certifications': return { onAdd: store.addCertification, addLabel: 'Add Certification' };
      default: return {};
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[450px_1fr]">
        <aside className="overflow-y-auto border-r border-border bg-card p-4 md:p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-lg font-semibold">Resume Editor</h1>
              <span className="text-xs flex items-center gap-1">
                {saveStatus === 'saving' && <><Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Saving...</span></>}
                {saveStatus === 'saved' && <><CheckCircle2 className="h-3 w-3 text-green-500" /><span className="text-green-600">Saved</span></>}
                {saveStatus === 'error' && <span className="text-red-500">Save failed</span>}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Changes auto-save. <span className="text-primary font-medium">Drag ⠿ to reorder sections.</span></p>
          </div>

          {/* Tailored Resume Banner */}
          {showTailoredBanner && tailoredState?.jobTitle && (
            <div className="mb-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border border-purple-200 dark:border-purple-800 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    ✅ Resume tailored for: {tailoredState.jobTitle}
                  </p>
                  {tailoredState.atsKeywordsAdded && tailoredState.atsKeywordsAdded.length > 0 && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Keywords added: {tailoredState.atsKeywordsAdded.join(', ')}
                    </p>
                  )}
                </div>
                <button onClick={() => setShowTailoredBanner(false)} className="text-purple-400 hover:text-purple-700 text-xs shrink-0">✕</button>
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          <div className="mb-4">
            <AISuggestions data={store.resumeData} />
          </div>

          {/* Resume Name */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">Resume Name</Label>
            <Input className="mt-1" value={resumeName} onChange={e => setResumeName(e.target.value)} placeholder="e.g. Software Engineer Resume" />
          </div>

          {/* Job Type */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">Job Type / Target Role (for filtering)</Label>
            <Input className="mt-1" value={jobType} onChange={e => setJobType(e.target.value)} placeholder="e.g. Software Engineer, Data Analyst..." />
          </div>

          {/* Font Selector */}
          <div className="mb-5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Type className="h-3 w-3" /> Resume Font <span className="text-green-600 font-medium">(ATS-Approved Only)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {ATS_FONTS.map(font => (
                <button
                  key={font.value}
                  onClick={() => setSelectedFont(font.value)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                    selectedFont === font.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <span className="text-sm" style={{ fontFamily: font.value }}>{font.label}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    font.atsScore === 'Excellent' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>{font.atsScore}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Draggable sections using dnd-kit */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
              {sectionOrder.map(key => {
                const { onAdd, addLabel } = getAddHandler(key);
                return (
                  <SortableSection
                    key={key}
                    id={key}
                    title={SECTION_LABELS[key]}
                    onAdd={onAdd}
                    addLabel={addLabel}
                  >
                    {renderSectionContent(key)}
                  </SortableSection>
                );
              })}
            </SortableContext>
          </DndContext>

          <Button className="mt-2 w-full" onClick={() => navigate(`/resume/${templateId}${resumeId ? `?resumeId=${resumeId}` : ''}`)}>
            Preview & Download
          </Button>
        </aside>

        <main className="hidden overflow-y-auto bg-muted p-8 lg:flex lg:justify-center">
          <div
            className="w-full max-w-[800px] bg-card shadow-elevated ring-1 ring-border"
            style={{ fontFamily: selectedFont, minHeight: '1130px' }}
          >
            <TemplateComponent data={data} sectionOrder={sectionOrder} />
          </div>
        </main>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Input className="mt-1" value={value} onChange={e => onChange(e.target.value)} placeholder={label} />
  </div>
);

export default BuilderPage;
