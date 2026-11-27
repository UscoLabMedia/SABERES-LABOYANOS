// Task 8: el contenido del nivel 2 respeta lo verificado (docs/nivel2-fuentes.md): sin plaza de toros, sin cifras dudosas, preguntas con fuente.
const T=require('./lib'); const fs=require('fs');
const leer=f=>fs.readFileSync(f,'utf8');
const textos={'data/nivel2.json':leer('data/nivel2.json'),'data/trivia2.json':leer('data/trivia2.json'),'alfareria.html':leer('alfareria.html'),'carrera.html':leer('carrera.html')};
const VETADO=[[/plazas? de toros|\btoros?\b/i,'plaza de toros'],[/hace\s+(unos\s+)?\d+\s+años/i,'año aproximado de la primera chiva'],[/\b(19[5-9]\d)\b.*(primera|creó|creada)\s+chiva|primera chiva.*\b(19[5-9]\d)\b/i,'año de la primera chiva'],[/\b(200|250|cientos de)\s+familias/i,'cifra de familias'],[/\d+\s*(°|grados)\s*(c|centígrados)?/i,'temperatura de horno'],[/\bAshuarte\b.*\b(1975|2009)\b|\b(1975|2009)\b.*\bAshuarte\b/i,'año de Ashuarte (hay discrepancia)'],[/60 años/i,'aniversario de la feria (una sola fuente)']];
for (const [f,t] of Object.entries(textos)) for (const [re,n] of VETADO) T.ok(!re.test(t),`${f}: sin ${n}`);
const trivia=JSON.parse(textos['data/trivia2.json']), niv=JSON.parse(textos['data/nivel2.json']); const ids=new Set(niv.pistas.map(p=>p.id));
T.ok(trivia.preguntas.length>=15,`al menos 15 preguntas (${trivia.preguntas.length})`);
T.ok(trivia.preguntas.every(q=>/^https?:\/\//.test(q.fuente||'')),'cada pregunta tiene fuente (enlace)');
T.ok(trivia.preguntas.every(q=>q.opciones.length===4&&q.correcta>=0&&q.correcta<4&&(q.explicacion||'').length>20),'4 opciones, respuesta válida y explicación');
T.ok(trivia.preguntas.every(q=>!q.pista||ids.has(q.pista)),'toda pista citada existe en nivel2.json');
T.ok(new Set(trivia.preguntas.map(q=>q.id)).size===trivia.preguntas.length,'ids de preguntas únicos');
T.ok(/Cecilia Vargas Muñoz/.test(textos['data/nivel2.json'])&&/Ley 1891/.test(textos['data/nivel2.json'])&&/Resolución 23889/.test(textos['data/nivel2.json']),'las pistas citan a Cecilia Vargas Muñoz, la Ley 1891 y la Resolución 23889');
T.fin();
