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

## Resultados verificados (24/11/2026)

- Escena: 42 objetos visibles, 4 materiales, 2 luces, 3 zonas rotuladas.
- Test Runner: 9/9 pruebas en verde.
- Recorrido en Play (3.2 m/s): Plaza a los 14.8 s, Torre a los 29.7 s.

## Estructura

```
Assets/_TA5/
  Scenes/      CiudadFuturista2050.unity
  Materials/   Mat_Suelo, Mat_Metal, Mat_Neon, Mat_Vidrio
  Prefabs/     Ciudad_Futurista_2050, Jugador_Movil
  Scripts/     TouchJoystick, TouchLookArea, MobilePlayerController, PlatformSwitcher, RouteTimer
  Scripts/Editor/  TA5CiudadBuilder.cs, ciudad_layout.json
  Tests/       CiudadFuturistaTests.cs
Entrega/       Informe, presentación y matriz de pruebas
```

## Uso de IA

Los scripts y la documentación se generaron con asistencia de Claude (Anthropic) y se revisaron y probaron en el proyecto.
