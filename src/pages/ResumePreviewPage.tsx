import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useResumeStore, templates } from '@/store/resumeStore';
import { templateComponents } from '@/templates/ResumeTemplates';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Download, Pencil, LayoutTemplate, Loader2, Share2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  const [resumeId, setResumeId] = useState<string | null>(resumeIdParam);
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const template = templates.find((t) => t.id === templateId);
  const TemplateComponent = templateId ? templateComponents[templateId] : null;

  // Load resume if coming from history
  useEffect(() => {
    if (!resumeIdParam || !token) return;
    fetch(`/api/resumes/${resumeIdParam}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { store.setResumeData(data.resumeData); setResumeId(data.resumeId); if (data.sectionOrder) setSectionOrder(data.sectionOrder); } })
      .catch(console.error);
  }, [resumeIdParam, token]);

  if (!template || !TemplateComponent) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Template not found.</div>;
  }

  // ── Share handler ──────────────────────────────────────────────────
  const handleShare = async () => {
    // If no resumeId, auto-save first then share
    let currentResumeId = resumeId;

    if (!currentResumeId) {
      setShareLoading(true);
      try {
        const res = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ templateId, resumeData, name: resumeData.personalInfo.fullName || 'My Resume' }),
        });
        const created = await res.json();
        currentResumeId = created.resumeId;
        setResumeId(created.resumeId);
      } catch {
        alert('Could not save resume. Please go to the builder first.');
        setShareLoading(false);
        return;
      }
    } else {
      setShareLoading(true);
    }

    try {
      const res = await fetch(`/api/resumes/${currentResumeId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Share failed');
      const data = await res.json();
      const url = `${window.location.origin}/shared/${data.shareToken}`;
      // Clipboard API only works on HTTPS — fallback for HTTP
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Fallback: show the URL in a prompt so user can copy manually
        window.prompt('Copy your share link:', url);
      }
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      alert('Share failed. Please try again.');
    } finally {
      setShareLoading(false);
    }
  };

  // ── Backend Puppeteer PDF download (ATS-readable text) ────────────
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch('/api/resumes/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId,
          resumeData,
          fontFamily: selectedFont,
          sectionOrder: sectionOrder.length > 0 ? sectionOrder : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'PDF generation failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resumeData.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF error:', err);
      alert(err.message || 'PDF generation failed. Please try again.');
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

        <div className="no-print mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 flex items-center gap-2 max-w-[800px] mx-auto">
          <span className="text-green-600 text-lg">✅</span>
          <p className="text-xs text-green-700">
            <span className="font-semibold">ATS-readable PDF.</span> Downloaded resume contains real selectable text — compatible with all ATS systems and resume checkers.
          </p>
        </div>

        <div className="mx-auto max-w-[800px]">
          {/* ── Fix 2: Remove aspect-ratio constraint so content can grow naturally ── */}
          <div
            className="w-full bg-white shadow-elevated ring-1 ring-border"
            style={{ fontFamily: selectedFont, minHeight: '1130px' }}
          >
            <TemplateComponent data={resumeData} sectionOrder={sectionOrder.length > 0 ? sectionOrder : undefined} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumePreviewPage;
