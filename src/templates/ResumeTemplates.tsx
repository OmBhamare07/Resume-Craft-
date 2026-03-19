import { ResumeData } from '@/store/resumeStore';

interface TemplateProps {
  data: ResumeData;
}

// ─────────────────────────────────────────────
// 1. MODERN — single column, blue left-border accents
// ─────────────────────────────────────────────
export const ModernTemplate = ({ data }: TemplateProps) => (
  <div style={{ fontFamily: 'inherit', fontSize: '13px', color: '#1a1a1a', padding: '36px 40px', lineHeight: '1.5', background: '#fff', height: '100%' }}>
    <div style={{ borderLeft: '4px solid #2563eb', paddingLeft: '14px', marginBottom: '20px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#1e3a8a' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px', fontSize: '12px', color: '#555' }}>
        {data.personalInfo.email && <span>✉ {data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>📞 {data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>📍 {data.personalInfo.location}</span>}
        {data.personalInfo.linkedinUrl && <span>🔗 {data.personalInfo.linkedinUrl}</span>}
      </div>
    </div>

    {data.objective && (
      <Section title="PROFESSIONAL SUMMARY" color="#2563eb">
        <p style={{ margin: 0 }}>{data.objective}</p>
      </Section>
    )}

    {data.experience.length > 0 && (
      <Section title="WORK EXPERIENCE" color="#2563eb">
        {data.experience.map((e) => (
          <div key={e.id} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>{e.company}</span>
              <span style={{ fontSize: '11px', color: '#666', fontWeight: 400 }}>{e.timePeriod}</span>
            </div>
            {e.type && <div style={{ fontSize: '12px', color: '#2563eb', fontStyle: 'italic' }}>{e.type}</div>}
            <p style={{ margin: '4px 0 0', color: '#333' }}>{e.responsibilities}</p>
          </div>
        ))}
      </Section>
    )}

    {data.projects.length > 0 && (
      <Section title="PROJECTS" color="#2563eb">
        {data.projects.map((p) => (
          <div key={p.id} style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <p style={{ margin: '3px 0', color: '#333' }}>{p.description}</p>
            {p.technologies && <div style={{ fontSize: '11px', color: '#2563eb' }}>Tech Stack: {p.technologies}</div>}
          </div>
        ))}
      </Section>
    )}

    {data.skillGroups.length > 0 && (
      <Section title="SKILLS" color="#2563eb">
        {data.skillGroups.map((g) => (
          <div key={g.id} style={{ marginBottom: '4px' }}>
            <span style={{ fontWeight: 600 }}>{g.category}: </span>
            <span style={{ color: '#333' }}>{g.skills}</span>
          </div>
        ))}
      </Section>
    )}

    {data.education.length > 0 && (
      <Section title="EDUCATION" color="#2563eb">
        {data.education.map((e) => (
          <div key={e.id} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>{e.degree}</span>
              <span style={{ fontSize: '11px', color: '#666', fontWeight: 400 }}>{e.period}</span>
            </div>
            <div style={{ color: '#444' }}>{e.institute}</div>
            {e.marks && <div style={{ fontSize: '11px', color: '#666' }}>{e.marks}</div>}
          </div>
        ))}
      </Section>
    )}
  </div>
);

// ─────────────────────────────────────────────
// 2. PROFESSIONAL — two-column sidebar layout
// ─────────────────────────────────────────────
export const ProfessionalTemplate = ({ data }: TemplateProps) => (
  <div style={{ fontFamily: 'inherit', fontSize: '12px', color: '#1a1a1a', display: 'flex', height: '100%', background: '#fff' }}>
    {/* Sidebar */}
    <div style={{ width: '32%', background: '#1e3a5f', color: '#fff', padding: '28px 18px', flexShrink: 0 }}>
      <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: '#fff', lineHeight: 1.2 }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ height: '2px', background: '#60a5fa', margin: '10px 0' }} />

      <SideSection title="CONTACT">
        <div style={{ fontSize: '11px', lineHeight: '1.8', color: '#cbd5e1' }}>
          {data.personalInfo.email && <div>✉ {data.personalInfo.email}</div>}
          {data.personalInfo.phone && <div>📞 {data.personalInfo.phone}</div>}
          {data.personalInfo.location && <div>📍 {data.personalInfo.location}</div>}
          {data.personalInfo.linkedinUrl && <div>🔗 {data.personalInfo.linkedinUrl}</div>}
        </div>
      </SideSection>

      {data.skillGroups.length > 0 && (
        <SideSection title="SKILLS">
          {data.skillGroups.map((g) => (
            <div key={g.id} style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#93c5fd' }}>{g.category}</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{g.skills}</div>
            </div>
          ))}
        </SideSection>
      )}

      {data.education.length > 0 && (
        <SideSection title="EDUCATION">
          {data.education.map((e) => (
            <div key={e.id} style={{ marginBottom: '8px', fontSize: '11px', color: '#cbd5e1' }}>
              <div style={{ fontWeight: 600, color: '#fff' }}>{e.degree}</div>
              <div>{e.institute}</div>
              <div>{e.period}</div>
              {e.marks && <div style={{ color: '#93c5fd' }}>{e.marks}</div>}
            </div>
          ))}
        </SideSection>
      )}
    </div>

    {/* Main */}
    <div style={{ flex: 1, padding: '28px 24px', overflowY: 'auto' }}>
      {data.objective && (
        <MainSection title="PROFESSIONAL SUMMARY">
          <p style={{ margin: 0, color: '#334155', fontStyle: 'italic' }}>{data.objective}</p>
        </MainSection>
      )}
      {data.experience.length > 0 && (
        <MainSection title="EXPERIENCE">
          {data.experience.map((e) => (
            <div key={e.id} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>{e.company}</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{e.timePeriod}</span>
              </div>
              {e.type && <div style={{ color: '#1e3a5f', fontSize: '12px', fontWeight: 600 }}>{e.type}</div>}
              <p style={{ margin: '4px 0 0', color: '#475569' }}>{e.responsibilities}</p>
            </div>
          ))}
        </MainSection>
      )}
      {data.projects.length > 0 && (
        <MainSection title="PROJECTS">
          {data.projects.map((p) => (
            <div key={p.id} style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <p style={{ margin: '3px 0', color: '#475569' }}>{p.description}</p>
              {p.technologies && <div style={{ fontSize: '11px', color: '#1e3a5f', fontWeight: 600 }}>Stack: {p.technologies}</div>}
            </div>
          ))}
        </MainSection>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// 3. MINIMAL — ultra-clean, no color, serif
// ─────────────────────────────────────────────
export const MinimalTemplate = ({ data }: TemplateProps) => (
  <div style={{ fontFamily: 'inherit', fontSize: '13px', color: '#111', padding: '40px 48px', lineHeight: '1.6', background: '#fff', height: '100%' }}>
    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '2px', textTransform: 'uppercase' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ fontSize: '12px', color: '#444', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        {data.personalInfo.linkedinUrl && <span>{data.personalInfo.linkedinUrl}</span>}
      </div>
      <div style={{ margin: '14px auto 0', borderTop: '1px solid #111', width: '100%' }} />
    </div>

    {data.objective && (
      <MinSection title="OBJECTIVE">
        <p style={{ margin: 0, fontStyle: 'italic' }}>{data.objective}</p>
      </MinSection>
    )}
    {data.education.length > 0 && (
      <MinSection title="EDUCATION">
        {data.education.map((e) => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div>
              <span style={{ fontWeight: 700 }}>{e.degree}</span>
              {e.institute && <span>, {e.institute}</span>}
              {e.marks && <span style={{ fontSize: '12px', color: '#555' }}> — {e.marks}</span>}
            </div>
            <span style={{ fontSize: '12px', color: '#555', whiteSpace: 'nowrap' }}>{e.period}</span>
          </div>
        ))}
      </MinSection>
    )}
    {data.experience.length > 0 && (
      <MinSection title="EXPERIENCE">
        {data.experience.map((e) => (
          <div key={e.id} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>{e.company}</span>
              <span style={{ fontSize: '12px', color: '#555' }}>{e.timePeriod}</span>
            </div>
            {e.type && <div style={{ fontStyle: 'italic', fontSize: '12px' }}>{e.type}</div>}
            <p style={{ margin: '3px 0 0' }}>{e.responsibilities}</p>
          </div>
        ))}
      </MinSection>
    )}
    {data.skillGroups.length > 0 && (
      <MinSection title="SKILLS">
        {data.skillGroups.map((g) => (
          <div key={g.id} style={{ marginBottom: '3px' }}>
            <span style={{ fontWeight: 700 }}>{g.category}: </span>{g.skills}
          </div>
        ))}
      </MinSection>
    )}
    {data.projects.length > 0 && (
      <MinSection title="PROJECTS">
        {data.projects.map((p) => (
          <div key={p.id} style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 700 }}>{p.name}</span>
            {p.technologies && <span style={{ fontSize: '12px', color: '#555' }}> [{p.technologies}]</span>}
            <p style={{ margin: '2px 0 0' }}>{p.description}</p>
          </div>
        ))}
      </MinSection>
    )}
  </div>
);

// ─────────────────────────────────────────────
// 4. CORPORATE — bold dark header, classic lines
// ─────────────────────────────────────────────
export const CorporateTemplate = ({ data }: TemplateProps) => (
  <div style={{ fontFamily: 'inherit', fontSize: '13px', color: '#1a1a1a', background: '#fff', height: '100%' }}>
    {/* Header */}
    <div style={{ background: '#0f172a', color: '#fff', padding: '24px 36px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '1px' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        {data.personalInfo.linkedinUrl && <span>{data.personalInfo.linkedinUrl}</span>}
      </div>
    </div>

    <div style={{ padding: '24px 36px' }}>
      {data.objective && (
        <CorpSection title="EXECUTIVE SUMMARY">
          <p style={{ margin: 0, color: '#334155', lineHeight: '1.6' }}>{data.objective}</p>
        </CorpSection>
      )}
      {data.experience.length > 0 && (
        <CorpSection title="PROFESSIONAL EXPERIENCE">
          {data.experience.map((e) => (
            <div key={e.id} style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: '3px solid #0f172a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{e.company}</span>
                <span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>{e.timePeriod}</span>
              </div>
              {e.type && <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginTop: '2px' }}>{e.type}</div>}
              <p style={{ margin: '6px 0 0', color: '#334155' }}>{e.responsibilities}</p>
            </div>
          ))}
        </CorpSection>
      )}
      {data.skillGroups.length > 0 && (
        <CorpSection title="CORE COMPETENCIES">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {data.skillGroups.map((g) => (
              <div key={g.id} style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{g.category}: </span>
                <span style={{ color: '#475569' }}>{g.skills}</span>
              </div>
            ))}
          </div>
        </CorpSection>
      )}
      {data.projects.length > 0 && (
        <CorpSection title="KEY PROJECTS">
          {data.projects.map((p) => (
            <div key={p.id} style={{ marginBottom: '10px', paddingLeft: '12px', borderLeft: '3px solid #0f172a' }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <p style={{ margin: '3px 0', color: '#334155' }}>{p.description}</p>
              {p.technologies && <div style={{ fontSize: '11px', color: '#64748b' }}>Technologies: {p.technologies}</div>}
            </div>
          ))}
        </CorpSection>
      )}
      {data.education.length > 0 && (
        <CorpSection title="EDUCATION">
          {data.education.map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{e.degree}</div>
                <div style={{ color: '#475569' }}>{e.institute}</div>
                {e.marks && <div style={{ fontSize: '11px', color: '#64748b' }}>{e.marks}</div>}
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>{e.period}</span>
            </div>
          ))}
        </CorpSection>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// 5. SIMPLE — classic bullet-point ATS format
// ─────────────────────────────────────────────
export const SimpleTemplate = ({ data }: TemplateProps) => (
  <div style={{ fontFamily: 'inherit', fontSize: '12px', color: '#000', padding: '32px 40px', lineHeight: '1.5', background: '#fff', height: '100%' }}>
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ fontSize: '11px', color: '#333' }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedinUrl].filter(Boolean).join(' | ')}
      </div>
    </div>

    {data.objective && (
      <SimpleSection title="OBJECTIVE">
        <p style={{ margin: 0 }}>{data.objective}</p>
      </SimpleSection>
    )}
    {data.education.length > 0 && (
      <SimpleSection title="EDUCATION">
        {data.education.map((e) => (
          <div key={e.id} style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{e.degree}</strong>
              <span>{e.period}</span>
            </div>
            <div>{e.institute}{e.marks ? ` | ${e.marks}` : ''}</div>
          </div>
        ))}
      </SimpleSection>
    )}
    {data.experience.length > 0 && (
      <SimpleSection title="EXPERIENCE">
        {data.experience.map((e) => (
          <div key={e.id} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{e.company}</strong>
              <span>{e.timePeriod}</span>
            </div>
            {e.type && <div style={{ fontStyle: 'italic' }}>{e.type}</div>}
            <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>
              {e.responsibilities.split('.').filter(r => r.trim()).map((r, i) => (
                <li key={i}>{r.trim()}</li>
              ))}
            </ul>
          </div>
        ))}
      </SimpleSection>
    )}
    {data.skillGroups.length > 0 && (
      <SimpleSection title="SKILLS">
        {data.skillGroups.map((g) => (
          <div key={g.id}><strong>{g.category}:</strong> {g.skills}</div>
        ))}
      </SimpleSection>
    )}
    {data.projects.length > 0 && (
      <SimpleSection title="PROJECTS">
        {data.projects.map((p) => (
          <div key={p.id} style={{ marginBottom: '8px' }}>
            <strong>{p.name}</strong>{p.technologies ? ` (${p.technologies})` : ''}
            <div>{p.description}</div>
          </div>
        ))}
      </SimpleSection>
    )}
  </div>
);

// ─────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────
const Section = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color }}>{title}</span>
      <div style={{ flex: 1, height: '1px', background: color, opacity: 0.3 }} />
    </div>
    {children}
  </div>
);

const SideSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '18px' }}>
    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: '#93c5fd', marginBottom: '6px' }}>{title}</div>
    {children}
  </div>
);

const MainSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '18px' }}>
    <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: '#1e3a5f', borderBottom: '2px solid #1e3a5f', paddingBottom: '3px', marginBottom: '8px' }}>{title}</div>
    {children}
  </div>
);

const MinSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', marginBottom: '6px', textTransform: 'uppercase' }}>{title}</div>
    <div style={{ borderTop: '1px solid #ccc', paddingTop: '6px' }}>{children}</div>
  </div>
);

const CorpSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '18px' }}>
    <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', background: '#f8fafc', borderLeft: '4px solid #0f172a', padding: '4px 10px', marginBottom: '10px', textTransform: 'uppercase' }}>{title}</div>
    {children}
  </div>
);

const SimpleSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '6px' }}>{title}</div>
    {children}
  </div>
);

export const templateComponents: Record<string, React.ComponentType<TemplateProps>> = {
  modern: ModernTemplate,
  professional: ProfessionalTemplate,
  minimal: MinimalTemplate,
  corporate: CorporateTemplate,
  simple: SimpleTemplate,
};
