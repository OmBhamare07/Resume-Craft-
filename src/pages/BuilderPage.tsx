import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useResumeStore, templates } from '@/store/resumeStore';
import { templateComponents } from '@/templates/ResumeTemplates';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const BuilderPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [searchParams] = useSearchParams();
  const resumeIdParam = searchParams.get('resumeId');
  const navigate = useNavigate();
  const store = useResumeStore();
  const { token } = useAuth();

  const [resumeId, setResumeId] = useState<string | null>(resumeIdParam);
  const [resumeName, setResumeName] = useState('Untitled Resume');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (templateId) store.setSelectedTemplate(templateId);
  }, [templateId]);

  // Load existing resume if resumeId in URL
  useEffect(() => {
    if (!resumeIdParam || !token) return;
    fetch(`/api/resumes/${resumeIdParam}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          store.setResumeData(data.resumeData);
          setResumeName(data.name || 'Untitled Resume');
          setResumeId(data.resumeId);
        }
      })
      .catch(console.error)
      .finally(() => { isFirstLoad.current = false; });
  }, [resumeIdParam, token]);

  useEffect(() => {
    if (!resumeIdParam) isFirstLoad.current = false;
  }, []);

  // Auto-save debounce
  const autoSave = useCallback(async (data: typeof store.resumeData, name: string) => {
    if (!token || isFirstLoad.current) return;
    setSaveStatus('saving');
    try {
      if (resumeId) {
        await fetch(`/api/resumes/${resumeId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ templateId, resumeData: data, name }),
        });
      } else {
        const res = await fetch('/api/resumes', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ templateId, resumeData: data, name }),
        });
        const created = await res.json();
        if (created.resumeId) setResumeId(created.resumeId);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [resumeId, token, templateId]);

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

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[450px_1fr]">
        <aside className="overflow-y-auto border-r border-border bg-card p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-lg font-semibold">Resume Editor</h1>
              {/* Save status */}
              <span className="text-xs flex items-center gap-1">
                {saveStatus === 'saving' && <><Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Saving...</span></>}
                {saveStatus === 'saved' && <><CheckCircle2 className="h-3 w-3 text-green-500" /><span className="text-green-600">Saved</span></>}
                {saveStatus === 'error' && <span className="text-red-500">Save failed</span>}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Changes auto-save every 2 seconds.</p>
          </div>

          {/* Resume Name */}
          <div className="mb-5">
            <Label className="text-xs text-muted-foreground">Resume Name</Label>
            <Input className="mt-1" value={resumeName} onChange={e => setResumeName(e.target.value)} placeholder="e.g. Software Engineer Resume" />
          </div>

          <Section title="Personal Information">
            <Field label="Full Name" value={data.personalInfo.fullName} onChange={v => store.updatePersonalInfo({ fullName: v })} />
            <Field label="Email" value={data.personalInfo.email} onChange={v => store.updatePersonalInfo({ email: v })} />
            <Field label="Phone" value={data.personalInfo.phone} onChange={v => store.updatePersonalInfo({ phone: v })} />
            <Field label="Location" value={data.personalInfo.location} onChange={v => store.updatePersonalInfo({ location: v })} />
            <Field label="LinkedIn URL" value={data.personalInfo.linkedinUrl} onChange={v => store.updatePersonalInfo({ linkedinUrl: v })} />
          </Section>

          <Section title="Career Objective">
            <div>
              <Label className="text-xs text-muted-foreground">Objective</Label>
              <Textarea className="mt-1" rows={3} value={data.objective} onChange={e => store.setObjective(e.target.value)} placeholder="Write a brief career objective..." />
            </div>
          </Section>

          <Section title="Skills" onAdd={store.addSkillGroup} addLabel="Add Skill Group">
            {data.skillGroups.map(g => (
              <div key={g.id} className="relative rounded border border-border p-3">
                <button onClick={() => store.removeSkillGroup(g.id)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <Field label="Category" value={g.category} onChange={v => store.updateSkillGroup(g.id, { category: v })} />
                <Field label="Skills (comma separated)" value={g.skills} onChange={v => store.updateSkillGroup(g.id, { skills: v })} />
              </div>
            ))}
          </Section>

          <Section title="Projects" onAdd={store.addProject} addLabel="Add Project">
            {data.projects.map(p => (
              <div key={p.id} className="relative rounded border border-border p-3">
                <button onClick={() => store.removeProject(p.id)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <Field label="Project Name" value={p.name} onChange={v => store.updateProject(p.id, { name: v })} />
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea className="mt-1" rows={2} value={p.description} onChange={e => store.updateProject(p.id, { description: e.target.value })} />
                </div>
                <Field label="Technologies" value={p.technologies} onChange={v => store.updateProject(p.id, { technologies: v })} />
              </div>
            ))}
          </Section>

          <Section title="Experience" onAdd={store.addExperience} addLabel="Add Experience">
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
          </Section>

          <Section title="Education" onAdd={store.addEducation} addLabel="Add Education">
            {data.education.map(e => (
              <div key={e.id} className="relative rounded border border-border p-3">
                <button onClick={() => store.removeEducation(e.id)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <Field label="Degree" value={e.degree} onChange={v => store.updateEducation(e.id, { degree: v })} />
                <Field label="Institute" value={e.institute} onChange={v => store.updateEducation(e.id, { institute: v })} />
                <Field label="Period" value={e.period} onChange={v => store.updateEducation(e.id, { period: v })} />
                <Field label="Marks / CGPA" value={e.marks} onChange={v => store.updateEducation(e.id, { marks: v })} />
              </div>
            ))}
          </Section>

          <Button className="mt-6 w-full" onClick={() => navigate(`/resume/${templateId}${resumeId ? `?resumeId=${resumeId}` : ''}`)}>
            Preview & Download
          </Button>
        </aside>

        <main className="hidden overflow-y-auto bg-muted p-8 lg:flex lg:justify-center">
          <div className="aspect-[1/1.414] w-full max-w-[800px] origin-top scale-[0.85] bg-card shadow-elevated ring-1 ring-border">
            <TemplateComponent data={data} />
          </div>
        </main>
      </div>
    </div>
  );
};

const Section = ({ title, children, onAdd, addLabel }: { title: string; children: React.ReactNode; onAdd?: () => void; addLabel?: string }) => (
  <div className="mb-6">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold">{title}</h2>
      {onAdd && (
        <button onClick={onAdd} className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="h-3 w-3" /> {addLabel}
        </button>
      )}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Input className="mt-1" value={value} onChange={e => onChange(e.target.value)} placeholder={label} />
  </div>
);

export default BuilderPage;
