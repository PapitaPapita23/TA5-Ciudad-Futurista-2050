using UnityEngine;
using UnityEngine.EventSystems;

namespace TA5
{
    /// <summary>
    /// Zona de la pantalla (lado derecho) donde arrastrar el dedo gira la cámara.
    /// Acumula el desplazamiento del dedo en píxeles; MobilePlayerController lo consume cada frame.
    /// </summary>
    public class TouchLookArea : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
    {
        Vector2 accumulated;
        int activePointer = int.MinValue;

        public void OnPointerDown(PointerEventData eventData)
        {
            if (activePointer == int.MinValue) activePointer = eventData.pointerId;
        }

        public void OnDrag(PointerEventData eventData)
        {
            if (eventData.pointerId == activePointer) accumulated += eventData.delta;
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            if (eventData.pointerId == activePointer) activePointer = int.MinValue;
        }

        public Vector2 ConsumeDelta()
        {
            Vector2 d = accumulated;
            accumulated = Vector2.zero;
            return d;
        }

        void OnDisable()
        {
            accumulated = Vector2.zero;
            activePointer = int.MinValue;
        }
    }
}
