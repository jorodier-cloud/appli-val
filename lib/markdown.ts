export function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/**
 * Rendu Markdown minimal (titres, gras/italique, listes, séparateurs) vers du
 * HTML échappé — suffisant pour afficher les contenus générés par l'IA sans
 * dépendance externe. Pas de tableaux ni de code : les documents générés n'en
 * utilisent pas.
 */
export function markdownToHtml(text: string): string {
  let h = escapeHtml(text);
  h = h
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>");
  h = h.replace(/^\s*---\s*$/gm, "<hr>");
  h = h
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "<em>$1</em>");
  h = h
    .replace(/^\s*[-*]\s+(.*)$/gm, "<li>$1</li>")
    .replace(/^\s*\d+[.)]\s+(.*)$/gm, "<li>$1</li>");
  h = h.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>");
  h = h
    .split(/\n{2,}/)
    .map((block) => (/^\s*<(h\d|ul|hr)/.test(block) ? block : "<p>" + block.replace(/\n/g, "<br>") + "</p>"))
    .join("");
  return h;
}

export function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function downloadAsWord(titre: string, markdown: string) {
  const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8">
    <style>body{font-family:Arial;font-size:11pt;color:#000}h1{font-size:15pt}h2{font-size:13pt}
    table{border-collapse:collapse}td,th{border:1px solid #000;padding:4px}</style></head>
    <body>${markdownToHtml(markdown)}</body></html>`;
  downloadTextFile(html, `${titre.replace(/\s+/g, "-")}.doc`, "application/msword");
}
