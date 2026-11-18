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
