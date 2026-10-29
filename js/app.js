// Código compartilhado por todas as páginas da loja:
// API, formatação, ilustrações das peças, cabeçalho, rodapé, sacola e card de produto.

import { api } from './backend.js';
export { api };

export const brl = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const qs = (sel, el = document) => el.querySelector(sel);

let storeInfo = null;
export const getStore = async () => storeInfo ||= await api('/store');

// ---------- ilustrações das peças (usadas enquanto não há foto) ----------
const SHAPES = {
  regatas: 'M72 14q28 22 56 0l12 2q2 52 26 66v150H34V82q24-14 26-66z',
  camisas: 'M70 14q30 24 60 0l46 18 20 50-34 12-4-10v148H42V84l-4 10L4 82l20-50z',
  shorts: 'M38 40h124l20 150-68 12-14-82-14 82-68-12z',
  calcas: 'M54 10h92l18 222h-50l-14-160-14 160H36z',
  tops: 'M56 26h20q24 46 48 0h20q4 50 22 72l-6 56q-60 16-120 0l-6-56q18-22 22-72z',
};
const DETAILS = {
  regatas: 'M72 14q28 22 56 0',
  camisas: 'M70 14q30 24 60 0M42 84V60M158 84V60',
  shorts: 'M38 56h126M100 56v64',
  calcas: 'M53 26h94M100 26v46',
  tops: 'M42 140q58 14 116 0',
};
export function garmentSVG(category, hex = '#1d1d22', label = '') {
  const shape = SHAPES[category] || SHAPES.camisas;
  const light = isLight(hex);
  return `<svg viewBox="0 0 200 240" role="img" aria-label="${esc(label)}">
    <path d="${shape}" fill="${hex}" stroke="${light ? '#b9bcc8' : 'rgba(0,0,0,.28)'}" stroke-width="2" stroke-linejoin="round"/>
    <path d="${DETAILS[category] || ''}" fill="none" stroke="${light ? '#c9ccd6' : 'rgba(255,255,255,.18)'}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}
function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 200;
}

// foto da cor escolhida → foto geral → ilustração
export function productVisual(p, colorId, cls = '') {
  const picked = p.colors.find(c => c.id === colorId);
  const color = picked || p.colors[0] || { hex: '#1d1d22', name: '' };
  const img = (picked && p.images?.find(i => i.color_id === picked.id)) || p.images?.find(i => !i.color_id) || p.images?.[0];
  if (img) return `<img class="photo ${cls}" src="${esc(img.url)}" alt="${esc(p.name)}${picked ? ' ' + esc(picked.name) : ''}" loading="lazy">`;
  return garmentSVG(p.category, color.hex, `${p.name} ${color.name}`);
}

export const installments = (cents, n = 3) => cents && n > 1 && cents >= 3000 ? `ou ${n}x de ${brl(Math.ceil(cents / n))} sem juros` : '';

// preço vazio = a loja passa o valor pelo WhatsApp
export function priceHTML(p, installmentsN) {
  if (p.price_cents == null) return '<div class="price"><b>Valor pelo WhatsApp</b></div>';
  const sale = p.compare_at_cents > p.price_cents;
  return `<div class="price"><b>${brl(p.price_cents)}</b>${sale ? `<s>${brl(p.compare_at_cents)}</s>` : ''}
    <small>${installments(p.price_cents, installmentsN)}</small></div>`;
}

// ---------- card de produto ----------
export function productCard(p) {
  const sale = p.price_cents != null && p.compare_at_cents > p.price_cents;
  const off = sale ? Math.round((1 - p.price_cents / p.compare_at_cents) * 100) : 0;
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    <a class="card-media" href="produto.html?p=${encodeURIComponent(p.slug)}" tabindex="-1" aria-hidden="true">
      ${!p.in_stock ? '<span class="tag out">Esgotado</span>' : sale ? `<span class="tag">-${off}%</span>` : ''}
      ${productVisual(p)}
    </a>
    <h3><a href="produto.html?p=${encodeURIComponent(p.slug)}">${esc(p.name)}</a></h3>
    ${priceHTML(p)}
    <div class="swatches">
      ${p.colors.map((c, i) => `<button class="swatch" type="button" style="background:${c.hex}" title="${esc(c.name)}"
        aria-label="Ver na cor ${esc(c.name)}" aria-pressed="false" data-color="${c.id}"></button>`).join('')}
    </div>`;
  el.querySelectorAll('.swatch').forEach(btn => btn.addEventListener('click', () => {
    el.querySelectorAll('.swatch').forEach(b => b.setAttribute('aria-pressed', b === btn));
    const media = el.querySelector('.card-media');
    media.querySelector('svg, img')?.remove();
    media.insertAdjacentHTML('beforeend', productVisual(p, Number(btn.dataset.color)));
  }));
  return el;
}

export function skeletonCards(n = 4) {
  return Array.from({ length: n }, () => '<div class="card skeleton" aria-hidden="true"><div class="card-media"></div></div>').join('');
}

// ---------- sacola (salva no navegador) ----------
const CART_KEY = 'combate-sacola';
export const cart = {
  items: (() => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } })(),
  save() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(this.items)); } catch { /* navegador sem armazenamento */ }
    document.dispatchEvent(new CustomEvent('cart:change'));
  },
  add(item) {
    const found = this.items.find(i => i.variant_id === item.variant_id);
    if (found) found.qty = Math.min(found.qty + item.qty, item.stock);
    else this.items.push(item);
    this.save();
  },
  setQty(variantId, qty) {
    const it = this.items.find(i => i.variant_id === variantId);
    if (!it) return;
    it.qty = Math.max(1, Math.min(qty, it.stock || 20));
    this.save();
  },
  remove(variantId) { this.items = this.items.filter(i => i.variant_id !== variantId); this.save(); },
  clear() { this.items = []; this.save(); },
  get count() { return this.items.reduce((s, i) => s + i.qty, 0); },
  get total() { return this.items.reduce((s, i) => s + i.qty * (i.price_cents || 0), 0); },
  get unpriced() { return this.items.some(i => i.price_cents == null); },
};

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.role = 'status'; t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}

// ---------- ícones ----------
const ICON = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

const LOGO = `<a class="logo" href="index.html"><img src="img/logo.png" alt="Combate Sports — início" width="600" height="209"></a>`;

function totalsHTML() {
  if (!cart.total) return '<p class="ship-hint">A loja confirma os valores pelo WhatsApp.</p>';
  return `<div class="totals"><span>${cart.unpriced ? 'Total parcial' : 'Total'}</span><span>${brl(cart.total)}</span></div>
    ${cart.unpriced ? '<p class="ship-hint">Algumas peças têm valor a confirmar pelo WhatsApp.</p>' : ''}`;
}

const NAV = [
  ['catalogo.html?sort=novidades', 'Novidades'],
  ['catalogo.html?publico=feminino', 'Feminino'],
  ['catalogo.html?publico=masculino', 'Masculino'],
  ['index.html#loja', 'Loja física'],
];

function searchForm() {
  return `<form class="search" action="catalogo.html" role="search">
    ${ICON.search}<input name="q" type="search" aria-label="Buscar peças" placeholder="Buscar regata, cropped..." autocomplete="off">
  </form>`;
}

function renderHeader(store) {
  const here = location.href.split('#')[0];
  const isHere = href => new URL(href, location.href).href === here;
  const navLinks = NAV.map(([href, label, cls]) =>
    `<a href="${href}" class="${cls || ''}" ${isHere(href) ? 'aria-current="page"' : ''}>${label}</a>`).join('');
  const free = store?.free_shipping_from_cents;
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="notice"><div class="wrap">
      <span>Escolha cor e tamanho e finalize pelo WhatsApp</span>
      ${free ? `<span>Frete grátis em Caruaru acima de ${brl(free).replace(',00', '')}</span>` : ''}
      ${store?.installments > 1 ? `<span>Até ${store.installments}x sem juros</span>` : ''}
      <span>Loja física na ${esc(store?.address || 'Rua Samuel Campelo, 67')}, Caruaru</span>
    </div></div>
    <header class="header"><div class="wrap">
      <button class="icon-btn menu-btn" type="button" aria-label="Abrir menu" data-open-menu>${ICON.menu}</button>
      ${LOGO}
      <nav class="nav" aria-label="Principal">${navLinks}</nav>
      <div class="header-actions">
        ${searchForm()}
        <button class="icon-btn" type="button" data-open-cart aria-label="Abrir sacola">${ICON.bag}<span class="badge" data-cart-count></span></button>
      </div>
    </div></header>
    <div class="mobile-menu" id="mobile-menu">
      <div class="scrim" data-close-menu></div>
      <nav class="panel" aria-label="Menu">
        <button class="icon-btn" type="button" aria-label="Fechar menu" data-close-menu>${ICON.close}</button>
        ${searchForm()}
        ${NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}
      </nav>
    </div>`);
  const menu = qs('#mobile-menu');
  qs('[data-open-menu]').onclick = () => menu.classList.add('open');
  menu.querySelectorAll('[data-close-menu], a').forEach(el => el.addEventListener('click', () => menu.classList.remove('open')));
}

function renderFooter(store) {
  const year = new Date().getFullYear();
  document.body.insertAdjacentHTML('beforeend', `
    <footer class="footer"><div class="wrap">
      <div class="cols">
        <div class="brand">${LOGO}<p>Moda fitness masculina e feminina para musculação, luta e corrida. Em Caruaru, na ${esc(store?.address || '')}.</p></div>
        <div><h4>Comprar</h4><ul>
          <li><a href="catalogo.html?publico=feminino">Feminino</a></li>
          <li><a href="catalogo.html?publico=masculino">Masculino</a></li>
          <li><a href="catalogo.html">Todas as peças</a></li></ul></div>
        <div><h4>Ajuda</h4><ul>
          <li><a href="index.html#como-comprar">Como comprar</a></li>
          <li><a href="index.html#loja">Como chegar</a></li></ul></div>
        <div><h4>Fale com a gente</h4><ul>
          <li><a href="https://wa.me/${store?.whatsapp}" target="_blank" rel="noopener">WhatsApp ${esc(store?.whatsapp_display || '')}</a></li>
          <li><a href="https://instagram.com/${store?.instagram}" target="_blank" rel="noopener">Instagram @${esc(store?.instagram || '')}</a></li></ul></div>
      </div>
      <div class="legal"><span>© ${year} Combate Sports. Caruaru – PE.</span><span>Site por CoreWeb</span></div>
    </div></footer>`);
}

// ---------- gaveta da sacola + finalização pelo WhatsApp ----------
function renderDrawer(store) {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="drawer" id="drawer" aria-hidden="true">
      <div class="scrim" data-close-cart></div>
      <aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div class="drawer-head"><h2 id="drawer-title">Sua sacola</h2>
          <button class="icon-btn" type="button" aria-label="Fechar sacola" data-close-cart>${ICON.close}</button></div>
        <div class="drawer-body" id="drawer-body"></div>
        <div class="drawer-foot" id="drawer-foot"></div>
      </aside>
    </div>`);
  const drawer = qs('#drawer');
  let step = 'bag';
  let lastFocus = null;

  const open = () => { lastFocus = document.activeElement; step = 'bag'; draw(); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); qs('[data-close-cart]', drawer.querySelector('.drawer-head')).focus(); };
  const close = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); lastFocus?.focus?.(); };
  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-cart]')) open();
    if (e.target.closest('[data-close-cart]')) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) close(); });
  document.addEventListener('cart:open', open);

  const body = qs('#drawer-body'), foot = qs('#drawer-foot');

  function draw() {
    if (step === 'done') return;
    if (!cart.items.length) {
      body.innerHTML = `<div class="success"><h3>Sacola vazia</h3><p>Escolha uma peça, a cor e o tamanho, e ela aparece aqui.</p></div>`;
      foot.innerHTML = `<a class="btn block" href="catalogo.html">Ver todas as peças</a>`;
      return;
    }
    if (step === 'bag') drawBag(); else drawCheckout();
  }

  function drawBag() {
    body.innerHTML = cart.items.map(i => `
      <div class="line-item">
        <div class="thumb">${i.image ? `<img class="photo" src="${esc(i.image)}" alt="">` : garmentSVG(i.category, i.hex)}</div>
        <div><b>${esc(i.name)}</b><span class="meta">${esc(i.color)} · Tam. ${esc(i.size)}</span>
          <div class="qty"><button type="button" aria-label="Diminuir" data-dec="${i.variant_id}">−</button>
          <span aria-live="polite">${i.qty}</span>
          <button type="button" aria-label="Aumentar" data-inc="${i.variant_id}" ${i.qty >= i.stock ? 'disabled' : ''}>+</button></div></div>
        <div style="text-align:right"><b>${i.price_cents != null ? brl(i.qty * i.price_cents) : 'A consultar'}</b><button class="remove" type="button" data-rm="${i.variant_id}">Remover</button></div>
      </div>`).join('');
    const free = store?.free_shipping_from_cents || 0;
    const missing = free - cart.total;
    foot.innerHTML = `
      ${free && !cart.unpriced ? `<p class="ship-hint">${missing > 0 ? `Faltam <b>${brl(missing)}</b> para frete grátis em Caruaru.` : 'Frete grátis em Caruaru liberado.'}</p>
        <div class="ship-bar"><i style="width:${Math.min(100, cart.total / free * 100)}%"></i></div>` : ''}
      ${totalsHTML()}
      <button class="btn red block" type="button" data-checkout>Finalizar pedido</button>`;
    body.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => cart.setQty(+b.dataset.dec, cart.items.find(i => i.variant_id === +b.dataset.dec).qty - 1));
    body.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => cart.setQty(+b.dataset.inc, cart.items.find(i => i.variant_id === +b.dataset.inc).qty + 1));
    body.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => cart.remove(+b.dataset.rm));
    foot.querySelector('[data-checkout]').onclick = () => { step = 'checkout'; draw(); };
  }

  function drawCheckout() {
    body.innerHTML = `
      <form id="checkout" novalidate>
        <p style="margin-top:0;color:var(--muted)">Preencha e enviamos seu pedido pronto para o WhatsApp da loja. O pagamento é combinado por lá (Pix, cartão ou na retirada).</p>
        <div class="field"><label for="c-name">Nome</label><input id="c-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="c-phone">WhatsApp com DDD</label><input id="c-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(81) 9 0000-0000" required></div>
        <fieldset class="choice"><legend>Como quer receber?</legend>
          <label><input type="radio" name="delivery" value="retirada" checked> Retirar na loja</label>
          <label><input type="radio" name="delivery" value="entrega"> Entrega</label>
        </fieldset>
        <div class="field" id="addr-field" hidden><label for="c-addr">Endereço de entrega</label><textarea id="c-addr" name="address" autocomplete="street-address" placeholder="Rua, número, bairro"></textarea></div>
        <div class="field"><label for="c-notes">Observação (opcional)</label><input id="c-notes" name="notes"></div>
        <p class="error-msg" id="c-err" role="alert"></p>
      </form>`;
    foot.innerHTML = `
      ${totalsHTML()}
      <button class="btn wa block" type="submit" form="checkout">Enviar pedido pelo WhatsApp</button>
      <button class="btn ghost block" type="button" data-back>Voltar para a sacola</button>`;
    const form = qs('#checkout');
    form.addEventListener('change', () => { qs('#addr-field').hidden = form.delivery.value !== 'entrega'; });
    foot.querySelector('[data-back]').onclick = () => { step = 'bag'; draw(); };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = foot.querySelector('[type=submit]');
      const data = Object.fromEntries(new FormData(form));
      btn.disabled = true; btn.textContent = 'Enviando...';
      // abre a janela já no clique (evita bloqueio de pop-up) e redireciona depois
      const win = window.open('', '_blank');
      try {
        const order = await api('/orders', { method: 'POST', body: JSON.stringify({ ...data, items: cart.items.map(i => ({ variant_id: i.variant_id, qty: i.qty })) }) });
        if (win) win.location = order.whatsapp_url; else location.href = order.whatsapp_url;
        cart.clear();
        step = 'done';
        body.innerHTML = `<div class="success"><h3>Pedido ${esc(order.code)} enviado</h3>
          <p>Abrimos o WhatsApp da loja com o pedido escrito. É só tocar em enviar. A Combate Sports responde para confirmar pagamento e ${data.delivery === 'entrega' ? 'entrega' : 'retirada'}.</p>
          <p><a class="link" href="${esc(order.whatsapp_url)}" target="_blank" rel="noopener">O WhatsApp não abriu? Toque aqui.</a></p></div>`;
        foot.innerHTML = `<button class="btn block" type="button" data-close-cart>Continuar comprando</button>`;
      } catch (err) {
        win?.close();
        qs('#c-err').textContent = err.message;
        btn.disabled = false; btn.textContent = 'Enviar pedido pelo WhatsApp';
      }
    });
  }

  document.addEventListener('cart:change', () => { if (drawer.classList.contains('open')) draw(); });
}

function updateBadge() {
  document.querySelectorAll('[data-cart-count]').forEach(b => { b.textContent = cart.count || ''; });
}

// Monta o "esqueleto" comum da página
export async function initLayout() {
  let store = null;
  try { store = await getStore(); } catch { /* segue sem dados da loja */ }
  renderHeader(store);
  renderFooter(store);
  renderDrawer(store);
  updateBadge();
  document.addEventListener('cart:change', updateBadge);
  return store;
}
