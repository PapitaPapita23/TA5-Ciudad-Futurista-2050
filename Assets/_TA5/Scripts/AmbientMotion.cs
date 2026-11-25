using UnityEngine;

namespace TA5
{
    /// <summary>
    /// Movimiento decorativo del entorno (autos voladores, holograma, baliza de la torre).
    /// No es interactivo: solo da vida a la ciudad.
    /// mode: "rotate" gira en Y, "bob" sube y baja, "rotatebob" hace ambas, "patrol" va y viene en X.
    /// </summary>
    public class AmbientMotion : MonoBehaviour
    {
        public string mode = "rotate";
        [Tooltip("rotate: grados/s. bob y patrol: velocidad de la oscilación")]
        public float speed = 30f;
        [Tooltip("bob y patrol: distancia máxima en metros")]
        public float amplitude = 0.5f;

        Vector3 origin;
        float phase;

        void Start()
        {
            origin = transform.position;
            phase = Random.value * 10f;
        }

        void Update()
        {
            float t = Time.time + phase;
            switch (mode)
            {
                case "rotate":
                    transform.Rotate(0f, speed * Time.deltaTime, 0f, Space.World);
                    break;
                case "bob":
                    transform.position = origin + Vector3.up * Mathf.Sin(t * speed) * amplitude;
                    break;
                case "rotatebob":
                    transform.Rotate(0f, speed * Time.deltaTime, 0f, Space.World);
                    transform.position = origin + Vector3.up * Mathf.Sin(t * 1.5f) * amplitude;
                    break;
                case "patrol":
                    transform.position = origin + Vector3.right * Mathf.Sin(t * speed) * amplitude;
                    break;
            }
        }
    }
}
