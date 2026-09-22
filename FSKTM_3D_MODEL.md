# UTHM FSKTM 3D Architectural Model

This document describes the 3D architectural model of the **FSKTM (Fakulti Sains Komputer dan Teknologi Maklumat)** complex at **Universiti Tun Hussein Onn Malaysia (UTHM)**.

---

## 📁 3D Model Assets

| Format | File Path | Size | Description |
| :--- | :--- | :--- | :--- |
| **Blender** | [`models/fsktm.blend`](file:///c:/Users/haziq/locfsktm/models/fsktm.blend) | ~486 KB | Full editable Blender 5.2 scene with procedural/PBR materials |
| **Blender (Root)** | [`fsktm.blend`](file:///c:/Users/haziq/locfsktm/fsktm.blend) | ~486 KB | Root directory shortcut |
| **GLTF / GLB** | [`public/models/fsktm.glb`](file:///c:/Users/haziq/locfsktm/public/models/fsktm.glb) | ~2.5 MB | Web-optimized binary GLTF with embedded geometry & materials |
| **GLTF / GLB (Root)** | [`fsktm.glb`](file:///c:/Users/haziq/locfsktm/fsktm.glb) | ~2.5 MB | Root directory shortcut |

---

## 🏛️ Architectural Specifications

The model was reconstructed using official architectural references:
- **Exterior Photographs**: `public/reffsktm/` (`FSKTM.jpg`, `473149146_1104807498103930_2713907210675558057_n.jpg`, and `28b98649-919d-4e7b-83ef-a2c82d774008.jpg`)
- **2D Floor Plans & Kiosk Directory**: `directory/IMG_1815.JPG` through `IMG_1822.JPG`

### 1. Mid Administrative Tower (8 Storeys)
- **Dimensions**: 18m × 14m footprint, rising to 28.5m height.
- **Curved Facade**: Front-right corner sculpted with a smooth cylindrical curved transition (matching `FSKTM.jpg`).
- **Aerofoil Cantilever Roof**: Backward-sloping aerofoil roof slab extending forward with a rounded nose overhang.
- **Top Parapet & Signage**:
  - Red **UTHM crest emblem** badge on the upper-left facade.
  - Bold 3D blue **`FSKTM`** lettering with **`UTHM`** header centered under the cantilever roof.
- **Recessed Facade Window Channel**:
  - Front-left vertical recessed grey channel with 2 columns of windows across 6 floors.
  - Dark metal sunshade awnings above every front and side window.
- **Projecting Curved Entrance Lobby**:
  - Semi-cylindrical glass entrance lobby extending forward into the courtyard plaza.
  - Curved cantilever canopy supported by cylindrical pillars.

### 2. Left Building (SMIC @ FSKTM & Corridors — 3 Storeys)
- **Orientation & Angle**: 30° forward-left angle matching the 2D Ground Floor plan (`directory/IMG_1815.JPG`).
- **SMIC @ FSKTM Entrance Portal**:
  - Positioned immediately adjacent to the tower at the 30° angle.
  - White portal frame housing **14 horizontal aluminium sun louvres**.
  - Bold 3D colored text: **`SMIC`** (blue) **`@`** (red) **`FSKTM`** (blue) placed above the louvres.
  - Cantilevered white canopy with exposed underside rafter beams.
- **Multi-Bay Covered Veranda Corridors (Floors 2 & 3)**:
  - Open covered veranda walkways with solid white balustrade railings.
  - 5 large rectangular structural columns dividing the facade into 4 grand bays.
  - Recessed interior wall with classroom and lab windows.
- **Ground Floor Terracotta Base**: Warm terracotta accent wall running along the ground floor.
- **Sloping Overhang Roof & Eaves**: Wide overhanging roof with exposed rafter brackets.
- **Far Left End Cap**: Solid architectural end-wall block with vertical slit styling.

### 3. Right Wing (Academic & Laboratories — 4 Storeys)
- **Dimensions**: 50m × 14m × 16m extending straight east.
- **Facade**: Alternating white pilaster bays with 12 window columns per floor across 4 levels.
- **Accents**: Soft yellow/cream accent panels across the ground floor.
- **Eaves**: Overhanging roof supported by structural rafter brackets.
- **Lab Block**: Connected at the far right via a dedicated corridor bridge.

### 4. Site, Landscaping & Foreground Elements
- **Circular Drop-Off Roundabout**: Centered directly in front of the main entrance with an asphalt ring road, concrete curb, and grass island with a central palm tree.
- **Parking Lot**: Marked parking bays with white painted lines and parked cars (low-poly models in white, silver, black, red, and blue).
- **Foreground Lake & Fountain**: Scenic water body with reflective water material, shoreline retaining wall, and vertical fountain jet with spray cone (matching `28b98649-919d-4e7b-83ef-a2c82d774008.jpg`).
- **Tropical Landscaping**: Rows of palm trees and decorative shrubs along the front walkway and roundabout.

---

## 🌐 Web Integration (Three.js / React Three Fiber)

The exported GLB file (`public/models/fsktm.glb`) is located in the Next.js `public/` directory, making it directly accessible to client components via:

```tsx
import { useGLTF } from '@react-three/drei';

export function FSKTMModel(props) {
  const { scene } = useGLTF('/models/fsktm.glb');
  return <primitive object={scene} {...props} />;
}

useGLTF.preload('/models/fsktm.glb');
```
