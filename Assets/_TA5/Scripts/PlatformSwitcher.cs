using UnityEngine;

namespace TA5
{
    /// <summary>
    /// Activa el rig correcto según el dispositivo:
    /// - Si hay un visor XR activo (HTC VIVE por OpenXR) usa Rig_VR.
    /// - En celular, o en PC sin visor, usa Jugador_Movil y la interfaz táctil.
    /// La escena se guarda con Rig_VR desactivado; este script lo enciende cuando detecta el visor.
    /// </summary>
    public class PlatformSwitcher : MonoBehaviour
    {
        public GameObject vrRoot;
        public GameObject mobileRoot;
        public GameObject mobileUI;

        [Tooltip("Segundos durante los que se sigue esperando a que el visor termine de iniciar")]
        public float xrDetectionWindow = 3f;

        bool usingVR;
        float elapsed;

        void Awake()
        {
            Apply(IsXRActive());
        }

        void Update()
        {
            if (usingVR || elapsed > xrDetectionWindow) return;
            elapsed += Time.unscaledDeltaTime;
            if (IsXRActive()) Apply(true);
        }

        static bool IsXRActive()
        {
#if UNITY_ANDROID || UNITY_IOS
            return false;
#else
            return UnityEngine.XR.XRSettings.isDeviceActive;
#endif
        }

        void Apply(bool vr)
        {
            usingVR = vr;
            if (vrRoot != null) vrRoot.SetActive(vr);
            if (mobileRoot != null) mobileRoot.SetActive(!vr);
            if (mobileUI != null) mobileUI.SetActive(!vr);
            Debug.Log(vr ? "[TA5] Modo HTC VIVE (XR activo)" : "[TA5] Modo smartphone / escritorio (sin visor XR)");
        }
    }
}
