import { api, initLayout, productCard, productVisual, priceHTML, esc, qs, cart, toast } from './app.js';

const store = await initLayout();
const slug = new URLSearchParams(location.search).get('p');
const root = qs('#pdp');

let p;
try {
  p = await api(`/products/${encodeURIComponent(slug || '')}`);
} catch {
  root.innerHTML = `<div class="empty" style="margin:2rem 0 5rem"><h3>Essa peça saiu do catálogo</h3><p>Ela pode ter esgotado ou mudado de nome.</p><a class="btn" href="catalogo.html">Ver todas as peças</a></div>`;
  throw new Error('produto não encontrado');
}

document.title = `${p.name} — Combate Sports`;
const audLabel = { feminino: 'Feminino', masculino: 'Masculino', unissex: 'Unissex' }[p.audience];
qs('#crumbs').innerHTML = `<a href="index.html">Início</a> / <a href="catalogo.html?publico=${p.audience === 'unissex' ? '' : p.audience}">${audLabel}</a> / <a href="catalogo.html?categoria=${p.category}">${esc(p.category_name)}</a>`;

// começa na primeira cor que tem estoque
let colorId = (p.colors.find(c => p.variants.some(v => v.color_id === c.id && v.stock > 0)) || p.colors[0])?.id;
let size = null;

root.innerHTML = `
  <div class="pdp">
    <div class="pdp-gallery">
      <div class="pdp-media" id="media"></div>
      <div class="thumbs" id="thumbs"></div>
    </div>
    <div class="pdp-info">
      <span class="aud">${audLabel} · ${esc(p.category_name)}</span>
      <h1>${esc(p.name)}</h1>
      ${priceHTML(p, store?.installments)}

      <div class="opt">
        <div class="opt-label">Cor: <span id="color-name"></span></div>
        <div class="color-opts" role="group" aria-label="Cor">
          ${p.colors.map(c => `<button class="swatch" type="button" data-color="${c.id}" style="background:${c.hex}" aria-label="${esc(c.name)}" title="${esc(c.name)}"></button>`).join('')}
        </div>
      </div>

      <div class="opt">
        <div class="opt-label">Tamanho <span>— dúvida? chame no WhatsApp</span></div>
        <div class="size-opts" id="sizes" role="group" aria-label="Tamanho"></div>
        <p class="stock-hint" id="stock-hint" aria-live="polite"></p>
      </div>

      <div class="buy">
        <button class="btn red block" type="button" id="add">Adicionar à sacola</button>
        <a class="btn wa block" id="ask" target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a>
      </div>

      <div class="desc">
        <details open><summary>Sobre a peça</summary><div>${p.description.split('\n').filter(Boolean).map(t => `<p style="margin:0 0 .6rem">${esc(t)}</p>`).join('')}</div></details>
        <details><summary>Retirada e entrega</summary><div><p style="margin:0">Retire na loja da ${esc(store?.address || '')}, em Caruaru, ou combine a entrega pelo WhatsApp.</p></div></details>
      </div>
    </div>
  </div>`;

const variantFor = (c, s) => p.variants.find(v => v.color_id === c && v.size === s);

function render() {
  const color = p.colors.find(c => c.id === colorId);
  qs('#color-name').textContent = color?.name || '';
  root.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.color) === colorId));

  // fotos da cor
  const imgs = p.images.filter(i => i.color_id === colorId || !i.color_id);
  qs('#media').innerHTML = productVisual(p, colorId);
  qs('#thumbs').innerHTML = imgs.length > 1 ? imgs.map((im, i) => `<button type="button" aria-label="Foto ${i + 1}" aria-pressed="${i === 0}" data-img="${esc(im.url)}" style="background-image:url('${esc(im.url)}')"></button>`).join('') : '';
  qs('#thumbs').querySelectorAll('[data-img]').forEach(b => b.onclick = () => {
    qs('#thumbs').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    qs('#media').innerHTML = `<img class="photo" src="${b.dataset.img}" alt="${esc(p.name)}">`;
  });

  // tamanhos (desabilita os esgotados nessa cor)
  qs('#sizes').innerHTML = p.sizes.map(s => {
    const v = variantFor(colorId, s);
    const out = !v || v.stock <= 0;
    return `<button type="button" data-size="${s}" aria-pressed="${s === size}" ${out ? 'disabled aria-label="' + s + ', esgotado"' : ''}>${s}</button>`;
  }).join('');
  qs('#sizes').querySelectorAll('[data-size]').forEach(b => b.onclick = () => { size = b.dataset.size; render(); });

  const v = size && variantFor(colorId, size);
  const hint = qs('#stock-hint');
  if (size && (!v || v.stock <= 0)) { size = null; hint.textContent = ''; }
  else if (v && v.stock <= 3) hint.textContent = v.stock === 1 ? 'Última peça nesse tamanho' : `Últimas ${v.stock} peças nesse tamanho`;
  else hint.textContent = '';

  const add = qs('#add');
  const anyInColor = p.variants.some(x => x.color_id === colorId && x.stock > 0);
  add.disabled = !anyInColor;
  add.textContent = !anyInColor ? 'Esgotado nessa cor' : size ? 'Adicionar à sacola' : 'Escolha o tamanho';

  const msg = `Olá! Tenho uma dúvida sobre a peça ${p.name} (${color?.name}${size ? `, tam. ${size}` : ''}).`;
  qs('#ask').href = `https://wa.me/${store?.whatsapp}?text=${encodeURIComponent(msg)}`;
}

root.querySelectorAll('[data-color]').forEach(b => b.addEventListener('click', () => { colorId = Number(b.dataset.color); render(); }));

qs('#add').addEventListener('click', () => {
  if (!size) {
    qs('#stock-hint').textContent = 'Escolha um tamanho para adicionar.';
    qs('#sizes button:not(:disabled)')?.focus();
    return;
  }
  const v = variantFor(colorId, size);
  const color = p.colors.find(c => c.id === colorId);
  const img = p.images.find(i => i.color_id === colorId) || p.images[0];
  cart.add({
    variant_id: v.id, slug: p.slug, name: p.name, category: p.category,
    color: color.name, hex: color.hex, size, price_cents: p.price_cents, stock: v.stock, qty: 1,
    image: img?.url || null,
  });
  toast(`${p.name} (${size}) na sacola`);
  document.dispatchEvent(new CustomEvent('cart:open'));
});

render();

// relacionados: mesma linha, outra peça
const related = (await api(`/products?audience=${p.audience === 'unissex' ? '' : p.audience}&limit=9`).catch(() => []))
  .filter(x => x.id !== p.id && x.category !== p.category).slice(0, 4);
if (related.length) {
  qs('#related').replaceChildren(...related.map(productCard));
  qs('#related-section').hidden = false;
}
