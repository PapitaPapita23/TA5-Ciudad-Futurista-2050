# TA5 · Ciudad Futurista 2050 (Unity)

Tarea Académica 5 de Herramientas de Desarrollo Profesional – TIC (UTP). Autor: Víctor Sebastián Mija Mantari.

Escena 3D en Unity con tres zonas (Portal de entrada, Plaza central y Torre de observación) unidas por un sendero. La misma ciudad se recorre con HTC VIVE (teletransporte, OpenXR + XR Interaction Toolkit) y con un smartphone Android (joystick táctil y arrastre para mirar).

## Versión

- Unity **6.6 (6000.6.10f1)**, plantilla Universal 3D (URP)
- XR Interaction Toolkit 3.7.0 con Starter Assets, OpenXR, Input System

## Abrir el proyecto

1. Clonar el repositorio.
2. Unity Hub > Proyectos > Añadir > Añadir proyecto desde disco > seleccionar esta carpeta.
3. La primera apertura tarda varios minutos porque Unity regenera la carpeta `Library`.
4. Abrir la escena `Assets/_TA5/Scenes/CiudadFuturista2050.unity`.

## Probar

- **Escritorio (sin visor):** Play. WASD para caminar, clic derecho + mouse para mirar. El letrero junto a la Torre muestra el tiempo del recorrido.
- **HTC VIVE:** SteamVR abierto y configurado como runtime de OpenXR, visor y controles en verde. Play con el visor puesto; se detecta solo y cambia al rig de VR.
- **Pruebas automáticas:** menú TA5 > 5. Abrir Test Runner > EditMode > Run All (9 pruebas).
- **APK Android:** requiere el módulo Android Build Support (Unity Hub > Instalaciones > Gestionar > Gestionar módulos). Luego menú TA5 > 4. Generar APK Android.

## Menú TA5

| Opción | Qué hace |
|---|---|
| 1. Instalar paquetes | Input System, OpenXR, XR Interaction Toolkit y Shader Graph |
| 2. Importar Starter Assets | Muestra de XRI con el XR Origin y teletransporte |
| 3. Construir Ciudad Futurista 2050 | Genera la escena desde `Assets/_TA5/Scripts/Editor/ciudad_layout.json` |
| 4. Generar APK Android | Compila el APK en la carpeta `Entrega/` |
| 5. Abrir Test Runner | Pruebas de requisitos de la escena |

## Diseño

La ciudad tiene estilo neón nocturno. Los edificios llevan ventanas iluminadas y bordes de neón rosa y cian, el sendero está marcado con farolas y al fondo hay un skyline bajo un cielo nocturno. El brillo del neón sale del bloom de un Global Volume de URP. Los autos voladores y el holograma se mueven con `AmbientMotion.cs`.

## Resultados verificados (24/11/2026)

- Escena: 388 objetos visibles, 6 materiales, 4 luces, 3 zonas rotuladas.
- Test Runner: 9/9 pruebas en verde.
- Recorrido en Play (3.2 m/s): Plaza a los 14.8 s, Torre a los 29.8 s.

Las capturas de Unity (escena, Play y Test Runner) están en la carpeta `Capturas/`.

## Estructura

```
Assets/_TA5/
  Scenes/      CiudadFuturista2050.unity, Postproceso_Ciudad.asset
  Materials/   Mat_Suelo, Mat_Metal, Mat_Neon, Mat_NeonRosa, Mat_Vidrio, Mat_Ventanas, Cielo_Noche
  Prefabs/     Ciudad_Futurista_2050, Jugador_Movil
  Scripts/     TouchJoystick, TouchLookArea, MobilePlayerController, PlatformSwitcher, RouteTimer, AmbientMotion
  Scripts/Editor/  TA5CiudadBuilder.cs, ciudad_layout.json
  Tests/       CiudadFuturistaTests.cs
Capturas/      Capturas de Unity: escena, recorrido en Play y Test Runner
Entrega/       Informe, presentación y matriz de pruebas
```

## Uso de IA

Los scripts y la documentación se generaron con asistencia de Claude (Anthropic) y se revisaron y probaron en el proyecto.
