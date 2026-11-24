using UnityEngine;

namespace TA5
{
    /// <summary>
    /// Desplazamiento en smartphone: joystick táctil (izquierda) para caminar y arrastre (derecha) para mirar.
    /// En el Editor también acepta WASD/flechas y mirar con clic derecho, para probar sin celular.
    /// Usa CharacterController con gravedad, así que no atraviesa el suelo ni los edificios.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class MobilePlayerController : MonoBehaviour
    {
        public Transform cameraPivot;
        public TouchJoystick joystick;
        public TouchLookArea lookArea;

        [Header("Movimiento")]
        public float moveSpeed = 3.2f;
        public float gravity = -9.81f;

        [Header("Cámara")]
        [Tooltip("Grados por píxel arrastrado")]
        public float lookSensitivity = 0.15f;
        public float pitchLimit = 70f;

        CharacterController controller;
        float pitch;
        float verticalSpeed;

        void Awake()
        {
            controller = GetComponent<CharacterController>();
        }

        void Update()
        {
            Vector2 move = joystick != null ? joystick.Value : Vector2.zero;
            Vector2 look = lookArea != null ? lookArea.ConsumeDelta() : Vector2.zero;
            ReadDesktopInput(ref move, ref look);
            move = Vector2.ClampMagnitude(move, 1f);

            // Orientación: el cuerpo gira en horizontal, la cámara en vertical.
            transform.Rotate(0f, look.x * lookSensitivity, 0f, Space.World);
            pitch = Mathf.Clamp(pitch - look.y * lookSensitivity, -pitchLimit, pitchLimit);
            if (cameraPivot != null) cameraPivot.localEulerAngles = new Vector3(pitch, 0f, 0f);

            // Desplazamiento sobre el plano + gravedad.
            Vector3 dir = transform.right * move.x + transform.forward * move.y;
            if (controller.isGrounded && verticalSpeed < 0f) verticalSpeed = -1f;
            verticalSpeed += gravity * Time.deltaTime;
            Vector3 velocity = dir * moveSpeed + Vector3.up * verticalSpeed;
            controller.Move(velocity * Time.deltaTime);
        }

        void ReadDesktopInput(ref Vector2 move, ref Vector2 look)
        {
#if ENABLE_INPUT_SYSTEM
            var kb = UnityEngine.InputSystem.Keyboard.current;
            if (kb != null)
            {
                if (kb.wKey.isPressed || kb.upArrowKey.isPressed) move.y += 1f;
                if (kb.sKey.isPressed || kb.downArrowKey.isPressed) move.y -= 1f;
                if (kb.dKey.isPressed || kb.rightArrowKey.isPressed) move.x += 1f;
                if (kb.aKey.isPressed || kb.leftArrowKey.isPressed) move.x -= 1f;
            }
            var mouse = UnityEngine.InputSystem.Mouse.current;
            if (mouse != null && mouse.rightButton.isPressed) look += mouse.delta.ReadValue();
#elif ENABLE_LEGACY_INPUT_MANAGER
            move.x += Input.GetAxisRaw("Horizontal");
            move.y += Input.GetAxisRaw("Vertical");
            if (Input.GetMouseButton(1))
                look += new Vector2(Input.GetAxis("Mouse X"), Input.GetAxis("Mouse Y")) * 10f;
#endif
        }
    }
}
