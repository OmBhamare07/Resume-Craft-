const puppeteer = require("puppeteer-core");

async function getBrowser() {
  const executablePaths = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    "/opt/google/chrome/google-chrome",
  ];
  const fs = require("fs");
  let executablePath = null;
  for (const p of executablePaths) {
    if (fs.existsSync(p)) { executablePath = p; break; }
  }
  if (!executablePath) throw new Error("Chrome not found. Run: sudo yum install -y google-chrome-stable");
  return puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-first-run","--no-zygote","--single-process"],
  });
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrap(html) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;}</style>'
    + '</head><body>' + html + '</body></html>';
}

// ─── Section renderers (shared across templates, colour passed in) ────────────
function sections(d, orderedSections, accentColor, headingStyle) {
  function sectionHead(title) {
    return headingStyle(title, accentColor);
  }

  function renderObjective() {
    if (!d.objective) return "";
    return '<div style="margin-bottom:14px;">' + sectionHead("PROFESSIONAL SUMMARY")
      + '<p style="margin:0;line-height:1.6;">' + esc(d.objective) + '</p></div>';
  }

  function renderExperience() {
    if (!d.experience || !d.experience.length) return "";
    var rows = d.experience.map(function(e) {
      return '<div style="margin-bottom:11px;">'
        + '<div style="display:flex;justify-content:space-between;align-items:baseline;">'
        + '<span style="font-weight:700;">' + esc(e.company) + '</span>'
        + '<span style="font-size:11px;color:#666;">' + esc(e.timePeriod) + '</span>'
        + '</div>'
        + (e.type ? '<div style="font-size:12px;color:' + accentColor + ';font-style:italic;">' + esc(e.type) + '</div>' : '')
        + '<p style="margin:3px 0 0;color:#333;line-height:1.5;">' + esc(e.responsibilities) + '</p>'
        + '</div>';
    }).join("");
    return '<div style="margin-bottom:14px;">' + sectionHead("WORK EXPERIENCE") + rows + '</div>';
  }

  function renderSkills() {
    if (!d.skillGroups || !d.skillGroups.length) return "";
    var rows = d.skillGroups.map(function(g) {
      return '<div style="margin-bottom:3px;"><span style="font-weight:600;">' + esc(g.category) + ': </span>'
        + '<span style="color:#444;">' + esc(g.skills) + '</span></div>';
    }).join("");
    return '<div style="margin-bottom:14px;">' + sectionHead("SKILLS") + rows + '</div>';
  }

  function renderProjects() {
    if (!d.projects || !d.projects.length) return "";
    var rows = d.projects.map(function(p) {
      return '<div style="margin-bottom:9px;">'
        + '<div style="font-weight:700;">' + esc(p.name)
        + (p.githubUrl ? ' <span style="font-size:11px;color:' + accentColor + ';font-weight:400;">[GitHub]</span>' : '')
        + '</div>'
        + '<p style="margin:2px 0;color:#333;line-height:1.5;">' + esc(p.description) + '</p>'
        + (p.technologies ? '<div style="font-size:11px;color:' + accentColor + ';">Tech: ' + esc(p.technologies) + '</div>' : '')
        + '</div>';
    }).join("");
    return '<div style="margin-bottom:14px;">' + sectionHead("PROJECTS") + rows + '</div>';
  }

  function renderEducation() {
    if (!d.education || !d.education.length) return "";
    var rows = d.education.map(function(e) {
      return '<div style="margin-bottom:8px;">'
        + '<div style="display:flex;justify-content:space-between;">'
        + '<span style="font-weight:700;">' + esc(e.degree) + '</span>'
        + '<span style="font-size:11px;color:#666;">' + esc(e.period) + '</span>'
        + '</div>'
        + '<div style="color:#444;">' + esc(e.institute) + '</div>'
        + (e.marks ? '<div style="font-size:11px;color:#666;">' + esc(e.marks) + '</div>' : '')
        + '</div>';
    }).join("");
    return '<div style="margin-bottom:14px;">' + sectionHead("EDUCATION") + rows + '</div>';
  }

  function renderCertifications() {
    if (!d.certifications || !d.certifications.length) return "";
    var rows = d.certifications.map(function(c) {
      return '<div style="margin-bottom:5px;display:flex;justify-content:space-between;">'
        + '<div><span style="font-weight:600;">' + esc(c.name) + '</span>'
        + (c.issuer ? '<span style="color:#555;font-size:12px;"> — ' + esc(c.issuer) + '</span>' : '') + '</div>'
        + (c.date ? '<span style="font-size:11px;color:#666;">' + esc(c.date) + '</span>' : '')
        + '</div>';
    }).join("");
    return '<div style="margin-bottom:14px;">' + sectionHead("CERTIFICATIONS") + rows + '</div>';
  }

  return orderedSections.map(function(key) {
    if (key === "objective")      return renderObjective();
    if (key === "experience")     return renderExperience();
    if (key === "skills")         return renderSkills();
    if (key === "projects")       return renderProjects();
    if (key === "education")      return renderEducation();
    if (key === "certifications") return renderCertifications();
    return "";
  }).join("");
}

// ─── Template definitions ─────────────────────────────────────────────────────

function buildModern(d, name, contact, orderedSections, fontFamily) {
  var accent = "#2563eb";
  function headingStyle(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:' + accent + ';border-bottom:1px solid #bfdbfe;padding-bottom:3px;margin-bottom:8px;text-transform:uppercase;">' + t + '</div>';
  }
  var contactHTML = contact.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('<span style="margin:0 5px;color:#aaa;">|</span>');
  var header = '<div style="border-left:4px solid ' + accent + ';padding-left:14px;margin-bottom:18px;">'
    + '<h1 style="font-size:22px;font-weight:700;color:#1e3a8a;margin:0;">' + esc(name) + '</h1>'
    + '<div style="font-size:12px;color:#555;margin-top:5px;">' + contactHTML + '</div></div>';
  return '<div style="font-family:' + fontFamily + ';font-size:13px;color:#1a1a1a;padding:36px 40px;line-height:1.5;">'
    + header + sections(d, orderedSections, accent, headingStyle) + '</div>';
}

function buildProfessional(d, name, contact, orderedSections, fontFamily) {
  var accent = "#1e3a5f";
  function headingStyle(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#fff;background:' + accent + ';padding:3px 8px;margin-bottom:8px;text-transform:uppercase;">' + t + '</div>';
  }
  var contactHTML = contact.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('  •  ');
  var header = '<div style="background:' + accent + ';color:#fff;padding:20px 28px;margin-bottom:0;">'
    + '<h1 style="font-size:24px;font-weight:700;letter-spacing:1px;margin:0;">' + esc(name) + '</h1>'
    + '<div style="font-size:11px;margin-top:6px;opacity:0.85;">' + contactHTML + '</div></div>'
    + '<div style="height:4px;background:#c8a951;margin-bottom:16px;"></div>';
  return '<div style="font-family:' + fontFamily + ';font-size:13px;color:#1a1a1a;padding-bottom:36px;line-height:1.5;">'
    + header + '<div style="padding:0 28px;">' + sections(d, orderedSections, accent, headingStyle) + '</div></div>';
}

function buildMinimal(d, name, contact, orderedSections, fontFamily) {
  var accent = "#111827";
  function headingStyle(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:3px;color:#9ca3af;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:8px;text-transform:uppercase;">' + t + '</div>';
  }
  var contactHTML = contact.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('<span style="margin:0 8px;color:#d1d5db;">·</span>');
  var header = '<div style="margin-bottom:20px;">'
    + '<h1 style="font-size:26px;font-weight:300;letter-spacing:2px;color:#111827;margin:0 0 6px;">' + esc(name) + '</h1>'
    + '<div style="font-size:11px;color:#6b7280;">' + contactHTML + '</div></div>';
  return '<div style="font-family:' + fontFamily + ';font-size:13px;color:#1a1a1a;padding:40px 44px;line-height:1.6;">'
    + header + sections(d, orderedSections, "#374151", headingStyle) + '</div>';
}

function buildCorporate(d, name, contact, orderedSections, fontFamily) {
  var accent = "#374151";
  function headingStyle(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:' + accent + ';border-bottom:2px solid ' + accent + ';padding-bottom:3px;margin-bottom:8px;text-transform:uppercase;">' + t + '</div>';
  }
  var contactHTML = contact.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('<span style="margin:0 6px;">|</span>');
  var header = '<div style="border-bottom:3px double #374151;padding-bottom:14px;margin-bottom:16px;">'
    + '<h1 style="font-size:22px;font-weight:700;color:#111827;margin:0;text-transform:uppercase;letter-spacing:1px;">' + esc(name) + '</h1>'
    + '<div style="font-size:11px;color:#6b7280;margin-top:5px;">' + contactHTML + '</div></div>';
  return '<div style="font-family:' + fontFamily + ';font-size:13px;color:#1a1a1a;padding:36px 40px;line-height:1.5;">'
    + header + sections(d, orderedSections, accent, headingStyle) + '</div>';
}

function buildSimple(d, name, contact, orderedSections, fontFamily) {
  var accent = "#16a34a";
  function headingStyle(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:' + accent + ';margin-bottom:7px;text-transform:uppercase;">' + t + '</div>';
  }
  var contactHTML = contact.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('  |  ');
  var header = '<div style="text-align:center;border-bottom:2px solid ' + accent + ';padding-bottom:12px;margin-bottom:16px;">'
    + '<h1 style="font-size:24px;font-weight:700;color:#111827;margin:0;">' + esc(name) + '</h1>'
    + '<div style="font-size:11px;color:#6b7280;margin-top:5px;">' + contactHTML + '</div></div>';
  return '<div style="font-family:' + fontFamily + ';font-size:13px;color:#1a1a1a;padding:36px 40px;line-height:1.5;">'
    + header + sections(d, orderedSections, accent, headingStyle) + '</div>';
}

function buildExecutive(d, name, contact, orderedSections, fontFamily) {
  var accent = "#0f766e";
  function headingStyle(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:' + accent + ';border-bottom:2px solid ' + accent + ';padding-bottom:3px;margin-bottom:8px;text-transform:uppercase;">' + t + '</div>';
  }
  var contactHTML = contact.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('<span style="margin:0 6px;color:#99f6e4;">|</span>');
  var header = '<div style="background:linear-gradient(135deg,#0f766e,#0d9488);color:#fff;padding:22px 28px;margin-bottom:18px;">'
    + '<h1 style="font-size:24px;font-weight:700;letter-spacing:1px;margin:0;">' + esc(name) + '</h1>'
    + '<div style="font-size:11px;margin-top:6px;opacity:0.9;">' + contactHTML + '</div></div>';
  return '<div style="font-family:' + fontFamily + ';font-size:13px;color:#1a1a1a;padding-bottom:36px;line-height:1.5;">'
    + header + '<div style="padding:0 28px;">' + sections(d, orderedSections, accent, headingStyle) + '</div></div>';
}

function buildTech(d, name, contact, orderedSections, fontFamily) {
  var accent = "#7c3aed";
  function headingStyle(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:' + accent + ';border-left:3px solid ' + accent + ';padding-left:8px;margin-bottom:8px;text-transform:uppercase;">' + t + '</div>';
  }
  var contactHTML = contact.map(function(c){ return '<span style="background:#f3f4f6;padding:2px 8px;border-radius:12px;font-size:11px;">' + esc(c) + '</span>'; }).join(' ');
  var header = '<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid ' + accent + ';padding-bottom:14px;margin-bottom:16px;">'
    + '<div><h1 style="font-size:22px;font-weight:700;color:#111827;margin:0;">' + esc(name) + '</h1></div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:4px;max-width:55%;justify-content:flex-end;">' + contactHTML + '</div></div>';
  return '<div style="font-family:' + fontFamily + ';font-size:13px;color:#1a1a1a;padding:36px 40px;line-height:1.5;">'
    + header + sections(d, orderedSections, accent, headingStyle) + '</div>';
}

function buildCreative(d, name, contact, orderedSections, fontFamily) {
  var accent = "#ea580c";
  function headingStyle(t) {
    return '<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#fff;background:' + accent + ';padding:3px 10px;display:inline-block;margin-bottom:8px;text-transform:uppercase;">' + t + '</div>';
  }
  var contactHTML = contact.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('  ·  ');
  var header = '<div style="border-top:5px solid ' + accent + ';padding-top:14px;margin-bottom:18px;">'
    + '<h1 style="font-size:26px;font-weight:800;color:#111827;margin:0;">' + esc(name) + '</h1>'
    + '<div style="font-size:11px;color:#6b7280;margin-top:5px;">' + contactHTML + '</div></div>';
  return '<div style="font-family:' + fontFamily + ';font-size:13px;color:#1a1a1a;padding:32px 40px;line-height:1.5;">'
    + header + sections(d, orderedSections, accent, headingStyle) + '</div>';
}

function buildCompact(d, name, contact, orderedSections, fontFamily) {
  var accent = "#475569";
  function headingStyle(t) {
    return '<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:' + accent + ';border-bottom:1px solid #cbd5e1;padding-bottom:2px;margin-bottom:6px;text-transform:uppercase;">' + t + '</div>';
  }
  var contactHTML = contact.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join(' | ');
  var header = '<div style="margin-bottom:14px;">'
    + '<h1 style="font-size:18px;font-weight:700;color:#1e293b;margin:0;">' + esc(name) + '</h1>'
    + '<div style="font-size:10px;color:#64748b;margin-top:3px;">' + contactHTML + '</div></div>';
  return '<div style="font-family:' + fontFamily + ';font-size:12px;color:#1a1a1a;padding:28px 36px;line-height:1.4;">'
    + header + sections(d, orderedSections, accent, headingStyle) + '</div>';
}

function buildElegant(d, name, contact, orderedSections, fontFamily) {
  var accent = "#92400e";
  function headingStyle(t) {
    return '<div style="font-size:10px;font-weight:600;letter-spacing:3px;color:' + accent + ';text-align:center;border-top:1px solid #d6b88a;border-bottom:1px solid #d6b88a;padding:3px 0;margin-bottom:10px;text-transform:uppercase;">' + t + '</div>';
  }
  var contactHTML = contact.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('<span style="margin:0 8px;color:#d6b88a;">◆</span>');
  var header = '<div style="text-align:center;border-top:2px solid ' + accent + ';border-bottom:1px solid #d6b88a;padding:16px 0 12px;margin-bottom:18px;">'
    + '<h1 style="font-size:26px;font-weight:300;letter-spacing:4px;color:#1c1917;margin:0;text-transform:uppercase;">' + esc(name) + '</h1>'
    + '<div style="font-size:11px;color:#78716c;margin-top:7px;">' + contactHTML + '</div></div>';
  return '<div style="font-family:' + fontFamily + ';font-size:13px;color:#1a1a1a;padding:36px 44px;line-height:1.6;">'
    + header + sections(d, orderedSections, accent, headingStyle) + '</div>';
}

// ─── Main generateHTML ────────────────────────────────────────────────────────
function generateHTML(templateId, resumeData, fontFamily, sectionOrder) {
  fontFamily = fontFamily || "Arial, sans-serif";
  var d = resumeData;
  var name    = (d.personalInfo && d.personalInfo.fullName)    || "Your Name";
  var email   = (d.personalInfo && d.personalInfo.email)       || "";
  var phone   = (d.personalInfo && d.personalInfo.phone)       || "";
  var loc     = (d.personalInfo && d.personalInfo.location)    || "";
  var linkedin = (d.personalInfo && d.personalInfo.linkedinUrl) || "";
  var contact = [email, phone, loc, linkedin].filter(Boolean);

  var DEFAULT_ORDER = ["objective","experience","skills","projects","education","certifications"];
  var rawOrder = (sectionOrder && sectionOrder.length > 0) ? sectionOrder : DEFAULT_ORDER;
  var orderedSections = rawOrder.filter(function(k){ return k !== "personalInfo"; });

  var body = "";
  if      (templateId === "modern")       body = buildModern(d, name, contact, orderedSections, fontFamily);
  else if (templateId === "professional") body = buildProfessional(d, name, contact, orderedSections, fontFamily);
  else if (templateId === "minimal")      body = buildMinimal(d, name, contact, orderedSections, fontFamily);
  else if (templateId === "corporate")    body = buildCorporate(d, name, contact, orderedSections, fontFamily);
  else if (templateId === "simple")       body = buildSimple(d, name, contact, orderedSections, fontFamily);
  else if (templateId === "executive")    body = buildExecutive(d, name, contact, orderedSections, fontFamily);
  else if (templateId === "tech")         body = buildTech(d, name, contact, orderedSections, fontFamily);
  else if (templateId === "creative")     body = buildCreative(d, name, contact, orderedSections, fontFamily);
  else if (templateId === "compact")      body = buildCompact(d, name, contact, orderedSections, fontFamily);
  else if (templateId === "elegant")      body = buildElegant(d, name, contact, orderedSections, fontFamily);
  else                                    body = buildModern(d, name, contact, orderedSections, fontFamily); // fallback

  return wrap(body);
}

// ─── Export ───────────────────────────────────────────────────────────────────
async function generatePDF(templateId, resumeData, fontFamily, sectionOrder) {
  var html = generateHTML(templateId, resumeData, fontFamily, sectionOrder);
  var browser = await getBrowser();
  try {
    var page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    var pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDF };
