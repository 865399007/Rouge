from pathlib import Path
out=Path('assets')
def svg(name,w,h,body):
 out.joinpath(name+'.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><g stroke="#292822" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>',encoding='utf-8')
svg('potato',72,80,'''<ellipse cx="36" cy="73" rx="26" ry="6" fill="#332d26" opacity=".22" stroke="none"/>
<path d="M19 62l-4 9q6 7 16 1l2-10m10 0 1 10q9 6 15-1l-5-10" fill="#655544"/>
<rect x="8" y="35" width="18" height="29" rx="7" fill="#65715b"/>
<path d="M16 40C13 23 20 9 35 8s25 11 23 31l-2 21q-2 10-21 10T15 58Z" fill="#dbb889"/>
<path d="M47 19q12 12 5 31" stroke="#bd9268" stroke-width="5" fill="none"/>
<path d="M16 47q18 10 41 0l-1 13q-21 13-40-1Z" fill="#77836a"/>
<path d="m18 46 30 14" stroke="#3f493b" stroke-width="7"/><rect x="30" y="51" width="11" height="8" rx="2" fill="#d2b875"/>
<path d="M16 27q17-6 43 0l-2-12Q35 2 18 13Z" fill="#cb6549"/>
<path d="m16 20-8 8 10 1m35-12 7 3" fill="#cb6549"/>
<path d="m24 33 6 1m11 0 6-2"/><path d="M28 36v4m15-4v4" stroke-width="4"/>
<path d="m34 47 6-1" stroke-width="2.5"/><path d="m49 37 3 7" stroke="#976c50" stroke-width="2"/>
<ellipse cx="17" cy="53" rx="6" ry="8" fill="#e7c69a"/><ellipse cx="57" cy="52" rx="6" ry="8" fill="#e7c69a"/>
<path d="m26 14 4-2" stroke="#eb9875" stroke-width="3"/>''')
svg('bug',54,56,'''<ellipse cx="27" cy="50" rx="22" ry="5" opacity=".18" stroke="none"/>
<path d="m13 40-4 9 12-3m19-6 5 9-13-3" fill="#717d55"/>
<path d="M9 31 4 22l9 1Q13 8 27 7q16 0 16 16l8-2-6 12q1 15-17 15T9 31Z" fill="#a7b374"/>
<path d="m19 8-2-5 11 5 8-5-1 7" fill="#a7b374"/>
<path d="M14 35q12 13 26 0" fill="#555945"/>
<path d="m19 38 1 5 5-2m7 0 4 2 1-6" fill="#f4e7bb" stroke-width="2"/>
<ellipse cx="18" cy="26" rx="7" ry="8" fill="#f2e5bb"/><ellipse cx="36" cy="26" rx="7" ry="8" fill="#f2e5bb"/>
<path d="m20 25 1 4m12-4 1 4" stroke-width="4"/><path d="m9 33-4 4m40-3 5 4"/>
<circle cx="27" cy="17" r="2" fill="#ccd294" stroke="none"/>''')
svg('brute',68,72,'''<ellipse cx="34" cy="65" rx="30" ry="6" opacity=".2" stroke="none"/>
<path d="m16 55-5 9 17-2m19-8 9 10-18-2" fill="#805d51"/>
<path d="M12 29 6 14l16 8Q33 10 46 20l17-8-4 20q11 30-24 31T12 29Z" fill="#b88770"/>
<path d="M12 31q-12 6-7 20l12 1m40-21q10 6 6 20l-12 1" fill="#a47660"/>
<path d="m13 30 15 6m13 0 15-7" stroke-width="5"/>
<path d="M20 36h7v7h-7zm21 0h7v7h-7z" fill="#f2cf72" stroke-width="2"/>
<path d="M23 49q10-6 23 0l-4 10H26Z" fill="#433735"/>
<path d="m26 49 3 5 3-7m6 0 2 7 3-5" fill="#f5e8c9" stroke-width="2"/>
<path d="m30 23 5-3 5 4" stroke="#d6ab85"/><path d="m7 42 4 2m44 9 4-2" stroke="#d3a180"/>''')
svg('runner',54,56,'''<ellipse cx="27" cy="50" rx="22" ry="4" opacity=".18" stroke="none"/>
<path d="m16 38-12 9 17-1 6-10m11 2 11 9-15-1" fill="#c59d55"/>
<path d="M7 27 17 7l8 6L37 4l2 15 11 3-8 19Q21 52 7 27Z" fill="#d7b965"/>
<path d="m10 25 14 3m7-3 13-6" stroke-width="4"/><path d="m19 29 2 4m14-6 1 4"/>
<path d="m22 40 9-4 6 3" fill="none"/><path d="m15 18 6-3m13 1 1-5" stroke="#f0d78a" stroke-width="3"/>''')
svg('spitter',58,60,'''<ellipse cx="29" cy="54" rx="24" ry="5" opacity=".18" stroke="none"/>
<path d="M9 35Q3 16 21 12l8-8 6 9q20 1 18 23l-7 12-4 7-11-4-13 4-6-9Z" fill="#a68cae"/>
<path d="m13 35-6 9m41-9 6 10"/><ellipse cx="20" cy="26" rx="6" ry="7" fill="#efe5c7"/><ellipse cx="39" cy="26" rx="6" ry="7" fill="#efe5c7"/>
<path d="m20 26 1 3m17-3 1 3"/><ellipse cx="30" cy="40" rx="9" ry="8" fill="#57415c"/>
<ellipse cx="30" cy="41" rx="4" ry="4" fill="#d7bcdf" stroke-width="2"/><circle cx="16" cy="17" r="3" fill="#c5adce" stroke="none"/>''')
svg('gem',22,24,'''<path d="m11 2 8 6-3 12-9 1L2 9Z" fill="#b5da68" stroke-width="2.5"/><path d="m11 2-3 9 8 9M2 9l6 2 11-3" fill="none" stroke="#6a873d" stroke-width="1.5"/><path d="m10 6-3 3" stroke="#edf7b2" stroke-width="2"/>''')
svg('gun',46,28,'''<path d="m12 15-3 9 9 1 3-11" fill="#755d47"/><path d="M3 6h31v13H3Z" fill="#85918b"/><path d="M30 8h12v9H30Z" fill="#515b59"/><path d="M8 6V3h15v3m-9 4h11" fill="none"/><path d="M6 11h3" stroke="#d5d3a5" stroke-width="2"/>''')
svg('pea',16,12,'''<path d="M3 3h7l4 3-4 3H3Z" fill="#efd979" stroke-width="2"/><path d="M4 5h5" stroke="#fff4cd" stroke-width="1.5"/>''')
svg('orb',24,24,'''<path d="m12 2 8 5 2 10-10 5-9-5 1-10Z" fill="#e68a78" stroke-width="2.5"/><circle cx="12" cy="11" r="5" fill="#f9d497" stroke="none"/>''')
svg('rock',50,32,'''<path d="M4 23 10 10l15-6 16 8 5 13-16 4Z" fill="#a4947b" stroke="#7f735f" stroke-width="2"/><path d="m11 11 13 3 6 14m-6-14 15-1" fill="none" stroke="#897b67" stroke-width="2"/>''')
svg('staff',46,30,'''<path d="M4 17h28" stroke="#755544" stroke-width="7"/><path d="m34 3 10 10-8 13-10-11Z" fill="#a6c4c8"/><path d="m33 8 5 5" stroke="#edf7df"/>''')
svg('blade',56,42,'''<path d="m6 33 14-13" stroke="#816747" stroke-width="8"/><path d="m16 23 20-19 13 2-3 14-20 11Z" fill="#b6c6c0"/><path d="M28 25 44 10" stroke="#eff1d8" stroke-width="2"/>''')
for name,color,inside in [('tower-rapid','#e0b65c','<path d="M29 28h15v18H29Z" fill="#796749"/>'),('tower-frost','#a4d8de','<path d="m36 17 11 17-11 17-11-17Z" fill="#bce6e7"/><path d="M36 18v32m-10-16h20" stroke="#649aa2" stroke-width="2"/>'),('tower-blast','#de8866','<circle cx="36" cy="35" r="12" fill="#da8663"/><circle cx="36" cy="35" r="5" fill="#523f32"/>')]:
 svg(name,72,80,f'''<ellipse cx="36" cy="71" rx="33" ry="7" opacity=".2" stroke="none"/><circle cx="36" cy="43" r="31" fill="#6c6c59"/><circle cx="36" cy="37" r="30" fill="{color}"/><circle cx="36" cy="37" r="23" fill="#ded1a9"/><circle cx="36" cy="37" r="18" fill="#6d7768"/>{inside}<path d="M16 18h1m39 0h1M15 56h1m39 0h1" stroke="#f6edcb" stroke-width="4"/>''')
print('Created original SVG art:',len(list(out.glob('*.svg'))))
# Distinct class silhouettes: light hood, horned axe helm, pointed mage hat,
# engineering goggles and a closed guard visor. All remain original art.
base=out.joinpath('potato.svg').read_text(encoding='utf-8')
looks={
 'ranger':('#6d8b61','#677f60','<path d="M15 20Q35-2 58 19l-4-10Q33-4 18 9Z" fill="#648158"/><path d="M48 9l6-8" stroke="#d6c995"/>'),
 'vanguard':('#9d6250','#866052','<path d="M15 19 9 5l14 5m29 9 11-14-17 5" fill="#d7c5a0"/><path d="M22 12h28" stroke="#ababa0" stroke-width="6"/>'),
 'pyromancer':('#9577a1','#797098','<path d="m12 20 15-5 10-16 11 17 15 6Z" fill="#7f6395"/><path d="m35 7 5 7" stroke="#d5b974"/>'),
 'engineer':('#c6a356','#777d65','<path d="M15 20q0-17 22-16 20 0 21 17Z" fill="#c4a150"/><path d="M35 5v12" stroke="#7c673c"/><rect x="17" y="19" width="17" height="10" rx="3" fill="#99bbb9"/><rect x="37" y="19" width="17" height="10" rx="3" fill="#99bbb9"/>'),
 'warden':('#758b99','#718594','<path d="M17 22q-1-17 20-16 21 1 19 19l-4 19H22Z" fill="#95a7ab"/><path d="M23 26h27v9H23Z" fill="#3c484b"/><path d="M35 6v34" stroke="#d8d8b9" stroke-width="3"/>')}
for name,(hat,coat,extra) in looks.items():
 body=base.replace('#cb6549',hat).replace('#77836a',coat).replace('</g></svg>',extra+'</g></svg>')
 out.joinpath('hero-'+name+'.svg').write_text(body,encoding='utf-8')
svg('axe',56,48,'<path d="m8 39 28-28" stroke="#715340" stroke-width="8"/><path d="M25 9 34 2q2 10 17 13l-4 15q-16-2-22-21Z" fill="#b7c4bf"/><path d="m30 8 13 17" stroke="#edf2d9" stroke-width="2"/>')
svg('shield',42,48,'<path d="M5 8 21 3l16 5v19L21 44 5 27Z" fill="#98afbb"/><path d="M11 12 21 9l10 3v13L21 36 11 25Z" fill="#d8d5aa"/><path d="M21 10v24m-9-16h18" stroke="#6f8390" stroke-width="4"/>')
svg('deployer',46,32,'<rect x="3" y="6" width="33" height="21" rx="5" fill="#7d9585"/><path d="M35 10h8v10h-8" fill="#d7c281"/><path d="M8 11h19v10H8Z" fill="#c9e8a2"/><path d="m12 16 3-3 4 6 4-5" stroke-width="2" fill="none"/>')

svg('crossbow',56,38,'<path d="M5 13h37v6H5Zm0 11h37v6H5Z" fill="#a28757"/><path d="M24 2q15 16 0 34" fill="none" stroke="#738378" stroke-width="5"/><path d="m24 3 14 15-14 16" fill="none" stroke="#d5c48d" stroke-width="1.5"/><path d="M31 16h20m-20 10h20m-4-14 6 4-6 3m0 3 6 4-6 3" stroke="#d8ddd0" stroke-width="2"/>')
svg('fire-staff',46,30,'<path d="M3 19h27" stroke="#755544" stroke-width="7"/><path d="M31 26q-12-8 2-21l1 7 7-10q11 19-2 24Z" fill="#e69758"/><path d="M34 23q-6-5 2-11 7 8 1 11Z" fill="#f9dc8c" stroke-width="2"/>')
