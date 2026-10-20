"""Renderiza a capa de compartilhamento com Pillow e fontes DejaVu do sistema."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SCALE = 2
image = Image.new('RGB', (1200*SCALE, 630*SCALE), '#f5f1e8')
d = ImageDraw.Draw(image)
def box(coords): return tuple(round(v*SCALE) for v in coords)
def font(size, style='Sans'):
    return ImageFont.truetype(f'/usr/share/fonts/truetype/dejavu/DejaVu{style}.ttf', round(size*SCALE))
def text(x,y,value,size,color='#173c34',style='Sans'):
    d.text((x*SCALE,y*SCALE),value,font=font(size,style),fill=color)
def curve(points):
    out=[]
    for i in range(81):
        t=i/80; u=1-t
        out.append(tuple(SCALE*(u*u*u*points[0][j]+3*u*u*t*points[1][j]+3*u*t*t*points[2][j]+t*t*t*points[3][j]) for j in (0,1)))
    return out
def leaf(a,b,c,e,f,g,color):
    d.polygon(curve([a,b,c,e])+curve([e,f,g,a]),fill=color)
# The arch, morning light and growing plant echo the site's own botanical illustration.
d.rounded_rectangle(box((822,48,1148,584)),radius=163*SCALE,fill='#e4e7d7')
d.ellipse(box((888,81,1086,279)),fill='#e8c78b')
d.line(curve([(986,582),(931,447),(1013,285),(990,164)]),fill='#365f48',width=7*SCALE)
leaf((973,476),(883,480),(846,418),(850,371),(922,370),(971,413),'#64826a')
leaf((977,396),(1060,399),(1117,336),(1100,286),(1029,286),(980,344),'#365f48')
leaf((983,315),(913,314),(885,266),(897,223),(951,226),(982,268),'#829779')
leaf((991,248),(1051,245),(1081,197),(1066,164),(1018,171),(991,212),'#56775b')
d.line(box((65,564,755,564)),fill='#d7d9cc',width=SCALE)
text(65,55,'braga',33,style='Sans-Bold')
text(175,55,'saúde',33)
text(67,108,'SAÚDE MENTAL E ACOLHIMENTO',12)
text(62,187,'O cuidado começa',48,style='Serif')
text(62,252,'com um',48,style='Serif')
text(60,316,'primeiro passo.',55,color='#56775b',style='Serif-Italic')
text(66,420,'Para você ou para quem você ama.',23)
text(67,474,'Saúde mental • Dependências • Apoio à família',17,color='#50665b')
text(67,586,'clinicas.bragasaude.online',16,color='#50665b')
image.resize((1200,630),Image.Resampling.LANCZOS).save(ROOT/'clinicas_site/public/assets/compartilhar-cuidado-v1.jpg',quality=94,optimize=True)
