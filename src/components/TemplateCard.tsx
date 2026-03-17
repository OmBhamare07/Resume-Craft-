import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Template } from '@/store/resumeStore';

interface TemplateCardProps {
  template: Template;
  previewUrl: string;
}

export const TemplateCard = ({ template, previewUrl }: TemplateCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="group relative border border-border bg-card p-2 shadow-rest transition-all duration-150 hover:shadow-elevated">
      <div className="aspect-[1/1.414] overflow-hidden bg-muted">
        <img
          src={previewUrl}
          alt={template.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
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
