using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace TA5.EditorTools
{
    /// <summary>
    /// Menú "TA5" en la barra superior de Unity. Arma la Ciudad Futurista 2050 completa a partir de
    /// ciudad_layout.json (el mismo archivo que se usó para probar el recorrido fuera de Unity).
    /// Orden de uso: 1 → 2 → (configurar OpenXR a mano, ver guía) → 3 → Play.
    /// </summary>
    public static class TA5CiudadBuilder
    {
        const string Root = "Assets/_TA5";
        const string ScenePath = Root + "/Scenes/CiudadFuturista2050.unity";
        const string MatDir = Root + "/Materials";
        const string PrefabDir = Root + "/Prefabs";
        const string LayoutPath = Root + "/Scripts/Editor/ciudad_layout.json";
        const string XriPackage = "com.unity.xr.interaction.toolkit";

        static readonly string[] Folders = { "Scenes", "Models", "Materials", "Prefabs", "Scripts", "UI", "Tests" };

        // ------------------------------------------------------------------ 1. Paquetes
        [MenuItem("TA5/1. Instalar paquetes (Input System, OpenXR, XR Interaction Toolkit)", false, 1)]
        public static void InstallPackages()
        {
#if UNITY_2021_2_OR_NEWER
            string[] packages =
            {
                "com.unity.inputsystem",
                "com.unity.xr.management",
                "com.unity.xr.openxr",
                XriPackage,
                "com.unity.shadergraph"
            };
            var request = UnityEditor.PackageManager.Client.AddAndRemove(packages, null);
            EditorApplication.CallbackFunction poll = null;
            poll = () =>
            {
                if (!request.IsCompleted) return;
                EditorApplication.update -= poll;
                if (request.Status == UnityEditor.PackageManager.StatusCode.Success)
                    Debug.Log("[TA5] Paquetes instalados. Si Unity pide reiniciar por el Input System, acepta. Luego ejecuta TA5/2.");
                else
                    Debug.LogError("[TA5] No se pudieron instalar los paquetes: " + request.Error.message);
            };
            EditorApplication.update += poll;
            Debug.Log("[TA5] Instalando paquetes... espera a que Unity termine de compilar.");
#else
            EditorUtility.DisplayDialog("TA5", "Esta opción necesita Unity 2021.2 o superior. Instala a mano desde Window > Package Manager: Input System, OpenXR Plugin y XR Interaction Toolkit.", "OK");
#endif
        }

        // ------------------------------------------------------------------ 2. Starter Assets
        [MenuItem("TA5/2. Importar Starter Assets de XR Interaction Toolkit", false, 2)]
        public static void ImportStarterAssets()
        {
#if UNITY_2020_1_OR_NEWER
            bool found = false;
            foreach (var sample in UnityEditor.PackageManager.UI.Sample.FindByPackage(XriPackage, null))
            {
                if (sample.displayName != "Starter Assets") continue;
                found = true;
                if (sample.isImported)
                {
                    Debug.Log("[TA5] Starter Assets ya estaba importado.");
                }
                else
                {
                    bool ok = sample.Import(UnityEditor.PackageManager.UI.Sample.ImportOptions.OverridePreviousImports);
                    Debug.Log(ok ? "[TA5] Starter Assets importado en Assets/Samples." : "[TA5] Falló la importación de Starter Assets.");
                }
            }
            if (!found)
                EditorUtility.DisplayDialog("TA5", "No encontré el paquete XR Interaction Toolkit o su muestra Starter Assets. Ejecuta primero TA5/1 y espera a que termine la compilación.", "OK");
#else
            EditorUtility.DisplayDialog("TA5", "Importa Starter Assets a mano: Package Manager > XR Interaction Toolkit > Samples > Starter Assets > Import.", "OK");
#endif
        }

        // ------------------------------------------------------------------ 3. Construir ciudad
        [MenuItem("TA5/3. Construir Ciudad Futurista 2050", false, 20)]
        public static void BuildCity()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;

            Layout layout = LoadLayout();
            if (layout == null) return;

            EnsureFolders();
            Dictionary<string, Material> mats = CreateMaterials(layout);

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // Ambiente futurista: niebla suave y luz ambiental fría.
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.Exponential;
            RenderSettings.fogDensity = 0.007f;
            RenderSettings.fogColor = new Color(0.14f, 0.09f, 0.24f);
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.28f, 0.24f, 0.42f);
            RenderSettings.skybox = CreateNightSky();

            var city = new GameObject("Ciudad_Futurista_2050");
            var groups = new Dictionary<string, Transform>();
            groups["Entorno"] = NewChild("Entorno", city.transform, Vector3.zero);
            foreach (var z in layout.zones) groups[z.name] = NewChild(z.name, city.transform, V(z.pos));
            groups["Limites"] = NewChild("Limites", city.transform, Vector3.zero);

            var teleportSurfaces = new List<GameObject>();
            foreach (var o in layout.objects)
            {
                GameObject go = CreateShape(o);
                Transform parent;
                if (!groups.TryGetValue(o.group, out parent)) parent = city.transform;
                go.transform.SetParent(parent, true);

                var renderer = go.GetComponent<MeshRenderer>();
                Material m;
                if (mats.TryGetValue(o.mat, out m)) renderer.sharedMaterial = m;
                renderer.enabled = o.visible;
                if (o.teleport) teleportSurfaces.Add(go);
                if (string.IsNullOrEmpty(o.motion))
                {
                    GameObjectUtility.SetStaticEditorFlags(go, StaticEditorFlags.BatchingStatic);
                }
                else
                {
                    var motion = go.AddComponent<AmbientMotion>();
                    motion.mode = o.motion;
                    motion.speed = o.speed;
                    motion.amplitude = o.amp;
                }
            }

            var lightsRoot = NewChild("Iluminacion", city.transform, Vector3.zero);
            foreach (var l in layout.lights) CreateLight(l, lightsRoot);

            Font font = GetBuiltinFont();
            foreach (var lb in layout.labels)
            {
                Transform parent;
                if (!groups.TryGetValue(lb.group, out parent)) parent = city.transform;
                CreateLabel(lb.name, lb.text, V(lb.pos), parent, font, 0.09f, new Color(0.75f, 1f, 1f));
            }

            // Puntos de la ruta (los usan las pruebas automáticas).
            var routeRoot = NewChild("Ruta", city.transform, Vector3.zero);
            foreach (var p in layout.route) NewChild(p.name, routeRoot, V(p.pos));

            // Rigs y controles.
            Vector3 start = V(layout.start);
            Text hud;
            GameObject ui = CreateMobileUI(font, out hud);
            GameObject mobile = CreateMobilePlayer(start, ui);
            GameObject vr = CreateVRRig(start, teleportSurfaces);

            CreatePostProcessing();
            EnablePostProcessing(mobile);
            EnablePostProcessing(vr);

            var platform = new GameObject("Plataforma");
            var switcher = platform.AddComponent<PlatformSwitcher>();
            switcher.vrRoot = vr;
            switcher.mobileRoot = mobile;
            switcher.mobileUI = ui;

            var timerGO = new GameObject("Medidor_Recorrido");
            var timer = timerGO.AddComponent<RouteTimer>();
            timer.portal = groups["Zona_A_Portal"];
            timer.plaza = groups["Zona_B_Plaza"];
            timer.torre = FindRoutePoint(routeRoot, "Ruta_Punto_3_Torre");
            timer.plazaRadius = ZoneRadius(layout, "Zona_B_Plaza", 9f);
            timer.torreRadius = ZoneRadius(layout, "Zona_C_Torre", 5f);
            timer.worldText = CreateLabel("Rotulo_Tiempo", "Ruta: Portal → Plaza → Torre",
                V(layout.timerLabel), groups["Zona_C_Torre"], font, 0.05f, Color.white);
            timer.hudText = hud;

            // Guardar escena, prefabs de referencia y Build Settings.
            EditorSceneManager.SaveScene(scene, ScenePath);
            PrefabUtility.SaveAsPrefabAsset(city, PrefabDir + "/Ciudad_Futurista_2050.prefab");
            PrefabUtility.SaveAsPrefabAsset(mobile, PrefabDir + "/Jugador_Movil.prefab");
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            PlayerSettings.productName = "Ciudad Futurista 2050";
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.LandscapeLeft;
            AssetDatabase.SaveAssets();

            int visibles = 0;
            foreach (var o in layout.objects) if (o.visible) visibles++;
            Debug.Log("[TA5] Ciudad construida: " + visibles + " objetos visibles, " + layout.materials.Length +
                      " materiales, " + layout.lights.Length + " luces. Escena: " + ScenePath +
                      (vr.transform.childCount > 0 ? "" : "  (Sin XR Origin: ejecuta TA5/1 y TA5/2 y vuelve a construir)"));
        }

        // ------------------------------------------------------------------ 4. APK
        [MenuItem("TA5/4. Generar APK Android", false, 40)]
        public static void BuildApk()
        {
            if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.Android)
            {
                if (!EditorUtility.DisplayDialog("TA5", "Hay que cambiar la plataforma a Android (puede tardar unos minutos).", "Cambiar a Android", "Cancelar"))
                    return;
                if (!EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android))
                {
                    EditorUtility.DisplayDialog("TA5", "No se pudo cambiar a Android. Instala el módulo 'Android Build Support' (con OpenJDK y SDK/NDK) desde Unity Hub > Installs.", "OK");
                    return;
                }
            }
            string outDir = Path.Combine(Directory.GetParent(Application.dataPath).FullName, "Entrega");
            Directory.CreateDirectory(outDir);
            EditorUserBuildSettings.buildAppBundle = false;
            var options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = Path.Combine(outDir, "TA5_CiudadFuturista2050.apk"),
                target = BuildTarget.Android,
                options = BuildOptions.None
            };
            BuildReport report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result == BuildResult.Succeeded)
            {
                Debug.Log("[TA5] APK generado: " + options.locationPathName);
                EditorUtility.RevealInFinder(options.locationPathName);
            }
            else
            {
                Debug.LogError("[TA5] El build falló: " + report.summary.result + ". Revisa la Console.");
            }
        }

        // ------------------------------------------------------------------ 5. Pruebas
        [MenuItem("TA5/5. Abrir Test Runner (pruebas de la escena)", false, 60)]
        public static void OpenTestRunner()
        {
            if (!EditorApplication.ExecuteMenuItem("Window/General/Test Runner"))
                Debug.Log("[TA5] Abre Window > General > Test Runner, pestaña EditMode, y pulsa Run All.");
        }

        // ================================================================== Construcción
        static GameObject CreateShape(ObjDef o)
        {
            PrimitiveType type = o.shape == "cylinder" ? PrimitiveType.Cylinder :
                                 o.shape == "sphere" ? PrimitiveType.Sphere : PrimitiveType.Cube;
            GameObject go = GameObject.CreatePrimitive(type);
            go.name = o.name;
            go.transform.position = V(o.pos);
            if (o.rot != null && o.rot.Length == 3) go.transform.eulerAngles = V(o.rot);
            Vector3 s = V(o.size);
            // Un cilindro primitivo mide 2 m de alto con escala 1.
            if (type == PrimitiveType.Cylinder) s.y *= 0.5f;
            go.transform.localScale = s;

            Collider col = go.GetComponent<Collider>();
            if (!o.collider)
            {
                UnityEngine.Object.DestroyImmediate(col);
            }
            else if (type == PrimitiveType.Cylinder)
            {
                // El CapsuleCollider por defecto deforma los cilindros anchos (la plaza sería una cúpula).
                UnityEngine.Object.DestroyImmediate(col);
                go.AddComponent<MeshCollider>();
            }
            return go;
        }

        static void CreateLight(LightDef l, Transform parent)
        {
            var go = new GameObject(l.name);
            go.transform.SetParent(parent, false);
            go.transform.position = V(l.pos);
            go.transform.eulerAngles = V(l.rot);
            var light = go.AddComponent<Light>();
            light.type = l.type == "point" ? LightType.Point : LightType.Directional;
            light.color = C(l.color);
            light.intensity = l.intensity;
            if (light.type == LightType.Point) light.range = l.range;
            light.shadows = light.type == LightType.Directional ? LightShadows.Soft : LightShadows.None;
        }

        static TextMesh CreateLabel(string name, string text, Vector3 pos, Transform parent, Font font, float charSize, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, true);
            go.transform.position = pos;
            var mr = go.AddComponent<MeshRenderer>();
            var tm = go.AddComponent<TextMesh>();
            tm.text = text;
            tm.anchor = TextAnchor.MiddleCenter;
            tm.alignment = TextAlignment.Center;
            tm.fontSize = 64;
            tm.characterSize = charSize;
            tm.color = color;
            if (font != null)
            {
                tm.font = font;
                mr.sharedMaterial = font.material;
            }
            return tm;
        }

        static GameObject CreateMobilePlayer(Vector3 start, GameObject ui)
        {
            var player = new GameObject("Jugador_Movil");
            player.transform.position = start + Vector3.up * 0.05f;
            var cc = player.AddComponent<CharacterController>();
            cc.height = 1.8f;
            cc.radius = 0.35f;
            cc.center = new Vector3(0f, 0.9f, 0f);
            cc.stepOffset = 0.3f;
            cc.slopeLimit = 45f;

            var camGO = new GameObject("Camara_Movil");
            camGO.transform.SetParent(player.transform, false);
            camGO.transform.localPosition = new Vector3(0f, 1.65f, 0f);
            camGO.tag = "MainCamera";
            var cam = camGO.AddComponent<Camera>();
            cam.nearClipPlane = 0.05f;
            cam.farClipPlane = 400f;
            camGO.AddComponent<AudioListener>();

            var ctrl = player.AddComponent<MobilePlayerController>();
            ctrl.cameraPivot = camGO.transform;
            ctrl.joystick = ui.GetComponentInChildren<TouchJoystick>(true);
            ctrl.lookArea = ui.GetComponentInChildren<TouchLookArea>(true);
            return player;
        }

        static GameObject CreateMobileUI(Font font, out Text hud)
        {
            var canvasGO = new GameObject("UI_Movil", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasGO.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasGO.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920f, 1080f);
            scaler.matchWidthOrHeight = 0.5f;

            // Zona para mirar: 60 % derecho de la pantalla, invisible pero recibe toques.
            var look = NewUI("Zona_Mirar", canvasGO.transform, new Vector2(0.4f, 0f), new Vector2(1f, 1f), Vector2.zero, Vector2.zero);
            var lookImg = look.gameObject.AddComponent<Image>();
            lookImg.color = new Color(0f, 0f, 0f, 0f);
            look.gameObject.AddComponent<TouchLookArea>();

            Sprite knob = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd");

            // Joystick abajo a la izquierda.
            var bg = NewUI("Joystick_Fondo", canvasGO.transform, Vector2.zero, Vector2.zero, new Vector2(260f, 260f), new Vector2(300f, 300f));
            var bgImg = bg.gameObject.AddComponent<Image>();
            bgImg.sprite = knob;
            bgImg.color = new Color(0.4f, 0.95f, 1f, 0.28f);
            var handle = NewUI("Joystick_Perilla", bg, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(130f, 130f));
            var hImg = handle.gameObject.AddComponent<Image>();
            hImg.sprite = knob;
            hImg.color = new Color(0.6f, 1f, 1f, 0.75f);
            hImg.raycastTarget = false;
            var joy = bg.gameObject.AddComponent<TouchJoystick>();
            joy.background = bg;
            joy.handle = handle;
            joy.radius = 110f;

            // Texto superior con la ruta y el tiempo.
            var txtRT = NewUI("HUD_Ruta", canvasGO.transform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -60f), new Vector2(1200f, 80f));
            hud = txtRT.gameObject.AddComponent<Text>();
            hud.font = font;
            hud.fontSize = 40;
            hud.alignment = TextAnchor.MiddleCenter;
            hud.color = Color.white;
            hud.raycastTarget = false;
            hud.text = "Ruta: Portal → Plaza → Torre";

            var esGO = new GameObject("EventSystem", typeof(EventSystem));
#if ENABLE_INPUT_SYSTEM
            esGO.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>();
#else
            esGO.AddComponent<StandaloneInputModule>();
#endif
            return canvasGO;
        }

        static GameObject CreateVRRig(Vector3 start, List<GameObject> teleportSurfaces)
        {
            var root = new GameObject("Rig_VR");
            root.transform.position = start;

            string prefabPath = FindXROriginPrefab();
            if (prefabPath != null)
            {
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
                var inst = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
                inst.transform.SetParent(root.transform, false);
                inst.transform.localPosition = Vector3.zero;
                inst.transform.localRotation = Quaternion.identity;

                Type manager = FindXriType("XRInteractionManager");
                if (manager != null && FindAny(manager) == null)
                    new GameObject("XR Interaction Manager", manager).transform.SetParent(root.transform, false);

                Type area = FindXriType("TeleportationArea");
                if (area != null)
                {
                    foreach (var go in teleportSurfaces) go.AddComponent(area);
                }
                else
                {
                    Debug.LogWarning("[TA5] No encontré TeleportationArea; revisa que XR Interaction Toolkit esté instalado.");
                }
                Debug.Log("[TA5] XR Origin agregado desde " + prefabPath);
            }
            else
            {
                Debug.LogWarning("[TA5] No se encontró el prefab XR Origin de Starter Assets. La escena funciona en modo celular; para VIVE ejecuta TA5/1 y TA5/2 y vuelve a construir.");
            }
            // Se guarda apagado: PlatformSwitcher lo enciende cuando detecta el visor.
            root.SetActive(false);
            return root;
        }

        static UnityEngine.Object FindAny(Type t)
        {
#if UNITY_2023_1_OR_NEWER
            return UnityEngine.Object.FindAnyObjectByType(t, FindObjectsInactive.Include);
#else
            return UnityEngine.Object.FindObjectOfType(t);
#endif
        }

        static string FindXROriginPrefab()
        {
            string fallback = null;
            foreach (string guid in AssetDatabase.FindAssets("t:Prefab", new[] { "Assets/Samples" }))
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                string file = Path.GetFileNameWithoutExtension(path);
                if (file == "XR Origin (XR Rig)") return path;
                if (file == "Complete XR Origin Set Up") fallback = path;
            }
            return fallback;
        }

        static Type FindXriType(string typeName)
        {
#if UNITY_2021_1_OR_NEWER
            // TypeCache evita recorrer AppDomain (obsoleto en Unity 6.6+).
            foreach (var t in TypeCache.GetTypesDerivedFrom<Component>())
            {
                if (t.Name == typeName && t.Namespace != null &&
                    t.Namespace.StartsWith("UnityEngine.XR.Interaction.Toolkit") && !t.IsAbstract)
                    return t;
            }
            return null;
#else
            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                Type[] types;
                try { types = asm.GetTypes(); }
                catch (System.Reflection.ReflectionTypeLoadException e) { types = e.Types; }
                foreach (var t in types)
                {
                    if (t != null && t.Name == typeName && t.Namespace != null &&
                        t.Namespace.StartsWith("UnityEngine.XR.Interaction.Toolkit") && !t.IsAbstract)
                        return t;
                }
            }
            return null;
#endif
        }

        // ================================================================== Utilidades
        // ================================================================== Diseño
        static Material CreateNightSky()
        {
            Shader sh = Shader.Find("Skybox/Procedural");
            if (sh == null) return RenderSettings.skybox;
            string path = MatDir + "/Cielo_Noche.mat";
            var m = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (m == null)
            {
                m = new Material(sh);
                AssetDatabase.CreateAsset(m, path);
            }
            m.shader = sh;
            m.SetFloat("_SunSize", 0.02f);
            m.SetFloat("_AtmosphereThickness", 1.8f);
            m.SetColor("_SkyTint", new Color(0.45f, 0.2f, 0.65f));
            m.SetColor("_GroundColor", new Color(0.04f, 0.03f, 0.08f));
            m.SetFloat("_Exposure", 0.55f);
            EditorUtility.SetDirty(m);
            return m;
        }

        // Bloom + tonemapping + viñeta con el Volume de URP (por reflexión, para no depender del paquete al compilar).
        static void CreatePostProcessing()
        {
            Type volumeType = FindTypeByName("UnityEngine.Rendering.Volume", typeof(Component));
            Type profileType = FindTypeByName("UnityEngine.Rendering.VolumeProfile", typeof(ScriptableObject));
            if (volumeType == null || profileType == null)
            {
                Debug.Log("[TA5] Sin URP: se omite el postproceso.");
                return;
            }
            string path = Root + "/Scenes/Postproceso_Ciudad.asset";
            AssetDatabase.DeleteAsset(path);
            var profile = ScriptableObject.CreateInstance(profileType);
            AssetDatabase.CreateAsset(profile, path);

            AddVolumeComponent(profile, "UnityEngine.Rendering.Universal.Bloom",
                new[] { "intensity", "threshold", "scatter" }, new object[] { 1.4f, 0.85f, 0.7f });
            AddVolumeComponent(profile, "UnityEngine.Rendering.Universal.Tonemapping",
                new[] { "mode" }, new object[] { 2 });   // 2 = ACES
            AddVolumeComponent(profile, "UnityEngine.Rendering.Universal.Vignette",
                new[] { "intensity" }, new object[] { 0.28f });
            AddVolumeComponent(profile, "UnityEngine.Rendering.Universal.ColorAdjustments",
                new[] { "saturation", "contrast" }, new object[] { 15f, 10f });

            var go = new GameObject("Postproceso_Global");
            var volume = go.AddComponent(volumeType);
            var isGlobalField = volumeType.GetField("isGlobal");
            if (isGlobalField != null) isGlobalField.SetValue(volume, true);
            var isGlobalProp = volumeType.GetProperty("isGlobal");
            if (isGlobalProp != null && isGlobalProp.CanWrite) isGlobalProp.SetValue(volume, true, null);
            var shared = volumeType.GetField("sharedProfile");
            if (shared != null) shared.SetValue(volume, profile);
            EditorUtility.SetDirty(profile);
        }

        static void AddVolumeComponent(ScriptableObject profile, string typeName, string[] fields, object[] values)
        {
            Type t = FindTypeByName(typeName, typeof(ScriptableObject));
            if (t == null) return;
            var add = profile.GetType().GetMethod("Add", new[] { typeof(Type), typeof(bool) });
            if (add == null) return;
            var comp = (ScriptableObject)add.Invoke(profile, new object[] { t, true });
            comp.name = t.Name;
            AssetDatabase.AddObjectToAsset(comp, profile);
            for (int i = 0; i < fields.Length; i++)
            {
                var f = t.GetField(fields[i]);
                if (f == null) continue;
                object param = f.GetValue(comp);
                var valueProp = param.GetType().GetProperty("value");
                var overrideProp = param.GetType().GetProperty("overrideState");
                if (valueProp == null) continue;
                object v = values[i];
                if (valueProp.PropertyType.IsEnum) v = Enum.ToObject(valueProp.PropertyType, v);
                else v = Convert.ChangeType(v, valueProp.PropertyType);
                valueProp.SetValue(param, v, null);
                if (overrideProp != null) overrideProp.SetValue(param, true, null);
            }
        }

        static void EnablePostProcessing(GameObject root)
        {
            Type camData = FindTypeByName("UnityEngine.Rendering.Universal.UniversalAdditionalCameraData", typeof(Component));
            if (camData == null) return;
            foreach (var cam in root.GetComponentsInChildren<Camera>(true))
            {
                var data = cam.GetComponent(camData);
                if (data == null) data = cam.gameObject.AddComponent(camData);
                var prop = camData.GetProperty("renderPostProcessing");
                if (prop != null) prop.SetValue(data, true, null);
            }
        }

        static Type FindTypeByName(string fullName, Type baseType)
        {
#if UNITY_2021_1_OR_NEWER
            foreach (var t in TypeCache.GetTypesDerivedFrom(baseType))
                if (t.FullName == fullName) return t;
            return null;
#else
            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                var t = asm.GetType(fullName);
                if (t != null) return t;
            }
            return null;
#endif
        }

        static Layout LoadLayout()
        {
            string full = Path.Combine(Directory.GetParent(Application.dataPath).FullName, LayoutPath);
            if (!File.Exists(full))
            {
                EditorUtility.DisplayDialog("TA5", "No se encontró " + LayoutPath, "OK");
                return null;
            }
            return JsonUtility.FromJson<Layout>(File.ReadAllText(full));
        }

        static void EnsureFolders()
        {
            if (!AssetDatabase.IsValidFolder(Root)) AssetDatabase.CreateFolder("Assets", "_TA5");
            foreach (var f in Folders)
                if (!AssetDatabase.IsValidFolder(Root + "/" + f)) AssetDatabase.CreateFolder(Root, f);
        }

        static Dictionary<string, Material> CreateMaterials(Layout layout)
        {
            Shader lit = Shader.Find("Universal Render Pipeline/Lit");
            if (lit == null) lit = Shader.Find("Standard");
            var result = new Dictionary<string, Material>();
            foreach (var d in layout.materials)
            {
                string path = MatDir + "/" + d.name + ".mat";
                var m = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (m == null)
                {
                    m = new Material(lit);
                    AssetDatabase.CreateAsset(m, path);
                }
                else
                {
                    m.shader = lit;
                }
                Color c = C(d.color);
                m.color = c;
                if (m.HasProperty("_BaseColor")) m.SetColor("_BaseColor", c);
                if (m.HasProperty("_Metallic")) m.SetFloat("_Metallic", d.metallic);
                if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", d.smoothness);
                if (m.HasProperty("_Glossiness")) m.SetFloat("_Glossiness", d.smoothness);
                Color e = C(d.emission);
                if (e.r + e.g + e.b > 0f)
                {
                    m.EnableKeyword("_EMISSION");
                    m.SetColor("_EmissionColor", e);
                    m.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;
                }
                EditorUtility.SetDirty(m);
                result[d.name] = m;
            }
            return result;
        }

        static Font GetBuiltinFont()
        {
            foreach (string n in new[] { "LegacyRuntime.ttf", "Arial.ttf" })
            {
                try
                {
                    var f = Resources.GetBuiltinResource<Font>(n);
                    if (f != null) return f;
                }
                catch (Exception) { }
            }
            return null;
        }

        static Transform NewChild(string name, Transform parent, Vector3 worldPos)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.position = worldPos;
            return go.transform;
        }

        static RectTransform NewUI(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 pos, Vector2 size)
        {
            var go = new GameObject(name, typeof(RectTransform));
            var rt = go.GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.anchoredPosition = pos;
            rt.sizeDelta = size;
            return rt;
        }

        static Transform FindRoutePoint(Transform routeRoot, string name)
        {
            Transform t = routeRoot.Find(name);
            return t != null ? t : routeRoot;
        }

        static float ZoneRadius(Layout layout, string zone, float fallback)
        {
            foreach (var z in layout.zones) if (z.name == zone) return z.radius;
            return fallback;
        }

        static Vector3 V(float[] a)
        {
            return new Vector3(a[0], a[1], a[2]);
        }

        static Color C(float[] a)
        {
            return new Color(a[0], a[1], a[2], a.Length > 3 ? a[3] : 1f);
        }

        // ================================================================== Datos (JSON)
        [Serializable] public class Layout
        {
            public ObjDef[] objects;
            public MatDef[] materials;
            public LightDef[] lights;
            public LabelDef[] labels;
            public ZoneDef[] zones;
            public PointDef[] route;
            public float[] start;
            public float[] timerLabel;
        }
        [Serializable] public class ObjDef
        {
            public string name, shape, mat, group;
            public float[] pos, size, rot;
            public bool collider, teleport, visible;
            public string motion;
            public float speed, amp;
        }
        [Serializable] public class MatDef
        {
            public string name;
            public float[] color, emission;
            public float metallic, smoothness;
        }
        [Serializable] public class LightDef
        {
            public string name, type;
            public float[] pos, rot, color;
            public float intensity, range;
        }
        [Serializable] public class LabelDef
        {
            public string name, text, group;
            public float[] pos;
        }
        [Serializable] public class ZoneDef
        {
            public string name;
            public float[] pos;
            public float radius;
        }
        [Serializable] public class PointDef
        {
            public string name;
            public float[] pos;
        }
    }
}
