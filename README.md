# 📅 Weekly Plan Tracker

> A full-stack weekly planning tool for development teams — built with .NET 8, Azure SQL, and Angular 21.

---

## 🌐 Live Deployment

|                 | URL                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| 🖥️ **Frontend** | [https://agreeable-hill-0f22b4400.4.azurestaticapps.net](https://agreeable-hill-0f22b4400.4.azurestaticapps.net)   |
| 📖 **Swagger**  | [https://weekly-planner-api-v2.azurewebsites.net/swagger](https://weekly-planner-api-v2.azurewebsites.net/swagger) |

---

## 📖 About the App

Weekly Plan Tracker helps development teams plan and track their weekly work with structured hour budgets across business categories.

A **Team Lead** sets up a planning week by choosing a Tuesday date and splitting the team's capacity across three categories: **Client Focused**, **Tech Debt**, and **R&D**. Each team member then picks backlog items and plans their hours within the allocated budget. The lead can view an aggregated dashboard across all members and freeze the week when planning is complete. Once frozen, members can only update progress — no hour changes allowed.

All data is persisted to **Azure SQL** in real time — members, backlog items, week cycles, plans, and progress updates are all stored in the cloud database.

---

## 🛠️ Tech Stack

| Layer                | Technology                                     |
| -------------------- | ---------------------------------------------- |
| **Backend**          | .NET 8, C#, ASP.NET Core Web API               |
| **ORM**              | Entity Framework Core 8                        |
| **Database**         | Azure SQL (SQL Server)                         |
| **Frontend**         | Angular 21, TypeScript                         |
| **State Management** | Angular Signals + localStorage                 |
| **HTTP**             | Angular HttpClient + firstValueFrom (RxJS)     |
| **Backend Tests**    | xUnit, FluentAssertions, Moq, EF Core InMemory |
| **Frontend Tests**   | Vitest v4, Angular Testing Library             |
| **Backend Hosting**  | Azure App Service (Linux, .NET 8)              |
| **Frontend Hosting** | Azure Static Web Apps                          |
| **CI/CD**            | GitHub Actions                                 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Angular 21 SPA                        │
│           (Azure Static Web Apps)                        │
│                                                          │
│  AppStateService — manages full workflow state           │
│  localStorage    — working state between sessions        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS REST (JSON)
                         │ X-Is-Lead header (lead / member)
┌────────────────────────▼────────────────────────────────┐
│               ASP.NET Core Web API (.NET 8)              │
│                  (Azure App Service)                     │
│                                                          │
│  Controllers → Interfaces (Core)                         │
│       ↓                                                  │
│  Infrastructure (EF Core + Azure SQL)                   │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    Azure SQL Database                    │
│   Members | BacklogItems | WeekCycles                   │
│   WeeklyPlans | PlanEntries                             │
└─────────────────────────────────────────────────────────┘

Layers:
  WeeklyPlanner.Core           — Models, Interfaces
  WeeklyPlanner.Infrastructure — EF Core DbContext, Service implementations
  WeeklyPlanner.API            — Controllers, DTOs, Middleware, Program.cs
  WeeklyPlanner.Tests          — Unit + Integration Tests (101 tests, all passing)
```

---

## 🔄 Planning Workflow

```
SETUP → PLANNING → FROZEN → COMPLETED
```

| State         | Who acts    | What happens                                        |
| ------------- | ----------- | --------------------------------------------------- |
| **SETUP**     | Team Lead   | Creates week cycle, selects members, sets % budgets |
| **PLANNING**  | All members | Each member claims backlog items and assigns hours  |
| **FROZEN**    | All members | Plan is locked — members report progress only       |
| **COMPLETED** | Team Lead   | Week is closed, incomplete items return to backlog  |

---

## 💾 Backend Integration

All key actions persist to Azure SQL in real time:

| Frontend Action      | API Call                                  |
| -------------------- | ----------------------------------------- |
| Setup members        | `POST /api/Members` for each member       |
| Add backlog item     | `POST /api/Backlog`                       |
| Edit backlog item    | `PUT /api/Backlog/{id}`                   |
| Archive backlog item | `PUT /api/Backlog/{id}` (isActive: false) |
| Start new week       | `POST /api/WeekCycle`                     |
| Open planning        | `PUT /api/WeekCycle/{id}/percentages`     |
| Freeze plan          | `POST /api/Plan/submit` per member        |
| Update progress      | `PUT /api/Plan/progress/{entryId}`        |

> LocalStorage acts as the working state layer — Azure SQL is the persistence layer. All `dbId` values are stored alongside local UUIDs to enable accurate API calls.

---

## 📁 Project Structure

```
Weekly-Planner/
│
├── WeeklyPlanner.Core/                        # Domain layer
│   ├── Interfaces/
│   │   ├── IBacklogService.cs
│   │   ├── IPlanService.cs
│   │   └── IWeekCycleService.cs
│   └── Models/
│       ├── BacklogItem.cs
│       ├── Member.cs
│       ├── PlanEntry.cs
│       ├── WeekCycle.cs
│       └── WeeklyPlan.cs
│
├── WeeklyPlanner.Infrastructure/              # Data + service implementations
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── AppDbContextFactory.cs
│   ├── Migrations/
│   │   └── 20260302093805_InitialCreate.cs
│   └── Services/
│       ├── BacklogService.cs
│       ├── PlanService.cs
│       └── WeekCycleService.cs
│
├── WeeklyPlanner.API/                         # Presentation layer
│   ├── Controllers/
│   │   ├── BacklogController.cs
│   │   ├── MembersController.cs
│   │   ├── PlanController.cs
│   │   └── WeekCycleController.cs
│   ├── DTOs/
│   │   ├── PercentageDto.cs
│   │   ├── ProgressDto.cs
│   │   └── SubmitPlanDto.cs
│   ├── Helpers/
│   │   └── RequestContext.cs
│   ├── Middleware/
│   │   └── ExceptionMiddleware.cs
│   └── Program.cs
│
├── WeeklyPlanner.Tests/                       # Test suite (101 tests, all passing)
│   ├── BacklogControllerTests.cs
│   ├── BacklogServiceTests.cs
│   ├── CoverageGapTests.cs
│   ├── ExceptionMiddlewareTests.cs
│   ├── MembersControllerTests.cs
│   ├── PlanControllerTests.cs
│   ├── PlanServiceTests.cs
│   ├── RequestContextTests.cs
│   ├── WeekCycleControllerTests.cs
│   └── WeekCycleServiceTests.cs
│
├── weekly-planner-ui/                         # Angular 21 SPA
│   └── src/app/
│       ├── services/
│       │   └── app-state.service.ts           # Full workflow + Azure SQL integration
│       ├── models/index.ts
│       └── environments/
│           ├── environment.ts                 # Dev API URL
│           └── environment.prod.ts            # Prod: Azure API URL
│
├── .github/workflows/
│   ├── ci.yml                                 # Build + test on every PR
│   └── cd.yml                                 # Deploy to Azure on main
│
└── WeeklyPlanner.sln
```

---

## 📡 API Reference

### Members

| Method | Endpoint       | Description     |
| ------ | -------------- | --------------- |
| GET    | `/api/Members` | Get all members |
| POST   | `/api/Members` | Add a member    |

### Backlog Items

| Method | Endpoint            | Description           |
| ------ | ------------------- | --------------------- |
| GET    | `/api/Backlog`      | Get all backlog items |
| GET    | `/api/Backlog/{id}` | Get by ID             |
| POST   | `/api/Backlog`      | Create backlog item   |
| PUT    | `/api/Backlog/{id}` | Update backlog item   |
| DELETE | `/api/Backlog/{id}` | Delete backlog item   |

### Week Cycles

| Method | Endpoint                          | Description                          |
| ------ | --------------------------------- | ------------------------------------ |
| GET    | `/api/WeekCycle`                  | Get all week cycles                  |
| GET    | `/api/WeekCycle/current`          | Get the active week cycle            |
| POST   | `/api/WeekCycle`                  | Create a new week cycle              |
| PUT    | `/api/WeekCycle/{id}/percentages` | **Lead only** — set category % split |

### Plans

| Method | Endpoint                                 | Description                          |
| ------ | ---------------------------------------- | ------------------------------------ |
| GET    | `/api/Plan/{memberId}/{weekCycleId}`     | Get a member's plan for a week       |
| POST   | `/api/Plan/submit`                       | Submit and freeze a member's plan    |
| PUT    | `/api/Plan/progress/{entryId}`           | Update progress on a plan entry      |
| GET    | `/api/Plan/week/{weekCycleId}/all`       | Get all plans for a week             |
| GET    | `/api/Plan/week/{weekCycleId}/dashboard` | **Lead only** — aggregated dashboard |
| DELETE | `/api/Plan/{memberId}/{weekCycleId}`     | Delete a member's plan (dev only)    |
| DELETE | `/api/Plan/admin/reset`                  | Wipe all plans (dev only)            |

> 🔒 **Lead-only endpoints** require the `X-Is-Lead: true` header, sent automatically by the frontend when the current user is a Team Lead.

---

## 🗂️ Domain Models

### BacklogItem

| Field            | Type    | Description                                |
| ---------------- | ------- | ------------------------------------------ |
| `Id`             | int     | Primary key                                |
| `Title`          | string  | Task title                                 |
| `Description`    | string  | Task description                           |
| `Category`       | int     | 1 = Client Focused, 2 = Tech Debt, 3 = R&D |
| `IsActive`       | bool    | Soft delete flag                           |
| `EstimatedHours` | decimal | Optional effort estimate                   |

### Member

| Field    | Type   | Description             |
| -------- | ------ | ----------------------- |
| `Id`     | int    | Primary key             |
| `Name`   | string | Member name             |
| `IsLead` | bool   | true = Team Lead access |

### WeekCycle

| Field              | Type     | Description                       |
| ------------------ | -------- | --------------------------------- |
| `Id`               | int      | Primary key                       |
| `PlanningDate`     | DateTime | Must be a Tuesday                 |
| `WeekStartDate`    | DateTime | Wednesday after planning date     |
| `WeekEndDate`      | DateTime | Following Monday                  |
| `Category1Percent` | decimal  | Client Focused %                  |
| `Category2Percent` | decimal  | Tech Debt %                       |
| `Category3Percent` | decimal  | R&D % (all three must sum to 100) |
| `IsActive`         | bool     | Active cycle flag                 |

### WeeklyPlan

| Field         | Type     | Description                  |
| ------------- | -------- | ---------------------------- |
| `Id`          | int      | Primary key                  |
| `MemberId`    | int      | FK → Member                  |
| `WeekCycleId` | int      | FK → WeekCycle               |
| `IsFrozen`    | bool     | true after plan is submitted |
| `FrozenAt`    | DateTime | Timestamp of freeze          |
| `PlanEntries` | List     | Tasks planned for the week   |

### PlanEntry

| Field             | Type     | Description                       |
| ----------------- | -------- | --------------------------------- |
| `Id`              | int      | Primary key                       |
| `WeeklyPlanId`    | int      | FK → WeeklyPlan                   |
| `BacklogItemId`   | int      | FK → BacklogItem                  |
| `PlannedHours`    | decimal  | Committed hours (max 30 total)    |
| `ProgressPercent` | decimal  | 0–100, updated after freeze       |
| `ActualHours`     | decimal  | Optional actual time spent        |
| `LastUpdated`     | DateTime | Timestamp of last progress update |

---

## 🚀 Running Locally

### Prerequisites

- .NET 8 SDK
- Node.js 20+
- Angular CLI (`npm install -g @angular/cli`)

### Backend

```bash
cd WeeklyPlanner.API
dotnet run
# API:     http://localhost:5162
# Swagger: http://localhost:5162/swagger
```

### Frontend

```bash
cd weekly-planner-ui
npm install
ng serve
# App: http://localhost:4200
```

> ⚠️ Stop the API (`Ctrl+C`) before running backend tests.

---

## 🧪 Running Tests

### Backend (101 tests — all passing)

```bash
# From repo root
dotnet test
```

| Test File                     | What it covers                            |
| ----------------------------- | ----------------------------------------- |
| `BacklogServiceTests.cs`      | BacklogService CRUD logic                 |
| `BacklogControllerTests.cs`   | BacklogController HTTP responses          |
| `PlanServiceTests.cs`         | Plan submit, progress updates, validation |
| `PlanControllerTests.cs`      | PlanController endpoints + dashboard      |
| `WeekCycleServiceTests.cs`    | WeekCycle creation and percentage setting |
| `WeekCycleControllerTests.cs` | WeekCycleController endpoints             |
| `MembersControllerTests.cs`   | Members endpoints                         |
| `ExceptionMiddlewareTests.cs` | Global error handling middleware          |
| `RequestContextTests.cs`      | X-Is-Lead header parsing                  |
| `CoverageGapTests.cs`         | Edge case coverage                        |

```
✅ 101/101 tests passing
📊 ~89% line coverage, ~96% branch coverage
🧪 All controllers tested
🧪 All services tested
🧪 All core models 100% covered
```

### Frontend

```bash
cd weekly-planner-ui
npx vitest run --coverage
```

```
✅ 301/301 tests passing (100%)
⚡ Vitest v4 — fast ESM-native test runner
🧪 All edge cases tested
🔥 Stress tested (1000 members, 500 items)
```

---

## 🧠 Key Design Decisions

**1. Dual-layer persistence (localStorage + Azure SQL)**
The frontend uses `localStorage` as the working state layer for a smooth, offline-capable UX. Azure SQL is the persistence layer — data is synced at key workflow moments (setup, backlog save, week creation, freeze, progress update). Local `dbId` fields map frontend UUIDs to backend integer IDs.

**2. Role via HTTP Header**
Instead of authentication, a lightweight `X-Is-Lead: true` header is sent by the frontend when the current user is the Team Lead. The API reads this via `RequestContext.IsLead()` to gate lead-only endpoints such as setting category percentages and viewing the dashboard.

**3. Per-member category hour enforcement**
The backend enforces that each member's hours in a category cannot exceed `(categoryPercent / 100) × 30`. The frontend mirrors this validation to prevent failed API calls before they happen.

**4. Plan submitted = immediately frozen**
On `POST /api/Plan/submit`, the backend immediately sets `IsFrozen = true`. The frontend's multi-step workflow (PLANNING → FROZEN) maps to this: freeze in the UI triggers plan submission to the backend for all participating members.

**5. Standalone Angular Components**
All Angular components are standalone (no NgModules), following Angular 17+ best practices for simpler dependency management and tree-shaking.

**6. Clean Architecture layers**
The solution is split into Core (interfaces + models), Infrastructure (EF Core + services), and API (controllers) — making services fully unit-testable with mocked dependencies using Moq.

**7. EF Core InMemory for tests**
Backend tests use `Microsoft.EntityFrameworkCore.InMemory` to test services and controllers without a real database, keeping tests fast and isolated.

---

## ⚙️ CI/CD Pipeline

### CI (on every push / PR)

```
Build → Test (101 backend tests) → Coverage report
```

### CD (on push to main)

```
Build API → Deploy to Azure App Service
Build Angular → Deploy to Azure Static Web Apps
```

### Azure Resources (centralindia region)

| Resource            | Name                       |
| ------------------- | -------------------------- |
| Resource Group      | `weekly-planner-rg`        |
| SQL Server          | `weekly-planner-sql`       |
| SQL Database        | `WeeklyPlannerDb`          |
| App Service Plan    | `weekly-planner-plan` (F1) |
| Web App (API)       | `weekly-planner-api-v2`    |
| Static Web App (UI) | `weekly-planner-ui`        |

---

## 👤 Author

**Vaibhav Udhane**

- 🌐 Live app: [https://agreeable-hill-0f22b4400.4.azurestaticapps.net](https://agreeable-hill-0f22b4400.4.azurestaticapps.net)
- 🔧 API: [https://weekly-planner-api-v2.azurewebsites.net/swagger](https://weekly-planner-api-v2.azurewebsites.net/swagger)
- 💻 GitHub: [https://github.com/vaibhavudhane/weekly-planner-](https://github.com/vaibhavudhane/weekly-planner-)
