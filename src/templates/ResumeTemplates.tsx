import { ResumeData } from '@/store/resumeStore';

type SectionKey = 'personalInfo' | 'objective' | 'skills' | 'projects' | 'experience' | 'education';

const DEFAULT_ORDER: SectionKey[] = ['personalInfo', 'objective', 'skills', 'projects', 'experience', 'education'];

interface TemplateProps {
  data: ResumeData;
  sectionOrder?: SectionKey[];
}

// ─────────────────────────────────────────────
// 1. MODERN — single column, blue left-border accents
// ─────────────────────────────────────────────
export const ModernTemplate = ({ data, sectionOrder = DEFAULT_ORDER }: TemplateProps) => (
  <div style={{ fontFamily: 'inherit', fontSize: '13px', color: '#1a1a1a', padding: '36px 40px', lineHeight: '1.5', background: '#fff', height: '100%' }}>
    <div style={{ borderLeft: '4px solid #2563eb', paddingLeft: '14px', marginBottom: '20px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#1e3a8a' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px', fontSize: '12px', color: '#555' }}>
        {data.personalInfo.email && <span>✉ {data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>📞 {data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>📍 {data.personalInfo.location}</span>}
        {data.personalInfo.linkedinUrl && (
          <span>
            🔗 <a href={data.personalInfo.linkedinUrl.startsWith('http') ? data.personalInfo.linkedinUrl : `https://${data.personalInfo.linkedinUrl}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
              {data.personalInfo.linkedinUrl.replace(/^https?:\/\//, '').replace('www.linkedin.com/in/', 'LinkedIn/').replace('linkedin.com/in/', 'LinkedIn/')}
            </a>
          </span>
        )}
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
export const ProfessionalTemplate = ({ data, sectionOrder = DEFAULT_ORDER }: TemplateProps) => (
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
export const MinimalTemplate = ({ data, sectionOrder = DEFAULT_ORDER }: TemplateProps) => (
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

    {sectionOrder.filter(k => k !== 'personalInfo').map(key => renderMinimalSection(key, data))}
  </div>
);

// ─────────────────────────────────────────────
// 4. CORPORATE — bold dark header, classic lines
// ─────────────────────────────────────────────
export const CorporateTemplate = ({ data, sectionOrder = DEFAULT_ORDER }: TemplateProps) => (
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
      {sectionOrder.filter(k => k !== 'personalInfo').map(key => renderCorpSection(key, data))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// 5. SIMPLE — classic bullet-point ATS format
// ─────────────────────────────────────────────
export const SimpleTemplate = ({ data, sectionOrder = DEFAULT_ORDER }: TemplateProps) => (
  <div style={{ fontFamily: 'inherit', fontSize: '12px', color: '#000', padding: '32px 40px', lineHeight: '1.5', background: '#fff', height: '100%' }}>
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ fontSize: '11px', color: '#333' }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedinUrl].filter(Boolean).join(' | ')}
      </div>
    </div>

    {sectionOrder.filter(k => k !== 'personalInfo').map(key => renderSimpleSection(key, data))}
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


// ─────────────────────────────────────────────
// Section renderers — used by all templates
// ─────────────────────────────────────────────

function renderMinimalSection(key: SectionKey, data: ResumeData) {
  switch (key) {
    case 'objective': return data.objective ? (
      <MinSection key={key} title="OBJECTIVE"><p style={{ margin: 0, fontStyle: 'italic' }}>{data.objective}</p></MinSection>
    ) : null;
    case 'education': return data.education.length > 0 ? (
      <MinSection key={key} title="EDUCATION">
        {data.education.map((e) => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div><span style={{ fontWeight: 700 }}>{e.degree}</span>{e.institute && <span>, {e.institute}</span>}{e.marks && <span style={{ fontSize: '12px', color: '#555' }}> — {e.marks}</span>}</div>
            <span style={{ fontSize: '12px', color: '#555', whiteSpace: 'nowrap' }}>{e.period}</span>
          </div>
        ))}
      </MinSection>
    ) : null;
    case 'experience': return data.experience.length > 0 ? (
      <MinSection key={key} title="EXPERIENCE">
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
    ) : null;
    case 'skills': return data.skillGroups.length > 0 ? (
      <MinSection key={key} title="SKILLS">
        {data.skillGroups.map((g) => (<div key={g.id} style={{ marginBottom: '3px' }}><span style={{ fontWeight: 700 }}>{g.category}: </span>{g.skills}</div>))}
      </MinSection>
    ) : null;
    case 'projects': return data.projects.length > 0 ? (
      <MinSection key={key} title="PROJECTS">
        {data.projects.map((p) => (
          <div key={p.id} style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 700 }}>{p.name}</span>{p.technologies && <span style={{ fontSize: '12px', color: '#555' }}> [{p.technologies}]</span>}
            <p style={{ margin: '2px 0 0' }}>{p.description}</p>
          </div>
        ))}
      </MinSection>
    ) : null;
    case 'certifications':
      return data.certifications && data.certifications.length > 0 ? (
        <Section key={key} title="CERTIFICATIONS" color="#2563eb">
          {data.certifications.map((c) => (
            <div key={c.id} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <span style={{ fontWeight: 600 }}>
                  {c.credentialUrl ? <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#1e3a8a', textDecoration: 'none' }}>{c.name}</a> : c.name}
                </span>
                {c.issuer && <span style={{ color: '#555', fontSize: '12px' }}> — {c.issuer}</span>}
              </div>
              {c.date && <span style={{ fontSize: '11px', color: '#666' }}>{c.date}</span>}
            </div>
          ))}
        </Section>
      ) : null;
    default: return null;
  }
}

function renderCorpSection(key: SectionKey, data: ResumeData) {
  switch (key) {
    case 'objective': return data.objective ? (
      <CorpSection key={key} title="EXECUTIVE SUMMARY"><p style={{ margin: 0, color: '#334155', lineHeight: '1.6' }}>{data.objective}</p></CorpSection>
    ) : null;
    case 'experience': return data.experience.length > 0 ? (
      <CorpSection key={key} title="PROFESSIONAL EXPERIENCE">
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
    ) : null;
    case 'skills': return data.skillGroups.length > 0 ? (
      <CorpSection key={key} title="CORE COMPETENCIES">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {data.skillGroups.map((g) => (
            <div key={g.id} style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{g.category}: </span>
              <span style={{ color: '#475569' }}>{g.skills}</span>
            </div>
          ))}
        </div>
      </CorpSection>
    ) : null;
    case 'projects': return data.projects.length > 0 ? (
      <CorpSection key={key} title="KEY PROJECTS">
        {data.projects.map((p) => (
          <div key={p.id} style={{ marginBottom: '10px', paddingLeft: '12px', borderLeft: '3px solid #0f172a' }}>
            <div style={{ fontWeight: 700 }}>{p.name}</div>
            <p style={{ margin: '3px 0', color: '#334155' }}>{p.description}</p>
            {p.technologies && <div style={{ fontSize: '11px', color: '#64748b' }}>Technologies: {p.technologies}</div>}
          </div>
        ))}
      </CorpSection>
    ) : null;
    case 'education': return data.education.length > 0 ? (
      <CorpSection key={key} title="EDUCATION">
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
    ) : null;
    default: return null;
  }
}

function renderSimpleSection(key: SectionKey, data: ResumeData) {
  switch (key) {
    case 'objective': return data.objective ? (
      <SimpleSection key={key} title="OBJECTIVE"><p style={{ margin: 0 }}>{data.objective}</p></SimpleSection>
    ) : null;
    case 'education': return data.education.length > 0 ? (
      <SimpleSection key={key} title="EDUCATION">
        {data.education.map((e) => (
          <div key={e.id} style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{e.degree}</strong><span>{e.period}</span></div>
            <div>{e.institute}{e.marks ? ` | ${e.marks}` : ''}</div>
          </div>
        ))}
      </SimpleSection>
    ) : null;
    case 'experience': return data.experience.length > 0 ? (
      <SimpleSection key={key} title="EXPERIENCE">
        {data.experience.map((e) => (
          <div key={e.id} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{e.company}</strong><span>{e.timePeriod}</span></div>
            {e.type && <div style={{ fontStyle: 'italic' }}>{e.type}</div>}
            <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>
              {e.responsibilities.split('.').filter(r => r.trim()).map((r, i) => (<li key={i}>{r.trim()}</li>))}
            </ul>
          </div>
        ))}
      </SimpleSection>
    ) : null;
    case 'skills': return data.skillGroups.length > 0 ? (
      <SimpleSection key={key} title="SKILLS">
        {data.skillGroups.map((g) => (<div key={g.id}><strong>{g.category}:</strong> {g.skills}</div>))}
      </SimpleSection>
    ) : null;
    case 'projects': return data.projects.length > 0 ? (
      <SimpleSection key={key} title="PROJECTS">
        {data.projects.map((p) => (
          <div key={p.id} style={{ marginBottom: '8px' }}>
            <strong>{p.name}</strong>{p.technologies ? ` (${p.technologies})` : ''}
            <div>{p.description}</div>
          </div>
        ))}
      </SimpleSection>
    ) : null;
    default: return null;
  }
}


function renderModernSection(key: SectionKey, data: ResumeData) {
  switch (key) {
    case 'objective':
      return data.objective ? (
        <Section key={key} title="PROFESSIONAL SUMMARY" color="#2563eb">
          <p style={{ margin: 0 }}>{data.objective}</p>
        </Section>
      ) : null;
    case 'experience':
      return data.experience.length > 0 ? (
        <Section key={key} title="WORK EXPERIENCE" color="#2563eb">
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
      ) : null;
    case 'skills':
      return data.skillGroups.length > 0 ? (
        <Section key={key} title="SKILLS" color="#2563eb">
          {data.skillGroups.map((g) => (
            <div key={g.id} style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: 600 }}>{g.category}: </span>
              <span style={{ color: '#333' }}>{g.skills}</span>
            </div>
          ))}
        </Section>
      ) : null;
    case 'projects':
      return data.projects.length > 0 ? (
        <Section key={key} title="PROJECTS" color="#2563eb">
          {data.projects.map((p) => (
            <div key={p.id} style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {p.name}
                {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none', fontWeight: 400 }}>GitHub ↗</a>}
              </div>
              <p style={{ margin: '3px 0', color: '#333' }}>{p.description}</p>
              {p.technologies && <div style={{ fontSize: '11px', color: '#2563eb' }}>Tech Stack: {p.technologies}</div>}
            </div>
          ))}
        </Section>
      ) : null;
    case 'education':
      return data.education.length > 0 ? (
        <Section key={key} title="EDUCATION" color="#2563eb">
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
      ) : null;
    default: return null;
  }
}

export const templateComponents: Record<string, React.ComponentType<TemplateProps>> = {
  modern: ModernTemplate,
  professional: ProfessionalTemplate,
  minimal: MinimalTemplate,
  corporate: CorporateTemplate,
  simple: SimpleTemplate,
};

// ─────────────────────────────────────────────
// 6. EXECUTIVE — dark teal header, two-tone bold
// ─────────────────────────────────────────────
function renderExecutiveSection(key: SectionKey, data: ResumeData) {
  const H = ({ t }: { t: string }) => (
    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#0f766e', textTransform: 'uppercase', borderBottom: '2px solid #0f766e', paddingBottom: '3px', marginBottom: '10px', marginTop: '18px' }}>{t}</div>
  );
  switch (key) {
    case 'objective': return data.objective ? (
      <div key={key}><H t="Executive Profile" /><p style={{ margin: 0, color: '#1e293b', lineHeight: '1.7', fontStyle: 'italic', fontSize: '13px' }}>{data.objective}</p></div>
    ) : null;
    case 'experience': return data.experience.length > 0 ? (
      <div key={key}><H t="Career History" />
        {data.experience.map(e => (
          <div key={e.id} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{e.company}</span>
              <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>{e.timePeriod}</span>
            </div>
            {e.type && <div style={{ color: '#0f766e', fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>{e.type}</div>}
            <p style={{ margin: '5px 0 0', color: '#475569', lineHeight: '1.6' }}>{e.responsibilities}</p>
          </div>
        ))}
      </div>
    ) : null;
    case 'skills': return data.skillGroups.length > 0 ? (
      <div key={key}><H t="Core Competencies" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {data.skillGroups.map(g => (
            <div key={g.id} style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '6px', padding: '6px 10px' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#0f766e' }}>{g.category}</div>
              <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>{g.skills}</div>
            </div>
          ))}
        </div>
      </div>
    ) : null;
    case 'projects': return data.projects.length > 0 ? (
      <div key={key}><H t="Key Achievements" />
        {data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: '10px', paddingLeft: '12px', borderLeft: '3px solid #0f766e' }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
            <p style={{ margin: '3px 0', color: '#475569', fontSize: '12px' }}>{p.description}</p>
            {p.technologies && <div style={{ fontSize: '11px', color: '#0f766e' }}>Stack: {p.technologies}</div>}
          </div>
        ))}
      </div>
    ) : null;
    case 'education': return data.education.length > 0 ? (
      <div key={key}><H t="Education" />
        {data.education.map(e => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div><div style={{ fontWeight: 700, color: '#0f172a' }}>{e.degree}</div><div style={{ color: '#64748b', fontSize: '12px' }}>{e.institute}</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '11px', color: '#64748b' }}>{e.period}</div>{e.marks && <div style={{ fontSize: '11px', color: '#0f766e' }}>{e.marks}</div>}</div>
          </div>
        ))}
      </div>
    ) : null;
    default: return null;
  }
}

export const ExecutiveTemplate = ({ data, sectionOrder = DEFAULT_ORDER }: TemplateProps) => (
  <div style={{ fontFamily: 'inherit', fontSize: '13px', color: '#1a1a1a', background: '#fff', minHeight: '100%' }}>
    <div style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)', padding: '32px 40px', color: '#fff' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.5px' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: '#99f6e4', marginTop: '8px' }}>
        {data.personalInfo.email && <span>✉ {data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>📞 {data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>📍 {data.personalInfo.location}</span>}
        {data.personalInfo.linkedinUrl && <span>🔗 {data.personalInfo.linkedinUrl}</span>}
      </div>
    </div>
    <div style={{ padding: '24px 40px' }}>
      {sectionOrder.filter(k => k !== 'personalInfo').map(key => renderExecutiveSection(key, data))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// 7. TECH — dark sidebar, code-inspired, developer-focused
// ─────────────────────────────────────────────
function renderTechSection(key: SectionKey, data: ResumeData) {
  const H = ({ t }: { t: string }) => (
    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: '#6366f1', textTransform: 'uppercase', margin: '16px 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: '#6366f1' }}>▸</span> {t}
    </div>
  );
  switch (key) {
    case 'objective': return data.objective ? (
      <div key={key}><H t="About" /><p style={{ margin: 0, color: '#e2e8f0', fontSize: '12px', lineHeight: '1.7', background: '#1e293b', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #6366f1' }}>{data.objective}</p></div>
    ) : null;
    case 'skills': return data.skillGroups.length > 0 ? (
      <div key={key}><H t="Tech Stack" />
        {data.skillGroups.map(g => (
          <div key={g.id} style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>{g.category}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {g.skills.split(',').map((s, i) => (
                <span key={i} style={{ background: '#1e293b', border: '1px solid #334155', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>{s.trim()}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : null;
    case 'experience': return data.experience.length > 0 ? (
      <div key={key}><H t="Experience" />
        {data.experience.map(e => (
          <div key={e.id} style={{ marginBottom: '14px', paddingLeft: '10px', borderLeft: '2px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{e.company}</span>
              <span style={{ fontSize: '11px', color: '#6366f1', fontFamily: 'monospace' }}>{e.timePeriod}</span>
            </div>
            {e.type && <div style={{ color: '#a5b4fc', fontSize: '12px' }}>{e.type}</div>}
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>{e.responsibilities}</p>
          </div>
        ))}
      </div>
    ) : null;
    case 'projects': return data.projects.length > 0 ? (
      <div key={key}><H t="Projects" />
        {data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: '12px', background: '#1e293b', borderRadius: '6px', padding: '10px 12px', border: '1px solid #334155' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>⚙ {p.name}</div>
            <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px' }}>{p.description}</p>
            {p.technologies && <div style={{ fontSize: '11px', color: '#6366f1', fontFamily: 'monospace' }}>[{p.technologies}]</div>}
          </div>
        ))}
      </div>
    ) : null;
    case 'education': return data.education.length > 0 ? (
      <div key={key}><H t="Education" />
        {data.education.map(e => (
          <div key={e.id} style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{e.degree}</div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>{e.institute} {e.period && `· ${e.period}`} {e.marks && `· ${e.marks}`}</div>
          </div>
        ))}
      </div>
    ) : null;
    default: return null;
  }
}

export const TechTemplate = ({ data, sectionOrder = DEFAULT_ORDER }: TemplateProps) => (
  <div style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#e2e8f0', background: '#0f172a', minHeight: '100%', display: 'flex' }}>
    {/* Left panel */}
    <div style={{ width: '38%', background: '#020617', padding: '28px 20px', flexShrink: 0 }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: '#f1f5f9', letterSpacing: '1px' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #6366f1, transparent)', margin: '8px 0' }} />
        <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.8' }}>
          {data.personalInfo.email && <div>✉ {data.personalInfo.email}</div>}
          {data.personalInfo.phone && <div>📞 {data.personalInfo.phone}</div>}
          {data.personalInfo.location && <div>📍 {data.personalInfo.location}</div>}
          {data.personalInfo.linkedinUrl && <div>🔗 {data.personalInfo.linkedinUrl}</div>}
        </div>
      </div>
      {/* Skills in left panel for tech */}
      {data.skillGroups.length > 0 && renderTechSection('skills', data)}
      {data.education.length > 0 && renderTechSection('education', data)}
    </div>
    {/* Right panel */}
    <div style={{ flex: 1, padding: '28px 24px', borderLeft: '1px solid #1e293b' }}>
      {sectionOrder.filter(k => !['personalInfo', 'skills', 'education'].includes(k)).map(key => renderTechSection(key, data))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// 8. CREATIVE — bold color accents, modern design
// ─────────────────────────────────────────────
function renderCreativeSection(key: SectionKey, data: ResumeData) {
  const H = ({ t }: { t: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '18px 0 10px' }}>
      <div style={{ width: '4px', height: '18px', background: 'linear-gradient(180deg, #f59e0b, #ef4444)', borderRadius: '2px' }} />
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#1a1a1a', textTransform: 'uppercase' }}>{t}</span>
    </div>
  );
  switch (key) {
    case 'objective': return data.objective ? (
      <div key={key}><H t="Profile" /><p style={{ margin: 0, color: '#374151', lineHeight: '1.7', padding: '12px', background: '#fffbeb', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>{data.objective}</p></div>
    ) : null;
    case 'experience': return data.experience.length > 0 ? (
      <div key={key}><H t="Experience" />
        {data.experience.map((e, i) => (
          <div key={e.id} style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
            <div style={{ width: '32px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: i % 2 === 0 ? '#f59e0b' : '#ef4444', marginTop: '3px' }} />
              {i < data.experience.length - 1 && <div style={{ width: '2px', flex: 1, background: '#e5e7eb', marginTop: '4px' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>{e.company}</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>{e.timePeriod}</span>
              </div>
              {e.type && <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>{e.type}</div>}
              <p style={{ margin: '4px 0 0', color: '#4b5563', fontSize: '12px', lineHeight: '1.6' }}>{e.responsibilities}</p>
            </div>
          </div>
        ))}
      </div>
    ) : null;
    case 'skills': return data.skillGroups.length > 0 ? (
      <div key={key}><H t="Skills" />
        {data.skillGroups.map(g => (
          <div key={g.id} style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', color: '#1a1a1a', marginBottom: '4px' }}>{g.category}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {g.skills.split(',').map((s, i) => (
                <span key={i} style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', background: i % 3 === 0 ? '#fef3c7' : i % 3 === 1 ? '#fee2e2' : '#f3f4f6', color: i % 3 === 0 ? '#92400e' : i % 3 === 1 ? '#991b1b' : '#374151', fontWeight: 500 }}>{s.trim()}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : null;
    case 'projects': return data.projects.length > 0 ? (
      <div key={key}><H t="Projects" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {data.projects.map((p, i) => (
            <div key={p.id} style={{ background: i % 2 === 0 ? '#fffbeb' : '#fff1f2', border: `1px solid ${i % 2 === 0 ? '#fde68a' : '#fecdd3'}`, borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>{p.name}</div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#4b5563' }}>{p.description}</p>
              {p.technologies && <div style={{ fontSize: '10px', color: '#9ca3af' }}>{p.technologies}</div>}
            </div>
          ))}
        </div>
      </div>
    ) : null;
    case 'education': return data.education.length > 0 ? (
      <div key={key}><H t="Education" />
        {data.education.map(e => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', padding: '8px 12px', background: '#f9fafb', borderRadius: '6px' }}>
            <div><div style={{ fontWeight: 700 }}>{e.degree}</div><div style={{ fontSize: '12px', color: '#6b7280' }}>{e.institute}</div></div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#9ca3af' }}><div>{e.period}</div>{e.marks && <div style={{ color: '#f59e0b' }}>{e.marks}</div>}</div>
          </div>
        ))}
      </div>
    ) : null;
    default: return null;
  }
}

export const CreativeTemplate = ({ data, sectionOrder = DEFAULT_ORDER }: TemplateProps) => (
  <div style={{ fontFamily: 'inherit', fontSize: '13px', color: '#1a1a1a', background: '#fff', minHeight: '100%', padding: '0' }}>
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '32px 40px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)' }} />
      <div style={{ position: 'absolute', bottom: '-30px', right: '80px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)' }} />
      <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px', color: '#fff', position: 'relative' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: '#94a3b8', position: 'relative' }}>
        {data.personalInfo.email && <span>✉ {data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>📞 {data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>📍 {data.personalInfo.location}</span>}
        {data.personalInfo.linkedinUrl && <span>🔗 {data.personalInfo.linkedinUrl}</span>}
      </div>
    </div>
    <div style={{ padding: '20px 40px 32px' }}>
      {sectionOrder.filter(k => k !== 'personalInfo').map(key => renderCreativeSection(key, data))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// 9. COMPACT — dense, info-rich, fits more on 1 page
// ─────────────────────────────────────────────
function renderCompactSection(key: SectionKey, data: ResumeData) {
  const H = ({ t }: { t: string }) => (
    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: '#fff', background: '#334155', padding: '3px 8px', marginBottom: '6px', marginTop: '12px', textTransform: 'uppercase' }}>{t}</div>
  );
  switch (key) {
    case 'objective': return data.objective ? (
      <div key={key}><H t="Summary" /><p style={{ margin: '0 0 6px', fontSize: '11px', color: '#374151', lineHeight: '1.5' }}>{data.objective}</p></div>
    ) : null;
    case 'experience': return data.experience.length > 0 ? (
      <div key={key}><H t="Experience" />
        {data.experience.map(e => (
          <div key={e.id} style={{ marginBottom: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{e.company}</strong><span style={{ color: '#6b7280' }}>{e.timePeriod}</span>
            </div>
            {e.type && <div style={{ color: '#334155', fontStyle: 'italic' }}>{e.type}</div>}
            <p style={{ margin: '2px 0 0', color: '#4b5563', lineHeight: '1.4' }}>{e.responsibilities}</p>
          </div>
        ))}
      </div>
    ) : null;
    case 'skills': return data.skillGroups.length > 0 ? (
      <div key={key}><H t="Skills" />
        <div style={{ fontSize: '11px' }}>
          {data.skillGroups.map(g => (
            <div key={g.id} style={{ marginBottom: '3px' }}><strong>{g.category}:</strong> {g.skills}</div>
          ))}
        </div>
      </div>
    ) : null;
    case 'projects': return data.projects.length > 0 ? (
      <div key={key}><H t="Projects" />
        {data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: '6px', fontSize: '11px' }}>
            <strong>{p.name}</strong>{p.technologies && <span style={{ color: '#6b7280' }}> · {p.technologies}</span>}
            <p style={{ margin: '1px 0 0', color: '#4b5563', lineHeight: '1.4' }}>{p.description}</p>
          </div>
        ))}
      </div>
    ) : null;
    case 'education': return data.education.length > 0 ? (
      <div key={key}><H t="Education" />
        {data.education.map(e => (
          <div key={e.id} style={{ fontSize: '11px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <div><strong>{e.degree}</strong> · {e.institute}{e.marks ? ` · ${e.marks}` : ''}</div>
            <span style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>{e.period}</span>
          </div>
        ))}
      </div>
    ) : null;
    default: return null;
  }
}

export const CompactTemplate = ({ data, sectionOrder = DEFAULT_ORDER }: TemplateProps) => (
  <div style={{ fontFamily: 'inherit', fontSize: '12px', color: '#1a1a1a', background: '#fff', padding: '24px 32px', minHeight: '100%' }}>
    <div style={{ borderBottom: '3px solid #334155', paddingBottom: '10px', marginBottom: '4px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ fontSize: '11px', color: '#4b5563', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        {data.personalInfo.linkedinUrl && <span>{data.personalInfo.linkedinUrl}</span>}
      </div>
    </div>
    {sectionOrder.filter(k => k !== 'personalInfo').map(key => renderCompactSection(key, data))}
  </div>
);

// ─────────────────────────────────────────────
// 10. ELEGANT — serif, refined, understated luxury
// ─────────────────────────────────────────────
function renderElegantSection(key: SectionKey, data: ResumeData) {
  const H = ({ t }: { t: string }) => (
    <div style={{ textAlign: 'center', margin: '20px 0 12px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#d1c4a8' }} />
      <span style={{ position: 'relative', background: '#fff', padding: '0 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#92765a', textTransform: 'uppercase' }}>{t}</span>
    </div>
  );
  switch (key) {
    case 'objective': return data.objective ? (
      <div key={key}><H t="Profile" /><p style={{ margin: '0 0 12px', color: '#44403c', lineHeight: '1.8', textAlign: 'center', fontStyle: 'italic', fontSize: '13px' }}>{data.objective}</p></div>
    ) : null;
    case 'experience': return data.experience.length > 0 ? (
      <div key={key}><H t="Professional Experience" />
        {data.experience.map(e => (
          <div key={e.id} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px dotted #d1c4a8', paddingBottom: '4px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#1c1917' }}>{e.company}</span>
              <span style={{ fontSize: '11px', color: '#92765a', fontStyle: 'italic' }}>{e.timePeriod}</span>
            </div>
            {e.type && <div style={{ color: '#92765a', fontSize: '12px', fontStyle: 'italic', marginBottom: '4px' }}>{e.type}</div>}
            <p style={{ margin: 0, color: '#44403c', lineHeight: '1.7', fontSize: '12px' }}>{e.responsibilities}</p>
          </div>
        ))}
      </div>
    ) : null;
    case 'skills': return data.skillGroups.length > 0 ? (
      <div key={key}><H t="Expertise" />
        {data.skillGroups.map(g => (
          <div key={g.id} style={{ display: 'flex', marginBottom: '6px', fontSize: '12px' }}>
            <span style={{ fontWeight: 700, color: '#92765a', minWidth: '120px' }}>{g.category}</span>
            <span style={{ color: '#44403c', borderLeft: '1px solid #d1c4a8', paddingLeft: '10px' }}>{g.skills}</span>
          </div>
        ))}
      </div>
    ) : null;
    case 'projects': return data.projects.length > 0 ? (
      <div key={key}><H t="Notable Work" />
        {data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: '10px', fontSize: '12px' }}>
            <div style={{ fontWeight: 700, color: '#1c1917', marginBottom: '3px' }}>{p.name}{p.technologies && <span style={{ fontWeight: 400, color: '#92765a', fontStyle: 'italic' }}> — {p.technologies}</span>}</div>
            <p style={{ margin: 0, color: '#44403c', lineHeight: '1.6' }}>{p.description}</p>
          </div>
        ))}
      </div>
    ) : null;
    case 'education': return data.education.length > 0 ? (
      <div key={key}><H t="Education" />
        {data.education.map(e => (
          <div key={e.id} style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontWeight: 700, color: '#1c1917' }}>{e.degree}</div>
            <div style={{ fontSize: '12px', color: '#92765a' }}>{e.institute} {e.period && `· ${e.period}`}</div>
            {e.marks && <div style={{ fontSize: '11px', color: '#a8a29e' }}>{e.marks}</div>}
          </div>
        ))}
      </div>
    ) : null;
    default: return null;
  }
}

export const ElegantTemplate = ({ data, sectionOrder = DEFAULT_ORDER }: TemplateProps) => (
  <div style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#1c1917', background: '#fff', padding: '40px 48px', minHeight: '100%' }}>
    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 400, margin: '0 0 8px', letterSpacing: '4px', textTransform: 'uppercase', color: '#1c1917' }}>{data.personalInfo.fullName || 'Your Name'}</h1>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '11px', color: '#92765a' }}>
        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        {data.personalInfo.linkedinUrl && <span>{data.personalInfo.linkedinUrl}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '12px 0 0' }}>
        <div style={{ height: '1px', width: '60px', background: '#d1c4a8' }} />
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#92765a' }} />
        <div style={{ height: '1px', width: '60px', background: '#d1c4a8' }} />
      </div>
    </div>
    {sectionOrder.filter(k => k !== 'personalInfo').map(key => renderElegantSection(key, data))}
  </div>
);

// Update templateComponents to include new templates
Object.assign(templateComponents, {
  executive: ExecutiveTemplate,
  tech: TechTemplate,
  creative: CreativeTemplate,
  compact: CompactTemplate,
  elegant: ElegantTemplate,
});
