# ISS Orbit Distance Accuracy Plan

## Top-Level Overview

The ISS currently renders at `1.45` scene units from Earth's centre, while Earth's `visualRadius` is `0.55` scene units.
That places the ISS at **2.6× Earth's visual radius** in the scene.

The **real** ISS altitude is ~408 km above Earth's surface (semi-major axis ≈ 6,778 km).
Earth's real radius is 6,371 km, so the ISS is only **1.064× Earth's radius** away from Earth's centre.

The current scene ratio (2.6×) is therefore **~2.4× too far out** compared to reality.
The fundamental challenge is that all bodies in the scene use heavily exaggerated visual radii,
so a purely physical km-to-scene conversion (`6778 km × 2.8e-6 = 0.019 scene units`) would bury
the ISS inside Earth's mesh.

The goal is to reduce the perceived gap between Earth and ISS as much as possible while
keeping the ISS clearly visible outside Earth's surface.

**Confirmed values (user-approved):**
- ISS (408 km / 6778 km smaKm) → `0.72` scene units
- Terra / Aqua / Landsat-9 (705 km / 7076 km smaKm) → `0.78` scene units (split between
  proportional value 0.75 and 0.80 estimate)

---

## Sub-Tasks

### Sub-Task 1 — Update all Earth-orbiter visual radii in `VISUAL_ORBIT_RADIUS`

**Intent**
Reduce visual orbit radii for all four Earth orbiters (ISS, Terra, Aqua, Landsat-9) in the
`VISUAL_ORBIT_RADIUS` lookup table in `SpaceScene.tsx`.

**Expected Outcomes**
- The ISS orbit ring renders noticeably tighter to Earth (1.31× Earth visual radius).
- Terra/Aqua/Landsat-9 orbit rings render at a proportionally larger but still reduced
  distance (1.42× Earth visual radius), correctly showing them above LEO.
- No non-Earth orbits change.

**Todo List**
1. In [`components/SpaceScene.tsx`](components/SpaceScene.tsx) at line 183–195, change the four
   Earth-orbiter entries:
   ```
   iss:         1.45,
   terra:       1.72,
   aqua:        1.72,
   'landsat-9': 1.74,
   ```
   to:
   ```
   iss:         0.72,
   terra:       0.78,
   aqua:        0.78,
   'landsat-9': 0.78,
   ```

**Relevant Context**
- [`VISUAL_ORBIT_RADIUS`](components/SpaceScene.tsx:183) — the record used at runtime to scale
  the `keplerPosition` unit vector by a visual orbit radius.
- Earth `visualRadius` = `0.55` in [`lib/solar-system.ts`](lib/solar-system.ts:331).

**Status**: [ ] pending

---

### Sub-Task 2 — Update all Earth-orbiter `orbitRadius` values in `EARTH_OBJECTS`

**Intent**
Keep the `orbitRadius` fields in [`lib/spacecraft-positions.ts`](lib/spacecraft-positions.ts)
in sync with the new scene-unit values. These fields are the fallback source and also drive
the orbit ring at initial load.

**Expected Outcomes**
- ISS `orbitRadius` = `0.72`
- Terra `orbitRadius` = `0.78`
- Aqua `orbitRadius` = `0.78`
- Landsat-9 `orbitRadius` = `0.78`

**Todo List**
1. In [`lib/spacecraft-positions.ts`](lib/spacecraft-positions.ts:101), for each of the four
   Earth orbiters, update `orbitRadius` to its new value:
   - ISS: `1.45` → `0.72`
   - Terra: `1.72` → `0.78`
   - Aqua: `1.72` → `0.78`
   - Landsat-9: `1.72` → `0.78`

**Relevant Context**
- [`EARTH_OBJECTS`](lib/spacecraft-positions.ts:91) — source-of-truth SceneObject array for
  Earth missions.
- `orbitRadius` is the fallback in [`SpaceScene.tsx`](components/SpaceScene.tsx:956):
  `const vr = VISUAL_ORBIT_RADIUS[missionId] || scObj.orbitRadius || 1.5;`

**Status**: [ ] pending

---

### Sub-Task 3 — (Optional) Adjust `PLANET_CAM_RADIUS` for ISS camera zoom

**Intent**
When the user selects the ISS or zooms to Earth, the camera pull-back is controlled by
`PLANET_CAM_RADIUS['earth'] = 5`. With the ISS now at `0.72`, the camera still frames well,
but if a tight "ISS view" is desired (future), the value can be noted.
This task is marked as **informational / no-op** unless a per-mission camera offset is desired.

**Expected Outcomes**
- No code change in this sub-task unless explicitly requested.
- Confirm that `earth` camera radius of `5` still gives good framing with ISS at `0.72`.

**Todo List**
1. Verify visually in the running app that Earth + ISS orbit are both in frame at `earth` zoom.
2. Optionally reduce `PLANET_CAM_RADIUS['earth']` from `5` to `3.5` for a tighter framing — only
   if the reviewer decides this is desirable.

**Relevant Context**
- [`PLANET_CAM_RADIUS`](components/SpaceScene.tsx:153) at line 153.

**Status**: [ ] pending (informational)

---

## Notes on Future Accuracy Improvements

For higher fidelity, the `VISUAL_ORBIT_RADIUS` values could be computed programmatically
from the planet's `visualRadius` and the orbit's `smaKm` with a minimum clearance floor:

```
vr = Math.max(planet.visualRadius * 1.15, planet.visualRadius * (smaKm / planet.radiusKm))
```

This would automatically scale all Earth orbiters correctly relative to Earth's rendered size.
That refactor is beyond the minimal scope of this plan.
