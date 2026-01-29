# GraphSpace - Advanced 3D Surface Explorer

A powerful 3D mathematical surface visualization tool with advanced analysis and export capabilities.

## 🚀 Features

### Core Functionality
- **Interactive 3D Surface Plotting** - Visualize mathematical functions z = f(x, y)
- **Multiple Equations** - Plot multiple surfaces simultaneously with different colors
- **Real-time Updates** - See changes as you type
- **Function Keyboard** - Quick access to common mathematical functions
- **Smart Autocomplete** - Intelligent function suggestions

### Left Panel (Equation Management)

#### Equation Editor
- Add unlimited equations using the `+` button
- Color-coded surfaces for easy identification
- Toggle visibility by clicking the color indicator
- Delete equations with the X button
- Active equation highlighting

#### Function Keyboard
Quick insert buttons for:
- √ (square root)
- x², x³, xⁿ (powers)
- sin, cos, tan (trigonometry)
- eˣ, ln (exponential and logarithm)
- |x| (absolute value)
- π, e (constants)

#### Settings
- **Domain Range**: Set X and Y bounds (-10 to 10 by default)
- **Resolution**: Adjust mesh density (20-100 points)
- **View Controls**: Reset camera, toggle grid, toggle axes

#### Presets
Pre-loaded beautiful surfaces:
- Ripple Wave: `sin(√(x²+y²))`
- Paraboloid: `x²+y²`
- Saddle: `x²-y²`
- Wave Grid: `sin(x)cos(y)`
- Gaussian: `exp(-(x²+y²))`
- Mexican Hat: `cos(√(x²+y²))/(1+0.1(x²+y²))`

### Right Panel (Analysis & Tools)

#### 📊 Surface Analysis
- **Critical Points**: Automatically find and mark local minima (blue) and maxima (red)
- **Contour Lines**: Visualize level curves (planned feature)
- **Normal Vectors**: Display surface normals as yellow arrows
- **Statistics**:
  - Surface Area (approximate)
  - Volume Under Surface
  - Min/Max Z-Value range

#### 🎨 Visualization
- **Rendering Modes**:
  - Solid: Standard filled surface
  - Wireframe: Grid mesh only
  - Points: Point cloud
  - Solid + Wireframe: Combined view
  
- **Color Mapping**:
  - Solid Color: Use equation color
  - Height Gradient: Darker to lighter by height
  - Rainbow Gradient: Full spectrum coloring
  - Cool-Warm: Blue (low) to red (high)
  
- **Material Properties**:
  - Opacity: 10-100% transparency
  - Shininess: 0-100 specular reflection
  - Smooth/Flat Shading toggle

#### 🎬 Animation
- **Auto-Rotate Camera**: Automatic orbiting view
- **Rotation Speed**: Adjustable 0.2x to 2x
- **Surface Animations**:
  - Wave Motion: Vertical oscillation
  - Pulse: Scaling effect
  - Morph: Rotation animation

#### 📍 Point Evaluation
- Enter X,Y coordinates to calculate Z value
- Visual marker on surface (green sphere)
- Real-time calculation
- Shows "Undefined" for invalid points

#### 💾 Export Options
- **Screenshot (PNG)**: High-quality image of current view
- **3D Model (STL)**: Export for 3D printing or CAD software
- **Data (CSV)**: Export all surface points as spreadsheet
- **Equations (JSON)**: Save equations and settings to reload later

#### 📷 Camera Presets
Quick view angles:
- Front, Back, Top, Bottom, Left, Right views
- Isometric (3D diagonal view)

## 📝 Supported Mathematical Notation

### Functions
- `sin(x)`, `cos(x)`, `tan(x)` - Trigonometric
- `asin(x)`, `acos(x)`, `atan(x)` - Inverse trigonometric
- `sqrt(x)` or `√(x)` - Square root
- `exp(x)` - Exponential (eˣ)
- `ln(x)` or `log(x)` - Natural logarithm
- `abs(x)` - Absolute value

### Operators
- `+`, `-`, `*`, `/` - Basic arithmetic
- `^` - Power (e.g., `x^2`, `x^y`)
- Implicit multiplication: `2x`, `xy`, `3sin(x)`

### Constants
- `π` or `pi` - Pi (3.14159...)
- `e` - Euler's number (2.71828...)

### Variables
- `x` - X coordinate (horizontal)
- `y` - Y coordinate (depth)
- Result is `z` - Height value

## 💡 Example Equations

### Simple Surfaces
```
x^2 + y^2              (Paraboloid)
x^2 - y^2              (Saddle/Hyperbolic Paraboloid)
x*y                    (Twisted plane)
√(x^2 + y^2)           (Cone)
```

### Trigonometric
```
sin(x)                 (Sine wave)
sin(x) * cos(y)        (Wave grid)
sin(√(x^2 + y^2))      (Ripple from center)
cos(x) + sin(y)        (Combined waves)
```

### Complex Surfaces
```
exp(-(x^2 + y^2))                        (Gaussian bell curve)
sin(x^2 + y^2) / (x^2 + y^2)             (Sinc function)
cos(√(x^2 + y^2)) / (1 + 0.1*(x^2+y^2))  (Mexican hat)
√(25 - x^2 - y^2)                        (Hemisphere)
```

### Creative Surfaces
```
sin(x) + cos(y)                    (Egg carton)
abs(sin(x)) * abs(cos(y))          (Pyramid grid)
x^2 * y^2 / (x^2 + y^2)            (Star shape)
sin(5*x) * cos(5*y) / 5            (High frequency grid)
```

## 🎮 Controls

### Mouse
- **Drag**: Rotate camera around origin
- **Shift + Drag**: Pan camera (move view)
- **Scroll**: Zoom in/out

### Keyboard
- **Enter**: Plot/update current equation
- **Tab**: Accept autocomplete suggestion
- **↑/↓**: Navigate autocomplete suggestions
- **Esc**: Close autocomplete

## 🐛 Troubleshooting

### "Invalid expression" Error
**Problem**: Red border and error message below equation input

**Solutions**:
1. Check for unmatched parentheses: `sin(x` ❌ → `sin(x)` ✓
2. Use proper function names: `sine(x)` ❌ → `sin(x)` ✓
3. Include multiplication: `2x` ✓ or `2*x` ✓
4. Avoid division by zero: Use domain limits to exclude problem areas

### Surface Not Rendering
**Problem**: Equation accepted but no surface appears

**Solutions**:
1. Check if surface is visible (color indicator not faded)
2. Verify domain range includes valid points
3. Expression might be undefined in current domain
4. Try resetting camera view (Settings → Reset View)

### Analysis Features Not Working
**Problem**: Critical points, normals not showing

**Solutions**:
1. Make sure an equation is selected (click on equation card)
2. Ensure surface is already plotted
3. Uncheck and recheck the option
4. Some features need higher resolution for better results

### Export Issues
**Problem**: Export buttons don't work

**Solutions**:
1. Make sure at least one surface is plotted
2. Check browser allows downloads
3. For STL/CSV: Surface must be successfully rendered
4. Screenshot requires WebGL support

### Performance Issues
**Problem**: Slow rendering, lag

**Solutions**:
1. Lower resolution (Settings → Resolution slider)
2. Reduce number of surfaces
3. Disable normal vectors display (many arrows = slow)
4. Turn off auto-rotate during editing
5. Use simpler equations

## 🎯 Tips & Tricks

1. **Start Simple**: Begin with basic equations like `x^2 + y^2` before complex ones
2. **Use Presets**: Click presets to see well-crafted examples
3. **Adjust Domain**: Change X/Y ranges to focus on interesting regions
4. **Compare Surfaces**: Plot multiple equations to compare shapes
5. **Export Often**: Save your work as JSON to reload later
6. **Resolution Balance**: Higher resolution = more detail but slower
7. **Color Mapping**: Try "Height Gradient" for better depth perception
8. **Camera Presets**: Use Top view to see contours clearly
9. **Analysis First**: Use "Analyze Active Surface" before exploring critical points
10. **Keyboard Shortcuts**: Use function keyboard for faster equation entry

## 🔧 Technical Details

### Built With
- **Three.js** (r128) - 3D rendering engine
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with animations
- **HTML5 Canvas** - WebGL rendering target

### Browser Requirements
- Modern browser with WebGL support
- Recommended: Chrome, Firefox, Edge, Safari (latest)
- Minimum 2GB RAM for complex surfaces
- Decent GPU for smooth rendering

### Performance Notes
- Resolution of 50 = 2,601 vertices per surface
- Resolution of 100 = 10,201 vertices per surface
- Multiple surfaces multiply vertex count
- Normal vectors add ~100-200 arrows (performance impact)

## 📄 File Formats

### Screenshot (PNG)
- Current viewport as high-resolution image
- Preserves canvas quality
- Transparent background not supported

### 3D Model (STL)
- ASCII STL format
- Compatible with 3D printers, Blender, etc.
- Includes all visible surfaces
- Unit scale: 1 unit = 1 in domain space

### Data (CSV)
- Comma-separated values
- Columns: Equation, X, Y, Z
- All vertices from all surfaces
- Import to Excel, MATLAB, Python, etc.

### Equations (JSON)
- Save complete state
- Includes all equations, colors, settings
- Load in text editor to modify
- Future: Import back into app (planned)

## 🆘 Common Questions

**Q: Can I save my work?**  
A: Yes! Use Export → Equations (JSON) to save all equations and settings.

**Q: How do I share a surface?**  
A: Export as Screenshot or STL, then share the file.

**Q: What's the maximum number of equations?**  
A: No hard limit, but 5-10 is recommended for performance.

**Q: Can I animate parameter values?**  
A: Not yet, but you can use the Animation panel for rotation and effects.

**Q: Why is my surface jagged?**  
A: Increase resolution in Settings, or enable Smooth Shading in Visualization.

**Q: Can I use this offline?**  
A: Yes! Download all files and open index.html locally.

**Q: Is there a mobile version?**  
A: The interface is responsive, but touch controls are limited. Best on desktop.

**Q: How accurate are the analysis results?**  
A: Approximate! Surface area uses triangulation, volume uses Riemann sums.

## 📊 Keyboard Reference

| Key | Action |
|-----|--------|
| Enter | Plot equation |
| Tab | Accept autocomplete |
| ↑/↓ | Navigate suggestions |
| Esc | Close autocomplete |
| Shift + Drag | Pan camera |

## 🎨 Color Palette

Default equation colors cycle through:
1. Indigo (#6366f1)
2. Pink (#ec4899)
3. Purple (#8b5cf6)
4. Green (#10b981)
5. Orange (#f59e0b)
6. Cyan (#06b6d4)
7. Red (#ef4444)
8. Lime (#84cc16)
9. Deep Orange (#f97316)
10. Violet (#a855f7)

## 📞 Support

For issues or questions:
1. Check this README first
2. Try the Troubleshooting section
3. Review example equations
4. Check browser console for errors (F12)

---

**Version**: 2.0  
**Last Updated**: 2024  
**License**: MIT (modify and share freely)

Enjoy exploring mathematical surfaces! 🚀📐
