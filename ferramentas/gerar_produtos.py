"""Gera uma página por produto em produtos/<slug>.html.

Para adicionar ou editar um produto, mude a lista PRODUTOS abaixo e rode:
    python3 ferramentas/gerar_produtos.py

Cada produto tem:
  fotos  -> lista de (arquivo em img/, texto alternativo). A primeira é a foto principal.
           Lista vazia mostra "Foto em breve".
  cores  -> lista de (nome, cor do círculo em hex, índice da foto que mostra essa cor ou None).
  tamanhos -> lista vazia mostra "consulte pelo WhatsApp".
"""
from html import escape
from pathlib import Path
from urllib.parse import quote
import unicodedata

RAIZ = Path(__file__).resolve().parent.parent
WHATSAPP = "558194110631"

PRODUTOS = [
    {
        "slug": "regata-machao-poliamida",
        "nome": "Regata Machão Poliamida",
        "publico": "masculino", "categoria": "Regatas", "cat_id": "regatas",
        "resumo": "Regata machão em poliamida, com tecido respirável.",
        "descricao": [
            "Regata machão masculina em poliamida, feita para treinar com liberdade nos ombros e nos braços.",
            "O tecido é respirável e leve, bom para musculação, corrida e treinos funcionais.",
        ],
        "tecido": "Poliamida",
        "tamanhos": [],
        "fotos": [],
        "cores": [("Bege", "#d9c3a5", None)],
    },
    {
        "slug": "regata-machao-furadinho",
        "nome": "Regata Machão Furadinho",
        "publico": "masculino", "categoria": "Regatas", "cat_id": "regatas",
        "resumo": "Regata machão em poliamida furadinho. Peça extremamente confortável.",
        "descricao": [
            "Regata machão masculina em poliamida furadinho (dry-fit), com detalhe de listras nos ombros.",
            "Peça extremamente confortável, disponível em várias cores.",
        ],
        "tecido": "Poliamida furadinho (dry-fit)",
        "tamanhos": ["M", "G", "GG"],
        "fotos": [
            ("masc-regata-2.jpg", "Regatas machão em vermelho, preto, bege e coral"),
            ("masc-regata-3.jpg", "Detalhe da regata machão vermelha dry-fit"),
        ],
        "cores": [("Vermelho", "#c8202a", 1), ("Preto", "#1b1b1f", 0), ("Bege", "#d9c3a5", 0), ("Coral", "#d0634f", 0)],
    },
    {
        "slug": "camisa-poliamida-uv",
        "nome": "Camisa Poliamida UV",
        "publico": "masculino", "categoria": "Camisas", "cat_id": "camisas",
        "resumo": "Camisa masculina em poliamida com proteção UV.",
        "descricao": [
            "Camisa masculina em poliamida UV, com caimento justo e tecido leve.",
            "Boa para treinos ao ar livre e para o dia a dia.",
        ],
        "tecido": "Poliamida UV",
        "tamanhos": ["P", "M", "G", "GG"],
        "fotos": [],
        "cores": [("Preto", "#1b1b1f", None), ("Azul-claro", "#9fd0ea", None)],
    },
    {
        "slug": "camisa-dry-fit-grao-de-arroz",
        "nome": "Camisa Dry-Fit Grão de Arroz",
        "publico": "masculino", "categoria": "Camisas", "cat_id": "camisas",
        "resumo": "Camisa masculina dry-fit com textura grão de arroz.",
        "descricao": [
            "Camisa masculina dry-fit com textura grão de arroz e listras nos ombros.",
            "Leve e confortável para treinos de academia e esportes.",
        ],
        "tecido": "Dry-fit grão de arroz",
        "tamanhos": ["M", "G", "GG"],
        "fotos": [],
        "cores": [("Azul royal", "#2440b8", None)],
    },
    {
        "slug": "bermuda-dupla-premium",
        "nome": "Bermuda Dupla Premium",
        "publico": "masculino", "categoria": "Shorts", "cat_id": "shorts",
        "resumo": "Bermuda dupla, com bermuda interna e bolso com zíper.",
        "descricao": [
            "Bermuda masculina dupla, com bermuda interna, cordão de ajuste na cintura e bolso com zíper.",
            "Disponível em várias cores, para treino ou uso no dia a dia.",
        ],
        "tecido": "Consulte pelo WhatsApp",
        "tamanhos": ["P", "M", "G", "GG"],
        "fotos": [
            ("masc-short-1.jpg", "Bermudas duplas em preto, bege, cinza e branco"),
            ("masc-short-2.jpg", "Bermuda dupla bege com bolso de zíper"),
        ],
        "cores": [("Preto", "#1b1b1f", 0), ("Bege", "#c9a57a", 1), ("Cinza", "#8a9099", 0), ("Branco", "#ffffff", 0)],
    },
    {
        "slug": "bermuda-premium-jordan",
        "nome": "Bermuda Premium Jordan",
        "publico": "masculino", "categoria": "Shorts", "cat_id": "shorts",
        "resumo": "Bermuda premium com bolso com zíper.",
        "descricao": [
            "Bermuda masculina premium com faixas laterais em contraste, cordão na cintura e bolso com zíper.",
        ],
        "tecido": "Consulte pelo WhatsApp",
        "tamanhos": ["M", "G", "GG"],
        "fotos": [("masc-short-3.jpg", "Bermuda branca com faixas pretas e logo Jordan")],
        "cores": [("Branco", "#ffffff", 0)],
    },
    {
        "slug": "cropped-com-manga",
        "nome": "Cropped com Manga",
        "publico": "feminino", "categoria": "Camisas", "cat_id": "camisas",
        "resumo": "Cropped feminino com manga, em poliamida. Peça com muito conforto.",
        "descricao": [
            "Cropped feminino com manga curta, em poliamida.",
            "Peça com muito conforto, disponível em várias cores para combinar com leggings e shorts.",
        ],
        "tecido": "Poliamida",
        "tamanhos": ["M", "G"],
        "fotos": [
            ("fem-camisa-1.jpg", "Croppeds com manga em oito cores"),
            ("fem-camisa-2.jpg", "Cropped com manga bege"),
            ("fem-camisa-3.jpg", "Cropped com manga amarelo"),
        ],
        "cores": [
            ("Bege", "#e3cdb1", 1), ("Amarelo", "#e8c27a", 2), ("Verde-água", "#9dd3b5", 0),
            ("Verde-militar", "#59684f", 0), ("Caramelo", "#b8741a", 0), ("Preto", "#1b1b1f", 0),
            ("Branco", "#ffffff", 0), ("Rosa", "#f2b8c6", 0),
        ],
    },
    {
        "slug": "cropped-regata",
        "nome": "Cropped Regata",
        "publico": "feminino", "categoria": "Regatas", "cat_id": "regatas",
        "resumo": "Cropped regata feminino em poliamida. Peça extremamente confortável.",
        "descricao": [
            "Cropped regata feminino em poliamida, com gola alta e cava ampla.",
            "Peça extremamente confortável, disponível em várias cores.",
        ],
        "tecido": "Poliamida",
        "tamanhos": ["M", "G"],
        "fotos": [
            ("fem-regata-2.jpg", "Croppeds regata em sete cores"),
            ("fem-regata-3.jpg", "Cropped regata caramelo"),
        ],
        "cores": [
            ("Rosa", "#f2b8c6", None), ("Caramelo", "#b8741a", 1), ("Azul", "#5bc6e8", 0),
            ("Verde-água", "#9dd3b5", 0), ("Bege", "#e3cdb1", 0), ("Preto", "#1b1b1f", 0),
            ("Amarelo-claro", "#f0d39a", 0), ("Branco", "#ffffff", 0),
        ],
    },
]


def slugify(texto):
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return "-".join(texto.lower().split())


def wa_link(msg):
    return f"https://wa.me/{WHATSAPP}?text={quote(msg, safe='')}"


def cabecalho(p):
    nav = []
    for href, nome in [("index.html", "Início"), ("masculino.html", "Masculino"), ("feminino.html", "Feminino"), ("contato.html", "Contato")]:
        atual = ' aria-current="page"' if href == p["publico"] + ".html" else ""
        nav.append(f'<a href="../{href}"{atual}>{nome}</a>')
    return f"""<header class="top">
  <a class="brand" href="../index.html" aria-label="Combate Sports, página inicial">
    <img src="../img/logo.png" alt="Combate Sports" width="600" height="209">
  </a>
  <nav>{''.join(nav)}</nav>
</header>"""


RODAPE = """<footer class="foot">
  <div>
    <strong>Combate Sports</strong>
    <p>Artigos fitness masculinos e femininos.</p>
  </div>
  <div>
    <p>Rua Samuel Campelo, 67, Caruaru</p>
    <p><a href="https://www.google.com/maps/search/?api=1&query=Rua+Samuel+Campelo+67+Caruaru+PE">Ver no mapa</a></p>
  </div>
  <div>
    <p><a href="https://www.instagram.com/combate_sport02/">Instagram @combate_sport02</a></p>
    <p><a href="https://wa.me/558194110631">WhatsApp (81) 9411-0631</a></p>
  </div>
</footer>"""


SEM_FOTO = '<div class="ph" role="img" aria-label="Foto do produto em breve">Foto em breve</div>'


def galeria(p):
    if not p["fotos"]:
        return f'<div class="pd-gal"><div class="pd-main">{SEM_FOTO}</div></div>'
    principal, alt = p["fotos"][0]
    atual = ' aria-current="true"'
    miniaturas = "".join(
        f'<a href="../img/{escape(f)}" data-alt="{escape(a)}"{atual if i == 0 else ""}>'
        f'<img src="../img/{escape(f)}" alt="Foto {i + 1} de {len(p["fotos"])}"></a>'
        for i, (f, a) in enumerate(p["fotos"])
    )
    thumbs = f'<div class="pd-thumbs">{miniaturas}</div>' if len(p["fotos"]) > 1 else ""
    return (f'<div class="pd-gal">{thumbs}'
            f'<div class="pd-main"><img src="../img/{escape(principal)}" alt="{escape(alt)}"></div></div>')


def seletores(p):
    marcada = " checked" if len(p["cores"]) == 1 else ""
    cores = ""
    for n, hx, i in p["cores"]:
        foto = "" if i is None else f' data-foto="{i}"'
        cores += (f'<label class="swatch"><input type="radio" name="cor" value="{escape(n)}" data-slug="{slugify(n)}"{foto}{marcada}>'
                  f'<span style="--c:{hx}" title="{escape(n)}"></span><span class="sr">{escape(n)}</span></label>')
    inicial = p["cores"][0][0] if len(p["cores"]) == 1 else "escolha uma cor"
    html = (f'<fieldset class="pd-opt"><legend>Cor: <strong data-cor>{escape(inicial)}</strong></legend>'
            f'<div class="swatches">{cores}</div></fieldset>')
    if p["tamanhos"]:
        tams = "".join(
            f'<label class="size"><input type="radio" name="tamanho" value="{t}"><span>{t}</span></label>'
            for t in p["tamanhos"]
        )
        html += f'<fieldset class="pd-opt"><legend>Tamanho</legend><div class="sizes">{tams}</div></fieldset>'
    else:
        html += '<p class="pd-note">Tamanhos: consulte pelo WhatsApp.</p>'
    return html


def relacionados(p):
    outros = [o for o in PRODUTOS if o["publico"] == p["publico"] and o["slug"] != p["slug"]]
    outros.sort(key=lambda o: o["cat_id"] != p["cat_id"])
    def capa(o):
        if not o["fotos"]:
            return SEM_FOTO
        return (f'<a href="{o["slug"]}.html" tabindex="-1" aria-hidden="true">'
                f'<img class="ph" src="../img/{escape(o["fotos"][0][0])}" alt="" loading="lazy"></a>')

    cards = "".join(
        f'<article class="card">{capa(o)}'
        f'<h3><a href="{o["slug"]}.html">{escape(o["nome"])}</a></h3><p>{escape(o["resumo"])}</p>'
        f'<a class="btn small" href="{o["slug"]}.html">Ver detalhes</a></article>'
        for o in outros[:4]
    )
    return f'<section class="cat"><h2>Você também pode gostar</h2><div class="grid">{cards}</div></section>'


def pagina(p):
    publico = p["publico"].capitalize()
    tamanhos = ", ".join(p["tamanhos"]) if p["tamanhos"] else "Consulte pelo WhatsApp"
    cores = ", ".join(n for n, _, _ in p["cores"])
    descricao = "".join(f"<p>{escape(t)}</p>" for t in p["descricao"])
    msg = f"Olá! Quero saber mais sobre {p['nome']} ({p['publico']})."
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="only light">
<title>{escape(p['nome'])} | {publico} | Combate Sports</title>
<meta name="description" content="{escape(p['resumo'])} Tamanhos {escape(tamanhos)}. Combate Sports, Caruaru.">
<meta property="og:title" content="{escape(p['nome'])} | Combate Sports">
<meta property="og:description" content="{escape(p['resumo'])}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/style.css">
</head>
<body>
{cabecalho(p)}
<main>
<nav class="crumbs" aria-label="Você está em"><a href="../index.html">Início</a><a href="../{p['publico']}.html">{publico}</a><a href="../{p['publico']}.html#{p['cat_id']}">{p['categoria']}</a><span aria-current="page">{escape(p['nome'])}</span></nav>
<section class="pd">
{galeria(p)}
<form class="pd-info" data-produto="{escape(p['nome'])} ({p['publico']})" onsubmit="return false">
<p class="pd-kicker">{publico} · {p['categoria']}</p>
<h1>{escape(p['nome'])}</h1>
<p class="pd-sum">{escape(p['resumo'])}</p>
<div class="pd-price"><strong>Preço sob consulta</strong><span>Atacado e varejo. Valores pelo WhatsApp.</span></div>
{seletores(p)}
<a class="btn pd-cta" href="{wa_link(msg)}">Comprar pelo WhatsApp</a>
<ul class="pd-perks">
<li><strong>Retire na loja</strong> Rua Samuel Campelo, 67, Caruaru</li>
<li><strong>Atacado e varejo</strong> Peça para revenda ou para você</li>
<li><strong>Trocas</strong> Consulte as condições pelo WhatsApp</li>
</ul>
</form>
</section>
<section class="pd-more">
<div><h2>Descrição</h2>{descricao}</div>
<div><h2>Características</h2>
<table class="specs">
<tr><th scope="row">Categoria</th><td>{p['categoria'][:-1]} {p['publico']}</td></tr>
<tr><th scope="row">Tecido</th><td>{escape(p['tecido'])}</td></tr>
<tr><th scope="row">Tamanhos</th><td>{escape(tamanhos)}</td></tr>
<tr><th scope="row">Cores</th><td>{escape(cores)}</td></tr>
</table></div>
</section>
{relacionados(p)}
</main>
{RODAPE}
<a class="wa-float" href="{wa_link(msg)}" aria-label="Chamar no WhatsApp">Chamar no WhatsApp</a>
<script src="../js/produto.js"></script>
</body>
</html>
"""


if __name__ == "__main__":
    pasta = RAIZ / "produtos"
    pasta.mkdir(exist_ok=True)
    for p in PRODUTOS:
        (pasta / f"{p['slug']}.html").write_text(pagina(p), encoding="utf-8")
        print("gerado:", f"produtos/{p['slug']}.html")
