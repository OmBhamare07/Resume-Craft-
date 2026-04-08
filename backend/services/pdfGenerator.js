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
  if (!executablePath) throw new Error("Chrome/Chromium not found. Run: sudo yum install -y google-chrome-stable");
  return puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-first-run","--no-zygote","--single-process"],
  });
}

function generateHTML(templateId, resumeData, fontFamily, sectionOrder) {
  fontFamily = fontFamily || "Arial, sans-serif";
  const d = resumeData;
  const name = (d.personalInfo && d.personalInfo.fullName) || "Your Name";
  const email = (d.personalInfo && d.personalInfo.email) || "";
  const phone = (d.personalInfo && d.personalInfo.phone) || "";
  const loc   = (d.personalInfo && d.personalInfo.location) || "";
  const linkedin = (d.personalInfo && d.personalInfo.linkedinUrl) || "";
  const objective = d.objective || "";

  const contact = [email, phone, loc, linkedin].filter(Boolean);

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const DEFAULT_ORDER = ["objective","experience","skills","projects","education","certifications"];
  const rawOrder = (sectionOrder && sectionOrder.length > 0) ? sectionOrder : DEFAULT_ORDER;
  const orderedSections = rawOrder.filter(function(k){ return k !== "personalInfo"; });

  // ── Section renderers ─────────────────────────────────────────────────────

  function renderObjective() {
    if (!objective) return "";
    return '<div style="margin-bottom:16px;">'
      + '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">PROFESSIONAL SUMMARY</div>'
      + '<p style="margin:0;">' + esc(objective) + '</p>'
      + '</div>';
  }

  function renderExperience() {
    if (!d.experience || !d.experience.length) return "";
    var rows = d.experience.map(function(e) {
      return '<div style="margin-bottom:12px;">'
        + '<div style="display:flex;justify-content:space-between;font-weight:600;">'
        + '<span>' + esc(e.company) + '</span>'
        + '<span style="font-size:11px;color:#666;font-weight:400;">' + esc(e.timePeriod) + '</span>'
        + '</div>'
        + (e.type ? '<div style="font-size:12px;color:#2563eb;font-style:italic;">' + esc(e.type) + '</div>' : '')
        + '<p style="margin:4px 0 0;color:#333;">' + esc(e.responsibilities) + '</p>'
        + '</div>';
    }).join("");
    return '<div style="margin-bottom:16px;">'
      + '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">WORK EXPERIENCE</div>'
      + rows + '</div>';
  }

  function renderSkills() {
    if (!d.skillGroups || !d.skillGroups.length) return "";
    var rows = d.skillGroups.map(function(g) {
      return '<div style="margin-bottom:4px;"><span style="font-weight:600;">' + esc(g.category) + ': </span><span>' + esc(g.skills) + '</span></div>';
    }).join("");
    return '<div style="margin-bottom:16px;">'
      + '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">SKILLS</div>'
      + rows + '</div>';
  }

  function renderProjects() {
    if (!d.projects || !d.projects.length) return "";
    var rows = d.projects.map(function(p) {
      return '<div style="margin-bottom:10px;">'
        + '<div style="font-weight:600;">' + esc(p.name)
        + (p.githubUrl ? ' <a href="' + esc(p.githubUrl) + '" style="font-size:11px;color:#2563eb;font-weight:400;">GitHub</a>' : '')
        + '</div>'
        + '<p style="margin:3px 0;color:#333;">' + esc(p.description) + '</p>'
        + (p.technologies ? '<div style="font-size:11px;color:#2563eb;">Tech: ' + esc(p.technologies) + '</div>' : '')
        + '</div>';
    }).join("");
    return '<div style="margin-bottom:16px;">'
      + '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">PROJECTS</div>'
      + rows + '</div>';
  }

  function renderEducation() {
    if (!d.education || !d.education.length) return "";
    var rows = d.education.map(function(e) {
      return '<div style="margin-bottom:8px;">'
        + '<div style="display:flex;justify-content:space-between;font-weight:600;">'
        + '<span>' + esc(e.degree) + '</span>'
        + '<span style="font-size:11px;color:#666;font-weight:400;">' + esc(e.period) + '</span>'
        + '</div>'
        + '<div>' + esc(e.institute) + '</div>'
        + (e.marks ? '<div style="font-size:11px;color:#666;">' + esc(e.marks) + '</div>' : '')
        + '</div>';
    }).join("");
    return '<div style="margin-bottom:16px;">'
      + '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">EDUCATION</div>'
      + rows + '</div>';
  }

  function renderCertifications() {
    if (!d.certifications || !d.certifications.length) return "";
    var rows = d.certifications.map(function(c) {
      return '<div style="margin-bottom:6px;display:flex;justify-content:space-between;">'
        + '<div><span style="font-weight:600;">' + esc(c.name) + '</span>'
        + (c.issuer ? '<span style="color:#555;font-size:12px;"> — ' + esc(c.issuer) + '</span>' : '')
        + '</div>'
        + (c.date ? '<span style="font-size:11px;color:#666;">' + esc(c.date) + '</span>' : '')
        + '</div>';
    }).join("");
    return '<div style="margin-bottom:16px;">'
      + '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">CERTIFICATIONS</div>'
      + rows + '</div>';
  }

  function renderSection(key) {
    if (key === "objective")       return renderObjective();
    if (key === "experience")      return renderExperience();
    if (key === "skills")          return renderSkills();
    if (key === "projects")        return renderProjects();
    if (key === "education")       return renderEducation();
    if (key === "certifications")  return renderCertifications();
    return "";
  }

  // Build contact line
  var contactHTML = contact.map(function(c) {
    return '<span>' + esc(c) + '</span>';
  }).join('<span style="margin:0 6px;color:#999;">|</span>');

  // Build ordered sections body
  var sectionsHTML = orderedSections.map(renderSection).join("");

  // ── Header HTML ───────────────────────────────────────────────────────────
  var headerHTML = '<div style="border-left:4px solid #2563eb;padding-left:14px;margin-bottom:20px;">'
    + '<h1 style="font-size:22px;font-weight:700;margin:0;color:#1e3a8a;">' + esc(name) + '</h1>'
    + '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;font-size:12px;color:#555;">'
    + contactHTML
    + '</div></div>';

  var bodyHTML = '<div style="font-family:' + fontFamily + ';font-size:13px;color:#1a1a1a;padding:36px 40px;line-height:1.5;background:#fff;">'
    + headerHTML
    + sectionsHTML
    + '</div>';

  return '<!DOCTYPE html><html><head>'
    + '<meta charset="UTF-8">'
    + '<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;}</style>'
    + '</head><body>' + bodyHTML + '</body></html>';
}

async function generatePDF(templateId, resumeData, fontFamily, sectionOrder) {
  const html = generateHTML(templateId, resumeData, fontFamily, sectionOrder);
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
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
