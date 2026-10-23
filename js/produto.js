// Página de produto: troca de foto, escolha de cor/tamanho e mensagem do WhatsApp.
(function () {
  var form = document.querySelector('.pd-info');
  if (!form) return;
  var main = document.querySelector('.pd-main img');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.pd-thumbs a'));
  var cta = form.querySelector('.pd-cta');
  var corLabel = form.querySelector('[data-cor]');

  function mostrar(i) {
    var t = thumbs[i];
    if (!t || !main) return;
    main.src = t.getAttribute('href');
    main.alt = t.getAttribute('data-alt');
    thumbs.forEach(function (x, j) {
      if (j === i) x.setAttribute('aria-current', 'true');
      else x.removeAttribute('aria-current');
    });
  }

  thumbs.forEach(function (t, i) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      mostrar(i);
    });
  });

  function escolhido(nome) {
    var r = form.querySelector('input[name="' + nome + '"]:checked');
    return r ? r.value : '';
  }

  function atualizar() {
    var cor = escolhido('cor');
    var tam = escolhido('tamanho');
    if (cor) corLabel.textContent = cor;
    var msg = 'Olá! Quero comprar: ' + form.getAttribute('data-produto');
    if (cor) msg += ', cor ' + cor;
    if (tam) msg += ', tamanho ' + tam;
    msg += '.';
    cta.href = 'https://wa.me/558194110631?text=' + encodeURIComponent(msg);
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'cor' && e.target.hasAttribute('data-foto')) mostrar(Number(e.target.getAttribute('data-foto')));
    atualizar();
  });

  // Cor vinda do link da listagem, ex.: produto.html?cor=bege
  var pedida = new URLSearchParams(location.search).get('cor');
  if (pedida) {
    form.querySelectorAll('input[name="cor"]').forEach(function (r) {
      if (r.getAttribute('data-slug') === pedida) {
        r.checked = true;
        if (r.hasAttribute('data-foto')) mostrar(Number(r.getAttribute('data-foto')));
      }
    });
  }
  atualizar();
})();
