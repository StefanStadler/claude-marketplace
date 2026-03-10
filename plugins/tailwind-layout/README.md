# tailwind-layout

Three Tailwind CSS layout skills for Claude Code — generate layout patterns, optimize responsiveness, and build grid systems.

## Installation

```
/plugin marketplace add StefanStadler/claude-marketplace
/plugin install tailwind-layout
```

## Skills

### `/layout-builder`

Generate production-ready layout patterns from a description.

**Supported patterns:** Dashboard, Holy Grail, Sidebar, Split Screen, Magazine, Masonry, Kanban

```
/layout-builder dashboard with collapsible sidebar and top nav
/layout-builder holy grail layout for a blog
/layout-builder masonry card grid for a photo gallery
```

### `/responsive-optimizer`

Paste your existing markup and get a responsive audit + improved code.

```
/responsive-optimizer
<paste your HTML/JSX here>
```

Returns a numbered issue list, fixed code, and a before/after summary table.

### `/grid-generator`

Generate CSS Grid or Flexbox systems with proper Tailwind classes, including auto-responsive grids, named template areas, and `tailwind.config.js` extensions.

```
/grid-generator auto-fit card gallery, min 240px per card
/grid-generator 12-column grid with a featured item spanning 2 cols
/grid-generator sticky footer layout with flex
```

## Examples

### Dashboard layout
```html
<div class="flex h-screen bg-gray-100">
  <aside class="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
    <!-- sidebar content -->
  </aside>
  <div class="flex flex-col flex-1 overflow-hidden">
    <header class="flex items-center h-16 px-6 bg-white border-b border-gray-200">
      <!-- header content -->
    </header>
    <main class="flex-1 overflow-y-auto p-6">
      <!-- page content -->
    </main>
  </div>
</div>
```

### Auto-responsive card grid
```html
<div class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
  <div class="rounded-xl bg-white shadow p-4">Card</div>
</div>
```

### Responsive optimizer (before → after)
```html
<!-- Before: breaks on mobile -->
<div class="flex flex-row gap-8">
  <div class="w-48">Sidebar</div>
  <div class="w-full">Content</div>
</div>

<!-- After: stacks on mobile, side-by-side on md+ -->
<div class="flex flex-col md:flex-row gap-4 md:gap-8">
  <div class="w-full md:w-48 shrink-0">Sidebar</div>
  <div class="flex-1 min-w-0">Content</div>
</div>
```

## Requirements

- Tailwind CSS v3.0+
- For container queries: `@tailwindcss/container-queries` plugin
