// De onde vêm os dados da loja.
//  - 'servidor': fala com a API Node (painel, banco SQLite, estoque baixa a cada pedido)
//  - 'estatico': lê data/catalogo.json — é o modo do GitHub Pages, que não roda servidor
// O comando `npm run pages` gera a versão estática já com MODE = 'estatico'.
export const MODE = 'estatico';

export async function api(path, opts = {}) {
  return MODE === 'estatico' ? staticApi(path, opts) : serverApi(path, opts);
}

async function serverApi(path, opts) {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Não foi possível falar com o servidor.');
  return data;
}

// ---------- modo estático ----------
let catalog = null;
async function load() {
  if (!catalog) {
    const res = await fetch('data/catalogo.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Não foi possível carregar o catálogo.');
    catalog = await res.json();
  }
  return catalog;
}

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fail = msg => { throw new Error(msg); };
const brl = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function staticApi(path, opts) {
  const db = await load();
  const [route, query = ''] = path.split('?');
  const q = Object.fromEntries(new URLSearchParams(query));

  if (route === '/store') return db.store;
  if (route === '/categories') return db.categories;
  if (route === '/colors') return db.colors;
  if (route === '/products') return listProducts(db.products, q);
  if (route.startsWith('/products/')) {
    const slug = decodeURIComponent(route.slice('/products/'.length));
    return db.products.find(p => p.slug === slug) || fail('Produto não encontrado.');
  }
  if (route === '/orders' && opts.method === 'POST') return createOrder(db, JSON.parse(opts.body || '{}'));
  fail('Rota não encontrada.');
}

function listProducts(all, f) {
  const hasStock = (p, test) => p.variants.some(v => v.stock > 0 && test(v));
  let list = all.filter(p =>
    (!f.audience || p.audience === f.audience || p.audience === 'unissex') &&
    (!f.category || p.category === f.category) &&
    (!f.featured || p.featured) &&
    (!f.sale || p.compare_at_cents > p.price_cents) &&
    (!f.q || [p.name, p.description, p.category_name].some(t => norm(t).includes(norm(f.q)))) &&
    (!f.size || hasStock(p, v => v.size === f.size)) &&
    (!f.color || hasStock(p, v => v.color === f.color)) &&
    (!f.max_price || (p.price_cents != null && p.price_cents <= Number(f.max_price) * 100)));

  const byDate = (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id;
  const sorts = {
    novidades: byDate,
    menor_preco: (a, b) => (a.price_cents ?? Infinity) - (b.price_cents ?? Infinity),
    maior_preco: (a, b) => (b.price_cents ?? -1) - (a.price_cents ?? -1),
    nome: (a, b) => a.name.localeCompare(b.name, 'pt'),
  };
  list.sort(sorts[f.sort] || ((a, b) => (b.featured - a.featured) || byDate(a, b)));
  if (f.limit) list = list.slice(0, Number(f.limit));
  return list;
}

// Sem servidor não há como baixar o estoque: o pedido vai direto para o WhatsApp
// e a loja confirma a disponibilidade por lá.
function createOrder(db, { name = '', phone = '', delivery = 'retirada', address = '', notes = '', items = [] }) {
  if (name.trim().length < 2) fail('Informe seu nome.');
  if (phone.replace(/\D/g, '').length < 10) fail('Informe um WhatsApp com DDD.');
  if (delivery === 'entrega' && address.trim().length < 8) fail('Informe o endereço de entrega.');
  if (!items.length) fail('Sua sacola está vazia.');

  let total = 0, unpriced = false;
  const lines = items.map(({ variant_id, qty }) => {
    let found;
    for (const p of db.products) {
      const v = p.variants.find(x => x.id === variant_id);
      if (v) { found = { p, v }; break; }
    }
    if (!found) fail('Uma das peças da sacola não está mais no catálogo. Remova e adicione de novo.');
    const q = Math.max(1, Math.min(20, parseInt(qty, 10) || 1));
    const price = found.p.price_cents;
    if (price == null) unpriced = true; else total += price * q;
    return `• ${q}x ${found.p.name} — ${found.v.color}, tam. ${found.v.size}${price != null ? ` (${brl(price * q)})` : ''}`;
  });

  const code = 'CS' + Date.now().toString(36).toUpperCase().slice(-6);
  const msg = [
    `Olá, Combate Sports! Quero fazer o pedido *${code}*:`, '',
    ...lines, '',
    !total ? 'Pode me passar os valores?' : unpriced ? `*Total parcial: ${brl(total)}* (+ peças com valor a confirmar)` : `*Total: ${brl(total)}*`,
    delivery === 'entrega' ? `Entrega em: ${address.trim()}` : 'Vou retirar na loja.',
    notes.trim() ? `Obs.: ${notes.trim()}` : null,
    `Nome: ${name.trim()}`,
    '', 'Pode confirmar se tem essas peças?',
  ].filter(l => l !== null).join('\n');

  return { code, total_cents: total, whatsapp_url: `https://wa.me/${db.store.whatsapp}?text=${encodeURIComponent(msg)}` };
}
