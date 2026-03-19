import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useResumeStore, templates } from '@/store/resumeStore';
import { templateComponents } from '@/templates/ResumeTemplates';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Download, Pencil, LayoutTemplate, FileText, Loader2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const ResumePreviewPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [searchParams] = useSearchParams();
  const resumeIdParam = searchParams.get('resumeId');
  const navigate = useNavigate();
  const resumeData = useResumeStore((s) => s.resumeData);
  const selectedFont = useResumeStore((s) => s.selectedFont);
  const store = useResumeStore();
  const { token } = useAuth();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  const template = templates.find((t) => t.id === templateId);
  const TemplateComponent = templateId ? templateComponents[templateId] : null;

  // Load resume if coming from history
  useEffect(() => {
    if (!resumeIdParam || !token) return;
    fetch(`/api/resumes/${resumeIdParam}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) store.setResumeData(data.resumeData); })
      .catch(console.error);
  }, [resumeIdParam, token]);

  if (!template || !TemplateComponent) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Template not found.</div>;
  }

  // ── Protected PDF download (rendered as image — uncopiable) ────────
  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    setPdfLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const canvas = await html2canvas(resumeRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      // Set document properties (no password needed — image-based = uncopiable)
      pdf.setProperties({
        title: `${resumeData.personalInfo.fullName || 'Resume'} - Resume`,
        creator: 'ResumeCraft',
      });

      const fileName = `${(resumeData.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF error:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Word document download ─────────────────────────────────────────
  const handleDownloadWord = async () => {
    setDocLoading(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } = await import('docx');
      const d = resumeData;
      const fontName = selectedFont.split(',')[0].replace(/['"]/g, '').trim() || 'Arial';

      const t = (text: string, bold = false, size = 22) => new TextRun({ text, bold, size, font: fontName, color: '1a1a1a' });
      const hr = () => new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2563eb', space: 1 } },
        spacing: { after: 80 },
        children: [new TextRun({ text: '' })],
      });

      const sectionHeading = (title: string) => new Paragraph({
        children: [t(title.toUpperCase(), true, 20)],
        spacing: { before: 200, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '2563eb', space: 1 } },
      });

      const children: any[] = [];

      // Header
      children.push(new Paragraph({
        children: [t(d.personalInfo.fullName || 'Your Name', true, 36)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }));

      const contactParts = [d.personalInfo.email, d.personalInfo.phone, d.personalInfo.location, d.personalInfo.linkedinUrl].filter(Boolean);
      if (contactParts.length) {
        children.push(new Paragraph({
          children: [t(contactParts.join('  |  '), false, 18)],
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
        }));
      }

      // Objective
      if (d.objective) {
        children.push(sectionHeading('Professional Summary'));
        children.push(new Paragraph({ children: [t(d.objective, false, 20)], spacing: { after: 120 } }));
      }

      // Experience
      if (d.experience.length) {
        children.push(sectionHeading('Work Experience'));
        d.experience.forEach(e => {
          children.push(new Paragraph({
            children: [t(e.company, true, 22), t(`  |  ${e.type}`, false, 20)],
            spacing: { after: 40 },
          }));
          if (e.timePeriod) children.push(new Paragraph({ children: [t(e.timePeriod, false, 18)], spacing: { after: 60 } }));
          if (e.responsibilities) {
            e.responsibilities.split('.').filter(r => r.trim()).forEach(r => {
              children.push(new Paragraph({
                children: [t(`• ${r.trim()}`, false, 20)],
                spacing: { after: 40 },
              }));
            });
          }
          children.push(new Paragraph({ children: [t('')], spacing: { after: 80 } }));
        });
      }

      // Skills
      if (d.skillGroups.length) {
        children.push(sectionHeading('Skills'));
        d.skillGroups.forEach(g => {
          children.push(new Paragraph({
            children: [t(`${g.category}: `, true, 20), t(g.skills, false, 20)],
            spacing: { after: 60 },
          }));
        });
      }

      // Projects
      if (d.projects.length) {
        children.push(sectionHeading('Projects'));
        d.projects.forEach(p => {
          children.push(new Paragraph({ children: [t(p.name, true, 22)], spacing: { after: 40 } }));
          if (p.description) children.push(new Paragraph({ children: [t(p.description, false, 20)], spacing: { after: 40 } }));
          if (p.technologies) children.push(new Paragraph({ children: [t(`Technologies: ${p.technologies}`, false, 18)], spacing: { after: 80 } }));
        });
      }

      // Education
      if (d.education.length) {
        children.push(sectionHeading('Education'));
        d.education.forEach(e => {
          children.push(new Paragraph({
            children: [t(e.degree, true, 22), t(`  —  ${e.institute}`, false, 20)],
            spacing: { after: 40 },
          }));
          const eduMeta = [e.period, e.marks].filter(Boolean).join('  |  ');
          if (eduMeta) children.push(new Paragraph({ children: [t(eduMeta, false, 18)], spacing: { after: 80 } }));
        });
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(d.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Word error:', err);
      alert('Word document generation failed. Please try again.');
    } finally {
      setDocLoading(false);
    }
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
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate(`/builder/${templateId}${resumeIdParam ? `?resumeId=${resumeIdParam}` : ''}`)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Resume
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> Change Template
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadWord} disabled={docLoading}>
              {docLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
              Download Word
            </Button>
            <Button size="sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
              {pdfLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
              Download PDF
            </Button>
          </div>
        </div>

        {/* PDF lock notice */}
        <div className="no-print mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-center gap-2 max-w-[800px] mx-auto">
          <span className="text-amber-600 text-lg">🔒</span>
          <p className="text-xs text-amber-700">
            <span className="font-semibold">PDF is copy-protected.</span> Resume is rendered as an image — text cannot be selected or copied from the downloaded PDF.
          </p>
        </div>

        <div className="mx-auto max-w-[800px]">
          <div
            ref={resumeRef}
            className="print-area aspect-[1/1.414] w-full bg-white shadow-elevated ring-1 ring-border"
            style={{ fontFamily: selectedFont }}
          >
            <TemplateComponent data={resumeData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumePreviewPage;
