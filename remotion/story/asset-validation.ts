import type { Storyboard } from './types';

export const assetKey = (name: string) => String(name ?? '').trim().toLowerCase()
  .replace(/\\/g, '/').replace(/^file:/, '').replace(/^props\//, '')
  .replace(/\.svg$/, '').replace(/[\s-]+/g, '_');

/** Validate all scenes, including assets whose entrance is later than the preview frame. */
export function validateAssets(sb: Storyboard, resolve: (name: string) => string | null) {
  const missing: string[] = [];
  sb.scenes.forEach((scene, i) => {
    const check = (name: string, field: string) => {
      if (!resolve(name)) missing.push(`Scene ${scene.id ?? i + 1}, ${field}: ${JSON.stringify(name) ?? '(missing name)'}`);
    };
    scene.props?.forEach((p, j) => check(p.name, `props[${j}].name`));
    scene.items?.forEach((p, j) => { if (!p.image && p.prop !== undefined) check(p.prop, `items[${j}].prop`); });
    scene.characters?.forEach((c, j) => { if (c.holding !== undefined) check(c.holding, `characters[${j}].holding`); });
    if (scene.bubble?.prop !== undefined) check(scene.bubble.prop, 'bubble.prop');
  });
  if (missing.length) throw new Error(`Unknown drawing assets:\n${missing.join('\n')}\nChoose an existing prop from Library, or add the missing SVG to projects/<name>/props/. A question mark is only drawn when explicitly requested as "question".`);
}
