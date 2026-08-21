---
name: procedural-visual-system
description: Build or remix premium web visuals from reusable procedural primitives with explicit design constraints, variants, and browser QA. Use for hero scenes, interactive backgrounds, Three.js moments, motion systems, or when a page is becoming generic AI-looking UI.
---

# Procedural Visual System

## Goal

Do not generate a fresh visual language from scratch for every page.
Build from a small library of human-curated primitives, then remix them inside explicit constraints.

Core loop:

`reference -> extract visual grammar -> choose primitive -> set variant -> compose page -> QA -> promote good result back into library`

## When to use

Use this skill when:
- a landing page needs a strong hero or interactive visual moment;
- the existing result looks like generic AI UI;
- a Three.js/WebGL effect is requested;
- one interaction needs to be reused across multiple pages;
- a previous visual should be remixed without losing quality.

Do not use Three.js by default. Use it only when depth, parallax, lighting, procedural geometry, or spatial interaction materially improves the composition.

## Operating rules

1. Start from a reference or a previously approved primitive.
2. Identify the visual grammar before coding:
   - focal object;
   - composition;
   - type hierarchy;
   - palette;
   - motion behavior;
   - interaction behavior;
   - density and negative space.
3. Choose the narrowest primitive that solves the job.
4. Change parameters and composition before rewriting primitive internals.
5. Generate 2-3 materially different variants, not random rerolls.
6. Keep one dominant visual idea per viewport.
7. Preserve readable text and interaction hierarchy above effects.
8. If a primitive produces a consistently strong result, keep it and version it.

## Anti-slop constraints

Never add effects only because they are easy to generate.
Avoid:
- gratuitous glass cards;
- purple/blue gradients without a reference reason;
- excessive glow, bloom, particles, blur, or noise;
- 3D objects centered with generic marketing copy around them;
- identical rounded rectangles across all sections;
- scroll animation on every element;
- random cursor-follow motion;
- decorative metrics that do not mean anything;
- fake technical labels added only to create a futuristic look.

Each decorative element must support at least one of: focal hierarchy, depth, brand character, state feedback, or narrative pacing.

## Primitive contract

Every reusable visual primitive must expose:
- one clear purpose;
- a small configuration surface;
- named variants;
- responsive behavior;
- reduced-motion behavior;
- performance bounds;
- an explicit destroy/cleanup path;
- an example/demo;
- acceptance checks.

Prefer configuration such as:

```js
createReactiveField({
  canvas,
  variant: 'nocturne',
  intensity: 0.7,
  interaction: 'proximity',
  quality: 'auto'
})
```

Do not expose dozens of arbitrary visual knobs. Curated presets are better than infinite parameter space.

## Composition workflow

### 1. Reference pass

Capture or inspect the reference and write down:
- what creates the first impression;
- where the eye lands first;
- what remains still;
- what moves;
- what is deliberately absent.

Do not copy surface decoration while missing the layout logic.

### 2. Primitive selection

Pick an existing primitive first.
Current library entry:
- `visual-primitives/reactive-field.js` — atmospheric procedural depth field for hero or section backgrounds.

If no primitive fits, create a new one only when the interaction or rendering model is materially different.

### 3. Variant pass

Create 2-3 variants by changing a coherent design system, for example:
- editorial / restrained;
- organic / tactile;
- technical / high-contrast.

A variant should change palette, material behavior, density, timing, and composition as a group. Do not merely recolor.

### 4. Page integration

Effects support the layout; they do not own it.
Ensure:
- hero copy remains readable at 390px and 1440px;
- focal object does not collide with key text;
- mobile gets a simplified composition rather than a squeezed desktop scene;
- pointer interactions have touch-safe fallback;
- animation is paused while the page is hidden.

### 5. QA

Check at minimum:
- 390x844 mobile;
- 768x1024 tablet;
- 1440x900 desktop.

Acceptance checks:
- no horizontal overflow;
- no clipped key text;
- no text/effect contrast failure;
- no interaction required to understand core content;
- reduced-motion produces a stable usable state;
- hidden tab pauses continuous rendering;
- resize does not distort the camera;
- WebGL failure leaves the page readable;
- target is visually legible within 1 second;
- one dominant focal idea, not competing effects.

## Promotion rule

Only promote a result into the reusable library when:
- it survives at least two different page contexts;
- its API can stay small;
- it has clear failure modes;
- it has passed responsive and performance QA.

Do not save one-off decoration as a primitive.
