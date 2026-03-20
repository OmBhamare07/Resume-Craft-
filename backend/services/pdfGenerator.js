const puppeteer = require("puppeteer-core");
const path = require("path");

// Try to find Chrome/Chromium on the system
async function getBrowser() {
  // Try system chromium first (installed via apt on EC2)
  const executablePaths = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/snap/bin/chromium",
  ];

  const fs = require("fs");
  let executablePath = null;
  for (const p of executablePaths) {
    if (fs.existsSync(p)) { executablePath = p; break; }
  }

  if (!executablePath) {
    throw new Error("Chrome/Chromium not found. Run: sudo apt-get install -y chromium-browser");
  }

  return puppeteer.launch({
    executablePath,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  });
}

// Generate HTML for a given template and resume data
function generateHTML(templateId, resumeData, fontFamily = "Arial, sans-serif") {
  const d = resumeData;
  const name = d.personalInfo?.fullName || "Your Name";
  const email = d.personalInfo?.email || "";
  const phone = d.personalInfo?.phone || "";
  const location = d.personalInfo?.location || "";
  const linkedin = d.personalInfo?.linkedinUrl || "";
  const objective = d.objective || "";

  const contact = [email, phone, location, linkedin].filter(Boolean);

  // Helper to escape HTML
  const esc = (s) => String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  let bodyHTML = "";

  if (templateId === "modern") {
    bodyHTML = `
    <div style="font-family:${fontFamily};font-size:13px;color:#1a1a1a;padding:36px 40px;line-height:1.5;background:#fff;">
      <div style="border-left:4px solid #2563eb;padding-left:14px;margin-bottom:20px;">
        <h1 style="font-size:22px;font-weight:700;margin:0;color:#1e3a8a;">${esc(name)}</h1>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;font-size:12px;color:#555;">
          ${contact.map(c => `<span>${esc(c)}</span>`).join("")}
        </div>
      </div>
      ${objective ? `<div style="margin-bottom:16px;"><div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">PROFESSIONAL SUMMARY</div><p style="margin:0;">${esc(objective)}</p></div>` : ""}
      ${d.experience?.length ? `
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">WORK EXPERIENCE</div>
          ${d.experience.map(e => `
            <div style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;font-weight:600;">
                <span>${esc(e.company)}</span>
                <span style="font-size:11px;color:#666;font-weight:400;">${esc(e.timePeriod)}</span>
              </div>
              ${e.type ? `<div style="font-size:12px;color:#2563eb;font-style:italic;">${esc(e.type)}</div>` : ""}
              <p style="margin:4px 0 0;color:#333;">${esc(e.responsibilities)}</p>
            </div>
          `).join("")}
        </div>` : ""}
      ${d.skillGroups?.length ? `
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">SKILLS</div>
          ${d.skillGroups.map(g => `<div style="margin-bottom:4px;"><span style="font-weight:600;">${esc(g.category)}: </span><span>${esc(g.skills)}</span></div>`).join("")}
        </div>` : ""}
      ${d.projects?.length ? `
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">PROJECTS</div>
          ${d.projects.map(p => `
            <div style="margin-bottom:10px;">
              <div style="font-weight:600;">${esc(p.name)}</div>
              <p style="margin:3px 0;">${esc(p.description)}</p>
              ${p.technologies ? `<div style="font-size:11px;color:#2563eb;">Tech: ${esc(p.technologies)}</div>` : ""}
            </div>`).join("")}
        </div>` : ""}
      ${d.education?.length ? `
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #93c5fd;">EDUCATION</div>
          ${d.education.map(e => `
            <div style="margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;font-weight:600;">
                <span>${esc(e.degree)}</span>
                <span style="font-size:11px;color:#666;font-weight:400;">${esc(e.period)}</span>
              </div>
              <div>${esc(e.institute)}</div>
              ${e.marks ? `<div style="font-size:11px;color:#666;">${esc(e.marks)}</div>` : ""}
            </div>`).join("")}
        </div>` : ""}
    </div>`;

  } else if (templateId === "professional") {
    bodyHTML = `
    <div style="font-family:${fontFamily};font-size:12px;color:#1a1a1a;display:flex;min-height:297mm;background:#fff;">
      <div style="width:32%;background:#1e3a5f;color:#fff;padding:28px 18px;flex-shrink:0;">
        <h1 style="font-size:18px;font-weight:700;margin:0 0 4px;color:#fff;line-height:1.2;">${esc(name)}</h1>
        <div style="height:2px;background:#60a5fa;margin:10px 0;"></div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#93c5fd;margin-bottom:6px;">CONTACT</div>
        <div style="font-size:11px;line-height:1.8;color:#cbd5e1;">${contact.map(c => `<div>${esc(c)}</div>`).join("")}</div>
        ${d.skillGroups?.length ? `
          <div style="margin-top:18px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#93c5fd;margin-bottom:6px;">SKILLS</div>
            ${d.skillGroups.map(g => `<div style="margin-bottom:6px;"><div style="font-size:11px;font-weight:600;color:#93c5fd;">${esc(g.category)}</div><div style="font-size:11px;color:#cbd5e1;">${esc(g.skills)}</div></div>`).join("")}
          </div>` : ""}
        ${d.education?.length ? `
          <div style="margin-top:18px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#93c5fd;margin-bottom:6px;">EDUCATION</div>
            ${d.education.map(e => `<div style="margin-bottom:8px;font-size:11px;color:#cbd5e1;"><div style="font-weight:600;color:#fff;">${esc(e.degree)}</div><div>${esc(e.institute)}</div><div>${esc(e.period)}</div>${e.marks ? `<div style="color:#93c5fd;">${esc(e.marks)}</div>` : ""}</div>`).join("")}
          </div>` : ""}
      </div>
      <div style="flex:1;padding:28px 24px;">
        ${objective ? `<div style="margin-bottom:18px;"><div style="font-size:12px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:3px;margin-bottom:8px;">PROFESSIONAL SUMMARY</div><p style="margin:0;color:#334155;font-style:italic;">${esc(objective)}</p></div>` : ""}
        ${d.experience?.length ? `
          <div style="margin-bottom:18px;">
            <div style="font-size:12px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:3px;margin-bottom:8px;">EXPERIENCE</div>
            ${d.experience.map(e => `
              <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;">
                  <span style="font-weight:700;font-size:13px;">${esc(e.company)}</span>
                  <span style="font-size:11px;color:#64748b;">${esc(e.timePeriod)}</span>
                </div>
                ${e.type ? `<div style="color:#1e3a5f;font-size:12px;font-weight:600;">${esc(e.type)}</div>` : ""}
                <p style="margin:4px 0 0;color:#475569;">${esc(e.responsibilities)}</p>
              </div>`).join("")}
          </div>` : ""}
        ${d.projects?.length ? `
          <div style="margin-bottom:18px;">
            <div style="font-size:12px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:3px;margin-bottom:8px;">PROJECTS</div>
            ${d.projects.map(p => `<div style="margin-bottom:10px;"><div style="font-weight:700;">${esc(p.name)}</div><p style="margin:3px 0;color:#475569;">${esc(p.description)}</p>${p.technologies ? `<div style="font-size:11px;color:#1e3a5f;font-weight:600;">Stack: ${esc(p.technologies)}</div>` : ""}</div>`).join("")}
          </div>` : ""}
      </div>
    </div>`;

  } else if (templateId === "minimal") {
    bodyHTML = `
    <div style="font-family:'Times New Roman',serif;font-size:13px;color:#111;padding:40px 48px;line-height:1.6;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:24px;font-weight:700;margin:0 0 6px;letter-spacing:2px;text-transform:uppercase;">${esc(name)}</h1>
        <div style="font-size:12px;color:#444;">${contact.join(" | ")}</div>
        <div style="margin:14px auto 0;border-top:1px solid #111;width:100%;"></div>
      </div>
      ${objective ? `<div style="margin-bottom:16px;"><div style="font-size:12px;font-weight:700;letter-spacing:2px;margin-bottom:6px;text-transform:uppercase;">OBJECTIVE</div><div style="border-top:1px solid #ccc;padding-top:6px;font-style:italic;">${esc(objective)}</div></div>` : ""}
      ${d.education?.length ? `<div style="margin-bottom:16px;"><div style="font-size:12px;font-weight:700;letter-spacing:2px;margin-bottom:6px;text-transform:uppercase;">EDUCATION</div><div style="border-top:1px solid #ccc;padding-top:6px;">${d.education.map(e => `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><div><span style="font-weight:700;">${esc(e.degree)}</span>${e.institute ? `, ${esc(e.institute)}` : ""}${e.marks ? ` — ${esc(e.marks)}` : ""}</div><span style="font-size:12px;color:#555;">${esc(e.period)}</span></div>`).join("")}</div></div>` : ""}
      ${d.experience?.length ? `<div style="margin-bottom:16px;"><div style="font-size:12px;font-weight:700;letter-spacing:2px;margin-bottom:6px;text-transform:uppercase;">EXPERIENCE</div><div style="border-top:1px solid #ccc;padding-top:6px;">${d.experience.map(e => `<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;"><span style="font-weight:700;">${esc(e.company)}</span><span style="font-size:12px;color:#555;">${esc(e.timePeriod)}</span></div>${e.type ? `<div style="font-style:italic;font-size:12px;">${esc(e.type)}</div>` : ""}<p style="margin:3px 0 0;">${esc(e.responsibilities)}</p></div>`).join("")}</div></div>` : ""}
      ${d.skillGroups?.length ? `<div style="margin-bottom:16px;"><div style="font-size:12px;font-weight:700;letter-spacing:2px;margin-bottom:6px;text-transform:uppercase;">SKILLS</div><div style="border-top:1px solid #ccc;padding-top:6px;">${d.skillGroups.map(g => `<div style="margin-bottom:3px;"><span style="font-weight:700;">${esc(g.category)}: </span>${esc(g.skills)}</div>`).join("")}</div></div>` : ""}
      ${d.projects?.length ? `<div style="margin-bottom:16px;"><div style="font-size:12px;font-weight:700;letter-spacing:2px;margin-bottom:6px;text-transform:uppercase;">PROJECTS</div><div style="border-top:1px solid #ccc;padding-top:6px;">${d.projects.map(p => `<div style="margin-bottom:8px;"><span style="font-weight:700;">${esc(p.name)}</span>${p.technologies ? ` [${esc(p.technologies)}]` : ""}<p style="margin:2px 0 0;">${esc(p.description)}</p></div>`).join("")}</div></div>` : ""}
    </div>`;

  } else if (templateId === "corporate") {
    bodyHTML = `
    <div style="font-family:${fontFamily};font-size:13px;color:#1a1a1a;background:#fff;">
      <div style="background:#0f172a;color:#fff;padding:24px 36px;">
        <h1 style="font-size:26px;font-weight:700;margin:0 0 8px;letter-spacing:1px;">${esc(name)}</h1>
        <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:#94a3b8;">${contact.map(c => `<span>${esc(c)}</span>`).join("")}</div>
      </div>
      <div style="padding:24px 36px;">
        ${objective ? `<div style="margin-bottom:18px;"><div style="font-size:12px;font-weight:700;background:#f8fafc;border-left:4px solid #0f172a;padding:4px 10px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1.5px;">EXECUTIVE SUMMARY</div><p style="margin:0;color:#334155;">${esc(objective)}</p></div>` : ""}
        ${d.experience?.length ? `<div style="margin-bottom:18px;"><div style="font-size:12px;font-weight:700;background:#f8fafc;border-left:4px solid #0f172a;padding:4px 10px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1.5px;">PROFESSIONAL EXPERIENCE</div>${d.experience.map(e => `<div style="margin-bottom:14px;padding-left:12px;border-left:3px solid #0f172a;"><div style="display:flex;justify-content:space-between;"><span style="font-weight:700;font-size:14px;">${esc(e.company)}</span><span style="font-size:11px;background:#e2e8f0;padding:2px 8px;border-radius:4px;">${esc(e.timePeriod)}</span></div>${e.type ? `<div style="font-size:12px;font-weight:600;color:#475569;">${esc(e.type)}</div>` : ""}<p style="margin:6px 0 0;color:#334155;">${esc(e.responsibilities)}</p></div>`).join("")}</div>` : ""}
        ${d.skillGroups?.length ? `<div style="margin-bottom:18px;"><div style="font-size:12px;font-weight:700;background:#f8fafc;border-left:4px solid #0f172a;padding:4px 10px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1.5px;">CORE COMPETENCIES</div><div style="display:flex;flex-wrap:wrap;gap:8px;">${d.skillGroups.map(g => `<div style="background:#f1f5f9;padding:4px 10px;border-radius:4px;font-size:12px;"><span style="font-weight:700;color:#0f172a;">${esc(g.category)}: </span><span style="color:#475569;">${esc(g.skills)}</span></div>`).join("")}</div></div>` : ""}
        ${d.projects?.length ? `<div style="margin-bottom:18px;"><div style="font-size:12px;font-weight:700;background:#f8fafc;border-left:4px solid #0f172a;padding:4px 10px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1.5px;">KEY PROJECTS</div>${d.projects.map(p => `<div style="margin-bottom:10px;padding-left:12px;border-left:3px solid #0f172a;"><div style="font-weight:700;">${esc(p.name)}</div><p style="margin:3px 0;color:#334155;">${esc(p.description)}</p>${p.technologies ? `<div style="font-size:11px;color:#64748b;">Technologies: ${esc(p.technologies)}</div>` : ""}</div>`).join("")}</div>` : ""}
        ${d.education?.length ? `<div style="margin-bottom:18px;"><div style="font-size:12px;font-weight:700;background:#f8fafc;border-left:4px solid #0f172a;padding:4px 10px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1.5px;">EDUCATION</div>${d.education.map(e => `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><div><div style="font-weight:700;">${esc(e.degree)}</div><div style="color:#475569;">${esc(e.institute)}</div>${e.marks ? `<div style="font-size:11px;color:#64748b;">${esc(e.marks)}</div>` : ""}</div><span style="font-size:11px;color:#64748b;">${esc(e.period)}</span></div>`).join("")}</div>` : ""}
      </div>
    </div>`;

  } else {
    // simple / default
    bodyHTML = `
    <div style="font-family:${fontFamily};font-size:12px;color:#000;padding:32px 40px;line-height:1.5;background:#fff;">
      <div style="text-align:center;margin-bottom:16px;">
        <h1 style="font-size:20px;font-weight:700;margin:0 0 4px;">${esc(name)}</h1>
        <div style="font-size:11px;color:#333;">${contact.join(" | ")}</div>
      </div>
      ${objective ? `<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;">OBJECTIVE</div><p style="margin:0;">${esc(objective)}</p></div>` : ""}
      ${d.education?.length ? `<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;">EDUCATION</div>${d.education.map(e => `<div style="margin-bottom:6px;"><div style="display:flex;justify-content:space-between;"><strong>${esc(e.degree)}</strong><span>${esc(e.period)}</span></div><div>${esc(e.institute)}${e.marks ? ` | ${esc(e.marks)}` : ""}</div></div>`).join("")}</div>` : ""}
      ${d.experience?.length ? `<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;">EXPERIENCE</div>${d.experience.map(e => `<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;"><strong>${esc(e.company)}</strong><span>${esc(e.timePeriod)}</span></div>${e.type ? `<div style="font-style:italic;">${esc(e.type)}</div>` : ""}<ul style="margin:4px 0;padding-left:18px;">${e.responsibilities.split(".").filter(r => r.trim()).map(r => `<li>${esc(r.trim())}</li>`).join("")}</ul></div>`).join("")}</div>` : ""}
      ${d.skillGroups?.length ? `<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;">SKILLS</div>${d.skillGroups.map(g => `<div><strong>${esc(g.category)}:</strong> ${esc(g.skills)}</div>`).join("")}</div>` : ""}
      ${d.projects?.length ? `<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;">PROJECTS</div>${d.projects.map(p => `<div style="margin-bottom:8px;"><strong>${esc(p.name)}</strong>${p.technologies ? ` (${esc(p.technologies)})` : ""}<div>${esc(p.description)}</div></div>`).join("")}</div>` : ""}
    </div>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 210mm; background: white; }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>${bodyHTML}</body>
</html>`;
}

async function generatePDF(templateId, resumeData, fontFamily) {
  const html = generateHTML(templateId, resumeData, fontFamily);
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDF };
