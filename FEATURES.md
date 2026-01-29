# GraphSpace - Complete Feature Implementation Guide

## 🎯 Mathematical Expression Parser

### Supported Notation & Examples

#### Basic Operations
```javascript
// Addition, Subtraction, Multiplication, Division
x + y        ✓
x - y        ✓  
x * y        ✓
x / y        ✓

// Implicit Multiplication (NO * NEEDED!)
2x           ✓  Converts to: 2*x
3y           ✓  Converts to: 3*y
xy           ✓  Converts to: x*y
2(x+1)       ✓  Converts to: 2*(x+1)
(x+1)(y-1)   ✓  Converts to: (x+1)*(y-1)
x(y+2)       ✓  Converts to: x*(y+2)
```

#### Power Operations
```javascript
// Powers using ^
x^2          ✓  Converts to: x**2
x^3          ✓  Converts to: x**3
x^y          ✓  Converts to: x**y
2^x          ✓  Converts to: 2**x

// Unicode superscripts
x²           ✓  Converts to: x^2 then x**2
x³           ✓  Converts to: x^3 then x**3
```

#### Trigonometric Functions
```javascript
sin(x)       ✓  Converts to: Math.sin(x)
cos(y)       ✓  Converts to: Math.cos(y)
tan(x)       ✓  Converts to: Math.tan(x)
asin(x)      ✓  Arcsine
acos(x)      ✓  Arccosine
atan(x)      ✓  Arctangent

// With implicit multiplication
2sin(x)      ✓  Converts to: 2*Math.sin(x)
sin(x)cos(y) ✓  Converts to: Math.sin(x)*Math.cos(y)
```

#### Square Root
```javascript
√(x²+y²)     ✓  Converts to: Math.sqrt(x**2+y**2)
sqrt(x)      ✓  Converts to: Math.sqrt(x)
√25          ✓  Converts to: Math.sqrt(25)

// Complex expressions
sin(√(x²+y²)) ✓  Fully supported!
```

#### Exponential & Logarithm
```javascript
exp(x)       ✓  Converts to: Math.exp(x) = e^x
ln(x)        ✓  Converts to: Math.log(x) = natural log
log(x)       ✓  Converts to: Math.log(x) = natural log
abs(x)       ✓  Converts to: Math.abs(x) = absolute value
```

#### Constants
```javascript
π            ✓  Converts to: Math.PI (3.14159...)
e            ✓  Converts to: Math.E (2.71828...)
```

### Expression Parser Logic Flow

```
Input: "sin(√(x²+y²))"
    ↓
1. Preprocess superscripts
   → "sin(√(x^2+y^2))"
    ↓
2. Replace constants
   → "sin(√(x^2+y^2))"
    ↓
3. Replace √ with Math.sqrt
   → "sin(Math.sqrt(x^2+y^2))"
    ↓
4. Replace function names
   → "Math.sin(Math.sqrt(x^2+y^2))"
    ↓
5. Handle implicit multiplication
   → "Math.sin(Math.sqrt(x^2+y^2))"
    ↓
6. Convert ^ to **
   → "Math.sin(Math.sqrt(x**2+y**2))"
    ↓
7. Create JavaScript function
   → new Function('x', 'y', 'return Math.sin(Math.sqrt(x**2+y**2))')
    ↓
Output: Executable function ✓
```

## 🎨 Complete Feature Breakdown

### LEFT PANEL - Equation Management

#### 1. Equation Cards (Dynamic)
```javascript
Features:
- Add new equation: Click + button
- Color indicator: Shows surface color, click to toggle visibility
- Delete button: Remove equation and surface
- Active highlighting: Blue border when selected
- Error display: Red border + message for invalid expressions
- Real-time validation: Expression checked as you type

Implementation:
- Each equation has unique ID
- Stored in equations[] array
- Each has: id, expression, color, visible, mesh
```

#### 2. Function Keyboard
```javascript
Quick insert buttons:
√    → Inserts: √()   (cursor inside parentheses)
x²   → Inserts: ^2    (at cursor position)
x³   → Inserts: ^3
xⁿ   → Inserts: ^     (cursor after ^)
sin  → Inserts: sin() (cursor inside)
cos  → Inserts: cos()
tan  → Inserts: tan()
eˣ   → Inserts: exp()
ln   → Inserts: ln()
|x|  → Inserts: abs()
π    → Inserts: π
e    → Inserts: e

Behavior:
- Inserts at active equation's cursor position
- Automatically positions cursor for easy completion
- No equation selected → button does nothing
```

#### 3. Smart Autocomplete
```javascript
Triggers:
- Type partial function name: "si" → shows sin()
- Shows while typing: "cos", "tan", "sqrt", etc.
- Shows function description

Controls:
- Tab: Accept suggestion
- ↑/↓: Navigate suggestions
- Esc: Close autocomplete
- Click: Select suggestion

Implementation:
- Monitors input at cursor position
- Matches against functionSuggestions array
- Positions dropdown below input field
```

#### 4. Settings Panel
```javascript
Domain Range:
- X min/max: -10 to 10 (default: -5 to 5)
- Y min/max: -10 to 10 (default: -5 to 5)
- Step: 0.5 increments
- Updates: All surfaces regenerated on change

Resolution:
- Range: 20-100 points (default: 50)
- 50 = 51x51 = 2,601 vertices
- 100 = 101x101 = 10,201 vertices
- Updates: All surfaces regenerated on change

View Controls:
- Reset View: Camera to (10, 10, 10)
- Toggle Grid: Show/hide 20x20 grid
- Toggle Axes: Show/hide XYZ axes (8 units long)
```

#### 5. Preset Surfaces
```javascript
6 Beautiful presets:
1. Ripple Wave:   sin(√(x²+y²))
2. Paraboloid:    x²+y²
3. Saddle:        x²-y²
4. Wave Grid:     sin(x)cos(y)
5. Gaussian:      exp(-(x²+y²))
6. Mexican Hat:   cos(√(x²+y²))/(1+0.1(x²+y²))

Behavior:
- Click → Adds new equation with preset expression
- Auto-assigns preset color
- Immediately plots surface
```

### RIGHT PANEL - Analysis & Tools

#### 1. Surface Analysis
```javascript
Critical Points Detection:
- Finds: Local minimum (blue sphere) and maximum (red sphere)
- Method: Scans all vertices for min/max Z values
- Size: 0.2 unit radius spheres
- Toggle: Checkbox enable/disable
- Requirement: Active equation must be selected

Contour Lines:
- Status: Placeholder feature
- Purpose: Show level curves at different Z heights
- Future: Full implementation planned

Normal Vectors:
- Shows: Yellow arrows perpendicular to surface
- Sampling: Every 15th vertex (for performance)
- Length: 0.5 units
- Calculation: Uses geometry.computeVertexNormals()
- Toggle: Checkbox enable/disable

Statistics (Click "Analyze Active Surface"):
- Surface Area: Triangulation-based approximation
- Volume: Riemann sum of Z values × cell area
- Z Range: Minimum to maximum Z values
- Updates: Manual (click button to calculate)
```

#### 2. Visualization Options
```javascript
Rendering Modes:
- Solid: MeshPhongMaterial, full shading
- Wireframe: MeshBasicMaterial, edges only
- Points: PointsMaterial, vertex cloud
- Solid + Wireframe: Combined mesh

Color Mapping:
- Solid Color: Use equation's assigned color
- Height Gradient: Darker (low) to lighter (high)
- Rainbow: Hue from red (low) to blue (high)
- Cool-Warm: Blue (low) → green → red (high)
  
Implementation:
- Creates color attribute per vertex
- Uses BufferGeometry.setAttribute('color', ...)
- Material.vertexColors = true

Material Properties:
- Opacity: 10-100% (0.1 to 1.0)
  - <100%: Sets material.transparent = true
  - Updates: Immediate (no regeneration)
  
- Shininess: 0-100 (specular reflection)
  - MeshPhongMaterial.shininess property
  - Updates: Immediate (no regeneration)
  
- Smooth Shading: Toggle
  - True: Vertex normals computed
  - False: material.flatShading = true
  - Updates: Requires surface regeneration
```

#### 3. Animation Controls
```javascript
Auto-Rotate Camera:
- Speed: 0.001 * slider value (0.2x to 2x)
- Method: Increments phi angle in spherical coords
- Maintains: Constant radius and theta
- Toggle: Checkbox enable/disable

Surface Animations:
Types:
1. Wave Motion:
   - Effect: Vertical oscillation
   - Implementation: mesh.position.z = sin(time) * 0.5

2. Pulse:
   - Effect: Scale in/out
   - Implementation: scale = 1 + sin(time*2) * 0.1

3. Morph:
   - Effect: Rotation
   - Implementation: mesh.rotation.y = time * 0.5

Controls:
- Play: Starts animation loop (isAnimating = true)
- Pause: Stops animation (isAnimating = false)
- Animation type: Dropdown selection
```

#### 4. Point Evaluation
```javascript
Input:
- X coordinate: Number input (step 0.1)
- Y coordinate: Number input (step 0.1)

Calculate:
- Click "Evaluate Point" button
- Calls: createEvaluator(expression)(x, y)
- Display: Z value with 4 decimal places
- Error handling: Shows "Error" or "Undefined"

Visual Marker:
- Toggle: "Show Point Marker" checkbox
- Type: Green sphere (0.15 unit radius)
- Position: (x, y, z) in 3D space
- Updates: When coordinates change (if enabled)
- Remove: Uncheck to hide
```

#### 5. Export Functions
```javascript
Screenshot (PNG):
- Method: renderer.domElement.toDataURL('image/png')
- Quality: Full canvas resolution
- Preserves: Current view angle and zoom
- Filename: graphspace-[timestamp].png
- Note: preserveDrawingBuffer = true required

3D Model (STL):
- Format: ASCII STL
- Contents: All visible surfaces
- Triangles: All geometry faces
- Normals: Computed per triangle
- Filename: graphspace-[timestamp].stl
- Use: 3D printing, Blender, CAD software

Data (CSV):
- Format: Comma-separated values
- Columns: Equation, X, Y, Z
- Rows: All vertices from all surfaces
- Filename: graphspace-data-[timestamp].csv
- Use: Excel, MATLAB, Python analysis

Equations (JSON):
- Contents: 
  - All equations (expression, color, visible)
  - Settings (domain ranges, resolution)
- Format: Pretty-printed JSON
- Filename: graphspace-equations-[timestamp].json
- Use: Save state, reload later (future feature)
```

#### 6. Camera Presets
```javascript
7 Preset Views (distance = 15 units):
1. Front:      (0, 0, 15)     - Looking at XY plane
2. Back:       (0, 0, -15)    - Behind the surface
3. Top:        (0, 15, 0)     - Bird's eye view
4. Bottom:     (0, -15, 0)    - Under the surface
5. Left:       (-15, 0, 0)    - YZ plane view
6. Right:      (15, 0, 0)     - YZ plane view
7. Isometric:  (10.6, 10.6, 10.6) - 45° angle

All views:
- Look at origin (0, 0, 0)
- Instant camera jump
- Preserve other settings
```

## 🎮 Interaction Controls

### Mouse Controls
```javascript
Drag (left mouse button):
- Action: Rotate camera around origin
- Method: Spherical coordinate manipulation
- Preserves: Camera distance from origin
- Constraints: Theta clamped to [0.1, π-0.1]

Shift + Drag:
- Action: Pan camera (translate view)
- Speed: 0.01 units per pixel
- Moves: Camera position in XY plane
- Note: Does not affect lookAt target

Scroll (wheel):
- Action: Zoom in/out
- Method: Scale camera distance from origin
- Range: 3 to 50 units
- Speed: 0.1 * wheel delta * 0.01
```

### Keyboard Shortcuts
```javascript
Enter: Plot/update current equation
Tab: Accept autocomplete suggestion
↑ / ↓: Navigate autocomplete list
Esc: Close autocomplete dropdown
```

## 💻 Technical Implementation Details

### Scene Setup
```javascript
Scene:
- Background: #0a0a0f (very dark blue)
- Units: Arbitrary (consistent scale)

Camera:
- Type: PerspectiveCamera
- FOV: 60 degrees
- Near: 0.1, Far: 1000
- Initial: (10, 10, 10) looking at origin

Renderer:
- Antialias: true
- Alpha: true
- preserveDrawingBuffer: true (for screenshots)
- PixelRatio: window.devicePixelRatio

Lighting:
1. AmbientLight: #ffffff, intensity 0.6
2. DirectionalLight: #ffffff, intensity 0.8, pos (10,10,10)
3. DirectionalLight: #6366f1 (blue), intensity 0.3, pos (-10,-5,-10)
```

### Surface Generation
```javascript
Geometry:
- Type: PlaneGeometry
- Width: xmax - xmin
- Height: ymax - ymin
- Segments: resolution x resolution

Process:
1. Create flat plane geometry
2. Loop through all vertices
3. For each vertex (x, y):
   - Calculate actual coordinates in domain
   - Evaluate z = f(x, y)
   - Set vertex Z position
   - Handle infinite/NaN → set to 0
4. Track min/max Z for coloring
5. Apply color mapping if enabled
6. Compute vertex normals
7. Create material
8. Return mesh

Performance:
- Resolution 50: 2,601 vertices (fast)
- Resolution 75: 5,776 vertices (moderate)  
- Resolution 100: 10,201 vertices (slow)
```

### Color Mapping Implementation
```javascript
Algorithm:
1. Find min/max Z across all vertices
2. For each vertex:
   - Calculate t = (z - minZ) / (maxZ - minZ)  [0 to 1]
   - Apply color scheme:
   
Height Gradient:
   - r = baseColor.r * (0.5 + t*0.5)
   - g = baseColor.g * (0.5 + t*0.5)
   - b = baseColor.b * (0.5 + t*0.5)
   
Rainbow:
   - hue = t * 0.7  (red to blue)
   - Use HSL color space
   
Cool-Warm:
   - r = t
   - g = 0.5
   - b = 1 - t

3. Store in color attribute
4. Enable material.vertexColors
```

### Memory Management
```javascript
Surface Updates:
- Always remove old mesh: scene.remove(equation.mesh)
- Dispose geometry: geometry.dispose()
- Dispose material: material.dispose()
- Clear references: equation.mesh = null

Array Cleanup:
- Critical points: Clear and remove all markers
- Normal vectors: Clear and remove all arrows
- Contour lines: Clear and remove all lines

Animation Frame:
- Single requestAnimationFrame loop
- All animations in one function
- No multiple loops (prevents memory leaks)
```

## 🐛 Error Handling

### Expression Validation
```javascript
Validation Steps:
1. Check if expression is empty → clear surface
2. Try to create evaluator function
3. Test with multiple points: (0,0), (1,1), (-1,-1), (0.5,0.5)
4. Count valid results (isFinite)
5. Require at least one valid result
6. If all fail → show error message

Error Messages:
- "Invalid mathematical expression" (parser error)
- "Expression produces no valid values" (all points NaN/Infinity)
- Displayed in red below equation input
```

### Runtime Safety
```javascript
Surface Creation:
- Wrap evaluator calls in try-catch
- Check for isFinite(z) before setting
- Set invalid points to z = 0
- Continue processing (partial surface ok)

Feature Toggles:
- Check if equation selected
- Check if surface exists
- Show alert if prerequisites not met
- Uncheck feature if operation fails
```

## 📊 Performance Optimization

### Best Practices
```javascript
Resolution:
- Start at 50 for fast iteration
- Increase to 75-100 for final render
- Higher resolution = exponentially slower

Surface Count:
- Ideal: 1-3 surfaces
- Ok: 4-7 surfaces
- Slow: 8+ surfaces

Feature Usage:
- Normal vectors: Most expensive (adds ~200 objects)
- Critical points: Cheap (2 objects)
- Auto-rotate: Minimal impact
- Animations: Moderate impact

Browser:
- Chrome/Edge: Best performance
- Firefox: Good performance
- Safari: Moderate performance
```

## 🎓 Mathematical Examples

### Educational Surfaces
```javascript
// Quadratic Surfaces
x^2 + y^2                  // Paraboloid (bowl)
x^2 - y^2                  // Saddle point
x^2 + y^2 - x              // Shifted paraboloid

// Trigonometric
sin(x)                     // Sine wave (y-independent)
cos(x) + sin(y)            // Orthogonal waves
sin(x)cos(y)               // Wave interference pattern
sin(sqrt(x^2+y^2))         // Circular ripples

// Exponential
exp(x)                     // Exponential growth
exp(-(x^2+y^2))            // Gaussian bell curve
exp(-abs(x)-abs(y))        // Pyramid bell curve

// Rational Functions
1/(x^2+y^2+1)              // Rational peak
x/(x^2+y^2+1)              // Tilted rational

// Complex Surfaces
sin(x)/x                   // Sinc function (1D)
sin(sqrt(x^2+y^2))/sqrt(x^2+y^2)  // 2D sinc (disk)
```

### Creative Surfaces
```javascript
// Terrain-like
sin(5x)cos(5y)/10          // Mountain range
abs(sin(x))abs(cos(y))     // Pyramid grid

// Abstract Art
sin(x)cos(y) + sin(3x)cos(3y)/3  // Harmonic pattern
x^3 - 3xy^2                       // Monkey saddle

// Physics Simulations
exp(-(x^2+y^2))sin(sqrt(x^2+y^2))  // Decaying wave
```

## 📁 File Structure

```
graphspace/
├── index.html          // Main HTML structure
├── styles.css          // All styling (dark theme)
├── script.js           // All functionality
└── README.md           // User documentation
```

## 🔧 Customization Guide

### Adding New Math Functions
```javascript
1. Add to function list in createEvaluator():
   'myFunc': 'Math.myFunc'

2. Add to autocomplete suggestions:
   { trigger: 'myfunc', suggestion: 'myFunc()', ... }

3. Add to function keyboard (optional):
   <button onclick="insertAtActive('myFunc()', 1)">myFunc</button>
```

### Adding New Presets
```javascript
HTML:
<button class="preset-card" onclick="loadPreset('YOUR_EXPRESSION', '#COLOR')">
    <div class="preset-name">Name</div>
    <div class="preset-equation">Expression</div>
</button>
```

### Custom Color Schemes
```javascript
CSS Variables (in styles.css):
--accent-blue: #6366f1
--accent-purple: #8b5cf6
--accent-pink: #ec4899
... (10 colors in colorPalette array)
```

## 🚀 Future Enhancements

### Planned Features
```javascript
1. Import JSON equations (save/load state)
2. Parametric surfaces: x(u,v), y(u,v), z(u,v)
3. Contour lines implementation
4. Gradient field visualization
5. Multiple light sources control
6. Animation recording (GIF export)
7. Touch controls for mobile
8. Equation library (community presets)
9. LaTeX equation rendering
10. Multiple camera bookmarks
```

---

**Total Lines of Code:** ~2,500+
**Functions:** 60+
**Features:** 50+
**Supported Expressions:** Unlimited

Created with ❤️ for mathematical visualization
