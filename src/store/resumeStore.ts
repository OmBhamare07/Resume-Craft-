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
}

export interface Experience {
  id: string;
  type: string;
  company: string;
  responsibilities: string;
  timePeriod: string;
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
}

export interface Template {
  id: string;
  name: string;
  category: string;
}

export const templates: Template[] = [
  { id: 'modern', name: 'Modern ATS Template', category: 'Modern' },
  { id: 'professional', name: 'Professional ATS Template', category: 'Professional' },
  { id: 'minimal', name: 'Minimal ATS Template', category: 'Minimal' },
  { id: 'corporate', name: 'Corporate ATS Template', category: 'Corporate' },
  { id: 'simple', name: 'Simple ATS Template', category: 'Simple' },
];

const defaultResume: ResumeData = {
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedinUrl: '' },
  objective: '',
  skillGroups: [],
  projects: [],
  experience: [],
  education: [],
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
};

interface ResumeStore {
  currentResumeId: number | null;
  setCurrentResumeId: (id: number | null) => void;
  selectedTemplateId: string;
  resumeData: ResumeData;
  isUsingMockData: boolean;
  setSelectedTemplate: (id: string) => void;
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
  loadMockData: () => void;
  resetData: () => void;
}

const genId = () => Math.random().toString(36).slice(2, 9);

export const useResumeStore = create<ResumeStore>((set) => ({
  selectedTemplateId: 'modern',
  currentResumeId: null,
  resumeData: defaultResume,
  isUsingMockData: false,
  setSelectedTemplate: (id) => set({ selectedTemplateId: id }),
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
  loadMockData: () => set({ resumeData: mockResume, isUsingMockData: true }),
  resetData: () => set({ resumeData: defaultResume, isUsingMockData: false }),
}));
