import { api, initLayout, productCard, skeletonCards, esc, qs, brl } from './app.js';

await initLayout();

const form = qs('#filters');
const results = qs('#results');
const params = new URLSearchParams(location.search);

const [allCats, allColors, all] = await Promise.all([
  api('/categories').catch(() => []), api('/colors').catch(() => []), api('/products').catch(() => []),
]);
// só mostra filtros que têm peças
const cats = allCats.filter(c => c.product_count > 0);
const usedColors = new Set(all.flatMap(p => p.colors.map(c => c.name)));
const colors = allColors.filter(c => usedColors.has(c.name));
const SIZE_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'];
const sizes = SIZE_ORDER.filter(s => all.some(p => p.sizes.includes(s)));

qs('#f-cat').innerHTML = cats.map(c => `<label class="chip"><input type="radio" name="categoria" value="${c.slug}"><span>${esc(c.name)}</span></label>`).join('')
  + '<label class="chip"><input type="radio" name="categoria" value="" checked><span>Todas</span></label>';
qs('#f-size').innerHTML = sizes.map(s => `<label class="chip"><input type="radio" name="tamanho" value="${s}"><span>${s}</span></label>`).join('');
qs('#f-color').innerHTML = colors.map(c => `<label class="chip"><input type="radio" name="cor" value="${esc(c.name)}"><span><i style="background:${c.hex}"></i>${esc(c.name)}</span></label>`).join('');
if (!all.some(p => p.price_cents != null)) qs('#f-price').closest('fieldset').remove();
if (!all.some(p => p.compare_at_cents > p.price_cents)) form.querySelector('[name=promo]').closest('fieldset').remove();

// preenche o formulário a partir da URL
for (const [k, v] of params) {
  const inputs = form.querySelectorAll(`[name="${k}"]`);
  inputs.forEach(i => { if (i.type === 'radio' || i.type === 'checkbox') i.checked = i.value === v; else i.value = v; });
}
qs('#sort').value = params.get('sort') || '';
if (params.get('q')) document.querySelectorAll('.search input').forEach(i => { i.value = params.get('q'); });

const priceOut = () => { if (!qs('#f-price')) return; qs('#price-out').textContent = qs('#f-price').value >= 150 ? 'qualquer valor' : brl(qs('#f-price').value * 100).replace(',00', ''); };

function readFilters() {
  const f = Object.fromEntries(new FormData(form));
  return {
    publico: f.publico || '', categoria: f.categoria || '', tamanho: f.tamanho || '', cor: f.cor || '',
    preco: Number(f.preco) < 150 ? f.preco : '', promo: f.promo || '', sort: qs('#sort').value, q: params.get('q') || '',
  };
}

let reqId = 0;
async function load() {
  priceOut();
  const f = readFilters();
  // URL compartilhável
  const url = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
  history.replaceState(null, '', `catalogo.html${url.toString() ? '?' + url : ''}`);

  const catName = cats.find(c => c.slug === f.categoria)?.name;
  qs('#title').textContent = f.q ? `Busca: “${f.q}”`
    : f.promo ? 'Promoções'
    : catName || (f.publico ? f.publico[0].toUpperCase() + f.publico.slice(1) : 'Todas as peças');
  qs('#subtitle').textContent = [catName && f.publico ? `Linha ${f.publico}` : '', f.publico ? 'Inclui peças unissex.' : ''].filter(Boolean).join('. ');

  const api_q = new URLSearchParams(Object.entries({
    audience: f.publico, category: f.categoria, size: f.tamanho, color: f.cor,
    max_price: f.preco, sale: f.promo, sort: f.sort, q: f.q,
  }).filter(([, v]) => v));

  results.innerHTML = skeletonCards(6);
  const id = ++reqId;
  try {
    const list = await api(`/products?${api_q}`);
    if (id !== reqId) return;
    qs('#count').textContent = `${list.length} ${list.length === 1 ? 'peça' : 'peças'}`;
    if (!list.length) {
      results.innerHTML = `<div class="empty"><h3>Nenhuma peça com esses filtros</h3><p>Tire um filtro ou chame a loja no WhatsApp: às vezes a peça chega antes de entrar no site.</p><button class="btn ghost" type="button" id="clear">Limpar filtros</button></div>`;
      qs('#clear').onclick = () => { form.reset(); params.delete('q'); load(); };
      return;
    }
    results.replaceChildren(...list.map(productCard));
  } catch (e) {
    results.innerHTML = `<div class="empty"><p>${esc(e.message)}</p></div>`;
  }
}

form.addEventListener('change', load);
form.addEventListener('input', e => { if (e.target.type === 'range') priceOut(); });
form.addEventListener('reset', () => { params.delete('q'); setTimeout(load); });
qs('#sort').addEventListener('change', load);
qs('#toggle-filters').addEventListener('click', e => {
  const open = form.classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', open);
  e.currentTarget.textContent = open ? 'Esconder filtros' : 'Filtrar';
});
load();
