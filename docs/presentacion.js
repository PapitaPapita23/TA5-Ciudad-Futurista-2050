const pptxgen = require('pptxgenjs');
const { applyTheme } = require('/root/.claude/skills/synced/e5676100-3782-414b-9120-0fd63aab7b66_d7fdcbfc-a2b0-41a7-ba40-230fdb896c24/pptx/scripts/apply_theme.js');

const THEME = {
  name: 'Ciudad Futurista 2050',
  headFontFace: 'Arial', bodyFontFace: 'Calibri',
  colors: {
    dk1: '0B1220', lt1: 'FFFFFF', dk2: '15223A', lt2: 'D9F7FB',
    accent1: '22D3EE', accent2: 'C8102E', accent3: '8EA6C8', accent4: '1E3A5F', accent5: 'F5B700', accent6: '5EEAD4',
    hlink: '22D3EE', folHlink: '8EA6C8'
  }
};
const HEX = { bg: '0B1220', panel: '15223A', cyan: '22D3EE', red: 'C8102E', soft: '8EA6C8', line: '2A3B5C' };

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = 'Víctor Sebastián Mija Mantari';
pres.title = 'TA5 · Ciudad Futurista 2050';
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: 'PORTADA', background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.55, w: 8.8, h: 1.0, fontSize: 40, bold: true, color: C.background1, valign: 'top', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 2.6, w: 8.8, h: 0.6, fontSize: 18, color: C.accent1, align: 'left', margin: 0 }, text: '' } }
  ]
});
pres.defineSlideMaster({
  title: 'CONTENIDO', background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9.0, h: 0.75, fontSize: 30, bold: true, color: C.background1, valign: 'middle', margin: 0 }, text: '' } },
    { text: { text: 'UTP · Herramientas de Desarrollo Profesional – TIC · TA5', options: { x: 0.5, y: 5.2, w: 6.5, h: 0.3, fontSize: 10, color: C.accent3, margin: 0 } } }
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: C.accent3, align: 'right' }
});

function card(slide, x, y, w, h, name) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.text2 }, line: { color: C.accent4, width: 1 }, objectName: name });
}
function shot(slide, x, y, w, h, label) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.text2 }, line: { color: C.accent1, width: 1.25, dashType: 'dash' }, objectName: 'Captura ' + label });
  slide.addText('Captura: ' + label, { x: x + 0.2, y, w: w - 0.4, h, fontSize: 14, italic: true, color: C.accent3, align: 'center', valign: 'middle', isTextBox: true });
}
function dot(slide, x, y, n) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: 0.42, h: 0.42, fill: { color: C.accent1 }, objectName: 'Marcador ' + n });
  slide.addText(String(n), { x, y, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: C.text1, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
}
function bullets(slide, items, x, y, w, h, size = 16) {
  slide.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
    { x, y, w, h, fontSize: size, color: C.background1, paraSpaceAfter: 8, valign: 'top', isTextBox: true });
}

// 1. Carátula
pres.addSection({ title: 'Presentación' });
let s = pres.addSlide({ masterName: 'PORTADA', sectionTitle: 'Presentación' });
s.addText('TA5 · Tarea Académica 5', { x: 0.6, y: 0.9, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.accent2, margin: 0, isTextBox: true });
s.addText('Ciudad Futurista 2050', { placeholder: 'title' });
s.addText('Escenario 3D en Unity recorrido con HTC VIVE y smartphone', { placeholder: 'body' });
s.addText([
  { text: 'Autor: ', options: { bold: true } }, { text: 'Víctor Sebastián Mija Mantari (U22207475)', options: { breakLine: true } },
  { text: 'Objetivo: ', options: { bold: true } }, { text: 'construir una ciudad y recorrerla Portal → Plaza → Torre en dos dispositivos', options: { breakLine: true } },
  { text: 'Unity: ', options: { bold: true } }, { text: 'Unity 6.6 (6000.6.10f1) · XR Interaction Toolkit 3.7.0 + OpenXR' }
], { x: 0.6, y: 3.55, w: 8.8, h: 1.2, fontSize: 15, color: C.background2, paraSpaceAfter: 4, valign: 'top', margin: 0, isTextBox: true });
s.addNotes('Presentar el objetivo y la versión de Unity usada.');

// 2. Idea del entorno
pres.addSection({ title: 'Escena' });
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Escena' });
s.addText('Una ciudad, tres lugares, un solo camino', { placeholder: 'title' });
// Recorte de la vista Game (833 × 356 px) de la captura real en Unity.
const IMG_H = 5.0 * 356 / 833;
s.addImage({ path: '/home/claude/ta5/build/unity_inicio_portal.jpg', x: 0.5, y: 1.25, w: 5.0, h: IMG_H, objectName: 'Vista desde el inicio', altText: 'Vista desde el inicio en Unity: sendero hacia el Portal' });
s.addText('Vista desde el inicio en Unity', { x: 0.5, y: 1.25 + IMG_H + 0.08, w: 5.0, h: 0.35, fontSize: 11, italic: true, color: C.accent3, margin: 0, isTextBox: true });
s.addText('Estilo neón nocturno: el Portal en primer plano, la Plaza detrás y la Torre al fondo del mismo sendero.', { x: 0.5, y: 3.95, w: 5.0, h: 0.7, fontSize: 13, color: C.background2, valign: 'top', margin: 0, isTextBox: true });
const zonas = [['Portal de entrada', 'Pilares de 6 m y dos arcos de neón. Aquí empieza el recorrido.'], ['Plaza central', 'Plataforma de 20 m con holograma, farolas y luz cian.'], ['Torre de observación', 'Torre de 30 m con anillos y mirador; se ve desde el Portal.']];
zonas.forEach(([t, d], i) => {
  const y = 1.25 + i * 1.0;
  dot(s, 5.85, y + 0.05, String.fromCharCode(65 + i));
  s.addText([{ text: t, options: { bold: true, breakLine: true, fontSize: 16 } }, { text: d, options: { fontSize: 13, color: C.background2 } }],
    { x: 6.4, y, w: 3.15, h: 0.9, color: C.background1, valign: 'top', margin: 0, isTextBox: true });
});

// 3. Construcción
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Escena' });
s.addText('Construcción en Unity', { placeholder: 'title' });
const stats = [['388', 'objetos visibles'], ['6', 'materiales'], ['4', 'luces'], ['101 m', 'de recorrido']];
stats.forEach(([n, l], i) => {
  const x = 0.5 + i * 2.3;
  card(s, x, 1.2, 2.05, 1.15, 'Dato ' + l);
  s.addText(n, { x, y: 1.25, w: 2.05, h: 0.65, fontSize: 32, bold: true, color: C.accent1, align: 'center', valign: 'middle', isTextBox: true });
  s.addText(l, { x, y: 1.88, w: 2.05, h: 0.4, fontSize: 14, color: C.background2, align: 'center', valign: 'top', isTextBox: true });
});
bullets(s, [
  'Primitivas de Unity; un script de editor arma la escena desde ciudad_layout.json',
  'Rediseño neón nocturno: cielo Cielo_Noche, niebla violeta y Bloom',
  'Ventanas iluminadas, farolas y una segunda fila de rascacielos',
  'AmbientMotion.cs mueve autos voladores, holograma y baliza'
], 0.5, 2.6, 4.7, 2.4, 14);
card(s, 5.4, 2.6, 4.1, 2.35, 'Esquema de ruta');
s.addText('Ruta de 101 m', { x: 5.6, y: 2.7, w: 3.7, h: 0.4, fontSize: 15, bold: true, color: C.accent1, margin: 0, isTextBox: true });
const ruta = [['Inicio', 'z −58'], ['Portal', 'z −45'], ['Plaza', 'z 0'], ['Torre', 'z 43']];
s.addShape(pres.shapes.LINE, { x: 5.95, y: 3.65, w: 3.0, h: 0, line: { color: C.accent1, width: 2 }, objectName: 'Línea de ruta' });
ruta.forEach(([n, z], i) => {
  const x = 5.75 + i * 1.0;
  s.addShape(pres.shapes.OVAL, { x, y: 3.45, w: 0.4, h: 0.4, fill: { color: i === 0 ? C.accent3 : C.accent1 }, objectName: 'Punto ' + n });
  s.addText(n, { x: x - 0.3, y: 3.95, w: 1.0, h: 0.35, fontSize: 14, bold: true, color: C.background1, align: 'center', margin: 0, isTextBox: true });
  s.addText(z, { x: x - 0.3, y: 4.3, w: 1.0, h: 0.3, fontSize: 11, color: C.accent3, align: 'center', margin: 0, isTextBox: true });
});

// 4. HTC VIVE
pres.addSection({ title: 'Navegación' });
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Navegación' });
s.addText('Recorrido con HTC VIVE', { placeholder: 'title' });
const vr = ['SteamVR reconoce visor, estaciones y controladores', 'OpenXR activo en PC + perfil HTC Vive Controller', 'XR Origin (Starter Assets) ubicado en el inicio', 'Teletransporte solo sobre suelo, sendero, plaza y mirador'];
vr.forEach((t, i) => {
  const y = 1.2 + i * 0.9;
  dot(s, 0.5, y, i + 1);
  s.addText(t, { x: 1.1, y: y - 0.1, w: 3.9, h: 0.65, fontSize: 15, color: C.background1, valign: 'middle', margin: 0, isTextBox: true });
});
card(s, 5.4, 1.2, 4.1, 3.75, 'Controles VIVE');
s.addText([{ text: 'En el visor', options: { bold: true, breakLine: true, color: C.accent1 } },
  { text: 'Se mira girando la cabeza', options: { bullet: true, breakLine: true } },
  { text: 'Se apunta al suelo con el control y aparece un arco', options: { bullet: true, breakLine: true } },
  { text: 'Al soltar, el usuario se teletransporta', options: { bullet: true, breakLine: true } },
  { text: 'Edificios y muros invisibles bloquean el paso', options: { bullet: true } }],
  { x: 5.6, y: 1.35, w: 3.7, h: 3.45, fontSize: 15, color: C.background1, valign: 'top', paraSpaceAfter: 8, isTextBox: true });

// 5. Smartphone
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Navegación' });
s.addText('Recorrido en el smartphone', { placeholder: 'title' });
s.addImage({ path: '/home/claude/ta5/build/unity_plaza_14_8s.jpg', x: 0.5, y: 1.2, w: 5.0, h: IMG_H, objectName: 'Modo celular en Play', altText: 'Modo celular en Play llegando a la Plaza, con el joystick a la izquierda' });
s.addText('Modo celular en Play, llegando a la Plaza: joystick a la izquierda; arrastrar a la derecha para mirar.', { x: 0.5, y: 1.2 + IMG_H + 0.08, w: 5.0, h: 0.55, fontSize: 11, italic: true, color: C.accent3, valign: 'top', margin: 0, isTextBox: true });
card(s, 5.8, 1.2, 3.7, 1.7, 'Controles');
s.addText([{ text: 'Controles', options: { bold: true, breakLine: true, color: C.accent1 } },
  { text: 'Joystick izquierdo: caminar a 3.2 m/s', options: { breakLine: true } },
  { text: 'Arrastre derecho: mirar (±70°)' }], { x: 6.0, y: 1.3, w: 3.4, h: 1.5, fontSize: 15, color: C.background1, valign: 'top', paraSpaceAfter: 4, isTextBox: true });
card(s, 5.8, 3.1, 3.7, 1.85, 'Diferencia');
s.addText([{ text: 'No es VR inmersiva', options: { bold: true, breakLine: true, color: C.accent1 } },
  { text: 'Misma escena en pantalla con controles táctiles. En el VIVE se mira con la cabeza y se apunta con el control.' }],
  { x: 6.0, y: 3.2, w: 3.4, h: 1.65, fontSize: 14, color: C.background1, valign: 'top', paraSpaceAfter: 4, isTextBox: true });
s.addText('APK generado con TA5 > 4. Generar APK Android', { x: 0.5, y: 4.0, w: 5.0, h: 0.4, fontSize: 13, italic: true, color: C.accent3, margin: 0, isTextBox: true });

// 6. Pruebas y métricas
pres.addSection({ title: 'Resultados' });
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Resultados' });
s.addText('Pruebas y métricas', { placeholder: 'title' });
const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.bg, fill: { color: HEX.cyan } } });
const cell = (t) => ({ text: t, options: { color: 'FFFFFF' } });
s.addTable([
  [hdr('Indicador'), hdr('Fórmula'), hdr('Meta')],
  [cell('Éxito del recorrido'), cell('completos ÷ 4'), cell('≥ 75 %')],
  [cell('Tiempo promedio'), cell('suma ÷ 4'), cell('registrar')],
  [cell('Errores'), cell('por intento'), cell('≤ 2')],
  [cell('Comodidad'), cell('suma ÷ 4'), cell('≥ 4/5')]
], { x: 0.5, y: 1.2, w: 5.2, colW: [2.1, 1.8, 1.3], fontSize: 14, fontFace: 'Calibri', border: { type: 'solid', pt: 0.75, color: HEX.line }, fill: { color: HEX.panel }, rowH: 0.48 });
s.addText('2 intentos por dispositivo = 4 recorridos. Resultados en la sustentación.', { x: 0.5, y: 3.75, w: 5.2, h: 0.4, fontSize: 13, italic: true, color: C.accent3, margin: 0, isTextBox: true });
card(s, 6.0, 1.2, 3.5, 3.75, 'Prueba previa');
s.addText('Antes del laboratorio', { x: 6.2, y: 1.3, w: 3.1, h: 0.4, fontSize: 15, bold: true, color: C.accent1, margin: 0, isTextBox: true });
s.addText('9/9', { x: 6.2, y: 1.75, w: 3.1, h: 0.7, fontSize: 36, bold: true, color: C.background1, margin: 0, isTextBox: true });
s.addText('pruebas automáticas en verde (Test Runner)', { x: 6.2, y: 2.4, w: 3.1, h: 0.5, fontSize: 13, color: C.background2, margin: 0, isTextBox: true });
s.addText('29.8 s', { x: 6.2, y: 3.0, w: 3.1, h: 0.7, fontSize: 36, bold: true, color: C.background1, margin: 0, isTextBox: true });
s.addText('recorrido real en Unity a 3.2 m/s; Plaza a los 14.8 s', { x: 6.2, y: 3.65, w: 3.1, h: 0.5, fontSize: 13, color: C.background2, margin: 0, isTextBox: true });

// 7. Problemas
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Resultados' });
s.addText('Problemas encontrados y mejora', { placeholder: 'title' });
const probs = [
  ['La plaza era una cúpula invisible', 'El collider por defecto del cilindro lo deformaba. Lo cambié a MeshCollider.'],
  ['Letreros pegados a la cara', 'Al llegar a la Torre los rótulos tapaban la vista. Los subí frente a la torre.'],
  ['Probar sin visor', 'El modo celular funciona en el Editor con teclado y mouse; el VIVE solo se usa en el laboratorio.'],
  ['Mejora propuesta', 'Solo teletransporte y giro por pasos (snap turn) en el VIVE para reducir el mareo.']
];
probs.forEach(([t, d], i) => {
  const x = 0.5 + (i % 2) * 4.6, y = 1.2 + Math.floor(i / 2) * 1.9;
  card(s, x, y, 4.4, 1.7, 'Problema ' + (i + 1));
  s.addText([{ text: t, options: { bold: true, breakLine: true, color: C.accent1, fontSize: 16 } }, { text: d, options: { fontSize: 14 } }],
    { x: x + 0.2, y: y + 0.1, w: 4.0, h: 1.5, color: C.background1, valign: 'top', paraSpaceAfter: 4, isTextBox: true });
});

// 8. Conclusiones
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Resultados' });
s.addText('Conclusiones', { placeholder: 'title' });
bullets(s, [
  'Separar el entorno de la navegación permitió usar una sola escena para los dos dispositivos',
  'Las pruebas automáticas detectaron problemas de colisión antes de usar el visor',
  'Teletransporte y joystick recorren la misma ruta de forma distinta, así que sus tiempos no se comparan como la misma prueba'
], 0.5, 1.2, 5.2, 3.5, 16);
card(s, 6.0, 1.2, 3.5, 3.75, 'Requisitos');
const req = ['10+ objetos (388)', '3+ materiales (6)', '2+ luces (4)', '3 zonas rotuladas', 'Camino libre', 'HTC VIVE y smartphone'];
s.addText('Requisitos de la TA5', { x: 6.2, y: 1.3, w: 3.1, h: 0.4, fontSize: 15, bold: true, color: C.accent1, margin: 0, isTextBox: true });
req.forEach((t, i) => {
  const y = 1.85 + i * 0.5;
  s.addShape(pres.shapes.OVAL, { x: 6.2, y: y + 0.05, w: 0.28, h: 0.28, fill: { color: C.accent1 }, objectName: 'Check ' + (i + 1) });
  s.addText(t, { x: 6.6, y, w: 2.8, h: 0.38, fontSize: 14, color: C.background1, valign: 'middle', margin: 0, isTextBox: true });
});

(async () => {
  const out = process.argv[2];
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log('ok');
})();
