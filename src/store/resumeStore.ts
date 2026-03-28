import { create } from 'zustand';

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  skills: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
  githubUrl: string;
}

export interface Experience {
  id: string;
  type: string;
  company: string;
  responsibilities: string;
  timePeriod: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl: string;
}

export interface Education {
  id: string;
  degree: string;
  institute: string;
  period: string;
  marks: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  objective: string;
  skillGroups: SkillGroup[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
}

export interface Template {
  id: string;
  name: string;
  category: string;
}

// ── ATS-approved fonts ────────────────────────────────────────────────
export interface ATSFont {
  name: string;
  value: string;
  label: string;
  atsScore: 'Excellent' | 'Good';
}

export const ATS_FONTS: ATSFont[] = [
  { name: 'Arial',            value: 'Arial, sans-serif',                    label: 'Arial',            atsScore: 'Excellent' },
  { name: 'Calibri',          value: 'Calibri, sans-serif',                  label: 'Calibri',          atsScore: 'Excellent' },
  { name: 'Times New Roman',  value: '"Times New Roman", Times, serif',       label: 'Times New Roman',  atsScore: 'Excellent' },
  { name: 'Georgia',          value: 'Georgia, serif',                        label: 'Georgia',          atsScore: 'Excellent' },
  { name: 'Helvetica',        value: 'Helvetica, Arial, sans-serif',          label: 'Helvetica',        atsScore: 'Excellent' },
  { name: 'Garamond',         value: 'Garamond, Georgia, serif',              label: 'Garamond',         atsScore: 'Good'      },
  { name: 'Cambria',          value: 'Cambria, Georgia, serif',               label: 'Cambria',          atsScore: 'Good'      },
  { name: 'Trebuchet MS',     value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS',     atsScore: 'Good'      },
  { name: 'Verdana',          value: 'Verdana, Geneva, sans-serif',           label: 'Verdana',          atsScore: 'Good'      },
  { name: 'Tahoma',           value: 'Tahoma, Geneva, sans-serif',            label: 'Tahoma',           atsScore: 'Good'      },
];

export const templates: Template[] = [
  { id: 'modern',       name: 'Modern ATS Template',       category: 'Modern'       },
  { id: 'professional', name: 'Professional ATS Template', category: 'Professional' },
  { id: 'minimal',      name: 'Minimal ATS Template',      category: 'Minimal'      },
  { id: 'corporate',    name: 'Corporate ATS Template',    category: 'Corporate'    },
  { id: 'simple',       name: 'Simple ATS Template',       category: 'Simple'       },
  { id: 'executive',    name: 'Executive ATS Template',    category: 'Executive'    },
  { id: 'tech',         name: 'Tech ATS Template',         category: 'Tech'         },
  { id: 'creative',     name: 'Creative ATS Template',     category: 'Creative'     },
  { id: 'compact',      name: 'Compact ATS Template',      category: 'Compact'      },
  { id: 'elegant',      name: 'Elegant ATS Template',      category: 'Elegant'      },
];

const defaultResume: ResumeData = {
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedinUrl: '' },
  objective: '',
  skillGroups: [],
  projects: [],
  experience: [],
  education: [],
  certifications: [],
};

const mockResume: ResumeData = {
  personalInfo: {
    fullName: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedinUrl: 'linkedin.com/in/alexjohnson',
  },
  objective: 'Results-driven software engineer with 5+ years of experience building scalable web applications. Seeking to leverage expertise in React, TypeScript, and cloud infrastructure to drive product innovation.',
  skillGroups: [
    { id: '1', category: 'Frontend', skills: 'React, TypeScript, Tailwind CSS, Next.js' },
    { id: '2', category: 'Backend', skills: 'Node.js, Express, PostgreSQL, Redis' },
    { id: '3', category: 'DevOps', skills: 'Docker, AWS, CI/CD, Terraform' },
  ],
  projects: [
    { id: '1', name: 'E-Commerce Platform', description: 'Built a full-stack e-commerce platform with real-time inventory management and payment processing.', technologies: 'React, Node.js, Stripe, PostgreSQL' },
    { id: '2', name: 'Task Management System', description: 'Developed a collaborative task management tool with real-time updates and team analytics.', technologies: 'Next.js, Prisma, WebSockets, Redis' },
  ],
  experience: [
    { id: '1', type: 'Full-time', company: 'TechCorp Inc.', responsibilities: 'Led frontend development for the core product, improving performance by 40%. Mentored junior developers and established coding standards.', timePeriod: 'Jan 2022 – Present' },
    { id: '2', type: 'Full-time', company: 'StartupXYZ', responsibilities: 'Developed RESTful APIs and microservices architecture. Implemented CI/CD pipelines reducing deployment time by 60%.', timePeriod: 'Jun 2019 – Dec 2021' },
  ],
  education: [
    { id: '1', degree: 'B.S. Computer Science', institute: 'Stanford University', period: '2015 – 2019', marks: 'GPA: 3.8/4.0' },
  ],
  certifications: [],
};

interface ResumeStore {
  currentResumeId: number | null;
  setCurrentResumeId: (id: number | null) => void;
  selectedTemplateId: string;
  selectedFont: string;
  resumeData: ResumeData;
  isUsingMockData: boolean;
  setSelectedTemplate: (id: string) => void;
  setSelectedFont: (font: string) => void;
  setResumeData: (data: ResumeData) => void;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  setObjective: (text: string) => void;
  addSkillGroup: () => void;
  updateSkillGroup: (id: string, data: Partial<SkillGroup>) => void;
  removeSkillGroup: (id: string) => void;
  addProject: () => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addExperience: () => void;
  updateExperience: (id: string, data: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  addEducation: () => void;
  updateEducation: (id: string, data: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  addCertification: () => void;
  updateCertification: (id: string, data: Partial<Certification>) => void;
  removeCertification: (id: string) => void;
  loadMockData: () => void;
  resetData: () => void;
}

const genId = () => Math.random().toString(36).slice(2, 9);

export const useResumeStore = create<ResumeStore>((set) => ({
  selectedTemplateId: 'modern',
  selectedFont: 'Arial, sans-serif',
  currentResumeId: null,
  resumeData: defaultResume,
  isUsingMockData: false,
  setSelectedTemplate: (id) => set({ selectedTemplateId: id }),
  setSelectedFont: (font) => set({ selectedFont: font }),
  setCurrentResumeId: (id) => set({ currentResumeId: id }),
  setResumeData: (data) => set({ resumeData: data }),
  updatePersonalInfo: (info) =>
    set((s) => ({ resumeData: { ...s.resumeData, personalInfo: { ...s.resumeData.personalInfo, ...info } } })),
  setObjective: (text) => set((s) => ({ resumeData: { ...s.resumeData, objective: text } })),
  addSkillGroup: () =>
    set((s) => ({ resumeData: { ...s.resumeData, skillGroups: [...s.resumeData.skillGroups, { id: genId(), category: '', skills: '' }] } })),
  updateSkillGroup: (id, data) =>
    set((s) => ({ resumeData: { ...s.resumeData, skillGroups: s.resumeData.skillGroups.map((g) => (g.id === id ? { ...g, ...data } : g)) } })),
  removeSkillGroup: (id) =>
    set((s) => ({ resumeData: { ...s.resumeData, skillGroups: s.resumeData.skillGroups.filter((g) => g.id !== id) } })),
  addProject: () =>
    set((s) => ({ resumeData: { ...s.resumeData, projects: [...s.resumeData.projects, { id: genId(), name: '', description: '', technologies: '' }] } })),
  updateProject: (id, data) =>
    set((s) => ({ resumeData: { ...s.resumeData, projects: s.resumeData.projects.map((p) => (p.id === id ? { ...p, ...data } : p)) } })),
  removeProject: (id) =>
    set((s) => ({ resumeData: { ...s.resumeData, projects: s.resumeData.projects.filter((p) => p.id !== id) } })),
  addExperience: () =>
    set((s) => ({ resumeData: { ...s.resumeData, experience: [...s.resumeData.experience, { id: genId(), type: '', company: '', responsibilities: '', timePeriod: '' }] } })),
  updateExperience: (id, data) =>
    set((s) => ({ resumeData: { ...s.resumeData, experience: s.resumeData.experience.map((e) => (e.id === id ? { ...e, ...data } : e)) } })),
  removeExperience: (id) =>
    set((s) => ({ resumeData: { ...s.resumeData, experience: s.resumeData.experience.filter((e) => e.id !== id) } })),
  addEducation: () =>
    set((s) => ({ resumeData: { ...s.resumeData, education: [...s.resumeData.education, { id: genId(), degree: '', institute: '', period: '', marks: '' }] } })),
  updateEducation: (id, data) =>
    set((s) => ({ resumeData: { ...s.resumeData, education: s.resumeData.education.map((e) => (e.id === id ? { ...e, ...data } : e)) } })),
  removeEducation: (id) =>
    set((s) => ({ resumeData: { ...s.resumeData, education: s.resumeData.education.filter((e) => e.id !== id) } })),
  addCertification: () =>
    set((s) => ({ resumeData: { ...s.resumeData, certifications: [...(s.resumeData.certifications || []), { id: genId(), name: '', issuer: '', date: '', credentialUrl: '' }] } })),
  updateCertification: (id, data) =>
    set((s) => ({ resumeData: { ...s.resumeData, certifications: (s.resumeData.certifications || []).map((c) => (c.id === id ? { ...c, ...data } : c)) } })),
  removeCertification: (id) =>
    set((s) => ({ resumeData: { ...s.resumeData, certifications: (s.resumeData.certifications || []).filter((c) => c.id !== id) } })),
  loadMockData: () => set({ resumeData: mockResume, isUsingMockData: true }),
  resetData: () => set({ resumeData: defaultResume, isUsingMockData: false }),
}));
