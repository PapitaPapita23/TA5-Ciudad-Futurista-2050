using System.Collections.Generic;
using System.IO;
using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace TA5.Tests
{
    /// <summary>
    /// Pruebas EditMode de la escena (Window > General > Test Runner > EditMode > Run All).
    /// Verifican los requisitos mínimos de la TA5 sobre la escena guardada.
    /// </summary>
    public class CiudadFuturistaTests
    {
        const string ScenePath = "Assets/_TA5/Scenes/CiudadFuturista2050.unity";
        static readonly string[] RoutePoints =
        {
            "Ruta_Punto_0_Inicio", "Ruta_Punto_1_Portal", "Ruta_Punto_2_Plaza", "Ruta_Punto_3_Torre"
        };

        Scene scene;

        [OneTimeSetUp]
        public void OpenScene()
        {
            Assert.IsTrue(File.Exists(ScenePath), "No existe la escena. Ejecuta el menú TA5/3. Construir Ciudad Futurista 2050.");
            scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            Physics.SyncTransforms();
        }

        [Test]
        public void P1_AlMenos10ObjetosVisibles()
        {
            int count = VisibleMeshRenderers().Count;
            Assert.GreaterOrEqual(count, 10, "Objetos visibles: " + count);
        }

        [Test]
        public void P1_AlMenos3Materiales()
        {
            var mats = new HashSet<Material>();
            foreach (var r in VisibleMeshRenderers())
                foreach (var m in r.sharedMaterials) if (m != null) mats.Add(m);
            Assert.GreaterOrEqual(mats.Count, 3, "Materiales distintos: " + mats.Count);
        }

        [Test]
        public void P1_AlMenos2Luces()
        {
            int count = 0;
            foreach (var root in scene.GetRootGameObjects())
                foreach (var l in root.GetComponentsInChildren<Light>(true)) if (l.enabled) count++;
            Assert.GreaterOrEqual(count, 2, "Luces: " + count);
        }

        [Test]
        public void P1_TresZonasConRotulo()
        {
            foreach (string zone in new[] { "Zona_A_Portal", "Zona_B_Plaza", "Zona_C_Torre" })
            {
                GameObject go = Find(zone);
                Assert.IsNotNull(go, "Falta " + zone);
                Assert.IsNotNull(go.GetComponentInChildren<TextMesh>(true), zone + " no tiene rótulo");
            }
        }

        [Test]
        public void P1_CaminoLibreEntreZonas()
        {
            const float radius = 0.4f;
            var blocked = new List<string>();
            for (int i = 0; i < RoutePoints.Length - 1; i++)
            {
                Vector3 a = RoutePoint(RoutePoints[i]);
                Vector3 b = RoutePoint(RoutePoints[i + 1]);
                // Cápsula de una persona: de 0.3 m a 1.9 m de altura (los escalones de 0.2 m no cuentan).
                Vector3 low = Vector3.up * 0.7f, high = Vector3.up * 1.5f;
                Vector3 dir = b - a;
                foreach (var c in Physics.OverlapCapsule(a + low, a + high, radius))
                    if (IsObstacle(c)) blocked.Add(RoutePoints[i] + " (inicio): " + c.name);
                foreach (var hit in Physics.CapsuleCastAll(a + low, a + high, radius, dir.normalized, dir.magnitude))
                    if (IsObstacle(hit.collider)) blocked.Add(RoutePoints[i] + " → " + RoutePoints[i + 1] + ": " + hit.collider.name);
            }
            Assert.IsEmpty(blocked, "Obstáculos en la ruta: " + string.Join(", ", blocked.ToArray()));
        }

        [Test]
        public void P1_HaySueloBajoTodaLaRuta()
        {
            var holes = new List<string>();
            for (int i = 0; i < RoutePoints.Length - 1; i++)
            {
                Vector3 a = RoutePoint(RoutePoints[i]);
                Vector3 b = RoutePoint(RoutePoints[i + 1]);
                int steps = Mathf.CeilToInt(Vector3.Distance(a, b));
                for (int s = 0; s <= steps; s++)
                {
                    Vector3 p = Vector3.Lerp(a, b, s / (float)steps);
                    if (!Physics.Raycast(p + Vector3.up * 3f, Vector3.down, 4f))
                        holes.Add(p.ToString("F1"));
                }
            }
            Assert.IsEmpty(holes, "Sin suelo en: " + string.Join(", ", holes.ToArray()));
        }

        [Test]
        public void P1_LimitesDelEscenario()
        {
            foreach (string n in new[] { "Limite_Norte", "Limite_Sur", "Limite_Este", "Limite_Oeste" })
            {
                GameObject go = Find(n);
                Assert.IsNotNull(go, "Falta " + n);
                Assert.IsNotNull(go.GetComponent<Collider>(), n + " no tiene collider");
            }
        }

        [Test]
        public void P3_JugadorMovilConfigurado()
        {
            GameObject player = Find("Jugador_Movil");
            Assert.IsNotNull(player, "Falta Jugador_Movil");
            Assert.IsNotNull(player.GetComponent<CharacterController>(), "Falta CharacterController");
            Assert.IsNotNull(player.GetComponent("MobilePlayerController"), "Falta MobilePlayerController");
            Assert.IsNotNull(Find("Joystick_Fondo"), "Falta el joystick táctil");
            Assert.IsNotNull(Find("Zona_Mirar"), "Falta la zona táctil para mirar");
        }

        [Test]
        public void P2_RigVRConXROrigin()
        {
            GameObject vr = Find("Rig_VR");
            Assert.IsNotNull(vr, "Falta Rig_VR");
            Assert.Greater(vr.transform.childCount, 0,
                "Rig_VR está vacío: ejecuta TA5/1 y TA5/2 (XR Interaction Toolkit + Starter Assets) y vuelve a construir la ciudad.");
        }

        // ------------------------------------------------------------------ utilidades
        // El propio jugador (CharacterController) está parado en el inicio: no es un obstáculo.
        static bool IsObstacle(Collider c)
        {
            return !c.isTrigger && !(c is CharacterController);
        }

        List<MeshRenderer> VisibleMeshRenderers()
        {
            var list = new List<MeshRenderer>();
            GameObject city = Find("Ciudad_Futurista_2050");
            Assert.IsNotNull(city, "Falta Ciudad_Futurista_2050");
            foreach (var r in city.GetComponentsInChildren<MeshRenderer>(true))
                if (r.enabled && r.GetComponent<MeshFilter>() != null) list.Add(r);
            return list;
        }

        Vector3 RoutePoint(string name)
        {
            GameObject go = Find(name);
            Assert.IsNotNull(go, "Falta el punto de ruta " + name);
            return go.transform.position;
        }

        GameObject Find(string name)
        {
            foreach (var root in scene.GetRootGameObjects())
            {
                if (root.name == name) return root;
                foreach (var t in root.GetComponentsInChildren<Transform>(true))
                    if (t.name == name) return t.gameObject;
            }
            return null;
        }
    }
}
