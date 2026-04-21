export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function fmtInline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="md-link" data-url="$2" style="color: #e0e0e0; text-decoration: underline; text-decoration-color: #555; cursor: pointer;">$1</a>')
}

export interface ParsedPart {
  type: 'text' | 'code'
  content: string
  language?: string
}

export function parseCodeBlocks(text: string): ParsedPart[] {
  const parts: ParsedPart[] = []
  const regex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) })
    }
    parts.push({ type: 'code', language: match[1] || 'Code', content: match[2] })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex)
    // If there's an unclosed code fence, render it as a code block in progress
    const openFence = remaining.indexOf('```')
    if (openFence !== -1) {
      if (openFence > 0) {
        parts.push({ type: 'text', content: remaining.substring(0, openFence) })
      }
      const fenceContent = remaining.substring(openFence + 3)
      const langEnd = fenceContent.indexOf('\n')
      const lang = langEnd > -1 ? fenceContent.substring(0, langEnd) : ''
      const code = langEnd > -1 ? fenceContent.substring(langEnd + 1) : fenceContent
      parts.push({ type: 'code', language: lang || 'Code', content: code })
    } else {
      parts.push({ type: 'text', content: remaining })
    }
  }

  return parts
}

export function renderMarkdown(text: string): string {
  const lines = text.split('\n')
  let html = ''
  let inUl = false, inOl = false
  let blankCount = 0
  let tableLines: string[] = []

  function closeLists() {
    if (inUl) { html += '</ul>'; inUl = false }
    if (inOl) { html += '</ol>'; inOl = false }
  }

  function flushTable() {
    if (tableLines.length < 2) {
      tableLines.forEach(l => { html += `<p class="md-p">${fmtInline(escHtml(l))}</p>` })
      tableLines = []
      return
    }
    const parseRow = (r: string) => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    const headers = parseRow(tableLines[0])
    const rows = tableLines.slice(2).map(parseRow)
    const csvRows = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
    const csvData = csvRows.join('\n')
    const csvB64 = btoa(unescape(encodeURIComponent(csvData)))

    let t = `<div class="md-table-wrap">`
    t += `<div class="md-table-header">`
    t += `<button class="code-copy-btn" title="Download CSV" onclick="(function(){const a=document.createElement('a');a.href='data:text/csv;base64,${csvB64}';a.download='table.csv';a.click();})()">`
    t += `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>`
    t += `<button class="code-copy-btn" title="Copy as CSV" onclick="(function(b){navigator.clipboard.writeText(b)})(${JSON.stringify(csvData)})">`
    t += `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>`
    t += `</div>`
    t += `<table class="md-table"><thead><tr>`
    headers.forEach(h => { t += `<th>${fmtInline(escHtml(h))}</th>` })
    t += '</tr></thead><tbody>'
    rows.forEach(row => {
      t += '<tr>'
      row.forEach(cell => { t += `<td>${fmtInline(escHtml(cell))}</td>` })
      t += '</tr>'
    })
    t += '</tbody></table></div>'
    html += t
    tableLines = []
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const t = raw.trim()

    if (t.startsWith('|') && t.endsWith('|')) {
      closeLists()
      tableLines.push(t)
      blankCount = 0
      continue
    } else if (tableLines.length > 0) {
      flushTable()
    }

    if (t === '') { blankCount++; closeLists(); continue }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { closeLists(); html += '<hr>'; blankCount = 0; continue }

    // Blockquote
    if (t.startsWith('> ')) {
      closeLists()
      html += `<blockquote class="md-blockquote">${fmtInline(escHtml(t.slice(2)))}</blockquote>`
      blankCount = 0
      continue
    }

    if (t.startsWith('### ')) { closeLists(); html += `<h3>${fmtInline(escHtml(t.slice(4)))}</h3>`; blankCount = 0; continue }
    if (t.startsWith('## ')) { closeLists(); html += `<h2>${fmtInline(escHtml(t.slice(3)))}</h2>`; blankCount = 0; continue }
    if (t.startsWith('# ')) { closeLists(); html += `<h1>${fmtInline(escHtml(t.slice(2)))}</h1>`; blankCount = 0; continue }

    if (/^[-*+] /.test(t)) {
      if (inOl) { html += '</ol>'; inOl = false }
      if (!inUl) { html += '<ul>'; inUl = true }
      html += `<li>${fmtInline(escHtml(t.replace(/^[-*+] /, '')))}</li>`
      blankCount = 0; continue
    }

    const olM = t.match(/^(\d+)[.)\s] (.+)/)
    if (olM) {
      if (inUl) { html += '</ul>'; inUl = false }
      if (!inOl) { html += '<ol>'; inOl = true }
      html += `<li>${fmtInline(escHtml(olM[2]))}</li>`
      blankCount = 0; continue
    }

    closeLists()
    const spacer = blankCount > 0 ? ' spaced' : ''
    html += `<p class="md-p${spacer}">${fmtInline(escHtml(t))}</p>`
    blankCount = 0
  }

  if (tableLines.length > 0) flushTable()
  closeLists()
  return html
}
