import { useParams, useNavigate } from 'react-router-dom';
import { templates, useResumeStore } from '@/store/resumeStore';
import { templateComponents } from '@/templates/ResumeTemplates';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';

const mockData = {
  personalInfo: { fullName: 'Alex Johnson', email: 'alex@email.com', phone: '+1 555-1234', location: 'San Francisco, CA', linkedinUrl: 'linkedin.com/in/alex' },
  objective: 'Results-driven software engineer with 5+ years of experience building scalable web applications.',
  skillGroups: [
    { id: '1', category: 'Frontend', skills: 'React, TypeScript, Tailwind CSS' },
    { id: '2', category: 'Backend', skills: 'Node.js, PostgreSQL, Redis' },
  ],
  projects: [{ id: '1', name: 'E-Commerce Platform', description: 'Full-stack e-commerce with real-time inventory.', technologies: 'React, Node.js, Stripe' }],
  experience: [{ id: '1', type: 'Full-time', company: 'TechCorp Inc.', responsibilities: 'Led frontend development, improving performance by 40%.', timePeriod: 'Jan 2022 – Present' }],
  education: [{ id: '1', degree: 'B.S. Computer Science', institute: 'Stanford University', period: '2015 – 2019', marks: 'GPA: 3.8' }],
};

const TemplatePreviewPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const setSelectedTemplate = useResumeStore((s) => s.setSelectedTemplate);

  const template = templates.find((t) => t.id === templateId);
  const TemplateComponent = templateId ? templateComponents[templateId] : null;

  if (!template || !TemplateComponent) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Template not found.</div>;
  }

  const handleCreateResume = () => {
    setSelectedTemplate(template.id);
    navigate(`/builder/${template.id}`);
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{template.name}</h1>
            <p className="text-sm text-muted-foreground">{template.category} — ATS Optimized</p>
          </div>
          <Button onClick={handleCreateResume}>Create Resume</Button>
        </div>
        <div className="mx-auto max-w-[800px]">
          <div className="aspect-[1/1.414] w-full bg-card shadow-elevated ring-1 ring-border">
            <TemplateComponent data={mockData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TemplatePreviewPage;
