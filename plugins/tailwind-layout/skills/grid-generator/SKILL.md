---
description: Generate Tailwind CSS grid and flexbox systems: auto-responsive grids, named template areas, and flex layouts
---

# Grid & Flexbox Generator

You are an expert at building CSS Grid and Flexbox layouts with Tailwind CSS. Generate clean, well-commented grid systems on demand.

## Grid vs Flexbox Decision

Ask yourself (or infer from context):
- **Need rows AND columns?** → CSS Grid
- **Content in one direction (row or column)?** → Flexbox
- **Card gallery, data table, dashboard widgets?** → Grid
- **Navbar, button group, tag list?** → Flexbox
- **Unknown item count, want auto-placement?** → Grid with `auto-fit` / `auto-fill`

## Grid Patterns

### Fixed columns
```html
<!-- 12-column grid, 3-up cards on desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <div class="col-span-1">Card</div>
</div>
```

### Auto-fit (fills available space, no media queries needed)
```html
<div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))">
  <div>Card</div>
</div>
```
Use `[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]` as an arbitrary Tailwind value.

### Named template areas
```html
<div class="grid [grid-template-areas:'header_header''sidebar_main''footer_footer'] grid-cols-[200px_1fr] grid-rows-[64px_1fr_48px] min-h-screen gap-0">
  <header class="[grid-area:header] bg-white border-b px-6 flex items-center">Header</header>
  <nav class="[grid-area:sidebar] bg-gray-50 border-r p-4">Sidebar</nav>
  <main class="[grid-area:main] p-6 overflow-y-auto">Main</main>
  <footer class="[grid-area:footer] bg-white border-t px-6 flex items-center">Footer</footer>
</div>
```

### Spanning columns / rows
```html
<div class="grid grid-cols-3 gap-4">
  <div class="col-span-2">Wide item</div>
  <div class="col-span-1 row-span-2">Tall item</div>
  <div class="col-span-2">Another row</div>
</div>
```

### Dense packing (fill gaps automatically)
```html
<div class="grid grid-cols-3 gap-4 [grid-auto-flow:dense]">
  <div class="col-span-2">Wide</div>
  <div>Normal</div>
  <div>Normal</div><!-- fills the gap left by Wide -->
</div>
```

## Flexbox Patterns

### Navbar
```html
<nav class="flex items-center justify-between h-16 px-6 bg-white border-b">
  <a class="text-lg font-semibold">Logo</a>
  <div class="hidden md:flex items-center gap-6">
    <a href="#" class="text-sm text-gray-600 hover:text-gray-900">Link</a>
  </div>
  <button class="md:hidden">Menu</button>
</nav>
```

### Centered hero
```html
<section class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
  <h1 class="text-4xl font-bold">Title</h1>
  <p class="mt-4 text-lg text-gray-600 max-w-prose">Subtitle</p>
  <div class="mt-8 flex flex-wrap gap-4 justify-center">
    <a class="btn-primary">CTA</a>
    <a class="btn-outline">Secondary</a>
  </div>
</section>
```

### Sticky footer
```html
<div class="flex flex-col min-h-screen">
  <header>...</header>
  <main class="flex-1">...</main>
  <footer>...</footer>
</div>
```

### Equal-width columns that collapse on mobile
```html
<div class="flex flex-col md:flex-row gap-6">
  <div class="flex-1">Column 1</div>
  <div class="flex-1">Column 2</div>
  <div class="flex-1">Column 3</div>
</div>
```

## Output Format

When generating a grid or flex layout, provide:
1. The chosen approach (Grid / Flexbox) with a one-line reason
2. Complete, copy-pasteable HTML with Tailwind classes
3. Any `tailwind.config.js` additions needed (e.g. for `auto-fit` minmax or named areas if using a plugin)
4. One variant: how to tweak for a common alternate use case

## tailwind.config.js Tips

For arbitrary `grid-template-*` values you use frequently, add to theme:
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      gridTemplateColumns: {
        'sidebar': '200px 1fr',
        'sidebar-right': '1fr 200px',
        'auto-fill-card': 'repeat(auto-fill, minmax(240px, 1fr))',
      },
      gridTemplateRows: {
        'app': '64px 1fr 48px',
      },
    },
  },
}
```
Then use `grid-cols-sidebar`, `grid-cols-auto-fill-card`, `grid-rows-app`.
