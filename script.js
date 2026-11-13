// ==UserScript==
// @name         LinkedIn Learning → Task List Exporter
// @namespace    https://example.local/lil-exporter
// @version      1.0
// @description  Copy a LinkedIn Learning course's modules (sections + videos) as a plain-text list for Todoist, Habitica, etc.
// @match        https://www.linkedin.com/learning/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  /* ---------- Selector fallbacks (LinkedIn changes class names often) ---------- */
  const SEL = {
    courseTitle: [
      '.classroom-nav__details h1',
      'h1.top-card__title',
      'h1[class*="course"]',
      'h1',
    ],
    section: [
      '.classroom-toc-section',
      '[class*="toc-section"]',
      '[class*="course-toc"] section',
    ],
    sectionToggle: [
      'button.classroom-toc-section__toggle',
      '[class*="toc-section"] button[aria-expanded]',
    ],
    sectionTitle: [
      '.classroom-toc-section__toggle-title',
      '[class*="toc-section__title"]',
      '[class*="toc-section"] h2',
      '[class*="toc-section"] h3',
      'button span',
    ],
    item: [
      '.classroom-toc-item',
      '[class*="toc-item"]',
      'li[class*="toc"]',
    ],
    itemTitle: [
      '.classroom-toc-item__title',
      '[class*="toc-item__title"]',
      '[class*="item__title"]',
      'a',
    ],
    itemDuration: [
      '.classroom-toc-item__duration',
      '[class*="toc-item__duration"]',
      '[class*="duration"]',
    ],
  };

  const $first = (root, sels) => {
    for (const s of sels) {
      const el = root.querySelector(s);
      if (el) return el;
    }
    return null;
  };
  const $all = (root, sels) => {
    for (const s of sels) {
      const els = [...root.querySelectorAll(s)];
      if (els.length) return els;
    }
    return [];
  };
  const clean = (t) =>
    (t || '')
      .replace(/\s+/g, ' ')
      .replace(/^(Video|Quiz|Chapter quiz|Practice)\s*:\s*/i, '')
      .replace(/\s*\(?\d+\s*h?\s*\d*\s*m?\s*\d*\s*s?\)?\s*$/i, '') // trailing durations like "3m 12s"
      .replace(/\s*\(?(Viewed|In progress|Not started|Completed)\)?\s*$/i, '')
      .trim();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Scraping ---------- */
  async function expandAllSections() {
    const toggles = $all(document, SEL.sectionToggle);
    for (const btn of toggles) {
      if (btn.getAttribute('aria-expanded') === 'false') {
        btn.click();
        await sleep(120);
      }
    }
    await sleep(300);
  }

  async function scrape() {
    await expandAllSections();

    const courseTitle = clean(($first(document, SEL.courseTitle) || {}).textContent) || document.title;
    const sections = $all(document, SEL.section);
    const data = [];

    sections.forEach((sec) => {
      const titleEl = $first(sec, SEL.sectionTitle);
      const title = clean(titleEl && titleEl.textContent);
      const items = $all(sec, SEL.item)
        .map((it) => {
          const t = clean(($first(it, SEL.itemTitle) || it).textContent);
          const d = ($first(it, SEL.itemDuration) || {}).textContent;
          return { title: t, duration: (d || '').replace(/\s+/g, ' ').trim() };
        })
        .filter((i) => i.title);
      if (title || items.length) data.push({ title, items });
    });

    return { courseTitle, sections: data };
  }

  /* ---------- Formatting ---------- */
  function format({ courseTitle, sections }, opts) {
    const lines = [];
    const dur = (i) => (opts.durations && i.duration ? ` (${i.duration})` : '');
    const course = opts.prefix ? `${courseTitle} – ` : '';

    if (opts.mode === 'todoist-nested') {
      // Section = parent task, videos = indented subtasks (Todoist honours indentation on paste)
      if (opts.courseAsParent) lines.push(courseTitle);
      sections.forEach((s, si) => {
        const base = opts.courseAsParent ? '  ' : '';
        lines.push(`${base}${s.title || 'Section ' + (si + 1)}`);
        s.items.forEach((i) => lines.push(`${base}  ${i.title}${dur(i)}`));
      });
    } else if (opts.mode === 'sections-only') {
      sections.forEach((s, si) => lines.push(`${course}${s.title || 'Section ' + (si + 1)}`));
    } else if (opts.mode === 'numbered') {
      let n = 1;
      sections.forEach((s) =>
        s.items.forEach((i) => lines.push(`${course}${String(n++).padStart(2, '0')}. ${i.title}${dur(i)}`))
      );
    } else {
      // flat: every video on its own line
      sections.forEach((s) =>
        s.items.forEach((i) => lines.push(`${course}${i.title}${dur(i)}`))
      );
    }
    return lines.join('\n');
  }

  /* ---------- UI ---------- */
  function buildPanel() {
    if (document.getElementById('lil-exp-panel')) return;

    const style = document.createElement('style');
    style.textContent = `
      #lil-exp-btn{position:fixed;right:16px;bottom:16px;z-index:99999;background:#0a66c2;color:#fff;border:0;border-radius:24px;padding:10px 16px;font:600 14px system-ui;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}
      #lil-exp-panel{position:fixed;right:16px;bottom:64px;z-index:99999;width:340px;background:#fff;color:#222;border:1px solid #ccc;border-radius:8px;padding:12px;font:13px system-ui;box-shadow:0 4px 16px rgba(0,0,0,.3);display:none}
      #lil-exp-panel label{display:block;margin:6px 0}
      #lil-exp-panel select,#lil-exp-panel textarea{width:100%;box-sizing:border-box;margin-top:4px}
      #lil-exp-panel textarea{height:180px;font:12px monospace}
      #lil-exp-panel button{margin-top:8px;margin-right:6px;padding:6px 10px;cursor:pointer}
    `;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = 'lil-exp-btn';
    btn.textContent = '📋 Export modules';

    const panel = document.createElement('div');
    panel.id = 'lil-exp-panel';
    panel.innerHTML = `
      <label>Format
        <select id="lil-mode">
          <option value="todoist-nested">Nested (sections → videos) – Todoist</option>
          <option value="flat">Flat list of videos – Habitica</option>
          <option value="numbered">Numbered videos (01., 02., …)</option>
          <option value="sections-only">Sections only</option>
        </select>
      </label>
      <label><input type="checkbox" id="lil-dur"> Include durations</label>
      <label><input type="checkbox" id="lil-prefix"> Prefix each line with course title</label>
      <label><input type="checkbox" id="lil-parent"> Course title as top-level parent (nested only)</label>
      <button id="lil-run">Scrape</button>
      <button id="lil-copy">Copy</button>
      <span id="lil-status"></span>
      <textarea id="lil-out" placeholder="Output appears here…"></textarea>
    `;

    document.body.append(panel, btn);
    btn.onclick = () => (panel.style.display = panel.style.display === 'block' ? 'none' : 'block');

    let cache = null;
    const $ = (id) => panel.querySelector(id);
    const render = () => {
      if (!cache) return;
      $('#lil-out').value = format(cache, {
        mode: $('#lil-mode').value,
        durations: $('#lil-dur').checked,
        prefix: $('#lil-prefix').checked,
        courseAsParent: $('#lil-parent').checked,
      });
    };

    $('#lil-run').onclick = async () => {
      $('#lil-status').textContent = 'Scraping…';
      cache = await scrape();
      const count = cache.sections.reduce((n, s) => n + s.items.length, 0);
      $('#lil-status').textContent = count
        ? `Found ${cache.sections.length} sections, ${count} items`
        : 'Nothing found – open the Contents sidebar and retry';
      render();
    };
    ['#lil-mode', '#lil-dur', '#lil-prefix', '#lil-parent'].forEach((s) => ($(s).onchange = render));
    $('#lil-copy').onclick = () => {
      const text = $('#lil-out').value;
      if (!text) return;
      if (typeof GM_setClipboard === 'function') GM_setClipboard(text);
      else navigator.clipboard.writeText(text);
      $('#lil-status').textContent = 'Copied ✔';
    };
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Export modules', () => {
      buildPanel();
      document.getElementById('lil-exp-btn').click();
    });
  }
  buildPanel();
})();
