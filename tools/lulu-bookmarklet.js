/* Botão de favorito "Enviar pro Dedé".
   Uso: no Lulu (Pipe Design), clique no favorito e depois clique no card.
   Ele só LÊ o que está na tela (nome do card, vendedor, data/hora e o pedido) e abre o Dedé
   com a janela "Registrar card" já preenchida. Não altera nada no Lulu. */
(function () {
  var DEDE = '__DEDE__';
  var M = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var tip = document.createElement('div');
  tip.textContent = 'Dedé: clique no card que você quer registrar (Esc cancela)';
  tip.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:2147483647;background:#FDB913;color:#1a1a1a;font:600 13px/1.2 system-ui,sans-serif;padding:10px 16px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.35)';
  document.body.appendChild(tip);
  function done() { tip.remove(); document.removeEventListener('click', onClick, true); document.removeEventListener('keydown', onKey, true); }
  function onKey(e) { if (e.key === 'Escape') done(); }
  function txt(el, sel) { var x = el && el.querySelector(sel); return x ? x.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function onClick(e) {
    var card = e.target.closest('[aria-roledescription=draggable]') || e.target.closest('tr');
    if (!card) return;
    done();
    var title = txt(card, 'p.font-medium') || txt(card, 'td');
    var sub = txt(card, 'p.truncate');
    var nome = (sub.split(' • ')[0] || title).trim();
    var w = window.open('', 'dede');
    setTimeout(function () {
      var data = '', hora = '';
      var dlg = Array.prototype.find.call(document.querySelectorAll('[role=dialog]'), function (d) { return d.innerText.indexOf(title) > -1; });
      var m = (dlg ? dlg.innerText : '').match(/(\d{1,2}) de ([a-zç]+)(?: de (\d{4}))? às (\d{1,2}:\d{2})/i);
      if (m) { data = (m[3] || new Date().getFullYear()) + '-' + String(M.indexOf(m[2].toLowerCase()) + 1).padStart(2, '0') + '-' + m[1].padStart(2, '0'); hora = m[4].padStart(5, '0'); }
      var v = (dlg ? dlg.innerText : '').match(/Criado por ([^\n•]+)/i);
      var q = new URLSearchParams({ card: nome, vendedor: v ? v[1].trim() : '', pedido: title, data: data, hora: hora, link: location.href });
      var url = DEDE + '#registrar?' + q.toString();
      if (w) { w.location.href = url; w.focus(); } else location.href = url;
    }, 700);
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
})();
