/* ============================================
   MOZZ VADER — PORTFOLIO
   Mesh Background Generator
   Low-poly triangle mesh with purple gradients
   ============================================ */

/**
 * Generates a low-poly triangle mesh SVG for a section background.
 * Creates an organic, random-looking pattern of triangles with
 * purple gradient colors and subtle opacity variations.
 */
class MeshBackground {
  constructor(svgElement, sectionIndex) {
    this.svg = svgElement;
    this.sectionIndex = sectionIndex;
    // Seed randomness per section for different but consistent patterns
    this.seed = sectionIndex * 1234 + 5678;
    this.gridSize = 120; // px per grid cell
    this.jitter = 0.35;  // how much vertices deviate from grid (0-1)
    this.generate();
  }

  /**
   * Simple seeded pseudo-random number generator
   */
  seededRandom() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Returns a purple-ish color with variation based on position and theme
   */
  getTriangleColor(cx, cy, width, height) {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const r = this.seededRandom();

    // Normalize position (0 to 1)
    const nx = cx / width;
    const ny = cy / height;

    // Base opacity: triangles near edges are more transparent
    const edgeFade = Math.min(nx, 1 - nx, ny, 1 - ny) * 4;
    const fadeFactor = Math.min(1, edgeFade + 0.3);

    // Purple color variations
    // Dark theme: deep purples, magentas, some blue undertones
    // Light theme: lighter purples, lavenders
    const colorSets = isDark ? [
      { h: 272, s: 85, l: 18 }, // deep purple
      { h: 280, s: 70, l: 22 }, // violet
      { h: 265, s: 80, l: 14 }, // darker purple
      { h: 285, s: 60, l: 16 }, // magenta-ish
      { h: 255, s: 75, l: 20 }, // blue-purple
      { h: 290, s: 50, l: 12 }, // very dark purple
      { h: 270, s: 90, l: 10 }, // near-black purple
    ] : [
      { h: 272, s: 60, l: 88 }, // light purple
      { h: 280, s: 50, l: 85 }, // light violet
      { h: 265, s: 55, l: 82 }, // lavender
      { h: 285, s: 40, l: 86 }, // light magenta
      { h: 255, s: 50, l: 84 }, // light blue-purple
      { h: 270, s: 65, l: 90 }, // very light purple
      { h: 290, s: 35, l: 88 }, // pale purple
    ];

    // Pick a color from the set with some interpolation
    const idx = Math.floor(r * colorSets.length);
    const nextIdx = (idx + 1) % colorSets.length;
    const t = (r * colorSets.length) - idx;

    const base = colorSets[idx];
    const next = colorSets[nextIdx];

    const h = Math.round(base.h + (next.h - base.h) * t);
    const s = Math.round(base.s + (next.s - base.s) * t);
    const l = Math.round(base.l + (next.l - base.l) * t);

    // Apply fade
    const alpha = (0.3 + r * 0.5) * fadeFactor;

    return `hsla(${h}, ${s}%, ${l}%, ${alpha.toFixed(2)})`;
  }

  /**
   * Generate the full mesh
   */
  generate() {
    const parent = this.svg.parentElement;
    const w = parent.offsetWidth || window.innerWidth;
    const h = parent.offsetHeight || window.innerHeight;

    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    this.svg.setAttribute('width', w);
    this.svg.setAttribute('height', h);

    // Build grid of jittered vertices
    const cols = Math.ceil(w / this.gridSize) + 2;
    const rows = Math.ceil(h / this.gridSize) + 2;
    const vertices = [];

    for (let row = -1; row <= rows; row++) {
      vertices[row + 1] = [];
      for (let col = -1; col <= cols; col++) {
        // Base position on grid
        let x = col * this.gridSize;
        let y = row * this.gridSize;

        // Apply jitter for organic look
        x += (this.seededRandom() - 0.5) * this.gridSize * this.jitter * 2;
        y += (this.seededRandom() - 0.5) * this.gridSize * this.jitter * 2;

        vertices[row + 1][col + 1] = { x, y };
      }
    }

    // Build triangles from grid (2 triangles per cell)
    const polygons = [];
    const totalRows = rows + 2;
    const totalCols = cols + 2;

    for (let row = 0; row < totalRows - 1; row++) {
      for (let col = 0; col < totalCols - 1; col++) {
        const tl = vertices[row][col];
        const tr = vertices[row][col + 1];
        const bl = vertices[row + 1][col];
        const br = vertices[row + 1][col + 1];

        // Triangle 1: top-left
        polygons.push({
          points: [tl, tr, bl],
          cx: (tl.x + tr.x + bl.x) / 3,
          cy: (tl.y + tr.y + bl.y) / 3,
        });

        // Triangle 2: bottom-right
        polygons.push({
          points: [tr, br, bl],
          cx: (tr.x + br.x + bl.x) / 3,
          cy: (tr.y + br.y + bl.y) / 3,
        });
      }
    }

    // Generate SVG
    let svgContent = '';

    polygons.forEach((poly) => {
      const color = this.getTriangleColor(poly.cx, poly.cy, w, h);
      const pointsStr = poly.points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      svgContent += `<polygon points="${pointsStr}" fill="${color}" />`;
    });

    this.svg.innerHTML = svgContent;
  }

  /**
   * Regenerate on resize (debounced)
   */
  static initAll() {
    const meshes = document.querySelectorAll('.mesh-svg');

    const instances = Array.from(meshes).map((svg, i) => {
      return new MeshBackground(svg, i);
    });

    // Regenerate on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        instances.forEach(instance => instance.generate());
      }, 300);
    });

    // Regenerate on theme change
    const observer = new MutationObserver(() => {
      // Small delay to let CSS custom properties update
      setTimeout(() => {
        instances.forEach(instance => instance.generate());
      }, 100);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return instances;
  }
}
