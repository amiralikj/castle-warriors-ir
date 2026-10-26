/**
 * دوربین صحنه‌ی دهکده: کشیدن با انگشت/ماوس، زوم با چرخ یا دو انگشت.
 * فقط transform گروه world را عوض می‌کند تا رندر دوباره لازم نباشد.
 */
export const SCENE_VIEW = { x: -720, y: -320, width: 1440, height: 1040 };
export const DEFAULT_CAMERA = Object.freeze({ x: 0, y: 0, zoom: 1 });
export const MIN_ZOOM = 0.7;
export const MAX_ZOOM = 2.4;

export function clampCamera(camera) {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(camera.zoom) || 1));
  const limitX = 320 * zoom;
  const limitY = 220 * zoom;
  return {
    zoom,
    x: Math.max(-limitX, Math.min(limitX, Number(camera.x) || 0)),
    y: Math.max(-limitY, Math.min(limitY, Number(camera.y) || 0)),
  };
}

export function cameraTransform(camera, view = SCENE_VIEW) {
  const safe = clampCamera(camera || DEFAULT_CAMERA);
  const cx = view.width / 2;
  const cy = view.height / 2;
  return `translate(${(cx + safe.x).toFixed(2)} ${(cy + safe.y).toFixed(2)}) scale(${safe.zoom.toFixed(3)}) translate(${(-view.width / 2).toFixed(2)} ${(-view.height / 2).toFixed(2)})`;
}

/** قاب نمایش ذخیره‌شده روی SVG را می‌خواند. */
export function readView(svg) {
  const parts = svg?.dataset?.view?.split(' ').map(Number);
  if (!parts || parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return SCENE_VIEW;
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}

/** اعمال دوربین روی SVG صحنه. */
export function applyCamera(svg, camera) {
  const world = svg?.querySelector('[data-camera]');
  if (world) world.setAttribute('transform', cameraTransform(camera, readView(svg)));
}

/**
 * نصب کنترل‌های دوربین روی ظرف صحنه.
 * @param {HTMLElement} stage
 * @param {{getCamera: () => object, setCamera: (camera: object) => void, onPan?: () => void}} options
 */
export function attachCamera(stage, { getCamera, setCamera, onPan } = {}) {
  if (!stage) return () => {};
  const pointers = new Map();
  let dragging = false;
  let moved = 0;
  let start = { x: 0, y: 0, camX: 0, camY: 0 };
  let pinchStart = 0;
  let pinchZoom = 1;

  const svg = () => stage.querySelector('svg.scene');

  const update = (camera) => {
    const safe = clampCamera(camera);
    setCamera(safe);
    applyCamera(svg(), safe);
    onPan?.(safe);
  };

  const onPointerDown = (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    // گرفتن اشاره‌گر فقط هنگام کشیدن انجام می‌شود تا کلیک روی ساختمان‌ها از بین نرود
    if (pointers.size === 1) {
      const camera = getCamera() || DEFAULT_CAMERA;
      dragging = true;
      moved = 0;
      start = { x: event.clientX, y: event.clientY, camX: camera.x, camY: camera.y };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
      pinchZoom = (getCamera() || DEFAULT_CAMERA).zoom;
    }
  };

  const onPointerMove = (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 2 && pinchStart > 0) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const camera = getCamera() || DEFAULT_CAMERA;
      update({ ...camera, zoom: (pinchZoom * distance) / pinchStart });
      moved = 12;
      return;
    }

    if (!dragging || pointers.size !== 1) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
    if (moved < 6) return;
    stage.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    const zoom = (getCamera() || DEFAULT_CAMERA).zoom;
    update({ x: start.camX + dx / zoom, y: start.camY + dy / zoom, zoom });
    stage.dataset.panning = 'true';
  };

  const endPointer = (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size === 0) {
      dragging = false;
      pinchStart = 0;
      stage.dataset.panning = 'false';
      // بعد از کشیدن، یک کلیک ناخواسته را بی‌اثر می‌کنیم
      if (moved >= 6) {
        const swallow = (clickEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        };
        stage.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => stage.removeEventListener('click', swallow, { capture: true }), 80);
      }
      moved = 0;
    }
  };

  const onWheel = (event) => {
    if (!event.ctrlKey && Math.abs(event.deltaY) < 2) return;
    event.preventDefault();
    const camera = getCamera() || DEFAULT_CAMERA;
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    update({ ...camera, zoom: camera.zoom * factor });
  };

  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('pointerleave', endPointer);
  stage.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    stage.removeEventListener('pointerdown', onPointerDown);
    stage.removeEventListener('pointermove', onPointerMove);
    stage.removeEventListener('pointerup', endPointer);
    stage.removeEventListener('pointercancel', endPointer);
    stage.removeEventListener('pointerleave', endPointer);
    stage.removeEventListener('wheel', onWheel);
  };
}

/** زوم نسبی برای دکمه‌های + و −. */
export function zoomBy(camera, factor) {
  return clampCamera({ ...camera, zoom: (camera.zoom || 1) * factor });
}
