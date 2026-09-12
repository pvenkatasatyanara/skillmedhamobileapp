// Builds a printable HTML resume for expo-print (PDF generation & preview).
import { stripHtml } from './format';

const ACCENTS = {
  modern: '#4f46e5',
  classic: '#0ea5e9',
  minimal: '#334155',
  professional: '#16a34a',
  creative: '#ec4899',
};

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function section(title, inner, accent) {
  if (!inner) return '';
  return `<div class="section"><div class="secTitle" style="color:${accent};border-color:${accent}">${esc(
    title
  )}</div>${inner}</div>`;
}

function entry({ title, subtitle, meta, description }) {
  return `<div class="entry">
    ${title ? `<div class="entryTitle">${esc(title)}</div>` : ''}
    ${subtitle ? `<div class="entrySub">${esc(subtitle)}</div>` : ''}
    ${meta ? `<div class="entryMeta">${esc(meta)}</div>` : ''}
    ${description ? `<div class="entryDesc">${esc(stripHtml(description))}</div>` : ''}
  </div>`;
}

export function buildResumeHtml(data = {}, template = 'modern') {
  const accent = ACCENTS[template] || ACCENTS.modern;
  const name =
    [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ') ||
    data.userName ||
    'Your Name';
  const contact = [data.email, data.phone, data.city].filter(Boolean).join('  •  ');
  const links = Array.isArray(data.links) ? data.links : [];

  const eduHtml = (data.educationDetails || [])
    .map((e) =>
      entry({
        title: e.degreeName || e.type || e.school,
        subtitle: e.school || e.board,
        meta: [e.startDate, e.endDate || e.yearOfPass].filter(Boolean).join(' - '),
        description: e.grade ? `Grade: ${e.grade}` : '',
      })
    )
    .join('');

  const expHtml = (data.experiences || [])
    .map((x) =>
      entry({
        title: x.role,
        subtitle: [x.company, x.type].filter(Boolean).join('  •  '),
        meta: [x.start || x.startDate, x.end || x.endDate].filter(Boolean).join(' - '),
        description: x.description,
      })
    )
    .join('');

  const projHtml = (data.projects || [])
    .map((p) =>
      entry({
        title: p.project || p.title,
        subtitle: p.company,
        meta: [p.start, p.end].filter(Boolean).join(' - '),
        description: p.description,
      })
    )
    .join('');

  const skills = (data.technical || data.skills || [])
    .map((sk) => (typeof sk === 'string' ? sk : sk.name))
    .filter(Boolean);
  const skillsHtml = skills.length
    ? `<div class="chips">${skills.map((sk) => `<span class="chip">${esc(sk)}</span>`).join('')}</div>`
    : '';

  const langs = (data.languages || []).filter(Boolean);
  const langsHtml = langs.length
    ? `<div class="chips">${langs.map((l) => `<span class="chip">${esc(l)}</span>`).join('')}</div>`
    : '';

  const summary = stripHtml(data.professionalSummary);
  const linksHtml = links.length
    ? `<div class="links">${links
        .map((l) => `<span>${esc(l.title)}: ${esc(l.link)}</span>`)
        .join('  •  ')}</div>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; margin: 0; padding: 32px 36px; font-size: 12.5px; line-height: 1.5; }
  .name { font-size: 26px; font-weight: 800; color: ${accent}; margin: 0; }
  .contact { color: #475569; margin-top: 4px; font-size: 12px; }
  .links { color: ${accent}; margin-top: 3px; font-size: 11px; }
  .section { margin-top: 20px; }
  .secTitle { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid; padding-bottom: 4px; margin-bottom: 8px; }
  .summary { color: #374151; }
  .entry { margin-bottom: 10px; }
  .entryTitle { font-weight: 700; font-size: 13px; }
  .entrySub { color: #475569; font-size: 12px; }
  .entryMeta { color: #94a3b8; font-size: 11px; }
  .entryDesc { color: #374151; font-size: 12px; margin-top: 2px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { background: ${accent}18; color: ${accent}; border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 600; }
</style></head>
<body>
  <h1 class="name">${esc(name)}</h1>
  ${contact ? `<div class="contact">${esc(contact)}</div>` : ''}
  ${linksHtml}
  ${section('Summary', summary ? `<div class="summary">${esc(summary)}</div>` : '', accent)}
  ${section('Skills', skillsHtml, accent)}
  ${section('Experience', expHtml, accent)}
  ${section('Education', eduHtml, accent)}
  ${section('Projects', projHtml, accent)}
  ${section('Languages', langsHtml, accent)}
</body></html>`;
}

export default { buildResumeHtml };