const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, BorderStyle, LevelFormat, PageBreak, Footer, Header, PageNumber,
  TableOfContents
} = require('docx');

const RED = 'C8102E', TEAL = '0E9F9A', GRAY = '595959';
const PAGE_W = 11906, MARGIN = 1134, CONTENT = PAGE_W - 2 * MARGIN; // A4, márgenes 2 cm

// Texto con **negrita** y [[pendiente]] resaltado en amarillo.
function runs(text, opts = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...opts }));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(new TextRun({ text: tok.slice(2, -2), bold: true, ...opts }));
    else out.push(new TextRun({ text: '[' + tok.slice(2, -2) + ']', highlight: 'yellow', ...opts }));
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...opts }));
  return out;
}
const P = (t, o = {}) => new Paragraph({ children: runs(t, o.run || {}), spacing: { after: 120, line: 276 }, alignment: o.align || AlignmentType.JUSTIFIED, ...(o.p || {}) });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const B = (t) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: runs(t), spacing: { after: 60, line: 276 } });
const N = (t) => new Paragraph({ numbering: { reference: 'nums', level: 0 }, children: runs(t), spacing: { after: 60, line: 276 } });

const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const borders = { top: border, bottom: border, left: border, right: border };
function table(widths, rows, headerFill = RED, keep = false) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0, cantSplit: true,
      children: r.map((c, j) => new TableCell({
        borders, width: { size: widths[j], type: WidthType.DXA },
        shading: i === 0 ? { fill: headerFill, type: ShadingType.CLEAR, color: 'auto' } : (i % 2 === 0 ? { fill: 'F5F7FA', type: ShadingType.CLEAR, color: 'auto' } : undefined),
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ keepNext: keep && i < rows.length - 1, children: runs(c, i === 0 ? { bold: true, color: 'FFFFFF', size: 19 } : { size: 19 }) })]
      }))
    }))
  });
}
// Recuadro para pegar una captura propia.
function shot(label) {
  const b = { style: BorderStyle.DASHED, size: 6, color: '7F8FA6' };
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [CONTENT],
    rows: [new TableRow({ height: { value: 1500, rule: 'atLeast' }, children: [new TableCell({
      borders: { top: b, bottom: b, left: b, right: b }, width: { size: CONTENT, type: WidthType.DXA },
      shading: { fill: 'F2F5F9', type: ShadingType.CLEAR, color: 'auto' },
      verticalAlign: 'center',
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Pegar aquí: ' + label, italics: true, color: GRAY, highlight: 'yellow', size: 19 })] })]
    })] })]
  });
}
const gap = () => new Paragraph({ spacing: { after: 80 }, children: [] });
function paso(n, titulo, accion, menu, config, resultado) {
  return [
    H3(`PASO ${String(n).padStart(2, '0')} · ${titulo}`),
    table([2000, CONTENT - 2000], [
      ['Elemento', 'Detalle'],
      ['Acción realizada', accion],
      ['Menú o componente', menu],
      ['Configuración', config],
      ['Resultado', resultado]
    ], '34495E', true),
    gap()
  ];
}

const content = [];
// ---------------- Portada
content.push(
  new Paragraph({ spacing: { before: 1800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'UNIVERSIDAD TECNOLÓGICA DEL PERÚ', bold: true, size: 26, color: RED })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'Herramientas de Desarrollo Profesional – TIC · Sección 49404', size: 22, color: GRAY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TAREA ACADÉMICA 5', bold: true, size: 24, color: TEAL })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'Entorno futurista en Unity', bold: true, size: 48 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 }, children: [new TextRun({ text: '«Ciudad Futurista 2050»: escenario 3D recorrido con HTC VIVE y smartphone', italics: true, size: 24, color: GRAY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: runs('**Docente:** Prof. Jurado Sandoval', { size: 22 }) }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: runs('**Autor:** Víctor Sebastián Mija Mantari (U22207475)', { size: 22 }) }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: runs('Trabajo individual', { size: 22, color: GRAY }) }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: runs('Lima, noviembre de 2026', { size: 22, color: GRAY }) }),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ children: [new TextRun({ text: 'Contenido', bold: true, size: 28, font: 'Arial' })], spacing: { after: 120 } }),
  new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-2' }),
  new Paragraph({ children: [new PageBreak()] })
);

// ---------------- 1. Objetivo y alcance
content.push(
  H1('1. Objetivo y alcance'),
  P('Construí en Unity una sola ciudad futurista con tres lugares conectados por un recorrido: Portal de entrada, Plaza central y Torre de observación. La misma escena se recorre con el visor HTC VIVE (teletransporte con los controladores) y con un smartphone Android (joystick táctil y arrastre para mirar).'),
  P('Siguiendo el alcance de la TA5, el proyecto no incluye botones funcionales, recolección de objetos, misiones ni combate. Lo que se evalúa es la construcción de la escena, el desplazamiento en los dos dispositivos, las pruebas y la documentación.'),
  H2('1.1 Herramientas y versiones'),
  table([3200, CONTENT - 3200], [
    ['Herramienta', 'Versión / detalle'],
    ['Unity Editor', 'Unity 6.6 (6000.6.10f1), plantilla Universal 3D (URP)'],
    ['XR Interaction Toolkit', 'Versión 3.7.0 instalada desde el menú TA5, con la muestra Starter Assets'],
    ['OpenXR Plugin y XR Plug-in Management', 'OpenXR activo para PC con el perfil HTC Vive Controller Profile'],
    ['Input System', 'Paquete de entrada usado por los controles del celular y del Editor'],
    ['Runtime del visor', 'SteamVR configurado como runtime OpenXR'],
    ['Visor', 'HTC VIVE con 2 estaciones base y 2 controladores'],
    ['Smartphone', 'Teléfono Android con la app instalada desde el APK'],
    ['Módulo de compilación', 'Android Build Support (OpenJDK, Android SDK y NDK)']
  ]),
  gap()
);

// ---------------- 2. Escenario
content.push(
  H1('2. Escenario «Ciudad Futurista 2050»'),
  P('La ciudad ocupa un terreno de 70 × 130 m. El recorrido es una línea recta de 101 m que sale del inicio, cruza el Portal, atraviesa la Plaza y termina en el mirador de la Torre. Al estar alineadas, desde el Portal ya se ve la Torre al fondo, lo que ayuda a orientarse.'),
  table([2600, 2400, CONTENT - 5000], [
    ['Lugar', 'Posición (x, z)', 'Qué contiene'],
    ['Inicio', '(0, −58)', 'Punto donde aparece el usuario, mirando hacia el Portal.'],
    ['Zona A · Portal de entrada', '(0, −45)', 'Dos pilares metálicos de 6 m con franjas magenta, un arco de neón cian y un segundo arco encima; paso libre de 6 m de ancho.'],
    ['Zona B · Plaza central', '(0, 0)', 'Plataforma circular de 20 m con borde luminoso, holograma que gira, 4 farolas, 2 bancos y luz puntual cian.'],
    ['Zona C · Torre de observación', '(0, 43)', 'Mirador circular de 10 m y torre de 30 m con anillos de neón, cúpula, antena y una baliza en la punta.']
  ]),
  gap(),
  P('A los lados del sendero hay 8 edificios de 12 a 32 m con ventanas iluminadas y bordes de neón. Detrás, a los costados y al fondo, una segunda fila de 20 rascacielos forma el skyline. Cuatro muros invisibles marcan los límites del escenario para que nadie salga del terreno.'),
  table([3000, CONTENT - 3000], [
    ['Requisito', 'Cumplimiento'],
    ['Al menos 10 objetos visibles', '388 objetos visibles (suelo, senderos, líneas de neón, portal, plaza, farolas, bancos, torre, edificios con sus ventanas, skyline y autos voladores)'],
    ['3 materiales', '6 materiales: Mat_Suelo, Mat_Metal, Mat_Vidrio, Mat_Neon (cian emisivo), Mat_NeonRosa (magenta emisivo) y Mat_Ventanas (ámbar emisivo)'],
    ['2 fuentes de luz', '4 luces: Luz_Sol (direccional, con sombras) y las puntuales Luz_Plaza, Luz_Portal y Luz_Torre'],
    ['3 lugares identificados', 'Grupos Zona_A_Portal, Zona_B_Plaza y Zona_C_Torre, cada uno con su rótulo 3D'],
    ['Camino libre', 'Sendero de 4 m de ancho sin obstáculos; comprobado con pruebas automáticas (sección 7.1)']
  ]),
  gap(),
  H2('2.1 Diseño visual'),
  P('Después de la primera versión rediseñé la parte visual con un estilo de neón nocturno. El cielo usa el material Cielo_Noche, hecho con el shader Skybox/Procedural, y una niebla violeta oculta el borde del terreno y le da profundidad a los edificios lejanos.'),
  P('Los edificios tienen ventanas iluminadas en ámbar y bordes de neón. El sendero lleva líneas de neón en el piso y farolas a ambos lados, la plaza tiene un borde luminoso y el Portal ganó un segundo arco. En la Torre agregué anillos y una antena.'),
  P('El brillo del neón depende del postproceso. El objeto Postproceso_Global tiene un Global Volume con Bloom, Tonemapping ACES, Vignette y Color Adjustments; sin el Bloom los materiales emisivos se ven planos.'),
  P('Para que la ciudad no se vea congelada escribí el script AmbientMotion.cs, que mueve algunos objetos decorativos. Seis autos voladores van y vienen sobre el sendero, el holograma de la plaza gira y la baliza de la torre sube y baja. Es movimiento de ambiente: no responde al usuario y esos objetos no tienen collider, así que no estorban el recorrido ni agregan interacción fuera del alcance de la tarea.'),
  gap()
);

// ---------------- 3. Pregunta 1
content.push(
  H1('3. Pregunta 1 · ¿Cómo se construye un entorno futurista en Unity?'),
  P('Creé el proyecto desde Unity Hub con la plantilla 3D y organicé todo dentro de Assets/_TA5 en las carpetas Scenes, Models, Materials, Prefabs, Scripts, UI y Tests. La ciudad se armó con objetos primitivos (cubos, cilindros y esferas), lo que mantiene la escena liviana para el celular.'),
  P('Para no colocar a mano casi cuatrocientos objetos, escribí un script de editor (TA5CiudadBuilder.cs) que lee las posiciones y tamaños desde un archivo ciudad_layout.json y crea la escena desde el menú **TA5 > 3. Construir Ciudad Futurista 2050**. El script también crea los seis materiales, las cuatro luces, el cielo nocturno, la niebla y el volumen de postproceso. Además agrega los rótulos de cada zona, los límites y los dos rigs de navegación, y guarda la escena CiudadFuturista2050.unity.'),
  P('En la jerarquía la escena queda ordenada así: Ciudad_Futurista_2050 contiene Entorno (suelo, senderos y edificios), las tres zonas, Limites, Iluminacion y Ruta (puntos de control). Aparte están Jugador_Movil, Rig_VR, UI_Movil, Postproceso_Global, Plataforma y Medidor_Recorrido.'),
  P('Dos decisiones técnicas que vale la pena explicar: los cilindros anchos (plaza y mirador) usan MeshCollider porque el CapsuleCollider por defecto los convierte en una cúpula invisible, y las plataformas miden 0.2 m de alto para que el personaje las suba sin saltar (el CharacterController acepta escalones de hasta 0.3 m).'),
  gap()
);

// ---------------- 4. Pregunta 2
content.push(
  H1('4. Pregunta 2 · ¿Cómo se recorre la ciudad utilizando HTC VIVE?'),
  P('El visor se conecta a Unity por OpenXR, con SteamVR como runtime. En **Edit > Project Settings > XR Plug-in Management**, pestaña de PC, activé OpenXR, y en la sección OpenXR agregué el perfil **HTC Vive Controller Profile**. Luego apliqué las correcciones que propone Project Validation.'),
  P('El rig es el prefab XR Origin (XR Rig) de la muestra Starter Assets del XR Interaction Toolkit. Lo ubiqué en el inicio, frente al Portal. El suelo, los senderos, la plaza y el mirador tienen el componente TeleportationArea, así que el usuario solo puede teletransportarse sobre superficies válidas y nunca cae por debajo del piso. Los edificios y los muros de límite bloquean el paso.'),
  P('Elegí el teletransporte como método principal porque es el más cómodo para quien no está acostumbrado a la realidad virtual. El desplazamiento continuo con el trackpad también está disponible, pero en las pruebas usé teletransporte.'),
  P('El script PlatformSwitcher decide qué rig usar: si detecta un visor XR activo enciende Rig_VR y apaga el jugador del celular y su interfaz.'),
  gap()
);

// ---------------- 5. Pregunta 3
content.push(
  H1('5. Pregunta 3 · ¿Cómo se recorre la misma ciudad desde un smartphone?'),
  P('La versión móvil usa la misma escena, sin cambios en el entorno. Al abrir la app en el celular no hay visor activo, así que PlatformSwitcher enciende Jugador_Movil y la interfaz táctil UI_Movil.'),
  P('El jugador es un CharacterController con una cámara a 1.65 m de altura. En la parte izquierda de la pantalla hay un joystick (TouchJoystick.cs) que mueve al personaje a 3.2 m/s. Arrastrar el dedo en la parte derecha (TouchLookArea.cs) gira la vista en horizontal y vertical, con un límite de 70° hacia arriba y abajo. Arriba se muestra la ruta y el tiempo del recorrido.'),
  P('Para compilar instalé Android Build Support desde Unity Hub y generé el APK con el menú **TA5 > 4. Generar APK Android**, que deja el archivo en la carpeta Entrega. Luego lo instalé en el teléfono y recorrí la ciudad completa.'),
  H3('Diferencia entre ambos controles'),
  P('En el HTC VIVE el usuario mira girando la cabeza y se desplaza apuntando con el controlador al lugar de destino; la experiencia es inmersiva porque la cámara sigue la posición real de la cabeza. En el celular la escena 3D se ve en pantalla y todo se controla con los dedos: no es realidad virtual inmersiva, es una aplicación 3D con controles táctiles, tal como permite la tarea.'),
  gap()
);

// ---------------- 6. Procedimiento
content.push(
  new Paragraph({ children: [new PageBreak()] }),
  H1('6. Procedimiento paso a paso'),
  P('Cada paso indica la acción, el menú o componente de Unity utilizado, la configuración relevante y el resultado obtenido.'),
  H2('6.1 Crear el entorno futurista'),
  ...paso(1, 'Instalar Unity', 'Instalé Unity Hub y el Editor con soporte para Android.', 'Unity Hub > Installs > Install Editor', 'Unity 6.6 (6000.6.10f1); módulo Android Build Support con OpenJDK y SDK/NDK.', 'Editor listo para crear proyectos de PC y Android.'),
  ...paso(2, 'Crear el proyecto', 'Creé el proyecto TA5_CiudadFuturista2050_MijaMantari.', 'Unity Hub > New project > 3D (Universal 3D)', 'Plantilla 3D con URP.', 'Proyecto abierto en el Editor.'),
  ...paso(3, 'Importar scripts y carpetas', 'Copié la carpeta _TA5 dentro de Assets.', 'Ventana Project', 'Carpetas Scenes, Models, Materials, Prefabs, Scripts, UI y Tests.', 'Aparece el menú TA5 en la barra superior.'),
  ...paso(4, 'Instalar paquetes XR', 'Instalé Input System, OpenXR y XR Interaction Toolkit 3.7.0.', 'TA5 > 1. Instalar paquetes', 'Acepté reiniciar el Editor para activar el Input System.', 'Paquetes visibles en Window > Package Manager.'),
  ...paso(5, 'Construir la ciudad', 'Generé la escena con terreno, edificios, sendero, plaza, torre y portal.', 'TA5 > 3. Construir Ciudad Futurista 2050', 'Escena guardada como CiudadFuturista2050.unity; 388 objetos visibles.', 'Ciudad completa en la vista Scene.'),
  ...paso(6, 'Materiales, luces y postproceso', 'Revisé los materiales, las luces, el cielo y el volumen de postproceso.', 'Inspector de Mat_Neon, Luz_Plaza y Postproceso_Global; Window > Rendering > Lighting', '6 materiales (3 emisivos) y 4 luces (1 direccional y 3 puntuales); cielo Cielo_Noche y niebla violeta; Global Volume con Bloom, Tonemapping ACES, Vignette y Color Adjustments.', 'Ciudad nocturna con neón cian y magenta y ventanas ámbar.'),
  ...paso(7, 'Rotular y verificar la ruta', 'Comprobé los rótulos de Portal, Plaza y Torre y que el sendero esté despejado.', 'Hierarchy > Ruta; rótulos TextMesh', 'Sendero de 4 m de ancho; paso entre pilares de 6 m.', 'Ruta Portal → Plaza → Torre sin obstáculos.'),
  ...paso(8, 'Colliders, Play Mode y Console', 'Ejecuté la escena y caminé con WASD para probar colisiones.', 'Play; Window > General > Console; Test Runner', 'MeshCollider en cilindros; muros invisibles en los 4 bordes.', 'No se atraviesa el piso ni los edificios; Console sin errores.'),
  H2('6.2 Integrar navegación en HTC VIVE'),
  ...paso(9, 'Comprobar el visor', 'Verifiqué que la PC reconozca el visor, las estaciones base y los controladores.', 'SteamVR (ventana de estado)', 'Room setup del área de juego; SteamVR como runtime OpenXR.', 'Todos los dispositivos en verde.'),
  ...paso(10, 'Configurar OpenXR', 'Activé OpenXR para PC y el perfil de controladores VIVE.', 'Project Settings > XR Plug-in Management > OpenXR', 'Pestaña PC: OpenXR activo; Interaction Profiles: HTC Vive Controller Profile; Project Validation: Fix All.', 'Sin advertencias en Project Validation.'),
  ...paso(11, 'Rig XR y teletransporte', 'Importé Starter Assets y volví a construir la ciudad para incluir el XR Origin.', 'TA5 > 2. Importar Starter Assets; TA5 > 3. Construir', 'XR Origin (XR Rig) en el inicio; TeleportationArea en suelo, senderos, plaza y mirador.', 'Rig_VR listo dentro de la escena.'),
  ...paso(12, 'Recorrido con el visor', 'Recorrí con el visor desde el Portal hasta la Torre.', 'Play con el visor puesto', 'Teletransporte con el controlador; tiempo medido por Medidor_Recorrido.', 'Recorrido completo Portal → Plaza → Torre.'),
  H2('6.3 Integrar navegación en smartphone'),
  ...paso(13, 'Módulo Android', 'Cambié la plataforma a Android.', 'File > Build Profiles (o Build Settings) > Android > Switch Platform', 'Android Build Support instalado.', 'Proyecto configurado para Android.'),
  ...paso(14, 'Cámara y controles táctiles', 'Revisé el jugador móvil y la interfaz táctil.', 'Jugador_Movil: CharacterController + MobilePlayerController; UI_Movil: TouchJoystick, TouchLookArea', 'Velocidad 3.2 m/s; sensibilidad 0.15°/px; orientación horizontal.', 'El entorno base no cambia.'),
  ...paso(15, 'Generar el APK', 'Compilé la app instalable.', 'TA5 > 4. Generar APK Android', 'Escena única en Build Settings; APK en la carpeta Entrega.', 'Archivo TA5_CiudadFuturista2050.apk.'),
  ...paso(16, 'Instalar y recorrer', 'Instalé el APK en el teléfono y recorrí la ciudad.', 'Ajustes del teléfono > instalar apps de origen desconocido', 'Orientación horizontal; joystick a la izquierda y zona para mirar a la derecha.', 'Recorrido Portal → Plaza → Torre en el celular.')
);

// ---------------- 7. Pregunta 4
content.push(
  H1('7. Pregunta 4 · ¿Cómo se comprueba y sustenta la navegación?'),
  H2('7.1 Pruebas automáticas y recorrido en el Editor'),
  P('Antes de usar el visor verifiqué la escena con pruebas automáticas en el Test Runner de Unity (pestaña EditMode). Las pruebas comprueban que la escena cumpla los mínimos de la tarea (al menos 10 objetos visibles, 3 materiales y 2 fuentes de luz), que existan las tres zonas con su rótulo y que haya suelo bajo toda la ruta. También revisan los límites, la configuración del jugador móvil y del rig de VR, y que una cápsula del tamaño de una persona pueda ir del inicio a la Torre sin chocar. Con la escena rediseñada las 9 pruebas pasan en verde.'),
  P('Como prueba previa, con el mismo archivo ciudad_layout.json simulé fuera de Unity una caminata a 3.2 m/s y no hubo choques en el camino. Después hice el recorrido en Play Mode, en modo escritorio y a la misma velocidad. Medidor_Recorrido registró la llegada a la Plaza a los 14.8 s y a la Torre a los 29.8 s, y confirmó que el recorrido pasó por la Plaza.'),
  H2('7.2 Pruebas de desplazamiento'),
  P('Hice el mismo recorrido dos veces en cada dispositivo, cuatro intentos en total, siguiendo siempre la ruta Portal → Plaza → Torre. El tiempo lo toma el Medidor_Recorrido, que empieza cuando me alejo del inicio y se detiene al llegar a la Torre. Como errores cuento los choques, las desorientaciones y los bloqueos, y la comodidad la valoro de 1 a 5 al terminar cada intento. Si aparece malestar con el visor, la prueba se detiene.'),
  P('Los resultados se registran en Matriz_Pruebas.xlsx, que calcula las métricas, y se muestran en la sustentación.'),
  gap(),
  H2('7.3 Métricas'),
  P('Son las métricas que pide la tarea. No hace falta un valor exacto de FPS ni telemetría: se informa lo que pasó y se propone una mejora.'),
  table([3000, CONTENT - 4800, 1800], [
    ['Indicador', 'Fórmula', 'Meta'],
    ['Éxito del recorrido', '(recorridos completos ÷ 4) × 100', '≥ 75 %'],
    ['Tiempo promedio', 'suma de los 4 tiempos ÷ 4', 'registrar y comparar'],
    ['Errores de navegación', 'choques, desorientaciones o bloqueos por intento', '≤ 2 por intento'],
    ['Comodidad percibida', 'suma de las 4 valoraciones ÷ 4', '≥ 4/5']
  ]),
  gap(),
  H2('7.4 Dificultades y mejora'),
  B('**Cilindros como cúpulas invisibles.** Al principio la plaza tenía el collider por defecto y el personaje caminaba sobre una cúpula. Lo resolví con MeshCollider.'),
  B('**Rótulos encima del jugador.** En una primera versión, el letrero del tiempo y el rótulo de la Torre quedaban pegados a la cara al llegar. Los moví al frente de la torre, a 4.6 y 8.5 m de altura.'),
  B('**Probar sin visor.** El HTC VIVE solo está disponible en el laboratorio. Para no depender de él, el modo celular también funciona en el Editor con teclado y mouse, y las pruebas automáticas revisan la escena sin necesidad del visor.'),
  P('**Mejora propuesta:** dejar el teletransporte como único desplazamiento en el VIVE y usar giro por pasos (snap turn) en lugar de giro continuo, que es lo que más mareo suele causar en usuarios nuevos.'),
  H1('8. Estructura del proyecto y entregables'),
  P('TA5_CiudadFuturista2050_MijaMantari/Assets/_TA5 contiene Scenes (CiudadFuturista2050.unity), Materials (6 materiales y el cielo Cielo_Noche), Prefabs (Ciudad_Futurista_2050 y Jugador_Movil), Scripts (TouchJoystick, TouchLookArea, MobilePlayerController, PlatformSwitcher, RouteTimer, AmbientMotion y, en Scripts/Editor, TA5CiudadBuilder con ciudad_layout.json), UI y Tests (CiudadFuturistaTests y TA5.Tests.asmdef). La carpeta Entrega reúne el informe, la presentación, la matriz de pruebas y el APK.'),
  table([3000, CONTENT - 3000], [
    ['Entregable', 'Archivo'],
    ['Proyecto Unity', 'TA5_CiudadFuturista2050_MijaMantari.zip (Assets, Packages y ProjectSettings)'],
    ['Informe', 'Informe_TA5_MijaMantari.pdf'],
    ['Exposición', 'Presentacion_TA5_MijaMantari.pptx'],
    ['Build móvil', 'TA5_CiudadFuturista2050.apk'],
    ['Matriz de pruebas', 'Matriz_Pruebas.xlsx']
  ]),
  gap(),
  H1('9. Uso de herramientas de IA'),
  P('Usé Claude (Anthropic) como asistente para generar el script de construcción de la escena, los scripts de control táctil, el script de movimiento decorativo y las pruebas automáticas, y para redactar una primera versión de este informe. Revisé, ejecuté y ajusté ese código en mi proyecto, y puedo explicar qué hace cada script. No usé modelos 3D de terceros: toda la ciudad está hecha con primitivas de Unity.'),
  H1('10. Conclusiones'),
  P('Una misma escena puede servir para dos formas de recorrerla si se separa el entorno de la navegación: la ciudad no cambia, solo se activa un rig u otro según el dispositivo. Eso evitó mantener dos proyectos.'),
  P('Probar la escena con pruebas automáticas antes de usar el visor permitió encontrar problemas de colisiones sin gastar tiempo de laboratorio. La plaza convertida en cúpula invisible, por ejemplo, habría sido difícil de notar con el visor puesto. Como la escena se arma desde un archivo, para el rediseño visual bastó con editar el layout y el script de construcción y volver a generar la ciudad, y las pruebas sirvieron para confirmar que el camino seguía libre.'),
  P('El teletransporte y el joystick resuelven el mismo recorrido de forma distinta. En el VIVE el usuario decide a dónde ir con la mirada y el control, y en el celular se camina de forma continua. Por eso los tiempos de cada dispositivo no se comparan como si fueran la misma prueba.'),
  H1('Referencias'),
  P('UTP. Herramientas de Desarrollo Profesional – TIC. Sesión 14: Introducción a AR, VR y Metaverso (2026).', { align: AlignmentType.LEFT }),
  P('UTP. Herramientas de Desarrollo Profesional – TIC. Sesión 15: Taller de prototipos simples en AR o VR con Unity o ARCore (2026).', { align: AlignmentType.LEFT }),
  P('UTP. Sílabo del curso 10000096SI, Unidad 5: Realidad aumentada, realidad virtual y metaverso (2026-2).', { align: AlignmentType.LEFT }),
  P('Unity Technologies. XR Interaction Toolkit (manual del paquete). https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@latest', { align: AlignmentType.LEFT }),
  P('Unity Technologies. OpenXR Plugin (manual del paquete). https://docs.unity3d.com/Packages/com.unity.xr.openxr@latest', { align: AlignmentType.LEFT }),
  P('Unity Technologies. Build for Android. https://docs.unity3d.com/Manual/android-BuildProcess.html', { align: AlignmentType.LEFT })
);

const doc = new Document({
  creator: 'Víctor Sebastián Mija Mantari', features: { updateFields: true },
  title: 'TA5 · Entorno futurista en Unity',
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 30, bold: true, color: RED }, paragraph: { spacing: { before: 320, after: 140 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 25, bold: true, color: '1F3B57' }, paragraph: { spacing: { before: 220, after: 100 }, keepNext: true, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 21, bold: true, color: TEAL }, paragraph: { spacing: { before: 160, after: 80 }, keepNext: true, outlineLevel: 2 } }
    ]
  },
  numbering: { config: [
    { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }
  ] },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } }, titlePage: true },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'UTP', bold: true, color: RED, size: 16 }), new TextRun({ text: '  |  TA5 · Entorno futurista en Unity', color: GRAY, size: 16 })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Página ', size: 16, color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY })] })] }) },
    children: content
  }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(process.argv[2], b); console.log('ok'); });
