import { api, initLayout, productCard, skeletonCards, garmentSVG, esc, qs } from './app.js';

const store = await initLayout();

const all = await api('/products').catch(() => []);
const firstPhoto = list => list.flatMap(p => p.images || []).find(i => !i.color_id)?.url;

// hero: fotos reais das peças em destaque (ou ilustrações, se ainda não houver fotos)
const heroPhotos = all.filter(p => p.featured).map(p => firstPhoto([p])).filter(Boolean).slice(0, 2);
qs('#hero-figs').innerHTML = heroPhotos.length
  ? heroPhotos.map(url => `<img src="${esc(url)}" alt="">`).join('')
  : [garmentSVG('regatas', '#f26a21'), garmentSVG('camisas', '#14235f'), garmentSVG('shorts', '#10173a')].join('');
qs('#hero-figs').classList.toggle('photos', heroPhotos.length > 0);

// categorias com peças
const cats = (await api('/categories').catch(() => [])).filter(c => c.product_count > 0);
qs('#cats').innerHTML = cats.map(c => {
  const photo = firstPhoto(all.filter(p => p.category === c.slug));
  return `<a class="cat${photo ? ' has-photo' : ''}" href="catalogo.html?categoria=${c.slug}">
    <div><strong>${esc(c.name)}</strong><br><span>${c.product_count} ${c.product_count === 1 ? 'modelo' : 'modelos'}</span></div>
    ${photo ? `<img src="${esc(photo)}" alt="" loading="lazy">` : garmentSVG(c.slug, '#14235f')}
  </a>`;
}).join('');

// novidades com abas
const news = qs('#news');
async function loadNews(audience = '') {
  news.innerHTML = skeletonCards(8);
  try {
    const list = await api(`/products?sort=novidades&limit=8${audience ? `&audience=${audience}` : ''}`);
    news.replaceChildren(...list.map(productCard));
  } catch (e) {
    news.innerHTML = `<div class="empty"><p>${esc(e.message)}</p></div>`;
  }
}
document.querySelectorAll('.tabs [data-aud]').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.tabs [data-aud]').forEach(t => t.setAttribute('aria-selected', t === tab));
  loadNews(tab.dataset.aud);
}));
loadNews();

// promoções
const promo = await api('/products?sale=1').catch(() => []);
if (promo.length) qs('#promo').replaceChildren(...promo.map(productCard));
else qs('#promo-section').remove();

// loja física
if (store) {
  qs('#store-address').innerHTML = `${esc(store.address)}<br>${esc(store.city)}`;
  qs('#store-hours').innerHTML = store.hours.map(h => `<dt>${esc(h.days)}</dt><dd>${esc(h.time)}</dd>`).join('');
  qs('#store-ctas').innerHTML = `
    <a class="btn wa" href="https://wa.me/${store.whatsapp}" target="_blank" rel="noopener">Chamar no WhatsApp</a>
    <a class="btn ghost" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.maps_query)}" target="_blank" rel="noopener">Como chegar</a>`;
  qs('#map').src = `https://www.google.com/maps?q=${encodeURIComponent(store.maps_query)}&output=embed`;
}
