# Scene composition and spacing review

Use this checklist for the user's finished pipeline, especially portrait scenes
that appear confined to the bottom half. It is a review method, not a requirement
to fill every pixel. Negative space can be intentional.

## Diagnose before moving anything

1. Identify the failing scene, time, format, and renderer. Compare Remotion and
   HyperFrames at the same time if only one export looks wrong.
2. Inspect a frame after entrances settle, one at the midpoint, and one before
   exits. Inspect transition frames separately. A subject entering from below
   is not evidence that the settled composition is misaligned.
3. Trace the geometry: output canvas → scene wrapper → safe area → layout group
   → artwork → captions. Verify the explicit canvas size and percentage-height
   containing blocks before adding offsets.
4. Check accumulated padding, margins, flex/grid alignment, min-height, `top`,
   `bottom`, transform origin, and translateY on both parents and children.
   A wrapper centered around already-offset children can double the displacement.
5. Check visible artwork bounds. SVG viewBox whitespace, transparent image borders,
   and letterboxing from `object-fit: contain` are different from CSS padding.
   Center/scale the visible subject, not just its element box. Do not crop useful art.
6. Inspect units and font readiness. Percentages depend on their containing block;
   em-based gaps depend on the font size of the element declaring them. Use clear
   canvas-space spacing tokens where inherited sizing causes surprising results.
   Measure text after the intended fonts load, including Arabic.

## Compose deliberately

- Define a safe content rectangle for each format and the intended platform.
  Keep platform controls and captions out of critical content. Do not assume a
  single fixed percentage is correct for every platform or shot.
- Lay out portrait independently from landscape; do not shrink the whole wide scene.
- Choose a scene-specific arrangement: central subject, conversation, side-by-side
  comparison, diagram, environment, or title card. Do not force all scene types
  into one title/illustration template.
- Allocate title, subject, labels, and captions together. Reserve space for only
  the regions actually used; a missing title should not leave a large phantom row.
- Keep the subject large enough to read at phone size. Fix unnecessary gaps and
  offsets before enlarging everything, which can introduce clipping.
- Give labels a clear relationship to their objects and a region that does not
  collide with props or captions. Permit purposeful layering only when legible.
- In scene groups with related elements, use a shared anchor and explicit spacing
  rather than unrelated vertical coordinates. Fix common layout code before
  accumulating scene-specific pixel nudges.

## Review warnings worth measuring

Calculate or inspect visible foreground bounds, excluding full-canvas backgrounds,
decorative particles, and transparent padding. DOM boxes alone are insufficient
for sparse SVGs and transparent images.

- **Bottom-heavy:** all primary subjects and explanatory text lie below the
  canvas midpoint in a settled frame, with no story reason for the empty upper half.
- **Unused space:** a large empty band separates related elements, or a reserved
  region remains empty after optional content is removed.
- **Small subject:** detail is unreadable at a 360-pixel-wide viewing scale.
- **Asymmetry:** top/bottom or left/right margins differ substantially without
  supporting the intended focal point, gaze direction, or movement.
- **Collision/overflow:** text or artwork clips, overlaps unintentionally, or
  enters the caption/platform-control area.

These are warning conditions, not automatic recentering rules. A character on a
ground plane, an incoming object, or deliberate space for a later reveal may justify them.
Do not treat a low foreground pixel count as inherently bad composition.

## Verify and report

For each affected shot, record:

| Scene / time | Format / renderer | Visible problem | Root cause | Proposed or applied fix | Evidence |
|---|---|---|---|---|---|

Inspect before/after images at native and phone sizes. Check settled frames plus
the nearby entrance/exit boundaries so a fix does not break motion. Review each
affected aspect ratio, then decode representative frames of the final MP4 when
an export is requested. Report deliberate whitespace and any unresolved limitations.

For an existing HyperFrames export, use its actual directory with:

```powershell
pnpm exec hyperframes check <export-directory> --snapshots
pnpm exec hyperframes snapshot <export-directory> --review
```

If a required preview/inspection tool cannot run, report that limitation. Do not
claim the visual issue is resolved solely because code compiles or checks pass.
