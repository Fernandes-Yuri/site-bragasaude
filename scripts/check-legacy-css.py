#!/usr/bin/env python3
"""Guard de CSS para navegadores legados (iOS 15 / Safari 15, Chrome <= 104).

Falha o CI quando aparece:
  1. Container queries (container-type, @container, cqw/cqh/cqi/...) FORA de
     um bloco @supports. Motivo: custom properties guardam qualquer token no
     parse, entao um --sim-unit com "cqw" num navegador sem suporte nao cai no
     parse — ele so explode na substituicao de var(), invalidando TODAS as
     propriedades que usam a variavel (o bug do simulador no iPhone 6s).
  2. backdrop-filter sem o par -webkit-backdrop-filter no mesmo bloco
     (Safari <= 17 so aceita a forma com prefixo).

Uso: python3 scripts/check-legacy-css.py [pasta-ou-arquivo...]
     (padrao: onboarding_site/public/css)
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DEFAULT_TARGETS = [REPO / "onboarding_site" / "public" / "css"]

CQ_TOKEN = re.compile(
    r"(?<![\w-])(cqw|cqh|cqi|cqb|cqmin|cqmax|container-type|container-name)(?![\w-])"
)
AT_CONTAINER = re.compile(r"@container\b")
COMMENT = re.compile(r"/\*.*?\*/", re.S)
SUPPORTS = re.compile(r"@supports\b")


def strip_comments(css: str) -> str:
    # Espacos no lugar dos comentarios para preservar a contagem de linhas.
    return COMMENT.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), css)


def strip_at_supports(css: str) -> str:
    """Remove blocos @supports com matching de chaves (o que esta dentro
    deles e justamente a parte permitida)."""
    out = []
    pos = 0
    while True:
        m = SUPPORTS.search(css, pos)
        if not m:
            out.append(css[pos:])
            break
        out.append(css[pos:m.start()])
        brace = css.find("{", m.end())
        if brace == -1:  # condicao sem bloco: nao da para analisar, ignora
            out.append(css[m.start():])
            break
        depth = 0
        i = brace
        while i < len(css):
            if css[i] == "{":
                depth += 1
            elif css[i] == "}":
                depth -= 1
                if depth == 0:
                    i += 1
                    break
            i += 1
        pos = i
    return "".join(out)


def check_file(path: Path) -> list[str]:
    raw = path.read_text(encoding="utf-8")
    css = strip_comments(raw)
    errors = []

    ungated = strip_at_supports(css)
    for pattern in (CQ_TOKEN, AT_CONTAINER):
        for m in pattern.finditer(ungated):
            line = ungated[: m.start()].count("\n") + 1
            errors.append(
                f"{path}:{line}: '{m.group(0)}' fora de @supports — "
                f"quebra iOS 15 / Safari 15 e Chrome <= 104"
            )

    # backdrop-filter sem a forma com prefixo, no mesmo bloco de declaracoes
    for m in re.finditer(r"\{([^{}]*)\}", css):
        block = m.group(1)
        if re.search(r"(?<!-)\bbackdrop-filter\s*:", block):
            if "-webkit-backdrop-filter" not in block:
                line = css[: m.start()].count("\n") + 1
                errors.append(
                    f"{path}:{line}: backdrop-filter sem -webkit-backdrop-filter "
                    f"— Safari <= 17 ignora a forma sem prefixo"
                )
    return errors


def iter_css(targets):
    for target in targets:
        target = Path(target)
        if target.is_dir():
            yield from sorted(target.rglob("*.css"))
        elif target.suffix == ".css":
            yield target
        else:
            sys.exit(f"alvo invalido: {target}")


def main(argv) -> int:
    targets = argv or DEFAULT_TARGETS
    files = list(iter_css(targets))
    if not files:
        sys.exit("nenhum arquivo .css encontrado")

    errors = []
    for css_file in files:
        errors.extend(check_file(css_file))

    if errors:
        print("CSS moderno sem fallback para navegadores legados:\n")
        for e in errors:
            print(f"  {e}")
        print("\nGateie com @supports (width: 1cqw) { ... } ou adicione o prefixo -webkit-.")
        return 1

    print(f"ok: {len(files)} arquivos CSS sem features nao-gated")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
