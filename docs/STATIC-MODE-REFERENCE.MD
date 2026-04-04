# JFT Static Mode — Input String Reference

Static mode lets you run the layout pipeline without a full JSON payload.
Instead, you pass a **single comma-separated line** that describes the job.

---

## Syntax Overview

```
[GLOBAL_KEYS,] SIZE=qty[.SS<n>][.LS<n>][.SP<n>][.LP<n>] [, SIZE=qty ...]
```

- **Order does not matter** — global keys and size entries can appear in any position.
- **Case-insensitive** — `TYPE=tshirt` is the same as `TYPE=TSHIRT`.
- **No spaces required** — but trailing/leading spaces around commas are trimmed.
- **Global keys are all optional** — each has a documented default value.
- **Per-size overrides are optional** — omitting one means it inherits the BODY qty.

---

## Global Keys

| Key     | Values                  | Default | Description                                                       |
| ------- | ----------------------- | ------- | ----------------------------------------------------------------- |
| `TYPE=` | `POLO` \| `TSHIRT`      | `POLO`  | Jersey type. Controls whether collar or neck piece is generated.  |
| `RIB=`  | `NO` \| `RIB` \| `CUFF` | `NO`    | Rib type. `CUFF` doubles short-sleeve rib quantity automatically. |
| `SLV=`  | `S` \| `L` \| `S.L`     | `S.L`   | Active sleeve types. Dot-separated when both are needed.          |
| `PANT=` | `S` \| `L` \| `S.L`     | `S.L`   | Active pant types. Dot-separated when both are needed.            |

---

## Size Entry Format

```
SIZE=qty[.SS<n>][.LS<n>][.SP<n>][.LP<n>]
```

| Part       | Meaning                                           | Default when omitted |
| ---------- | ------------------------------------------------- | -------------------- |
| `SIZE=qty` | **Required.** Apparel size key and body quantity. | —                    |
| `.SS<n>`   | Short sleeve quantity for this size.              | Same as `qty`        |
| `.LS<n>`   | Long sleeve quantity for this size.               | Same as `qty`        |
| `.SP<n>`   | Short pant quantity for this size.                | Same as `qty`        |
| `.LP<n>`   | Long pant quantity for this size.                 | Same as `qty`        |

### Valid size keys

Adult: `XS` `S` `M` `L` `XL` `2XL` `3XL` `4XL` `5XL`

Kids: `2` `4` `6` `8` `10` `12` `14` `16`

---

## Examples

### 1 — Simplest possible: only sizes, no config

```
XS=3,M=5,L=10
```

**What it does:**

- Jersey type: `POLO` (default)
- Rib: `NO` (default)
- Sleeves: both SHORT and LONG (default)
- Pants: both SHORT and LONG (default)
- All sleeve/pant quantities inherit from the body qty per size

**Produced SUMMARY per size:**

| Size | BODY | SHORT_SLEEVE | LONG_SLEEVE | SHORT_PANT | LONG_PANT |
| ---- | ---- | ------------ | ----------- | ---------- | --------- |
| XS   | 3    | 3            | 3           | 3          | 3         |
| M    | 5    | 5            | 5           | 5          | 5         |
| L    | 10   | 10           | 10          | 10         | 10        |

---

### 2 — T-Shirt with short sleeve only

```
TYPE=TSHIRT,SLV=S,XS=3,M=5,L=10
```

**What it does:**

- Generates a NECK piece instead of COLLAR/PLACKET
- Only short sleeve (`SLV=S`) is active — long sleeve layouts are skipped
- All sleeve/pant quantities still inherit body qty

---

### 3 — POLO with CUFF ribs

```
TYPE=POLO,RIB=CUFF,M=10,L=8,XL=6
```

**What it does:**

- POLO → generates PLACKET + COLLAR pieces
- `RIB=CUFF` → short sleeve rib quantity is automatically **doubled** internally
- Sleeve type defaults to both SHORT and LONG

---

### 4 — Long sleeve only

```
TYPE=TSHIRT,SLV=L,XS=5,S=5,M=10,L=10,XL=8
```

**What it does:**

- Only LONG sleeve layouts are generated — no short sleeve EPS files created
- `PANT=S.L` is still default so both pant types remain active

---

### 5 — Kids sizes only

```
TYPE=TSHIRT,SLV=S,2=10,4=10,6=8,8=8,10=6,12=6
```

**What it does:**

- Uses kids size chart (`2` through `16`)
- Short sleeve only
- All per-type quantities inherit body qty

---

### 6 — Per-size sleeve overrides

```
TYPE=TSHIRT,SLV=S.L,XS=3,M=10.SS5.LS5,L=8.SS4.LS4
```

**What it does:**

- XS: all quantities are 3 (inherits from body qty)
- M: BODY=10, but SHORT_SLEEVE=5, LONG_SLEEVE=5
- L: BODY=8, but SHORT_SLEEVE=4, LONG_SLEEVE=4

**Produced SUMMARY:**

| Size | BODY | SHORT_SLEEVE | LONG_SLEEVE | SHORT_PANT | LONG_PANT |
| ---- | ---- | ------------ | ----------- | ---------- | --------- |
| XS   | 3    | 3            | 3           | 3          | 3         |
| M    | 10   | 5            | 5           | 10         | 10        |
| L    | 8    | 4            | 4           | 8          | 8         |

---

### 7 — Per-size pant overrides only

```
TYPE=POLO,PANT=S,XS=5,M=10.SP4,L=8.SP3,XL=6.SP2
```

**What it does:**

- `PANT=S` → only SHORT pant layouts are generated
- Each size has a custom short pant qty via `.SP<n>`
- Sleeve quantities still inherit from body qty

---

### 8 — Mixed overrides (sleeve + pant per size)

```
TYPE=TSHIRT,SLV=S.L,PANT=S.L,XS=4,M=10.SS5.LS5.SP3.LP3,L=8.SS4.LS4.SP2.LP2
```

**What it does:**

- XS: all quantities are 4
- M: BODY=10, short/long sleeve=5, short/long pant=3
- L: BODY=8, short/long sleeve=4, short/long pant=2

---

### 9 — RIB with one sleeve side

```
TYPE=TSHIRT,RIB=RIB,SLV=S,XS=3,M=5,L=10
```

**What it does:**

- `RIB=RIB` → rib pieces are generated (no CUFF doubling)
- `SLV=S` → only SHORT sleeve rib layout is produced
- T-shirt neck piece is generated

---

### 10 — Full example: everything included

```
TYPE=TSHIRT,RIB=CUFF,SLV=S.L,PANT=S.L,XS=3,S=5.SS3.LS2,M=10.SS5.LS5.SP4.LP4,L=8.SS4.LS4.SP3.LP3,XL=6.SS3.LS3,2XL=4,3XL=2
```

**What it does:**

- `TYPE=TSHIRT` → NECK piece (no PLACKET/COLLAR)
- `RIB=CUFF` → both sleeve rib pieces, short rib qty doubled automatically
- `SLV=S.L` → both short and long sleeve layouts
- `PANT=S.L` → both short and long pant layouts
- `XS=3` → all types qty=3
- `S=5.SS3.LS2` → BODY=5, SHORT_SLEEVE=3, LONG_SLEEVE=2, pants inherit 5
- `M=10.SS5.LS5.SP4.LP4` → all overridden individually
- `L=8.SS4.LS4.SP3.LP3` → all overridden individually
- `XL=6.SS3.LS3` → sleeve overridden, pants inherit 6
- `2XL=4` → all types qty=4
- `3XL=2` → all types qty=2

**Produced SUMMARY:**

| Size | BODY | SHORT_SLEEVE | LONG_SLEEVE | SHORT_PANT | LONG_PANT |
| ---- | ---- | ------------ | ----------- | ---------- | --------- |
| XS   | 3    | 3            | 3           | 3          | 3         |
| S    | 5    | 3            | 2           | 5          | 5         |
| M    | 10   | 5            | 5           | 4          | 4         |
| L    | 8    | 4            | 4           | 3          | 3         |
| XL   | 6    | 3            | 3           | 6          | 6         |
| 2XL  | 4    | 4            | 4           | 4          | 4         |
| 3XL  | 2    | 2            | 2           | 2          | 2         |

---

## Quick Reference Card

```
──────────────────────────────────────────────────────────────────
STATIC MODE INPUT — QUICK REFERENCE
──────────────────────────────────────────────────────────────────

GLOBAL KEYS (optional, any position)
  TYPE=POLO | TSHIRT          jersey type          default: POLO
  RIB=NO | RIB | CUFF         rib type             default: NO
  SLV=S | L | S.L             active sleeves        default: S.L
  PANT=S | L | S.L            active pants          default: S.L

SIZE ENTRY
  SIZE=qty                     body qty (required)
  .SS<n>                       short sleeve qty     default: qty
  .LS<n>                       long sleeve qty      default: qty
  .SP<n>                       short pant qty       default: qty
  .LP<n>                       long pant qty        default: qty

ADULT SIZES   XS S M L XL 2XL 3XL 4XL 5XL
KIDS SIZES    2 4 6 8 10 12 14 16

RULES
  - Comma separated, single line
  - Case insensitive
  - Order does not matter
  - All global keys are optional
  - Per-size overrides are optional — omit to inherit body qty
──────────────────────────────────────────────────────────────────
```
