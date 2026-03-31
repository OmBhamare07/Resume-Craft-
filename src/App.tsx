import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import TemplatePreviewPage from "./pages/TemplatePreviewPage.tsx";
import BuilderPage from "./pages/BuilderPage.tsx";
import ResumePreviewPage from "./pages/ResumePreviewPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.tsx";
import HistoryPage from "./pages/HistoryPage.tsx";
import CoverLetterPage from "./pages/CoverLetterPage.tsx";
import CoverLettersListPage from "./pages/CoverLettersListPage.tsx";
import SharedResumePage from "./pages/SharedResumePage.tsx";
import TailorResumePage from "./pages/TailorResumePage.tsx";
import UploadResumePage from "./pages/UploadResumePage.tsx";
import JobMatchPage from "./pages/JobMatchPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import AdminRequestPage from "./pages/AdminRequestPage.tsx";
import ScoreTrackerPage from "./pages/ScoreTrackerPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import { ResumeChatbot } from "./components/ResumeChatbot.tsx";
import { ATSChecker } from "./components/ATSChecker.tsx";
import { useResumeStore } from "./store/resumeStore.ts";
import { useAuth } from "./context/AuthContext.tsx";

const queryClient = new QueryClient();

const FloatingWidgets = () => {
  const location = useLocation();
  const resumeData = useResumeStore(s => s.resumeData);
  const currentResumeId = useResumeStore(s => s.currentResumeId);
  const { token } = useAuth();
  const showATS = location.pathname.startsWith('/builder') || location.pathname.startsWith('/resume');
  const isAuthPage = ['/login', '/signup', '/verify-email'].includes(location.pathname);
  const isSharedPage = location.pathname.startsWith('/shared');
  if (isAuthPage || isSharedPage) return null;
  return (
    <>
      <ResumeChatbot />
      {showATS && <ATSChecker data={resumeData} resumeId={currentResumeId ? String(currentResumeId) : null} token={token} />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/shared/:shareToken" element={<SharedResumePage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/cover-letters" element={<ProtectedRoute><CoverLettersListPage /></ProtectedRoute>} />
            <Route path="/cover-letter" element={<ProtectedRoute><CoverLetterPage /></ProtectedRoute>} />
            <Route path="/tailor" element={<ProtectedRoute><TailorResumePage /></ProtectedRoute>} />
            <Route path="/upload-resume" element={<ProtectedRoute><UploadResumePage /></ProtectedRoute>} />
            <Route path="/job-match" element={<ProtectedRoute><JobMatchPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/admin/request" element={<ProtectedRoute><AdminRequestPage /></ProtectedRoute>} />
            <Route path="/score-tracker" element={<ProtectedRoute><ScoreTrackerPage /></ProtectedRoute>} />
            <Route path="/preview/:templateId" element={<ProtectedRoute><TemplatePreviewPage /></ProtectedRoute>} />
            <Route path="/builder/:templateId" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
            <Route path="/resume/:templateId" element={<ProtectedRoute><ResumePreviewPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingWidgets />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
