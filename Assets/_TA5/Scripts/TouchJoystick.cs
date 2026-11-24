using UnityEngine;
using UnityEngine.EventSystems;

namespace TA5
{
    /// <summary>
    /// Joystick táctil en pantalla. Devuelve un vector (-1..1) que usa MobilePlayerController para caminar.
    /// Va en el objeto del fondo del joystick; "handle" es la perilla que se mueve con el dedo.
    /// </summary>
    public class TouchJoystick : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
    {
        public RectTransform background;
        public RectTransform handle;
        [Tooltip("Recorrido máximo de la perilla en unidades de UI")]
        public float radius = 110f;

        public Vector2 Value { get; private set; }

        void Awake()
        {
            if (background == null) background = transform as RectTransform;
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            OnDrag(eventData);
        }

        public void OnDrag(PointerEventData eventData)
        {
            Vector2 local;
            if (RectTransformUtility.ScreenPointToLocalPointInRectangle(background, eventData.position, eventData.pressEventCamera, out local))
            {
                Vector2 clamped = Vector2.ClampMagnitude(local, radius);
                if (handle != null) handle.anchoredPosition = clamped;
                Value = clamped / radius;
            }
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            Value = Vector2.zero;
            if (handle != null) handle.anchoredPosition = Vector2.zero;
        }

        void OnDisable()
        {
            Value = Vector2.zero;
            if (handle != null) handle.anchoredPosition = Vector2.zero;
        }
    }
}
