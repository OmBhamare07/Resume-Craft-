import { useParams, useNavigate } from 'react-router-dom';
import { useResumeStore, templates } from '@/store/resumeStore';
import { templateComponents } from '@/templates/ResumeTemplates';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Download, Pencil, LayoutTemplate } from 'lucide-react';

const ResumePreviewPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const resumeData = useResumeStore((s) => s.resumeData);

  const template = templates.find((t) => t.id === templateId);
  const TemplateComponent = templateId ? templateComponents[templateId] : null;

  if (!template || !TemplateComponent) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Template not found.</div>;
  }

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="no-print">
        <AppHeader />
      </div>
      <main className="container py-8">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Resume Preview</h1>
            <p className="text-xs text-muted-foreground">{template.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/builder/${templateId}`)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Resume
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> Change Template
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-[800px]">
          <div className="print-area aspect-[1/1.414] w-full bg-card shadow-elevated ring-1 ring-border">
            <TemplateComponent data={resumeData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumePreviewPage;
