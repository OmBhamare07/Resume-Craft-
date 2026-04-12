const puppeteer = require("puppeteer-core");

async function getBrowser() {
  const paths = [
    "/usr/bin/google-chrome-stable", "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser", "/usr/bin/chromium",
    "/snap/bin/chromium", "/opt/google/chrome/google-chrome",
  ];
  const fs = require("fs");
  let exe = null;
  for (const p of paths) { if (fs.existsSync(p)) { exe = p; break; } }
  if (!exe) throw new Error("Chrome not found. Run: sudo yum install -y google-chrome-stable");
  return puppeteer.launch({
    executablePath: exe, headless: "new",
    args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage",
           "--disable-gpu","--no-first-run","--no-zygote","--single-process"],
  });
}

function e(s) {
  return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ─── MODERN ─── Blue left border, blue section lines ─────────────────────────
function templateModern(d, name, contact, sections, font) {
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 6px;color:#aaa;">|</span>');
  function secHead(t) {
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
      +'<span style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;">'+t+'</span>'
      +'<div style="flex:1;height:1px;background:#2563eb;opacity:0.3;"></div></div>';
  }
  return '<div style="font-family:'+font+';font-size:13px;color:#1a1a1a;padding:36px 40px;line-height:1.5;background:#fff;">'
    +'<div style="border-left:4px solid #2563eb;padding-left:14px;margin-bottom:20px;">'
    +'<h1 style="font-size:22px;font-weight:700;margin:0;color:#1e3a8a;">'+e(name)+'</h1>'
    +'<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;font-size:12px;color:#555;">'+contactHtml+'</div></div>'
    + renderSections(d, sections, secHead, "#2563eb")+'</div>';
}

// ─── PROFESSIONAL ─── Dark navy sidebar + right content ──────────────────────
function templateProfessional(d, name, contact, sections, font) {
  function sideHead(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#93c5fd;margin-bottom:6px;">'+t+'</div>';
  }
  function mainHead(t) {
    return '<div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:3px;margin-bottom:8px;">'+t+'</div>';
  }
  var sideContact = contact.map(function(c){return '<div style="font-size:11px;color:#cbd5e1;line-height:1.8;">'+e(c)+'</div>';}).join('');
  var sideSkills = '';
  if(d.skillGroups && d.skillGroups.length){
    sideSkills = sideHead('SKILLS') + d.skillGroups.map(function(g){
      return '<div style="margin-bottom:6px;"><div style="font-size:11px;font-weight:600;color:#93c5fd;">'+e(g.category)+'</div>'
        +'<div style="font-size:11px;color:#cbd5e1;">'+e(g.skills)+'</div></div>';
    }).join('');
  }
  var sideEdu = '';
  if(d.education && d.education.length){
    sideEdu = sideHead('EDUCATION') + d.education.map(function(e2){
      return '<div style="margin-bottom:8px;font-size:11px;color:#cbd5e1;">'
        +'<div style="font-weight:600;color:#fff;">'+e(e2.degree)+'</div>'
        +e(e2.institute)+'<div>'+e(e2.period)+'</div>'
        +(e2.marks?'<div style="color:#93c5fd;">'+e(e2.marks)+'</div>':'')+'</div>';
    }).join('');
  }
  // Main content - experience, projects, certs
  var mainContent = '';
  if(d.objective) mainContent += mainHead('PROFESSIONAL SUMMARY')+'<p style="margin:0 0 14px;color:#334155;font-style:italic;">'+e(d.objective)+'</p>';
  if(d.experience && d.experience.length){
    mainContent += mainHead('WORK EXPERIENCE') + d.experience.map(function(ex){
      return '<div style="margin-bottom:12px;">'
        +'<div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;color:#64748b;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="color:#1e3a5f;font-size:12px;font-weight:600;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:4px 0 0;color:#475569;">'+e(ex.responsibilities)+'</p></div>';
    }).join('');
  }
  if(d.projects && d.projects.length){
    mainContent += mainHead('PROJECTS') + d.projects.map(function(p){
      return '<div style="margin-bottom:10px;">'
        +'<div style="font-weight:700;">'+e(p.name)+'</div>'
        +'<p style="margin:3px 0;color:#475569;">'+e(p.description)+'</p>'
        +(p.technologies?'<div style="font-size:11px;color:#1e3a5f;font-weight:600;">Stack: '+e(p.technologies)+'</div>':'')
        +'</div>';
    }).join('');
  }
  if(d.certifications && d.certifications.length){
    mainContent += mainHead('CERTIFICATIONS') + d.certifications.map(function(c){
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;">'
        +'<span style="font-weight:600;">'+e(c.name)+(c.issuer?' <span style="font-weight:400;color:#64748b;">— '+e(c.issuer)+'</span>':'')+'</span>'
        +'<span style="font-size:11px;color:#64748b;">'+e(c.date)+'</span></div>';
    }).join('');
  }
  return '<div style="font-family:'+font+';font-size:12px;color:#1a1a1a;display:flex;background:#fff;min-height:100%;">'
    +'<div style="width:32%;background:#1e3a5f;color:#fff;padding:28px 18px;flex-shrink:0;">'
    +'<h1 style="font-size:18px;font-weight:700;margin:0 0 4px;color:#fff;">'+e(name)+'</h1>'
    +'<div style="height:2px;background:#60a5fa;margin:10px 0;"></div>'
    + sideContact + '<div style="height:16px;"></div>' + sideSkills
    + '<div style="height:16px;"></div>' + sideEdu + '</div>'
    +'<div style="flex:1;padding:28px 24px;">'+mainContent+'</div></div>';
}

// ─── MINIMAL ─── Black/white, thin top border, centered header ────────────────
function templateMinimal(d, name, contact, sections, font) {
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 12px;color:#ccc;">·</span>');
  function secHead(t) {
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
      +'<span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#444;">'+t+'</span>'
      +'<div style="flex:1;height:1px;background:#ccc;"></div></div>';
  }
  return '<div style="font-family:'+font+';font-size:13px;color:#111;padding:40px 48px;line-height:1.6;background:#fff;">'
    +'<div style="text-align:center;margin-bottom:20px;">'
    +'<h1 style="font-size:24px;font-weight:300;letter-spacing:3px;margin:0;color:#111;text-transform:uppercase;">'+e(name)+'</h1>'
    +'<div style="margin-top:10px;border-top:1px solid #111;width:100%;"></div>'
    +'<div style="font-size:12px;color:#444;margin-top:8px;display:flex;justify-content:center;flex-wrap:wrap;gap:12px;">'+contactHtml+'</div></div>'
    + renderSections(d, sections, secHead, "#333") + '</div>';
}

// ─── CORPORATE ─── Dark navy header full-width, slate left borders ────────────
function templateCorporate(d, name, contact, sections, font) {
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 16px;color:#94a3b8;">  </span>');
  function secHead(t) {
    return '<div style="font-size:12px;font-weight:700;letter-spacing:1.5px;background:#f8fafc;border-left:4px solid #0f172a;padding:4px 10px;margin-bottom:10px;text-transform:uppercase;">'+t+'</div>';
  }
  return '<div style="font-family:'+font+';font-size:13px;color:#1a1a1a;background:#fff;">'
    +'<div style="background:#0f172a;color:#fff;padding:24px 36px;">'
    +'<h1 style="font-size:22px;font-weight:700;margin:0;letter-spacing:1px;">'+e(name)+'</h1>'
    +'<div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:#94a3b8;margin-top:6px;">'+contactHtml+'</div></div>'
    +'<div style="padding:20px 36px;">'+renderSections(d, sections, secHead, "#0f172a")+'</div></div>';
}

// ─── SIMPLE ─── Clean black/white, no color, upper case section headings ──────
function templateSimple(d, name, contact, sections, font) {
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 8px;color:#999;">|</span>');
  function secHead(t) {
    return '<div style="font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;">'+t+'</div>';
  }
  return '<div style="font-family:'+font+';font-size:12px;color:#000;padding:32px 40px;line-height:1.5;background:#fff;">'
    +'<div style="text-align:center;margin-bottom:16px;">'
    +'<h1 style="font-size:22px;font-weight:700;margin:0;text-transform:uppercase;letter-spacing:1px;">'+e(name)+'</h1>'
    +'<div style="font-size:11px;color:#333;margin-top:5px;">'+contactHtml+'</div></div>'
    + renderSections(d, sections, secHead, "#000") + '</div>';
}

// ─── EXECUTIVE ─── Teal gradient header, teal section headings ───────────────
function templateExecutive(d, name, contact, sections, font) {
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 10px;color:#99f6e4;">|</span>');
  function secHead(t) {
    return '<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#0f766e;text-transform:uppercase;border-bottom:2px solid #0f766e;padding-bottom:3px;margin-bottom:10px;margin-top:18px;">'+t+'</div>';
  }
  return '<div style="font-family:'+font+';font-size:13px;color:#1a1a1a;background:#fff;">'
    +'<div style="background:linear-gradient(135deg,#134e4a 0%,#0f766e 100%);padding:32px 40px;color:#fff;">'
    +'<h1 style="font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">'+e(name)+'</h1>'
    +'<div style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:#99f6e4;margin-top:8px;">'+contactHtml+'</div></div>'
    +'<div style="padding:8px 40px 36px;">'+renderSections(d, sections, secHead, "#0f766e")+'</div></div>';
}

// ─── TECH ─── Dark background, indigo accents, monospace, sidebar ─────────────
function templateTech(d, name, contact, sections, font) {
  function sideHead(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6366f1;margin-bottom:6px;text-transform:uppercase;">▸ '+t+'</div>';
  }
  var sideContact = contact.map(function(c){return '<div style="font-size:11px;color:#64748b;line-height:1.8;">'+e(c)+'</div>';}).join('');
  var sideSkills = '';
  if(d.skillGroups && d.skillGroups.length){
    sideSkills = sideHead('SKILLS') + d.skillGroups.map(function(g){
      var tags = g.skills.split(',').map(function(s){
        return '<span style="background:#1e293b;border:1px solid #334155;color:#a5b4fc;padding:2px 8px;border-radius:4px;font-size:11px;font-family:monospace;display:inline-block;margin:2px;">'+e(s.trim())+'</span>';
      }).join('');
      return '<div style="margin-bottom:8px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;">'+e(g.category)+'</div>'+tags+'</div>';
    }).join('');
  }
  var mainContent = '';
  if(d.objective) mainContent += sideHead('ABOUT')+'<p style="color:#e2e8f0;font-size:12px;line-height:1.7;background:#1e293b;padding:10px 14px;border-radius:6px;border-left:3px solid #6366f1;margin-bottom:14px;">'+e(d.objective)+'</p>';
  if(d.experience && d.experience.length){
    mainContent += sideHead('EXPERIENCE') + d.experience.map(function(ex){
      return '<div style="margin-bottom:14px;padding-left:10px;border-left:2px solid #334155;">'
        +'<div style="display:flex;justify-content:space-between;">'
        +'<span style="font-weight:700;color:#f1f5f9;">'+e(ex.company)+'</span>'
        +'<span style="font-size:11px;color:#6366f1;font-family:monospace;">'+e(ex.timePeriod)+'</span></div>'
        +(ex.type?'<div style="color:#a5b4fc;font-size:12px;">'+e(ex.type)+'</div>':'')
        +'<p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">'+e(ex.responsibilities)+'</p></div>';
    }).join('');
  }
  if(d.projects && d.projects.length){
    mainContent += sideHead('PROJECTS') + d.projects.map(function(p){
      return '<div style="margin-bottom:12px;background:#1e293b;border-radius:6px;padding:10px 12px;border:1px solid #334155;">'
        +'<div style="font-weight:700;color:#f1f5f9;margin-bottom:4px;">⚙ '+e(p.name)+'</div>'
        +'<p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">'+e(p.description)+'</p>'
        +(p.technologies?'<div style="font-size:11px;color:#6366f1;font-family:monospace;">['+e(p.technologies)+']</div>':'')
        +'</div>';
    }).join('');
  }
  if(d.education && d.education.length){
    mainContent += sideHead('EDUCATION') + d.education.map(function(edu){
      return '<div style="font-weight:700;color:#f1f5f9;">'+e(edu.degree)+'</div>'
        +'<div style="color:#94a3b8;font-size:12px;">'+e(edu.institute)+(edu.period?' · '+e(edu.period):'')+(edu.marks?' · '+e(edu.marks):'')+'</div>';
    }).join('<div style="margin-bottom:8px;"></div>');
  }
  return '<div style="font-family:Courier New,monospace;font-size:12px;color:#e2e8f0;background:#0f172a;display:flex;min-height:100%;">'
    +'<div style="width:38%;background:#020617;padding:28px 20px;flex-shrink:0;">'
    +'<h1 style="font-size:18px;font-weight:700;margin:0 0 4px;color:#f1f5f9;letter-spacing:1px;">'+e(name)+'</h1>'
    +'<div style="height:2px;background:linear-gradient(90deg,#6366f1,transparent);margin:8px 0;"></div>'
    + sideContact + '<div style="height:16px;"></div>' + sideSkills + '</div>'
    +'<div style="flex:1;padding:28px 24px;border-left:1px solid #1e293b;">'+mainContent+'</div></div>';
}

// ─── CREATIVE ─── Amber/red, timeline dots, warm background accents ──────────
function templateCreative(d, name, contact, sections, font) {
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 8px;color:#9ca3af;">·</span>');
  function secHead(t) {
    return '<div style="display:flex;align-items:center;gap:8px;margin:16px 0 8px;">'
      +'<div style="width:4px;height:18px;background:linear-gradient(180deg,#f59e0b,#ef4444);border-radius:2px;"></div>'
      +'<span style="font-size:11px;font-weight:700;letter-spacing:2px;color:#1a1a1a;text-transform:uppercase;">'+t+'</span></div>';
  }
  return '<div style="font-family:'+font+';font-size:13px;color:#1a1a1a;background:#fff;">'
    +'<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px 40px;">'
    +'<h1 style="font-size:26px;font-weight:700;margin:0 0 6px;color:#fff;">'+e(name)+'</h1>'
    +'<div style="display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:#94a3b8;">'+contactHtml+'</div></div>'
    +'<div style="padding:16px 40px 36px;">'
    + renderSections(d, sections, secHead, "#f59e0b") + '</div></div>';
}

// ─── COMPACT ─── Small font, tight spacing, dark header gradient ──────────────
function templateCompact(d, name, contact, sections, font) {
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 6px;color:#9ca3af;">|</span>');
  function secHead(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#fff;background:#334155;padding:3px 8px;margin-bottom:6px;margin-top:12px;text-transform:uppercase;">'+t+'</div>';
  }
  return '<div style="font-family:'+font+';font-size:12px;color:#1a1a1a;background:#fff;">'
    +'<div style="border-bottom:3px solid #334155;padding-bottom:10px;margin-bottom:4px;padding:16px 32px 10px;">'
    +'<h1 style="font-size:20px;font-weight:700;margin:0 0 4px;color:#0f172a;">'+e(name)+'</h1>'
    +'<div style="font-size:11px;color:#4b5563;display:flex;flex-wrap:wrap;gap:10px;">'+contactHtml+'</div></div>'
    +'<div style="padding:0 32px 24px;">'+renderSections(d, sections, secHead, "#334155")+'</div></div>';
}

// ─── ELEGANT ─── Georgia serif, warm brown, ornamental dividers ───────────────
function templateElegant(d, name, contact, sections, font) {
  var contactHtml = contact.map(function(c){return "<span>"+e(c)+"</span>";}).join('<span style="margin:0 10px;color:#d1c4a8;">◆</span>');
  function secHead(t) {
    return '<div style="position:relative;text-align:center;margin:20px 0 10px;">'
      +'<div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#d1c4a8;"></div>'
      +'<span style="position:relative;background:#fff;padding:0 12px;font-size:11px;font-weight:700;letter-spacing:3px;color:#92765a;text-transform:uppercase;">'+t+'</span></div>';
  }
  return '<div style="font-family:Georgia,serif;font-size:13px;color:#1c1917;background:#fff;padding:40px 48px;">'
    +'<div style="text-align:center;margin-bottom:20px;">'
    +'<h1 style="font-size:28px;font-weight:400;margin:0 0 8px;letter-spacing:4px;text-transform:uppercase;color:#1c1917;">'+e(name)+'</h1>'
    +'<div style="display:flex;justify-content:center;flex-wrap:wrap;gap:16px;font-size:11px;color:#92765a;margin-bottom:10px;">'+contactHtml+'</div>'
    +'<div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:4px;">'
    +'<div style="height:1px;width:60px;background:#d1c4a8;"></div>'
    +'<div style="width:6px;height:6px;border-radius:50%;background:#92765a;"></div>'
    +'<div style="height:1px;width:60px;background:#d1c4a8;"></div></div></div>'
    + renderSections(d, sections, secHead, "#92765a") + '</div>';
}

// ─── Shared section renderer ──────────────────────────────────────────────────
function renderSections(d, sections, headFn, accent) {
  var html = '';
  sections.forEach(function(key) {
    if (key === 'objective' && d.objective) {
      html += headFn('PROFESSIONAL SUMMARY');
      html += '<p style="margin:0 0 12px;line-height:1.6;">'+e(d.objective)+'</p>';
    }
    if (key === 'experience' && d.experience && d.experience.length) {
      html += headFn('WORK EXPERIENCE');
      d.experience.forEach(function(ex) {
        html += '<div style="margin-bottom:11px;">'
          +'<div style="display:flex;justify-content:space-between;align-items:baseline;">'
          +'<span style="font-weight:700;">'+e(ex.company)+'</span>'
          +'<span style="font-size:11px;color:#666;">'+e(ex.timePeriod)+'</span></div>'
          +(ex.type?'<div style="font-size:12px;color:'+accent+';font-style:italic;">'+e(ex.type)+'</div>':'')
          +'<p style="margin:3px 0 0;color:#333;line-height:1.5;">'+e(ex.responsibilities)+'</p></div>';
      });
    }
    if (key === 'skills' && d.skillGroups && d.skillGroups.length) {
      html += headFn('SKILLS');
      d.skillGroups.forEach(function(g) {
        html += '<div style="margin-bottom:3px;"><span style="font-weight:600;">'+e(g.category)+': </span><span style="color:#444;">'+e(g.skills)+'</span></div>';
      });
      html += '<div style="margin-bottom:10px;"></div>';
    }
    if (key === 'projects' && d.projects && d.projects.length) {
      html += headFn('PROJECTS');
      d.projects.forEach(function(p) {
        html += '<div style="margin-bottom:9px;">'
          +'<div style="font-weight:700;">'+e(p.name)
          +(p.githubUrl?'<span style="font-size:11px;color:'+accent+';font-weight:400;"> [GitHub]</span>':'')
          +'</div>'
          +'<p style="margin:2px 0;color:#333;line-height:1.5;">'+e(p.description)+'</p>'
          +(p.technologies?'<div style="font-size:11px;color:'+accent+';">Tech: '+e(p.technologies)+'</div>':'')
          +'</div>';
      });
    }
    if (key === 'education' && d.education && d.education.length) {
      html += headFn('EDUCATION');
      d.education.forEach(function(edu) {
        html += '<div style="margin-bottom:8px;">'
          +'<div style="display:flex;justify-content:space-between;">'
          +'<span style="font-weight:700;">'+e(edu.degree)+'</span>'
          +'<span style="font-size:11px;color:#666;">'+e(edu.period)+'</span></div>'
          +'<div style="color:#444;">'+e(edu.institute)+'</div>'
          +(edu.marks?'<div style="font-size:11px;color:#666;">'+e(edu.marks)+'</div>':'')
          +'</div>';
      });
    }
    if (key === 'certifications' && d.certifications && d.certifications.length) {
      html += headFn('CERTIFICATIONS');
      d.certifications.forEach(function(c) {
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:5px;">'
          +'<div><span style="font-weight:600;">'+e(c.name)+'</span>'
          +(c.issuer?'<span style="color:#555;font-size:12px;"> — '+e(c.issuer)+'</span>':'')+'</div>'
          +(c.date?'<span style="font-size:11px;color:#666;">'+e(c.date)+'</span>':'')+'</div>';
      });
      html += '<div style="margin-bottom:10px;"></div>';
    }
  });
  return html;
}

// ─── Main HTML builder ────────────────────────────────────────────────────────
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
  if      (templateId === "modern")       body = templateModern(d, name, contact, sections, fontFamily);
  else if (templateId === "professional") body = templateProfessional(d, name, contact, sections, fontFamily);
  else if (templateId === "minimal")      body = templateMinimal(d, name, contact, sections, fontFamily);
  else if (templateId === "corporate")    body = templateCorporate(d, name, contact, sections, fontFamily);
  else if (templateId === "simple")       body = templateSimple(d, name, contact, sections, fontFamily);
  else if (templateId === "executive")    body = templateExecutive(d, name, contact, sections, fontFamily);
  else if (templateId === "tech")         body = templateTech(d, name, contact, sections, fontFamily);
  else if (templateId === "creative")     body = templateCreative(d, name, contact, sections, fontFamily);
  else if (templateId === "compact")      body = templateCompact(d, name, contact, sections, fontFamily);
  else if (templateId === "elegant")      body = templateElegant(d, name, contact, sections, fontFamily);
  else                                    body = templateModern(d, name, contact, sections, fontFamily);

  return '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;}</style>'
    + '</head><body>'+body+'</body></html>';
}

// ─── PDF generator ────────────────────────────────────────────────────────────
async function generatePDF(templateId, resumeData, fontFamily, sectionOrder) {
  var html = generateHTML(templateId, resumeData, fontFamily, sectionOrder);
  var browser = await getBrowser();
  try {
    var page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    var pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top:"0", right:"0", bottom:"0", left:"0" } });
    return pdf;
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDF };
