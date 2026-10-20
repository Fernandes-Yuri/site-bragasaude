"""Exporta somente instituições com dados revisados para o site público."""
import datetime
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
FIELDS = 'id name city state description specialties care_types insurance phone website image image_alt cnes verification_url reviewed_at'.split()
STATES = set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split())

def export_catalog(source):
    result, seen = [], set()
    for item in source['hospitals']:
        ident = item['id']
        if not ident or ident in seen:
            raise ValueError('ID ausente ou duplicado')
        seen.add(ident)
        if item.get('status') not in ('draft', 'published'):
            raise ValueError(f'{ident}: status inválido')
        if item['status'] == 'draft':
            continue
        for field in FIELDS:
            expected = list if field in ('specialties', 'care_types', 'insurance') else str
            if not isinstance(item.get(field), expected):
                raise ValueError(f'{ident}: campo inválido: {field}')
            if expected is list and any(not isinstance(x, str) or not x.strip() for x in item[field]):
                raise ValueError(f'{ident}: lista inválida: {field}')
        for field in ('name', 'city', 'description', 'verification_url', 'reviewed_at'):
            if not item[field].strip():
                raise ValueError(f'{ident}: preencher {field}')
        if item['state'] not in STATES:
            raise ValueError(f'{ident}: UF inválida')
        if datetime.date.fromisoformat(item['reviewed_at']) > datetime.date.today():
            raise ValueError(f'{ident}: revisão futura')
        for field in ('website', 'image', 'verification_url'):
            value = item[field]
            if value and (urlparse(value).scheme != 'https' or not urlparse(value).hostname or urlparse(value).username):
                raise ValueError(f'{ident}: {field} precisa ser HTTPS')
        if item['image'] and not item['image_alt'].strip():
            raise ValueError(f'{ident}: falta descrição da foto')
        if item['phone'] and (not item['phone'].isdigit() or not 10 <= len(item['phone']) <= 15):
            raise ValueError(f'{ident}: telefone inválido')
        if item['cnes'] and (not item['cnes'].isdigit() or len(item['cnes']) != 7):
            raise ValueError(f'{ident}: CNES inválido')
        result.append({field: item[field] for field in FIELDS})
    return {'hospitals': result}

if __name__ == '__main__':
    source = ROOT / 'clinicas_site/content/hospitais.json'
    target = ROOT / 'clinicas_site/public/data/hospitais.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(export_catalog(json.loads(source.read_text())), ensure_ascii=False, indent=2) + '\n')
    print('Catálogo público atualizado; rascunhos não são exportados.')
