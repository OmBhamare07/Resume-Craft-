import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Template } from '@/store/resumeStore';
import { templateComponents } from '@/templates/ResumeTemplates';

interface TemplateCardProps {
  template: Template;
}

// Sample data so preview looks realistic
const PREVIEW_DATA = {
  personalInfo: {
    fullName: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedinUrl: 'linkedin.com/in/alexjohnson',
  },
  objective: 'Results-driven software engineer with 5+ years of experience building scalable web applications. Seeking to leverage expertise in React and TypeScript to drive product innovation.',
  skillGroups: [
    { id: '1', category: 'Frontend', skills: 'React, TypeScript, Tailwind CSS, Next.js' },
    { id: '2', category: 'Backend', skills: 'Node.js, Express, PostgreSQL, Redis' },
    { id: '3', category: 'DevOps', skills: 'Docker, AWS, CI/CD, Terraform' },
  ],
  projects: [
    { id: '1', name: 'E-Commerce Platform', description: 'Built a full-stack e-commerce platform with real-time inventory and payment processing.', technologies: 'React, Node.js, Stripe' },
    { id: '2', name: 'Task Management App', description: 'Collaborative task manager with real-time updates and team analytics.', technologies: 'Next.js, Prisma, Redis' },
  ],
  experience: [
    { id: '1', type: 'Full-time', company: 'TechCorp Inc.', responsibilities: 'Led frontend development improving performance by 40%. Mentored junior developers and established coding standards.', timePeriod: 'Jan 2022 – Present' },
    { id: '2', type: 'Full-time', company: 'StartupXYZ', responsibilities: 'Developed RESTful APIs and microservices. Implemented CI/CD pipelines reducing deployment time by 60%.', timePeriod: 'Jun 2019 – Dec 2021' },
  ],
  education: [
    { id: '1', degree: 'B.S. Computer Science', institute: 'Stanford University', period: '2015 – 2019', marks: 'GPA: 3.8/4.0' },
  ],
};

export const TemplateCard = ({ template }: TemplateCardProps) => {
  const navigate = useNavigate();
  const TemplateComponent = templateComponents[template.id];

  return (
    <div className="group relative border border-border bg-card p-2 shadow-rest transition-all duration-150 hover:shadow-elevated">
      {/* Live template preview */}
      <div className="aspect-[1/1.414] overflow-hidden bg-white relative">
        <div
          style={{
            transform: 'scale(0.265)',
            transformOrigin: 'top left',
            width: '378%',
            height: '378%',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {TemplateComponent && <TemplateComponent data={PREVIEW_DATA} />}
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
      </div>

      <div className="mt-3 flex items-center justify-between px-1 pb-1">
        <div>
          <h3 className="text-sm font-medium">{template.name}</h3>
          <p className="text-xs text-muted-foreground">{template.category}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => navigate(`/preview/${template.id}`)}
          >
            Preview
          </Button>
          <Button
            size="sm"
            className="text-xs"
            onClick={() => navigate(`/builder/${template.id}`)}
          >
            Use
          </Button>
        </div>
      </div>
    </div>
  );
};
