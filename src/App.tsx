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
import { ResumeChatbot } from "./components/ResumeChatbot.tsx";
import { ATSChecker } from "./components/ATSChecker.tsx";
import { useResumeStore } from "./store/resumeStore.ts";

const queryClient = new QueryClient();

const FloatingWidgets = () => {
  const location = useLocation();
  const resumeData = useResumeStore(s => s.resumeData);
  const showATS = location.pathname.startsWith('/builder') || location.pathname.startsWith('/resume');
  const isAuthPage = ['/login', '/signup', '/verify-email'].includes(location.pathname);
  if (isAuthPage) return null;
  return (
    <>
      <ResumeChatbot />
      {showATS && <ATSChecker data={resumeData} />}
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

            {/* Protected */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
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
