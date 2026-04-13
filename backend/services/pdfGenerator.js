const puppeteer = require("puppeteer-core");

async function getBrowser() {
  const paths = [
    "/usr/bin/google-chrome-stable","/usr/bin/google-chrome",
    "/usr/bin/chromium-browser","/usr/bin/chromium",
    "/snap/bin/chromium","/opt/google/chrome/google-chrome",
  ];
  const fs = require("fs");
  let exe = null;
  for (var i=0;i<paths.length;i++){if(fs.existsSync(paths[i])){exe=paths[i];break;}}
  if (!exe) throw new Error("Chrome not found. Run: sudo yum install -y google-chrome-stable");
  return puppeteer.launch({
    executablePath: exe, headless: "new",
    args:["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage",
          "--disable-gpu","--no-first-run","--no-zygote","--single-process"],
  });
}

function e(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

// Each template defines its own section titles and rendering style
var TITLES = {
  modern:       { objective:"PROFESSIONAL SUMMARY", experience:"WORK EXPERIENCE",      skills:"SKILLS",            projects:"PROJECTS",       education:"EDUCATION", certifications:"CERTIFICATIONS" },
  professional: { objective:"PROFESSIONAL SUMMARY", experience:"EXPERIENCE",           skills:"SKILLS",            projects:"PROJECTS",       education:"EDUCATION", certifications:"CERTIFICATIONS" },
  minimal:      { objective:"OBJECTIVE",            experience:"EXPERIENCE",           skills:"SKILLS",            projects:"PROJECTS",       education:"EDUCATION", certifications:"CERTIFICATIONS" },
  corporate:    { objective:"EXECUTIVE SUMMARY",    experience:"PROFESSIONAL EXPERIENCE", skills:"CORE COMPETENCIES", projects:"KEY PROJECTS", education:"EDUCATION", certifications:"CERTIFICATIONS" },
  simple:       { objective:"OBJECTIVE",            experience:"EXPERIENCE",           skills:"SKILLS",            projects:"PROJECTS",       education:"EDUCATION", certifications:"CERTIFICATIONS" },
  executive:    { objective:"Executive Profile",    experience:"Career History",       skills:"Core Competencies", projects:"Key Achievements",education:"Education", certifications:"Certifications" },
  tech:         { objective:"About",                experience:"Experience",           skills:"Tech Stack",        projects:"Projects",       education:"Education", certifications:"Certifications" },
  creative:     { objective:"Profile",              experience:"Experience",           skills:"Skills",            projects:"Projects",       education:"Education", certifications:"Certifications" },
  compact:      { objective:"Summary",              experience:"Experience",           skills:"Skills",            projects:"Projects",       education:"Education", certifications:"Certifications" },
  elegant:      { objective:"Profile",              experience:"Professional Experience", skills:"Expertise",      projects:"Notable Work",   education:"Education", certifications:"Certifications" },
};

// ─── MODERN ──────────────────────────────────────────────────────────────────
function templateModern(d, name, contact, sectionOrder) {
  var T = TITLES.modern;
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 6px;color:#aaa;">|</span>');
  function H(t){ return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;margin-top:14px;">'
    +'<span style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;">'+t+'</span>'
    +'<div style="flex:1;height:1px;background:#2563eb;opacity:0.3;"></div></div>'; }
  var body = '<div style="border-left:4px solid #2563eb;padding-left:14px;margin-bottom:20px;">'
    +'<h1 style="font-size:22px;font-weight:700;margin:0;color:#1e3a8a;">'+e(name)+'</h1>'
    +'<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;font-size:12px;color:#555;">'+contactHtml+'</div></div>';
  sectionOrder.forEach(function(key){
    if(key==="objective" && d.objective){ body+=H(T.objective)+'<p style="margin:0 0 4px;color:#333;">'+e(d.objective)+'</p>'; }
    if(key==="experience" && d.experience && d.experience.length){ body+=H(T.experience)+d.experience.map(function(ex){
      return '<div style="margin-bottom:11px;"><div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;color:#666;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="font-size:12px;color:#2563eb;font-style:italic;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:3px 0 0;color:#333;line-height:1.5;">'+e(ex.responsibilities)+'</p></div>';
    }).join(''); }
    if(key==="skills" && d.skillGroups && d.skillGroups.length){ body+=H(T.skills)+d.skillGroups.map(function(g){
      return '<div style="margin-bottom:3px;"><span style="font-weight:600;">'+e(g.category)+': </span><span style="color:#333;">'+e(g.skills)+'</span></div>';
    }).join('')+'<div style="margin-bottom:4px;"></div>'; }
    if(key==="projects" && d.projects && d.projects.length){ body+=H(T.projects)+d.projects.map(function(p){
      return '<div style="margin-bottom:9px;"><div style="font-weight:700;">'+e(p.name)
        +(p.githubUrl?'<span style="font-size:11px;color:#2563eb;font-weight:400;"> [GitHub]</span>':'')+'</div>'
        +'<p style="margin:2px 0;color:#333;">'+e(p.description)+'</p>'
        +(p.technologies?'<div style="font-size:11px;color:#2563eb;">Tech Stack: '+e(p.technologies)+'</div>':'')+'</div>';
    }).join(''); }
    if(key==="education" && d.education && d.education.length){ body+=H(T.education)+d.education.map(function(edu){
      return '<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;">'+e(edu.degree)+'</span>'
        +'<span style="font-size:11px;color:#666;">'+e(edu.period)+'</span></div>'
        +'<div style="color:#444;">'+e(edu.institute)+'</div>'
        +(edu.marks?'<div style="font-size:11px;color:#666;">'+e(edu.marks)+'</div>':'')+'</div>';
    }).join(''); }
    if(key==="certifications" && d.certifications && d.certifications.length){ body+=H(T.certifications)+d.certifications.map(function(c){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><div><span style="font-weight:600;">'+e(c.name)+'</span>'
        +(c.issuer?'<span style="color:#555;font-size:12px;"> — '+e(c.issuer)+'</span>':'')+'</div>'
        +(c.date?'<span style="font-size:11px;color:#666;">'+e(c.date)+'</span>':'')+'</div>';
    }).join(''); }
  });
  return '<div style="font-family:inherit;font-size:13px;color:#1a1a1a;padding:36px 40px;line-height:1.5;background:#fff;">'+body+'</div>';
}

// ─── PROFESSIONAL ─── two-column: sidebar (skills/edu) + main (exp/projects) ─
function templateProfessional(d, name, contact, sectionOrder) {
  var T = TITLES.professional;
  function SH(t){ return '<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#93c5fd;margin-bottom:6px;text-transform:uppercase;">'+t+'</div>'; }
  function MH(t){ return '<div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:3px;margin-bottom:8px;margin-top:14px;">'+t+'</div>'; }
  var sideHtml = contact.map(function(c){return '<div style="font-size:11px;color:#cbd5e1;line-height:1.8;">'+e(c)+'</div>';}).join('');
  var mainHtml = '';
  // Sidebar always has skills + education regardless of order (as per original template design)
  if(d.skillGroups && d.skillGroups.length){
    sideHtml += SH(T.skills)+d.skillGroups.map(function(g){
      return '<div style="margin-bottom:6px;"><div style="font-size:11px;font-weight:600;color:#93c5fd;">'+e(g.category)+'</div><div style="font-size:11px;color:#cbd5e1;">'+e(g.skills)+'</div></div>';
    }).join('');
  }
  if(d.education && d.education.length){
    sideHtml += '<div style="margin-top:10px;">'+SH(T.education)+d.education.map(function(edu){
      return '<div style="margin-bottom:8px;font-size:11px;color:#cbd5e1;"><div style="font-weight:600;color:#fff;">'+e(edu.degree)+'</div>'+e(edu.institute)+'<div>'+e(edu.period)+'</div>'+(edu.marks?'<div style="color:#93c5fd;">'+e(edu.marks)+'</div>':'')+'</div>';
    }).join('')+'</div>';
  }
  // Main section respects order for objective/experience/projects/certifications
  sectionOrder.forEach(function(key){
    if(key==="objective" && d.objective){ mainHtml+=MH(T.objective)+'<p style="margin:0 0 12px;color:#334155;font-style:italic;">'+e(d.objective)+'</p>'; }
    if(key==="experience" && d.experience && d.experience.length){ mainHtml+=MH(T.experience)+d.experience.map(function(ex){
      return '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;color:#64748b;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="color:#1e3a5f;font-size:12px;font-weight:600;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:4px 0 0;color:#475569;">'+e(ex.responsibilities)+'</p></div>';
    }).join(''); }
    if(key==="projects" && d.projects && d.projects.length){ mainHtml+=MH(T.projects)+d.projects.map(function(p){
      return '<div style="margin-bottom:10px;"><div style="font-weight:700;">'+e(p.name)+'</div>'
        +'<p style="margin:3px 0;color:#475569;">'+e(p.description)+'</p>'
        +(p.technologies?'<div style="font-size:11px;color:#1e3a5f;font-weight:600;">Stack: '+e(p.technologies)+'</div>':'')+'</div>';
    }).join(''); }
    if(key==="certifications" && d.certifications && d.certifications.length){ mainHtml+=MH(T.certifications)+d.certifications.map(function(c){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-weight:600;">'+e(c.name)+(c.issuer?' — '+e(c.issuer):'')+'</span><span style="font-size:11px;color:#64748b;">'+e(c.date)+'</span></div>';
    }).join(''); }
  });
  return '<div style="font-family:inherit;font-size:12px;color:#1a1a1a;display:flex;background:#fff;min-height:100%;">'
    +'<div style="width:32%;background:#1e3a5f;color:#fff;padding:28px 18px;flex-shrink:0;">'
    +'<h1 style="font-size:18px;font-weight:700;margin:0 0 4px;color:#fff;">'+e(name)+'</h1>'
    +'<div style="height:2px;background:#60a5fa;margin:10px 0;"></div>'+sideHtml+'</div>'
    +'<div style="flex:1;padding:28px 24px;">'+mainHtml+'</div></div>';
}

// ─── MINIMAL ─── clean black/white, centered header ──────────────────────────
function templateMinimal(d, name, contact, sectionOrder) {
  var T = TITLES.minimal;
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 12px;color:#ccc;">·</span>');
  function H(t){ return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;margin-top:14px;">'
    +'<span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#444;">'+t+'</span>'
    +'<div style="flex:1;height:1px;background:#ccc;"></div></div>'; }
  var body = '<div style="text-align:center;margin-bottom:20px;">'
    +'<h1 style="font-size:24px;font-weight:300;letter-spacing:3px;margin:0;color:#111;text-transform:uppercase;">'+e(name)+'</h1>'
    +'<div style="margin-top:10px;border-top:1px solid #111;width:100%;"></div>'
    +'<div style="font-size:12px;color:#444;margin-top:8px;display:flex;justify-content:center;flex-wrap:wrap;gap:12px;">'+contactHtml+'</div></div>';
  sectionOrder.forEach(function(key){
    if(key==="objective" && d.objective){ body+=H(T.objective)+'<p style="margin:0 0 4px;font-style:italic;">'+e(d.objective)+'</p>'; }
    if(key==="experience" && d.experience && d.experience.length){ body+=H(T.experience)+d.experience.map(function(ex){
      return '<div style="margin-bottom:11px;"><div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;color:#666;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="font-size:12px;color:#333;font-style:italic;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:3px 0 0;color:#333;">'+e(ex.responsibilities)+'</p></div>';
    }).join(''); }
    if(key==="skills" && d.skillGroups && d.skillGroups.length){ body+=H(T.skills)+d.skillGroups.map(function(g){
      return '<div style="margin-bottom:3px;"><span style="font-weight:600;">'+e(g.category)+': </span><span>'+e(g.skills)+'</span></div>';
    }).join(''); }
    if(key==="projects" && d.projects && d.projects.length){ body+=H(T.projects)+d.projects.map(function(p){
      return '<div style="margin-bottom:9px;"><div style="font-weight:700;">'+e(p.name)+'</div>'
        +'<p style="margin:2px 0;color:#333;">'+e(p.description)+'</p>'
        +(p.technologies?'<div style="font-size:11px;color:#555;">['+e(p.technologies)+']</div>':'')+'</div>';
    }).join(''); }
    if(key==="education" && d.education && d.education.length){ body+=H(T.education)+d.education.map(function(edu){
      return '<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;">'+e(edu.degree)+'</span>'
        +'<span style="font-size:11px;color:#666;">'+e(edu.period)+'</span></div>'
        +'<div>'+e(edu.institute)+'</div>'+(edu.marks?'<div style="font-size:11px;color:#666;">'+e(edu.marks)+'</div>':'')+'</div>';
    }).join(''); }
    if(key==="certifications" && d.certifications && d.certifications.length){ body+=H(T.certifications)+d.certifications.map(function(c){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-weight:600;">'+e(c.name)+(c.issuer?' — '+e(c.issuer):'')+'</span><span style="font-size:11px;color:#666;">'+e(c.date)+'</span></div>';
    }).join(''); }
  });
  return '<div style="font-family:inherit;font-size:13px;color:#111;padding:40px 48px;line-height:1.6;background:#fff;">'+body+'</div>';
}

// ─── CORPORATE ─── dark #0f172a header, slate left-border sections ────────────
function templateCorporate(d, name, contact, sectionOrder) {
  var T = TITLES.corporate;
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 16px;color:#94a3b8;"></span>');
  function H(t){ return '<div style="font-size:12px;font-weight:700;letter-spacing:1.5px;background:#f8fafc;border-left:4px solid #0f172a;padding:4px 10px;margin-bottom:10px;margin-top:14px;text-transform:uppercase;">'+t+'</div>'; }
  var body = '';
  sectionOrder.forEach(function(key){
    if(key==="objective" && d.objective){ body+=H(T.objective)+'<p style="margin:0 0 12px;color:#334155;line-height:1.6;">'+e(d.objective)+'</p>'; }
    if(key==="experience" && d.experience && d.experience.length){ body+=H(T.experience)+d.experience.map(function(ex){
      return '<div style="margin-bottom:14px;padding-left:12px;border-left:3px solid #0f172a;">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;">'
        +'<span style="font-weight:700;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;background:#e2e8f0;padding:2px 8px;border-radius:4px;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="font-size:12px;font-weight:600;color:#475569;margin-top:2px;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:6px 0 0;color:#334155;">'+e(ex.responsibilities)+'</p></div>';
    }).join(''); }
    if(key==="skills" && d.skillGroups && d.skillGroups.length){ body+=H(T.skills)+d.skillGroups.map(function(g){
      return '<div style="background:#f1f5f9;padding:4px 10px;border-radius:4px;font-size:12px;display:inline-block;margin:3px;">'
        +'<span style="font-weight:700;color:#0f172a;">'+e(g.category)+': </span><span style="color:#475569;">'+e(g.skills)+'</span></div>';
    }).join('')+'<div style="margin-bottom:8px;"></div>'; }
    if(key==="projects" && d.projects && d.projects.length){ body+=H(T.projects)+d.projects.map(function(p){
      return '<div style="margin-bottom:10px;padding-left:12px;border-left:3px solid #0f172a;">'
        +'<div style="font-weight:700;">'+e(p.name)+'</div>'
        +'<p style="margin:3px 0;color:#334155;">'+e(p.description)+'</p>'
        +(p.technologies?'<div style="font-size:11px;color:#64748b;">Technologies: '+e(p.technologies)+'</div>':'')+'</div>';
    }).join(''); }
    if(key==="education" && d.education && d.education.length){ body+=H(T.education)+d.education.map(function(edu){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">'
        +'<div><span style="font-weight:700;">'+e(edu.degree)+'</span><div style="color:#475569;">'+e(edu.institute)+'</div></div>'
        +'<div style="text-align:right;"><div style="font-size:11px;color:#64748b;">'+e(edu.period)+'</div>'+(edu.marks?'<div style="font-size:11px;color:#64748b;">'+e(edu.marks)+'</div>':'')+'</div></div>';
    }).join(''); }
    if(key==="certifications" && d.certifications && d.certifications.length){ body+=H(T.certifications)+d.certifications.map(function(c){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-weight:600;">'+e(c.name)+(c.issuer?' — '+e(c.issuer):'')+'</span><span style="font-size:11px;color:#64748b;">'+e(c.date)+'</span></div>';
    }).join(''); }
  });
  return '<div style="font-family:inherit;font-size:13px;color:#1a1a1a;background:#fff;">'
    +'<div style="background:#0f172a;color:#fff;padding:24px 36px;">'
    +'<h1 style="font-size:22px;font-weight:700;margin:0;letter-spacing:1px;">'+e(name)+'</h1>'
    +'<div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:#94a3b8;margin-top:6px;">'+contactHtml+'</div></div>'
    +'<div style="padding:20px 36px;">'+body+'</div></div>';
}

// ─── SIMPLE ─── clean black/white, centered, uppercase headings ───────────────
function templateSimple(d, name, contact, sectionOrder) {
  var T = TITLES.simple;
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 8px;color:#999;">|</span>');
  function H(t){ return '<div style="font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;margin-top:14px;">'+t+'</div>'; }
  var body = '<div style="text-align:center;margin-bottom:16px;">'
    +'<h1 style="font-size:22px;font-weight:700;margin:0;text-transform:uppercase;letter-spacing:1px;">'+e(name)+'</h1>'
    +'<div style="font-size:11px;color:#333;margin-top:5px;">'+contactHtml+'</div></div>';
  sectionOrder.forEach(function(key){
    if(key==="objective" && d.objective){ body+=H(T.objective)+'<p style="margin:0 0 4px;">'+e(d.objective)+'</p>'; }
    if(key==="experience" && d.experience && d.experience.length){ body+=H(T.experience)+d.experience.map(function(ex){
      return '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;color:#555;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="font-size:12px;font-style:italic;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:3px 0 0;">'+e(ex.responsibilities)+'</p></div>';
    }).join(''); }
    if(key==="skills" && d.skillGroups && d.skillGroups.length){ body+=H(T.skills)+d.skillGroups.map(function(g){
      return '<div style="margin-bottom:3px;"><span style="font-weight:600;">'+e(g.category)+': </span>'+e(g.skills)+'</div>';
    }).join(''); }
    if(key==="projects" && d.projects && d.projects.length){ body+=H(T.projects)+d.projects.map(function(p){
      return '<div style="margin-bottom:8px;"><div style="font-weight:700;">'+e(p.name)+'</div>'
        +'<p style="margin:2px 0;">'+e(p.description)+'</p>'
        +(p.technologies?'<div style="font-size:11px;color:#555;">'+e(p.technologies)+'</div>':'')+'</div>';
    }).join(''); }
    if(key==="education" && d.education && d.education.length){ body+=H(T.education)+d.education.map(function(edu){
      return '<div style="margin-bottom:6px;"><div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;">'+e(edu.degree)+'</span>'
        +'<span style="font-size:11px;color:#555;">'+e(edu.period)+'</span></div>'
        +'<div>'+e(edu.institute)+'</div>'+(edu.marks?'<div style="font-size:11px;color:#555;">'+e(edu.marks)+'</div>':'')+'</div>';
    }).join(''); }
    if(key==="certifications" && d.certifications && d.certifications.length){ body+=H(T.certifications)+d.certifications.map(function(c){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-weight:600;">'+e(c.name)+(c.issuer?' — '+e(c.issuer):'')+'</span><span style="font-size:11px;color:#555;">'+e(c.date)+'</span></div>';
    }).join(''); }
  });
  return '<div style="font-family:inherit;font-size:12px;color:#000;padding:32px 40px;line-height:1.5;background:#fff;">'+body+'</div>';
}

// ─── EXECUTIVE ─── teal gradient header, teal section headings ───────────────
function templateExecutive(d, name, contact, sectionOrder) {
  var T = TITLES.executive;
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 10px;color:#99f6e4;">|</span>');
  function H(t){ return '<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#0f766e;text-transform:uppercase;border-bottom:2px solid #0f766e;padding-bottom:3px;margin-bottom:10px;margin-top:18px;">'+t+'</div>'; }
  var body = '';
  sectionOrder.forEach(function(key){
    if(key==="objective" && d.objective){ body+=H(T.objective)+'<p style="margin:0 0 4px;color:#1e293b;font-style:italic;font-size:13px;">'+e(d.objective)+'</p>'; }
    if(key==="experience" && d.experience && d.experience.length){ body+=H(T.experience)+d.experience.map(function(ex){
      return '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;font-size:14px;color:#0f172a;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:12px;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="color:#0f766e;font-weight:600;font-size:12px;margin-top:2px;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:5px 0 0;color:#475569;line-height:1.6;">'+e(ex.responsibilities)+'</p></div>';
    }).join(''); }
    if(key==="skills" && d.skillGroups && d.skillGroups.length){ body+=H(T.skills)+d.skillGroups.map(function(g){
      return '<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:6px;padding:6px 10px;margin-bottom:6px;">'
        +'<div style="font-weight:700;font-size:11px;color:#0f766e;">'+e(g.category)+'</div>'
        +'<div style="font-size:11px;color:#334155;margin-top:2px;">'+e(g.skills)+'</div></div>';
    }).join(''); }
    if(key==="projects" && d.projects && d.projects.length){ body+=H(T.projects)+d.projects.map(function(p){
      return '<div style="margin-bottom:10px;padding-left:12px;border-left:3px solid #0f766e;">'
        +'<div style="font-weight:700;color:#0f172a;">'+e(p.name)+'</div>'
        +'<p style="margin:3px 0;color:#475569;font-size:12px;">'+e(p.description)+'</p>'
        +(p.technologies?'<div style="font-size:11px;color:#0f766e;">Stack: '+e(p.technologies)+'</div>':'')+'</div>';
    }).join(''); }
    if(key==="education" && d.education && d.education.length){ body+=H(T.education)+d.education.map(function(edu){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">'
        +'<div><div style="font-weight:700;color:#0f172a;">'+e(edu.degree)+'</div><div style="color:#64748b;font-size:12px;">'+e(edu.institute)+'</div></div>'
        +'<div style="text-align:right;"><div style="font-size:11px;color:#64748b;">'+e(edu.period)+'</div>'+(edu.marks?'<div style="font-size:11px;color:#0f766e;">'+e(edu.marks)+'</div>':'')+'</div></div>';
    }).join(''); }
    if(key==="certifications" && d.certifications && d.certifications.length){ body+=H(T.certifications)+d.certifications.map(function(c){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-weight:600;">'+e(c.name)+(c.issuer?' — '+e(c.issuer):'')+'</span><span style="font-size:11px;color:#64748b;">'+e(c.date)+'</span></div>';
    }).join(''); }
  });
  return '<div style="font-family:inherit;font-size:13px;color:#1a1a1a;background:#fff;">'
    +'<div style="background:linear-gradient(135deg,#134e4a 0%,#0f766e 100%);padding:32px 40px;color:#fff;">'
    +'<h1 style="font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">'+e(name)+'</h1>'
    +'<div style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:#99f6e4;margin-top:8px;">'+contactHtml+'</div></div>'
    +'<div style="padding:8px 40px 36px;">'+body+'</div></div>';
}

// ─── TECH ─── dark bg, indigo, sidebar, monospace ────────────────────────────
function templateTech(d, name, contact, sectionOrder) {
  var T = TITLES.tech;
  function H(t){ return '<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6366f1;text-transform:uppercase;margin:16px 0 8px;display:flex;align-items:center;gap:6px;"><span style="color:#6366f1;">▸</span>'+t+'</div>'; }
  var sideContact = contact.map(function(c){return '<div style="font-size:11px;color:#64748b;line-height:1.8;">'+e(c)+'</div>';}).join('');
  var sideSkills = '';
  if(d.skillGroups && d.skillGroups.length){
    sideSkills = H(T.skills)+d.skillGroups.map(function(g){
      var tags = g.skills.split(',').map(function(s){
        return '<span style="background:#1e293b;border:1px solid #334155;color:#a5b4fc;padding:2px 8px;border-radius:4px;font-size:10px;font-family:monospace;display:inline-block;margin:2px 2px 2px 0;">'+e(s.trim())+'</span>';
      }).join('');
      return '<div style="margin-bottom:8px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;">'+e(g.category)+'</div>'+tags+'</div>';
    }).join('');
  }
  var mainHtml = '';
  sectionOrder.forEach(function(key){
    if(key==="objective" && d.objective){ mainHtml+=H(T.objective)+'<p style="color:#e2e8f0;font-size:12px;line-height:1.7;background:#1e293b;padding:10px 14px;border-radius:6px;border-left:3px solid #6366f1;margin-bottom:10px;">'+e(d.objective)+'</p>'; }
    if(key==="skills"){ /* handled in sidebar */ }
    if(key==="experience" && d.experience && d.experience.length){ mainHtml+=H(T.experience)+d.experience.map(function(ex){
      return '<div style="margin-bottom:14px;padding-left:10px;border-left:2px solid #334155;">'
        +'<div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;color:#f1f5f9;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;color:#6366f1;font-family:monospace;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="color:#a5b4fc;font-size:12px;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">'+e(ex.responsibilities)+'</p></div>';
    }).join(''); }
    if(key==="projects" && d.projects && d.projects.length){ mainHtml+=H(T.projects)+d.projects.map(function(p){
      return '<div style="margin-bottom:12px;background:#1e293b;border-radius:6px;padding:10px 12px;border:1px solid #334155;">'
        +'<div style="font-weight:700;color:#f1f5f9;margin-bottom:4px;">⚙ '+e(p.name)+'</div>'
        +'<p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">'+e(p.description)+'</p>'
        +(p.technologies?'<div style="font-size:11px;color:#6366f1;font-family:monospace;">['+e(p.technologies)+']</div>':'')+'</div>';
    }).join(''); }
    if(key==="education" && d.education && d.education.length){ mainHtml+=H(T.education)+d.education.map(function(edu){
      return '<div style="margin-bottom:6px;"><div style="font-weight:700;color:#f1f5f9;">'+e(edu.degree)+'</div>'
        +'<div style="color:#94a3b8;font-size:12px;">'+e(edu.institute)+(edu.period?' · '+e(edu.period):'')+(edu.marks?' · '+e(edu.marks):'')+'</div></div>';
    }).join(''); }
    if(key==="certifications" && d.certifications && d.certifications.length){ mainHtml+=H(T.certifications)+d.certifications.map(function(c){
      return '<div style="font-size:12px;color:#a5b4fc;margin-bottom:4px;"><span style="font-weight:600;color:#f1f5f9;">'+e(c.name)+'</span>'+(c.issuer?' — '+e(c.issuer):'')+(c.date?' ('+e(c.date)+')':'')+'</div>';
    }).join(''); }
  });
  return '<div style="font-family:Courier New,monospace;font-size:12px;color:#e2e8f0;background:#0f172a;display:flex;min-height:100%;">'
    +'<div style="width:38%;background:#020617;padding:28px 20px;flex-shrink:0;">'
    +'<h1 style="font-size:18px;font-weight:700;margin:0 0 4px;color:#f1f5f9;letter-spacing:1px;">'+e(name)+'</h1>'
    +'<div style="height:2px;background:linear-gradient(90deg,#6366f1,transparent);margin:8px 0;"></div>'
    +sideContact+'<div style="height:16px;"></div>'+sideSkills+'</div>'
    +'<div style="flex:1;padding:28px 24px;border-left:1px solid #1e293b;">'+mainHtml+'</div></div>';
}

// ─── CREATIVE ─── dark navy header, amber/red gradient bullets ────────────────
function templateCreative(d, name, contact, sectionOrder) {
  var T = TITLES.creative;
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 8px;color:#9ca3af;">·</span>');
  function H(t){ return '<div style="display:flex;align-items:center;gap:8px;margin:16px 0 8px;">'
    +'<div style="width:4px;height:18px;background:linear-gradient(180deg,#f59e0b,#ef4444);border-radius:2px;"></div>'
    +'<span style="font-size:11px;font-weight:700;letter-spacing:2px;color:#1a1a1a;text-transform:uppercase;">'+t+'</span></div>'; }
  var body = '';
  sectionOrder.forEach(function(key){
    if(key==="objective" && d.objective){ body+=H(T.objective)+'<p style="margin:0 0 4px;color:#374151;line-height:1.7;padding:12px;background:#fffbeb;border-radius:8px;border-left:4px solid #f59e0b;">'+e(d.objective)+'</p>'; }
    if(key==="experience" && d.experience && d.experience.length){ body+=H(T.experience)+d.experience.map(function(ex,i){
      var dot = i%2===0?'#f59e0b':'#ef4444';
      return '<div style="margin-bottom:12px;display:flex;gap:10px;">'
        +'<div><div style="width:12px;height:12px;border-radius:50%;background:'+dot+';margin-top:3px;flex-shrink:0;"></div></div>'
        +'<div style="flex:1;"><div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;color:#9ca3af;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="font-size:12px;color:#f59e0b;font-weight:600;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:4px 0 0;color:#4b5563;font-size:12px;">'+e(ex.responsibilities)+'</p></div></div>';
    }).join(''); }
    if(key==="skills" && d.skillGroups && d.skillGroups.length){ body+=H(T.skills)+d.skillGroups.map(function(g){
      var tags = g.skills.split(',').map(function(s,i){
        var bg=i%3===0?'#fef3c7':i%3===1?'#fee2e2':'#f3f4f6';
        var col=i%3===0?'#92400e':i%3===1?'#991b1b':'#374151';
        return '<span style="padding:2px 10px;border-radius:12px;font-size:11px;background:'+bg+';color:'+col+';font-weight:500;display:inline-block;margin:2px;">'+e(s.trim())+'</span>';
      }).join('');
      return '<div style="margin-bottom:6px;"><div style="font-weight:600;font-size:12px;color:#1a1a1a;margin-bottom:4px;">'+e(g.category)+'</div>'+tags+'</div>';
    }).join(''); }
    if(key==="projects" && d.projects && d.projects.length){ body+=H(T.projects)+d.projects.map(function(p,i){
      var bg=i%2===0?'#fffbeb':'#fff1f2';
      var bd=i%2===0?'#fde68a':'#fecdd3';
      return '<div style="background:'+bg+';border:1px solid '+bd+';border-radius:8px;padding:10px;margin-bottom:8px;">'
        +'<div style="font-weight:700;">'+e(p.name)+'</div>'
        +'<p style="margin:0 0 4px;font-size:11px;color:#4b5563;">'+e(p.description)+'</p>'
        +(p.technologies?'<div style="font-size:10px;color:#9ca3af;">'+e(p.technologies)+'</div>':'')+'</div>';
    }).join(''); }
    if(key==="education" && d.education && d.education.length){ body+=H(T.education)+d.education.map(function(edu){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:6px;padding:8px 12px;background:#f9fafb;border-radius:6px;">'
        +'<div><div style="font-weight:700;">'+e(edu.degree)+'</div><div style="font-size:12px;color:#6b7280;">'+e(edu.institute)+'</div></div>'
        +'<div style="text-align:right;font-size:11px;color:#9ca3af;"><div>'+e(edu.period)+'</div>'+(edu.marks?'<div style="color:#f59e0b;">'+e(edu.marks)+'</div>':'')+'</div></div>';
    }).join(''); }
    if(key==="certifications" && d.certifications && d.certifications.length){ body+=H(T.certifications)+d.certifications.map(function(c){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-weight:600;">'+e(c.name)+(c.issuer?' — '+e(c.issuer):'')+'</span><span style="font-size:11px;color:#9ca3af;">'+e(c.date)+'</span></div>';
    }).join(''); }
  });
  return '<div style="font-family:inherit;font-size:13px;color:#1a1a1a;background:#fff;">'
    +'<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px 40px;">'
    +'<h1 style="font-size:26px;font-weight:700;margin:0 0 6px;color:#fff;">'+e(name)+'</h1>'
    +'<div style="display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:#94a3b8;">'+contactHtml+'</div></div>'
    +'<div style="padding:16px 40px 36px;">'+body+'</div></div>';
}

// ─── COMPACT ─── tight spacing, slate section heading bars ───────────────────
function templateCompact(d, name, contact, sectionOrder) {
  var T = TITLES.compact;
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 6px;color:#9ca3af;">|</span>');
  function H(t){ return '<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#fff;background:#334155;padding:3px 8px;margin-bottom:6px;margin-top:12px;text-transform:uppercase;">'+t+'</div>'; }
  var body = '';
  sectionOrder.forEach(function(key){
    if(key==="objective" && d.objective){ body+=H(T.objective)+'<p style="margin:0 0 4px;color:#374151;line-height:1.5;font-size:11px;">'+e(d.objective)+'</p>'; }
    if(key==="experience" && d.experience && d.experience.length){ body+=H(T.experience)+d.experience.map(function(ex){
      return '<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;">'
        +'<strong>'+e(ex.company)+'</strong><span style="color:#6b7280;font-size:11px;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="font-style:italic;color:#334155;font-size:11px;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:2px 0 0;color:#4b5563;line-height:1.4;font-size:11px;">'+e(ex.responsibilities)+'</p></div>';
    }).join(''); }
    if(key==="skills" && d.skillGroups && d.skillGroups.length){ body+=H(T.skills)+d.skillGroups.map(function(g){
      return '<div style="margin-bottom:2px;font-size:11px;"><span style="font-weight:600;">'+e(g.category)+': </span><span style="color:#4b5563;">'+e(g.skills)+'</span></div>';
    }).join(''); }
    if(key==="projects" && d.projects && d.projects.length){ body+=H(T.projects)+d.projects.map(function(p){
      return '<div style="margin-bottom:6px;"><strong>'+e(p.name)+'</strong>'
        +(p.technologies?'<span style="font-size:11px;color:#6b7280;"> ['+e(p.technologies)+']</span>':'')
        +'<p style="margin:1px 0 0;color:#4b5563;font-size:11px;line-height:1.4;">'+e(p.description)+'</p></div>';
    }).join(''); }
    if(key==="education" && d.education && d.education.length){ body+=H(T.education)+d.education.map(function(edu){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'
        +'<div><div style="font-weight:700;font-size:11px;">'+e(edu.degree)+'</div><div style="font-size:10px;color:#6b7280;">'+e(edu.institute)+'</div></div>'
        +'<span style="font-size:10px;color:#6b7280;white-space:nowrap;">'+e(edu.period)+'</span></div>';
    }).join(''); }
    if(key==="certifications" && d.certifications && d.certifications.length){ body+=H(T.certifications)+d.certifications.map(function(c){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:11px;"><span style="font-weight:600;">'+e(c.name)+(c.issuer?' — '+e(c.issuer):'')+'</span><span style="color:#6b7280;">'+e(c.date)+'</span></div>';
    }).join(''); }
  });
  return '<div style="font-family:inherit;font-size:12px;color:#1a1a1a;background:#fff;">'
    +'<div style="border-bottom:3px solid #334155;padding:16px 32px 10px;">'
    +'<h1 style="font-size:20px;font-weight:700;margin:0 0 4px;color:#0f172a;">'+e(name)+'</h1>'
    +'<div style="font-size:11px;color:#4b5563;display:flex;flex-wrap:wrap;gap:10px;">'+contactHtml+'</div></div>'
    +'<div style="padding:0 32px 24px;">'+body+'</div></div>';
}

// ─── ELEGANT ─── Georgia serif, warm brown ornamental ────────────────────────
function templateElegant(d, name, contact, sectionOrder) {
  var T = TITLES.elegant;
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 10px;color:#d1c4a8;">◆</span>');
  function H(t){ return '<div style="position:relative;text-align:center;margin:20px 0 10px;">'
    +'<div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#d1c4a8;"></div>'
    +'<span style="position:relative;background:#fff;padding:0 12px;font-size:11px;font-weight:700;letter-spacing:3px;color:#92765a;text-transform:uppercase;">'+t+'</span></div>'; }
  var body = '';
  sectionOrder.forEach(function(key){
    if(key==="objective" && d.objective){ body+=H(T.objective)+'<p style="margin:0 0 12px;color:#44403c;line-height:1.8;text-align:center;font-style:italic;font-size:13px;">'+e(d.objective)+'</p>'; }
    if(key==="experience" && d.experience && d.experience.length){ body+=H(T.experience)+d.experience.map(function(ex){
      return '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px dotted #d1c4a8;padding-bottom:4px;margin-bottom:6px;">'
        +'<span style="font-weight:700;font-size:13px;color:#1c1917;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;color:#92765a;font-style:italic;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="color:#92765a;font-size:12px;font-style:italic;margin-bottom:4px;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:0;color:#44403c;line-height:1.7;font-size:12px;">'+e(ex.responsibilities)+'</p></div>';
    }).join(''); }
    if(key==="skills" && d.skillGroups && d.skillGroups.length){ body+=H(T.skills)+d.skillGroups.map(function(g){
      return '<div style="display:flex;margin-bottom:4px;"><span style="font-weight:700;color:#92765a;min-width:120px;">'+e(g.category)+'</span>'
        +'<span style="color:#44403c;border-left:1px solid #d1c4a8;padding-left:10px;">'+e(g.skills)+'</span></div>';
    }).join(''); }
    if(key==="projects" && d.projects && d.projects.length){ body+=H(T.projects)+d.projects.map(function(p){
      return '<div style="margin-bottom:10px;"><div style="font-weight:700;color:#1c1917;">'+e(p.name)
        +(p.technologies?'<span style="font-weight:400;color:#92765a;font-style:italic;"> — '+e(p.technologies)+'</span>':'')+'</div>'
        +'<p style="margin:0;color:#44403c;line-height:1.6;">'+e(p.description)+'</p></div>';
    }).join(''); }
    if(key==="education" && d.education && d.education.length){ body+=H(T.education)+d.education.map(function(edu){
      return '<div style="margin-bottom:8px;"><div style="font-weight:700;color:#1c1917;">'+e(edu.degree)+'</div>'
        +'<div style="font-size:12px;color:#92765a;">'+e(edu.institute)+(edu.period?' · '+e(edu.period):'')+'</div>'
        +(edu.marks?'<div style="font-size:11px;color:#a8a29e;">'+e(edu.marks)+'</div>':'')+'</div>';
    }).join(''); }
    if(key==="certifications" && d.certifications && d.certifications.length){ body+=H(T.certifications)+d.certifications.map(function(c){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-weight:600;color:#1c1917;">'+e(c.name)+(c.issuer?'<span style="font-weight:400;color:#92765a;font-style:italic;"> — '+e(c.issuer)+'</span>':'')+'</span><span style="font-size:11px;color:#92765a;font-style:italic;">'+e(c.date)+'</span></div>';
    }).join(''); }
  });
  return '<div style="font-family:Georgia,serif;font-size:13px;color:#1c1917;background:#fff;padding:40px 48px;">'
    +'<div style="text-align:center;margin-bottom:20px;">'
    +'<h1 style="font-size:28px;font-weight:400;margin:0 0 8px;letter-spacing:4px;text-transform:uppercase;color:#1c1917;">'+e(name)+'</h1>'
    +'<div style="display:flex;justify-content:center;flex-wrap:wrap;gap:16px;font-size:11px;color:#92765a;margin-bottom:10px;">'+contactHtml+'</div>'
    +'<div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:4px;">'
    +'<div style="height:1px;width:60px;background:#d1c4a8;"></div>'
    +'<div style="width:6px;height:6px;border-radius:50%;background:#92765a;"></div>'
    +'<div style="height:1px;width:60px;background:#d1c4a8;"></div></div></div>'
    +body+'</div>';
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function generateHTML(templateId, resumeData, fontFamily, sectionOrder) {
  fontFamily = fontFamily || "Arial, sans-serif";
  var d = resumeData;
  var name     = (d.personalInfo && d.personalInfo.fullName)    || "Your Name";
  var email    = (d.personalInfo && d.personalInfo.email)       || "";
  var phone    = (d.personalInfo && d.personalInfo.phone)       || "";
  var loc      = (d.personalInfo && d.personalInfo.location)    || "";
  var linkedin = (d.personalInfo && d.personalInfo.linkedinUrl) || "";
  var contact  = [email, phone, loc, linkedin].filter(Boolean);
  var DEF = ["objective","experience","skills","projects","education","certifications"];
  var raw = (sectionOrder && sectionOrder.length > 0) ? sectionOrder : DEF;
  var sections = raw.filter(function(k){ return k !== "personalInfo"; });

  var body;
  if      (templateId==="modern")       body = templateModern(d, name, contact, sections);
  else if (templateId==="professional") body = templateProfessional(d, name, contact, sections);
  else if (templateId==="minimal")      body = templateMinimal(d, name, contact, sections);
  else if (templateId==="corporate")    body = templateCorporate(d, name, contact, sections);
  else if (templateId==="simple")       body = templateSimple(d, name, contact, sections);
  else if (templateId==="executive")    body = templateExecutive(d, name, contact, sections);
  else if (templateId==="tech")         body = templateTech(d, name, contact, sections);
  else if (templateId==="creative")     body = templateCreative(d, name, contact, sections);
  else if (templateId==="compact")      body = templateCompact(d, name, contact, sections);
  else if (templateId==="elegant")      body = templateElegant(d, name, contact, sections);
  else                                  body = templateModern(d, name, contact, sections);

  return '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    +'<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;font-family:'+fontFamily+';}</style>'
    +'</head><body>'+body+'</body></html>';
}

async function generatePDF(templateId, resumeData, fontFamily, sectionOrder) {
  var html = generateHTML(templateId, resumeData, fontFamily, sectionOrder);
  var browser = await getBrowser();
  try {
    var page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    var pdf = await page.pdf({ format:"A4", printBackground:true, margin:{top:"0",right:"0",bottom:"0",left:"0"} });
    return pdf;
  } finally { await browser.close(); }
}

module.exports = { generatePDF };
