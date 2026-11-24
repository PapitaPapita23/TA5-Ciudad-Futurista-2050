using UnityEngine;
using UnityEngine.UI;

namespace TA5
{
    /// <summary>
    /// Mide el recorrido Portal → Plaza → Torre para la tabla de pruebas (sección 8 de la TA5).
    /// Sigue a la cámara activa (VIVE o celular), arranca cuando el usuario se mueve desde el inicio
    /// y se detiene al llegar a la Torre. Muestra el tiempo en un letrero junto a la Torre y en el HUD.
    /// No es una mecánica de juego: solo registra la prueba.
    /// </summary>
    public class RouteTimer : MonoBehaviour
    {
        public Transform portal;
        public Transform plaza;
        public Transform torre;
        public float plazaRadius = 9f;
        public float torreRadius = 5f;
        [Tooltip("Metros que hay que alejarse del punto de inicio para empezar a contar")]
        public float startDistance = 1.5f;

        public TextMesh worldText;
        public Text hudText;

        enum State { Waiting, Running, Finished }
        State state = State.Waiting;
        Transform target;
        Vector3 startPos;
        float startTime;
        float plazaTime = -1f;
        float finalTime;

        void Update()
        {
            if (target == null || !target.gameObject.activeInHierarchy)
            {
                Camera cam = Camera.main;
                if (cam == null) return;
                target = cam.transform;
                startPos = target.position;
            }

            Vector3 p = target.position;
            switch (state)
            {
                case State.Waiting:
                    if (Flat(p - startPos).magnitude > startDistance)
                    {
                        state = State.Running;
                        startTime = Time.time;
                        Debug.Log("[TA5] Recorrido iniciado");
                    }
                    break;
                case State.Running:
                    if (plazaTime < 0f && plaza != null && Flat(p - plaza.position).magnitude < plazaRadius)
                    {
                        plazaTime = Time.time - startTime;
                        Debug.Log("[TA5] Plaza central alcanzada en " + plazaTime.ToString("F1") + " s");
                    }
                    if (torre != null && Flat(p - torre.position).magnitude < torreRadius)
                    {
                        state = State.Finished;
                        finalTime = Time.time - startTime;
                        Debug.Log("[TA5] Torre alcanzada. Tiempo total: " + finalTime.ToString("F1") +
                                  " s. Pasó por la Plaza: " + (plazaTime >= 0f ? "sí" : "no"));
                    }
                    break;
            }
            Refresh();
        }

        void Refresh()
        {
            string msg;
            if (state == State.Waiting) msg = "Ruta: Portal → Plaza → Torre";
            else if (state == State.Running) msg = "Tiempo: " + (Time.time - startTime).ToString("F1") + " s";
            else msg = "Recorrido completo: " + finalTime.ToString("F1") + " s" +
                       (plazaTime >= 0f ? "" : " (sin pasar por la Plaza)");
            if (worldText != null) worldText.text = msg;
            if (hudText != null) hudText.text = msg;
        }

        static Vector3 Flat(Vector3 v)
        {
            v.y = 0f;
            return v;
        }
    }
}
