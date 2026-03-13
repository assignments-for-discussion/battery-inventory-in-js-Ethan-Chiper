# Battery Health Classification

Classifies batteries as **healthy**, **exchange**, or **failed** based on State-of-Health (SoH).

---

## 📁 Folder Structure

```
backend/
├── src/
│   └── battery.js          ← Core logic (computeSoH, classifyBattery, countBatteriesByHealth)
├── tests/
│   └── battery.test.js     ← 49 tests — all passing ✅
├── routes/
│   └── batteryRoutes.js    ← Express REST endpoints
├── utils/
│   └── validators.js       ← Input validation
├── server.js               ← Express app entry point
├── package.json
├── .env.example
└── .gitignore
```

---

## 🚀 Quick Start

```bash
cd backend
npm install
cp .env.example .env
npm run dev       # API on http://localhost:5000
npm test          # Run 49 tests
```

---

## 🔋 Classification Rules

| SoH Range         | Classification |
|-------------------|----------------|
| > 83% up to 100%  | `healthy`      |
| > 63% up to 83%   | `exchange`     |
| ≤ 63%             | `failed`       |

**Default rated capacity:** 120 Ah  
**SoH formula:** `SoH% = 100 × present_capacity / rated_capacity`

---

## 📡 API Endpoints

### GET `/api/battery/info`
Returns thresholds and rated capacity.

### POST `/api/battery/classify`
Full per-battery report + summary.
```json
{
  "presentCapacities": [105, 80, 50],
  "ratedCapacity": 120
}
```
Response:
```json
{
  "success": true,
  "data": {
    "summary": { "healthy": 1, "exchange": 1, "failed": 1 },
    "details": [
      { "id": 1, "presentCapacity": 105, "sohPercent": 87.5, "classification": "healthy" },
      { "id": 2, "presentCapacity": 80,  "sohPercent": 66.67, "classification": "exchange" },
      { "id": 3, "presentCapacity": 50,  "sohPercent": 41.67, "classification": "failed" }
    ]
  }
}
```

### POST `/api/battery/count`
Summary counts only.
```json
{ "presentCapacities": [113, 116, 80, 95, 92, 70] }
```
Response:
```json
{ "success": true, "data": { "healthy": 2, "exchange": 3, "failed": 1 } }
```

### POST `/api/battery/single`
Classify one battery.
```json
{ "presentCapacity": 105 }
```
Response:
```json
{
  "success": true,
  "data": { "presentCapacity": 105, "ratedCapacity": 120, "sohPercent": 87.5, "classification": "healthy" }
}
```

---

## ✅ Test Coverage (49 tests)

| Section | Tests |
|---------|-------|
| `computeSoH()` | 7 |
| `classifyBattery()` — normal ranges | 9 |
| `classifyBattery()` — boundary conditions | 6 |
| `countBatteriesByHealth()` — counts | 5 |
| `countBatteriesByHealth()` — boundary capacities | 7 |
| `classifyBatteries()` — full report | 8 |
| Edge cases | 7 |

### Key boundary findings
- **83.0%** → `exchange` (not healthy — rule says *more than* 83%)
- **63.0%** → `failed` (not exchange — rule says *below* 63%, so exactly 63 is failed)
- **75.6 Ah** → `63%` in math, but `62.999...%` in JS floats → compare with `toFixed(2)`

---

## Install

```bash
npm i express cors morgan dotenv
npm i -D nodemon
```
