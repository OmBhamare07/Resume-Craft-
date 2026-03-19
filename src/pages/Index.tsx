import { templates } from '@/store/resumeStore';
import { TemplateCard } from '@/components/TemplateCard';
import { AppHeader } from '@/components/AppHeader';

const Index = () => {
  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="container py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            Build a resume that machines can read and humans want to hire.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose an ATS-optimized template to get started. Single-column layouts designed for maximum compatibility.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
