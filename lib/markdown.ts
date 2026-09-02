export function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function inlineHtml(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "<em>$1</em>");
}

function isSepRow(line: string | undefined): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line ?? "");
}

function parseTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

/**
 * Rendu Markdown vers HTML pour les documents pédagogiques générés.
 * Gère les marqueurs de mise en page maison (%%ETAB%%, %%TITRE%%, %%TITREBOX%%,
 * %%SOUSTITRE%%), les encadrés « > » avec libellé, les tableaux (grilles de
 * Rapidos), les titres, listes et séparateurs.
 */
export function markdownToHtml(text: string): string {
  const lines = text.split("\n");
  let html = "";
  let para: string[] = [];
  let list: string[] = [];
  let quote: string[] = [];

  const flushPara = () => {
    if (para.length) {
      html += "<p>" + para.map(inlineHtml).join("<br>") + "</p>";
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      html += "<ul>" + list.map((x) => "<li>" + inlineHtml(x) + "</li>").join("") + "</ul>";
      list = [];
    }
  };
  const flushQuote = () => {
    if (!quote.length) return;
    let label = "";
    let content = quote;
    const fb = (quote[0] ?? "").match(/^\*\*(.+?)\*\*\s*$/);
    if (fb) {
      label = fb[1] ?? "";
      content = quote.slice(1);
    }
    html +=
      '<div class="callout">' +
      (label ? '<div class="callout-label">' + escapeHtml(label) + "</div>" : "") +
      content.map((l) => '<div class="callout-line">' + inlineHtml(l) + "</div>").join("") +
      "</div>";
    quote = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = (lines[i] ?? "").replace(/\r$/, "");
    let m: RegExpMatchArray | null;

    if (/^\s*\|.*\|\s*$/.test(line) && isSepRow(lines[i + 1])) {
      flushPara();
      flushList();
      flushQuote();
      const header = parseTableRow(line);
      let j = i + 2;
      const rows: string[][] = [];
      while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j] ?? "")) {
        rows.push(parseTableRow(lines[j] ?? ""));
        j++;
      }
      html +=
        "<table><tr>" +
        header.map((c) => "<th>" + inlineHtml(c) + "</th>").join("") +
        "</tr>" +
        rows
          .map(
            (r) =>
              "<tr>" + header.map((_, k) => "<td>" + inlineHtml(r[k] ?? "") + "</td>").join("") + "</tr>"
          )
          .join("") +
        "</table>";
      i = j;
      continue;
    }

    if ((m = line.match(/^%%ETAB%%\s*(.*)$/))) {
      flushPara(); flushList(); flushQuote();
      html += '<div class="doc-etab">' + inlineHtml(m[1] ?? "") + "</div>";
      i++; continue;
    }
    if ((m = line.match(/^%%TITRE%%\s*(.*)$/))) {
      flushPara(); flushList(); flushQuote();
      html += '<div class="doc-titre">' + inlineHtml(m[1] ?? "") + "</div>";
      i++; continue;
    }
    if ((m = line.match(/^%%TITREBOX%%\s*(.*)$/))) {
      flushPara(); flushList(); flushQuote();
      html += '<div class="doc-titre-box">' + inlineHtml(m[1] ?? "") + "</div>";
      i++; continue;
    }
    if ((m = line.match(/^%%SOUSTITRE%%\s*(.*)$/))) {
      flushPara(); flushList(); flushQuote();
      html += '<div class="doc-soustitre">' + inlineHtml(m[1] ?? "") + "</div>";
      i++; continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara(); flushList();
      quote.push(m[1] ?? "");
      i++; continue;
    }
    flushQuote();
    if ((m = line.match(/^###\s+(.*)$/))) {
      flushPara(); flushList();
      html += "<h3>" + inlineHtml(m[1] ?? "") + "</h3>";
      i++; continue;
    }
    if ((m = line.match(/^##\s+(.*)$/))) {
      flushPara(); flushList();
      html += "<h2>" + inlineHtml(m[1] ?? "") + "</h2>";
      i++; continue;
    }
    if ((m = line.match(/^#\s+(.*)$/))) {
      flushPara(); flushList();
      html += "<h1>" + inlineHtml(m[1] ?? "") + "</h1>";
      i++; continue;
    }
    if (/^\s*---\s*$/.test(line)) {
      flushPara(); flushList();
      html += "<hr>";
      i++; continue;
    }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/)) || (m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushPara();
      list.push(m[1] ?? "");
      i++; continue;
    }
    flushList();
    if (line.trim() === "") {
      flushPara();
      i++; continue;
    }
    para.push(line);
    i++;
  }
  flushPara(); flushList(); flushQuote();
  return html;
}

export function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

/* ---------- Export Word : RTF, un format que Word ouvre nativement ---------- */

function rtfEscape(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (ch === "\\" || ch === "{" || ch === "}") out += "\\" + ch;
    else if (code > 127) out += "\\u" + code + "?";
    else out += ch;
  }
  return out;
}

function inlineRtf(s: string): string {
  return rtfEscape(s)
    .replace(/\*\*(.+?)\*\*/g, "{\\b $1}")
    .replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "{\\i $1}");
}

function rtfTable(header: string[], rows: string[][]): string {
  const cols = header.length;
  const w = Math.floor(9000 / cols);
  const xs: number[] = [];
  let x = 0;
  for (let c = 0; c < cols; c++) {
    x += w;
    xs.push(x);
  }
  const cellDefs = xs
    .map(
      (xx) =>
        "\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10\\cellx" +
        xx
    )
    .join("");
  let out = "\\par\\trowd\\trgaph80\\trleft0" + cellDefs + " ";
  out += header.map((c) => "\\intbl\\qc{\\b " + inlineRtf(c) + "}\\cell ").join("");
  out += "\\row ";
  for (const r of rows) {
    out += "\\trowd\\trgaph80\\trleft0" + cellDefs + " ";
    out += header.map((_, k) => "\\intbl\\ql " + inlineRtf(r[k] ?? "") + "\\cell ").join("");
    out += "\\row ";
  }
  return out + "\\pard\\fs22 ";
}

export function markdownToRtf(src: string): string {
  const lines = src.split("\n");
  let body = "";
  let quote: string[] = [];
  let inList = false;

  const flushQuote = () => {
    if (!quote.length) return;
    let label: string | null = null;
    let content = quote;
    const fb = (quote[0] ?? "").match(/^\*\*(.+?)\*\*\s*$/);
    if (fb) {
      label = fb[1] ?? "";
      content = quote.slice(1);
    }
    body += "\\par\\pard\\box\\brdrs\\brdrw15\\brsp150\\li100\\ri100 ";
    if (label) body += "{\\b\\ul " + inlineRtf(label) + "}\\line ";
    body += content.map(inlineRtf).join("\\line ");
    body += "\\par\\pard\\fs22 ";
    quote = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = (lines[i] ?? "").replace(/\r$/, "");
    let m: RegExpMatchArray | null;

    if (/^\s*\|.*\|\s*$/.test(line) && isSepRow(lines[i + 1])) {
      flushQuote();
      const header = parseTableRow(line);
      let j = i + 2;
      const rows: string[][] = [];
      while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j] ?? "")) {
        rows.push(parseTableRow(lines[j] ?? ""));
        j++;
      }
      body += rtfTable(header, rows);
      i = j;
      continue;
    }

    if ((m = line.match(/^%%ETAB%%\s*(.*)$/))) {
      flushQuote();
      body += "\\pard\\qc\\brdrb\\brdrs\\brdrw15\\brsp60 \\b\\fs22 " + inlineRtf(m[1] ?? "") + "\\b0\\par\\pard\\fs22 ";
      i++; continue;
    }
    if ((m = line.match(/^%%TITRE%%\s*(.*)$/))) {
      flushQuote();
      body += "\\pard\\qc\\brdrb\\brdrs\\brdrw15\\brsp60 \\b\\fs32 " + inlineRtf(m[1] ?? "") + "\\b0\\fs22\\par\\pard\\fs22 ";
      i++; continue;
    }
    if ((m = line.match(/^%%TITREBOX%%\s*(.*)$/))) {
      flushQuote();
      body += "\\pard\\qc\\box\\brdrs\\brdrw15\\brsp100 \\b\\fs28 " + inlineRtf(m[1] ?? "") + "\\b0\\fs22\\par\\pard\\fs22 ";
      i++; continue;
    }
    if ((m = line.match(/^%%SOUSTITRE%%\s*(.*)$/))) {
      flushQuote();
      body += "\\pard\\qc\\i\\fs22 " + inlineRtf(m[1] ?? "") + "\\i0\\par\\pard\\fs22 ";
      i++; continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) {
      quote.push(m[1] ?? "");
      i++; continue;
    }
    flushQuote();
    if (/^\s*---\s*$/.test(line)) {
      body += "\\par\\pard\\brdrb\\brdrs\\brdrw10\\brsp20 \\par\\pard ";
      i++; continue;
    }
    if ((m = line.match(/^###\s+(.*)$/))) {
      body += "\\par{\\b\\fs26 " + inlineRtf(m[1] ?? "") + "}\\par ";
      i++; continue;
    }
    if ((m = line.match(/^##\s+(.*)$/))) {
      body += "\\par{\\b\\fs30 " + inlineRtf(m[1] ?? "") + "}\\par ";
      i++; continue;
    }
    if ((m = line.match(/^#\s+(.*)$/))) {
      body += "\\par\\pard\\brdrb\\brdrs\\brdrw10\\brsp40{\\b\\fs30 " + inlineRtf(m[1] ?? "") + "}\\par\\pard\\fs22 ";
      i++; continue;
    }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/)) || (m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      body += "\\par\\bullet\\tab " + inlineRtf(m[1] ?? "") + " ";
      inList = true;
      i++; continue;
    }
    if (line.trim() === "") {
      body += "\\par ";
      inList = false;
      i++; continue;
    }
    body += (inList ? "" : "\\par ") + inlineRtf(line) + " ";
    inList = false;
    i++;
  }
  flushQuote();
  return "{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs22 " + body + "}";
}

export function downloadAsWord(titre: string, markdown: string) {
  downloadTextFile(markdownToRtf(markdown), `${titre.replace(/\s+/g, "-")}.rtf`, "application/rtf");
}
