/* Shared PDF and EPUB reader for the Annual Reports library. */
(function () {
  'use strict';
  const cache = new Map();
  function script(url) {
    if (!cache.has(url)) cache.set(url, new Promise((resolve, reject) => {
      const node = document.createElement('script'); node.src = url;
      node.onload = resolve; node.onerror = () => { cache.delete(url); reject(new Error('The reader could not load. Check your internet connection.')); };
      document.head.append(node);
    }));
    return cache.get(url);
  }
  async function libraries(type) {
    if (type === 'pdf') {
      await script('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    } else {
      await script('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      await script('https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js');
    }
  }
  async function bytes(url) {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) throw new Error('The document could not be loaded.');
    return response.arrayBuffer();
  }
  async function cover(url, type, target) {
    try {
      await libraries(type);
      if (!target.isConnected) return;
      if (type === 'pdf') {
        const document = await pdfjsLib.getDocument({data: await bytes(url)}).promise;
        try {
          const page = await document.getPage(1), original = page.getViewport({scale: 1});
          const viewport = page.getViewport({scale: 320 / original.width});
          const canvas = window.document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
          await page.render({canvasContext: canvas.getContext('2d'), viewport}).promise;
          if (target.isConnected) target.replaceChildren(canvas);
        } finally { await document.destroy(); }
      } else {
        const book = ePub(await bytes(url));
        try {
          await book.ready; const image = await book.coverUrl();
          if (image && target.isConnected) {
            const img = window.document.createElement('img'); img.alt = ''; img.src = image;
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            const canvas = window.document.createElement('canvas'); canvas.width = Math.min(img.naturalWidth, 320); canvas.height = Math.round(img.naturalHeight * canvas.width / img.naturalWidth);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            if (target.isConnected) target.replaceChildren(canvas);
          }
        } finally { book.destroy(); }
      }
    } catch (_) { /* The labelled fallback remains available. */ }
  }
  async function open({url, type, title}) {
    const dialog = document.createElement('dialog'); dialog.className = 'ar-reader'; dialog.setAttribute('aria-label', 'Reader: ' + title);
    dialog.innerHTML = '<div class="ar-reader-layout"><header class="ar-reader-head"><strong></strong><button type="button" class="ar-reader-close" aria-label="Close reader">×</button></header><div class="ar-reader-stage"><p class="ar-reader-status" role="status">Opening document…</p><canvas class="ar-reader-pdf" hidden></canvas><div class="ar-reader-epub" hidden></div></div><footer class="ar-reader-tools"><button type="button" data-action="previous" aria-label="Previous page">‹</button><span class="ar-reader-page" aria-live="polite"></span><button type="button" data-action="next" aria-label="Next page">›</button><button type="button" data-action="smaller" aria-label="Zoom out">−</button><button type="button" data-action="larger" aria-label="Zoom in">+</button><a class="ar-reader-download" target="_blank" rel="noopener noreferrer" aria-label="Open document in a new tab">↗</a></footer></div>';
    dialog.querySelector('strong').textContent = title; dialog.querySelector('.ar-reader-download').href = url;
    document.body.append(dialog); const previousFocus = document.activeElement;
    let documentFile, book, rendition, task, pageNumber = 1, zoom = 1, generation = 0;
    dialog.addEventListener('close', () => { generation++; task?.cancel(); book?.destroy(); documentFile?.destroy(); dialog.remove(); if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true}); });
    dialog.querySelector('.ar-reader-close').onclick = () => dialog.close();
    dialog.showModal();
    const status = dialog.querySelector('.ar-reader-status'), canvas = dialog.querySelector('.ar-reader-pdf'), stage = dialog.querySelector('.ar-reader-stage'), pageLabel = dialog.querySelector('.ar-reader-page');
    async function renderPdf() {
      const current = ++generation;
      if (task) { task.cancel(); try { await task.promise; } catch (_) {} }
      const page = await documentFile.getPage(pageNumber); if (current !== generation) return;
      const base = page.getViewport({scale:1}), scale = Math.max(.1, Math.min((stage.clientWidth - 24) / base.width, (stage.clientHeight - 24) / base.height)) * zoom;
      const viewport = page.getViewport({scale}), dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(viewport.width * dpr); canvas.height = Math.ceil(viewport.height * dpr); canvas.style.width = viewport.width + 'px'; canvas.style.height = viewport.height + 'px';
      task = page.render({canvasContext:canvas.getContext('2d'), viewport, transform:dpr === 1 ? null : [dpr,0,0,dpr,0,0]});
      try { await task.promise; } catch (error) { if (error.name !== 'RenderingCancelledException') throw error; }
      if (current === generation) { canvas.hidden = false; status.hidden = true; pageLabel.textContent = `Page ${pageNumber} of ${documentFile.numPages}`; }
    }
    try {
      await libraries(type); const buffer = await bytes(url); if (!dialog.open) return;
      if (type === 'pdf') { documentFile = await pdfjsLib.getDocument({data:buffer}).promise; await renderPdf(); }
      else {
        book = ePub(buffer); const area = dialog.querySelector('.ar-reader-epub'); area.hidden = false;
        rendition = book.renderTo(area, {width:'100%',height:'100%',spread:'none',allowScriptedContent:false});
        await rendition.display(); status.hidden = true; pageLabel.textContent = 'EPUB';
      }
      dialog.querySelector('[data-action=previous]').onclick = () => { if (rendition) rendition.prev(); else if (pageNumber > 1) { pageNumber--; renderPdf().catch(showError); } };
      dialog.querySelector('[data-action=next]').onclick = () => { if (rendition) rendition.next(); else if (pageNumber < documentFile.numPages) { pageNumber++; renderPdf().catch(showError); } };
      dialog.querySelector('[data-action=smaller]').onclick = () => { zoom = Math.max(.6, zoom - .2); if (rendition) rendition.themes.fontSize(Math.round(zoom * 100) + '%'); else renderPdf().catch(showError); };
      dialog.querySelector('[data-action=larger]').onclick = () => { zoom = Math.min(2.4, zoom + .2); if (rendition) rendition.themes.fontSize(Math.round(zoom * 100) + '%'); else renderPdf().catch(showError); };
      dialog.addEventListener('keydown', event => {
        if (event.target.matches('input, textarea, select')) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); dialog.querySelector(event.key === 'ArrowLeft' ? '[data-action=previous]' : '[data-action=next]').click(); }
      });
      const resize = () => { if (dialog.open && documentFile) renderPdf().catch(showError); };
      window.addEventListener('resize', resize); dialog.addEventListener('close', () => window.removeEventListener('resize', resize), {once:true});
    } catch (error) { showError(error); }
    function showError(error) { if (!dialog.open) return; status.hidden = false; status.textContent = error.message || 'The document could not be opened.'; }
  }
  window.OMEAnnualReader = { open, cover };
})();
