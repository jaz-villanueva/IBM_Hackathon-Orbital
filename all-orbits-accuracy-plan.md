# All-Planet Orbit Accuracy Plan

## Top-Level Overview

Apply the same proportional orbit-radius scaling done for Earth's ISS/Terra/Aqua/Landsat-9 to
all remaining mission spacecraft across Moon, Mars, Jupiter, Saturn, Uranus, and Neptune.

**Formula used:**
```
vr_new = planet.visualRadius × (smaKm / planet.radiusKm)
         floored at planet.visualRadius × 1.15  (prevents clipping into parent mesh)
```

For highly elliptical or flyby missions where the raw formula yields implausibly large values,
a visually representative value is chosen that preserves relative ordering between spacecraft
at the same planet (closer real orbit → smaller scene radius).

---

## Planet Reference Values (from lib/solar-system.ts)

| Planet  | `radiusKm` | `visualRadius` | Scale factor (vR/rKm) | Floor (1.15×vR) |
|---------|-----------|----------------|----------------------|-----------------|
| Moon    | 1,737     | 0.19           | 1.094e-4             | 0.219           |
| Mars    | 3,390     | 0.42           | 1.239e-4             | 0.483           |
| Jupiter | 69,911    | 0.70           | 1.001e-5             | 0.805           |
| Saturn  | 58,232    | 0.58           | 9.961e-6             | 0.667           |
| Uranus  | 25,362    | 0.38           | 1.499e-5             | 0.437           |
| Neptune | 24,622    | 0.36           | 1.462e-5             | 0.414           |

---

## Computed New Values

### Moon orbiters
| Mission    | `smaKm` | Formula result | Floor applied? | **New `vr`** | Old `vr` | Notes |
|------------|---------|---------------|---------------|-------------|---------|-------|
| lro        | 1,837   | 0.201         | → 0.22        | **0.22**    | 0.52    | ~100 km polar orbit |
| kplo       | 1,837   | 0.201         | → 0.22        | **0.22**    | 0.52    | same altitude |
| artemis-2  | 6,000   | 0.656         | no            | **0.65**    | 0.65    | unchanged — wide lunar flyby |

### Mars orbiters
| Mission      | `smaKm` | Formula result | Floor applied? | **New `vr`** | Old `vr` | Notes |
|--------------|---------|---------------|---------------|-------------|---------|-------|
| mro          | 3,696   | 0.458         | → 0.50        | **0.50**    | 0.92    | ~300 km near-polar |
| tgo          | 3,796   | 0.470         | → 0.50        | **0.50**    | 0.98    | ~400 km near-circular |
| maven         | 6,500   | 0.805         | no            | **0.80**    | 1.12    | highly elliptical, sma representative |
| mars-express | 9,630   | 1.193         | no            | **1.19**    | 1.18    | highly elliptical, wide — virtually unchanged |

### Jupiter orbiters
| Mission       | Basis                         | **New `vr`** | Old `vr` | Notes |
|---------------|-------------------------------|-------------|---------|-------|
| juno          | Perijove ~74,100 km → 0.742   | **0.82**    | 1.80    | Represents tight polar swoop near cloudtops |
| europa-clipper | Europa orbit ~671,000 km → cap | **1.10**  | 2.20    | Represents Jupiter capture / Europa-vicinity |
| juice         | Ganymede orbit ~1,070,000 km → cap | **1.30** | 2.60 | Clearly outermost; Ganymede is furthest Galilean moon studied |

### Saturn orbiters
| Mission   | Basis                              | **New `vr`** | Old `vr` | Notes |
|-----------|------------------------------------|-------------|---------|-------|
| cassini   | Final orbit ~62,000 km → 0.617 → floor | **0.68** | 1.60 | Grand Finale close orbit |
| dragonfly | Targets Titan; Titan orbit 1.22M km → capped | **1.00** | 1.30 | Titan proximity representative |

### Uranus / Neptune (flyby missions)
| Mission              | Basis                          | **New `vr`** | Old `vr` | Notes |
|----------------------|-------------------------------|-------------|---------|-------|
| voyager-2-uranus     | Closest approach ~81,500 km → 1.22, floor 0.437 → capped | **0.55** | 1.20 | Visible outside Uranus mesh |
| voyager-2-neptune    | Closest approach ~29,200 km → 0.427, floor 0.48 | **0.48** | 1.10 | Tight Neptune flyby |

---

## Sub-Tasks

### Sub-Task 1 — Update Moon orbiter values in `VISUAL_ORBIT_RADIUS` and `MOON_OBJECTS`

**Intent**
LRO and KPLO both orbit at ~100 km altitude. Their visual radii should drop from `0.52`
to `0.22` (1.16× Moon visualRadius). Artemis-2 is unchanged.

**Expected Outcomes**
- LRO and KPLO orbit rings hug the Moon closely.
- Artemis-2 wide looping flyby orbit unchanged at `0.65`.

**Todo List**
1. `components/SpaceScene.tsx` — `VISUAL_ORBIT_RADIUS`: `lro: 0.52` → `0.22`, `kplo: 0.52` → `0.22`
2. `lib/spacecraft-positions.ts` — `MOON_OBJECTS`: LRO `orbitRadius: 0.52` → `0.22`, KPLO `orbitRadius: 0.52` → `0.22`

**Relevant Context**
- Moon `visualRadius = 0.19`, `radiusKm = 1737` (lib/solar-system.ts line 414)
- `VISUAL_ORBIT_RADIUS` at SpaceScene.tsx line 186
- `MOON_OBJECTS` at spacecraft-positions.ts line 160

**Status**: [ ] pending

---

### Sub-Task 2 — Update Mars orbiter values in `VISUAL_ORBIT_RADIUS` and `MARS_OBJECTS`

**Intent**
MRO and TGO are near-circular low-Mars orbiters — they should hug Mars like ISS hugs Earth.
MAVEN is elliptical; its semi-major axis positions it mid-range. Mars Express is highly
elliptical and barely changes.

**Expected Outcomes**
- MRO and TGO orbit rings are tight to Mars (similar to how ISS sits tight to Earth).
- MAVEN orbit ring is noticeably wider than MRO/TGO.
- Mars Express is the widest Mars orbit — unchanged visually.

**Todo List**
1. `components/SpaceScene.tsx` — `VISUAL_ORBIT_RADIUS`:
   - `mro: 0.92` → `0.50`
   - `maven: 1.12` → `0.80`
   - `'mars-express': 1.18` → `1.19`
   - `tgo: 0.98` → `0.50`
2. `lib/spacecraft-positions.ts` — `MARS_OBJECTS`:
   - MRO `orbitRadius: 0.92` → `0.50`
   - MAVEN `orbitRadius: 1.05` → `0.80`
   - Mars Express `orbitRadius: 1.15` → `1.19`
   - TGO `orbitRadius: 0.98` → `0.50`

**Relevant Context**
- Mars `visualRadius = 0.42`, `radiusKm = 3390` (solar-system.ts line 344)
- `VISUAL_ORBIT_RADIUS` entries at SpaceScene.tsx line 194
- `MARS_OBJECTS` at spacecraft-positions.ts line 213

**Status**: [ ] pending

---

### Sub-Task 3 — Update Jupiter orbiter values in `VISUAL_ORBIT_RADIUS` and `JUPITER_OBJECTS`

**Intent**
Juno executes very tight polar loops down to ~4200 km above cloudtops (74,100 km from centre).
Europa Clipper and JUICE will operate in Jupiter-vicinity / moon-encounter orbits. The
scale-down brings all three much closer to Jupiter.

**Expected Outcomes**
- Juno orbit ring is tight to Jupiter (0.82 vs visualRadius 0.70 — only 17% outside).
- Europa Clipper at 1.10 and JUICE at 1.30 — clearly outside Juno, ordered correctly.

**Todo List**
1. `components/SpaceScene.tsx` — `VISUAL_ORBIT_RADIUS` (add these entries, they don't exist yet):
   - `juno: 0.82`
   - `'europa-clipper': 1.10`
   - `juice: 1.30`
2. `lib/spacecraft-positions.ts` — `JUPITER_OBJECTS`:
   - Juno `orbitRadius: 1.80` → `0.82`
   - Europa Clipper `orbitRadius: 2.20` → `1.10`
   - JUICE `orbitRadius: 2.60` → `1.30`

**Relevant Context**
- Jupiter `visualRadius = 0.70`, `radiusKm = 69911` (solar-system.ts line 358)
- Jupiter spacecraft do NOT currently have entries in `VISUAL_ORBIT_RADIUS` — they fall back
  to `scObj.orbitRadius`. Adding them to the map makes behaviour explicit and consistent.

**Status**: [ ] pending

---

### Sub-Task 4 — Update Saturn orbiter values in `VISUAL_ORBIT_RADIUS` and `SATURN_OBJECTS`

**Intent**
Cassini's Grand Finale orbit was ~2500 km above cloudtops (~62,000 km from Saturn centre).
Dragonfly targets Titan, so represents a wider Saturn-system orbit.

**Expected Outcomes**
- Cassini orbit ring is tight to Saturn (0.68 vs visualRadius 0.58).
- Dragonfly at 1.00 — clearly outside Saturn and its visible rings.

**Todo List**
1. `components/SpaceScene.tsx` — `VISUAL_ORBIT_RADIUS` (add entries):
   - `cassini: 0.68`
   - `dragonfly: 1.00`
2. `lib/spacecraft-positions.ts` — `SATURN_OBJECTS`:
   - Cassini `orbitRadius: 1.60` → `0.68`
   - Dragonfly `orbitRadius: 1.30` → `1.00`

**Relevant Context**
- Saturn `visualRadius = 0.58`, `radiusKm = 58232` (solar-system.ts line 372)

**Status**: [ ] pending

---

### Sub-Task 5 — Update Uranus and Neptune flyby values in `VISUAL_ORBIT_RADIUS` and scene objects

**Intent**
Voyager 2 flybys were very close. Uranus flyby at ~81,500 km, Neptune flyby at ~29,200 km.
Scale these down from 1.20/1.10 to values that better reflect how close the spacecraft
swept past each planet.

**Expected Outcomes**
- Voyager 2 (Uranus) orbit ring closer to Uranus surface — `0.55` (1.45× vR).
- Voyager 2 (Neptune) orbit ring very tight to Neptune — `0.48` (1.33× vR).

**Todo List**
1. `components/SpaceScene.tsx` — `VISUAL_ORBIT_RADIUS` (add entries):
   - `'voyager-2-uranus': 0.55`
   - `'voyager-2-neptune': 0.48`
2. `lib/spacecraft-positions.ts` — `URANUS_OBJECTS` and `NEPTUNE_OBJECTS`:
   - Voyager 2 Uranus `orbitRadius: 1.20` → `0.55`
   - Voyager 2 Neptune `orbitRadius: 1.10` → `0.48`

**Relevant Context**
- Uranus `visualRadius = 0.38`, Neptune `visualRadius = 0.36`
- `URANUS_OBJECTS` at spacecraft-positions.ts line 413
- `NEPTUNE_OBJECTS` at spacecraft-positions.ts line 434

**Status**: [ ] pending
