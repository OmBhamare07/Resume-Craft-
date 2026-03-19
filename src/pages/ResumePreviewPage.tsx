import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useResumeStore, templates } from '@/store/resumeStore';
import { templateComponents } from '@/templates/ResumeTemplates';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Download, Pencil, LayoutTemplate, Loader2, Share2, Check } from 'lucide-react';
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
  const [resumeId] = useState<string | null>(resumeIdParam);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareToken, setShareToken] = useState('');

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


  const handleShare = async () => {
    if (!resumeId) { alert('Save your resume first by going back to the builder.'); return; }
    setShareLoading(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/share`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const url = `${window.location.origin}/shared/${data.shareToken}`;
      await navigator.clipboard.writeText(url);
      setShareToken(data.shareToken);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch { alert('Share failed. Please try again.'); }
    finally { setShareLoading(false); }
  };

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
            <Button variant="outline" size="sm" onClick={handleShare} disabled={shareLoading}>
              {shareLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : shareCopied ? <Check className="mr-1.5 h-3.5 w-3.5 text-green-500" /> : <Share2 className="mr-1.5 h-3.5 w-3.5" />}
              {shareCopied ? 'Link Copied!' : 'Share'}
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
