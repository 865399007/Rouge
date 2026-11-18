export const TOWER_RADIUS = 32;

export function circlesOverlap(a, aRadius, b, bRadius) {
  return Math.hypot(a.x - b.x, a.y - b.y) < aRadius + bRadius;
}

// Small swept steps prevent knockback from tunnelling through towers. Projection
// along the contact normal lets characters slide around the actual round base.
export function moveCircle(actor, dx, dy, radius, towers, width, height) {
  const count = Math.max(
    1,
    Math.ceil(Math.hypot(dx, dy) / Math.max(1, radius * 0.5)),
  );
  const confine = () => {
    actor.x = Math.max(radius, Math.min(width - radius, actor.x));
    actor.y = Math.max(radius, Math.min(height - radius, actor.y));
  };
  for (let i = 0; i < count; i++) {
    actor.x += dx / count;
    actor.y += dy / count;
    for (let pass = 0; pass < 4; pass++) {
      confine();
      let touched = false;
      for (const tower of towers) {
        const gap = TOWER_RADIUS + radius;
        let nx = actor.x - tower.x,
          ny = actor.y - tower.y;
        const distance = Math.hypot(nx, ny);
        if (distance >= gap) continue;
        if (distance < 0.00001) {
          nx = 1;
          ny = 0;
        } else {
          nx /= distance;
          ny /= distance;
        }
        actor.x = tower.x + nx * gap;
        actor.y = tower.y + ny * gap;
        touched = true;
      }
      if (!touched) break;
    }
    confine();
  }
}
