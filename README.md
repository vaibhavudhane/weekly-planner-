# 📅 Weekly Plan Tracker

> A full-stack weekly planning tool for development teams — built with .NET 8, SQL Server, and Angular 21.

---

## 🌐 Live Deployment

|                 | URL                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| 🖥️ **Frontend** | [https://kind-flower-09f143d00.1.azurestaticapps.net/](https://kind-flower-09f143d00.1.azurestaticapps.net/) |
| 📖 **Swagger**  | [/swagger](https://weeklyplanner-api-vaibhav.azurewebsites.net/swagger)                                      |

---

## 📖 About the App

Weekly Plan Tracker helps development teams plan and track their weekly work with structured hour budgets across business categories.

A **Team Lead** sets up a planning week by choosing a Tuesday date and splitting the team's capacity across three categories: **Client Focused**, **Tech Debt**, and **R&D**. Each team member then picks backlog items and plans their hours within the allocated budget. The lead can view an aggregated dashboard across all members and freeze the week when planning is complete. Once frozen, members can only update progress — no hour changes allowed.

---

## 🛠️ Tech Stack

| Layer                | Technology                                     |
| -------------------- | ---------------------------------------------- |
| **Backend**          | .NET 8, C#, ASP.NET Core Web API               |
| **ORM**              | Entity Framework Core 8                        |
| **Database**         | SQL Server (Azure SQL)                         |
| **Frontend**         | Angular 21, TypeScript                         |
| **HTTP**             | Angular HttpClient                             |
| **Backend Tests**    | xUnit, FluentAssertions, Moq, EF Core InMemory |
| **Frontend Tests**   | Vitest v4, Angular Testing Library             |
| **Backend Hosting**  | Azure App Service                              |
| **Frontend Hosting** | Azure Static Web Apps                          |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Angular 21 SPA                        │
│           (Azure Static Web Apps)                        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS REST (JSON)
                         │ X-Role header (lead / member)
┌────────────────────────▼────────────────────────────────┐
│               ASP.NET Core Web API (.NET 8)              │
│                  (Azure App Service)                     │
│                                                          │
│  Controllers → Interfaces (Core)                        │
│       ↓                                                  │
│  Infrastructure (EF Core + SQL Server)                  │
└─────────────────────────────────────────────────────────┘

Layers:
  WeeklyPlanner.Core           — Models, Interfaces
  WeeklyPlanner.Infrastructure — EF Core DbContext, Service implementations
  WeeklyPlanner.API            — Controllers, DTOs, Middleware, Program.cs
  WeeklyPlanner.Tests          — Unit + Integration Tests
```

---

## 📁 Project Structure

```
Weekly-Planner/
│
├── WeeklyPlanner.Core/                        # Domain layer
│   ├── Interfaces/
│   │   ├── IBacklogService.cs                 # Backlog CRUD contract
│   │   ├── IPlanService.cs                    # Plan submit/progress contract
│   │   └── IWeekCycleService.cs               # Week cycle contract
│   └── Models/
│       ├── BacklogItem.cs                     # Task in product backlog (Category 1/2/3)
│       ├── Member.cs                          # Team member or lead (IsLead flag)
│       ├── PlanEntry.cs                       # One task inside a weekly plan
│       ├── WeekCycle.cs                       # One planning week (Tue–Mon cycle)
│       └── WeeklyPlan.cs                      # A member's full plan for a week
│
├── WeeklyPlanner.Infrastructure/              # Data + service implementations
│   ├── Data/
│   │   ├── AppDbContext.cs                    # EF Core DbContext
│   │   └── AppDbContextFactory.cs             # Design-time factory for migrations
│   ├── Migrations/
│   │   └── 20260302093805_InitialCreate.cs    # Initial schema migration
│   └── Services/
│       ├── BacklogService.cs                  # IBacklogService implementation
│       ├── PlanService.cs                     # IPlanService implementation
│       └── WeekCycleService.cs                # IWeekCycleService implementation
│
├── WeeklyPlanner.API/                         # Presentation layer
│   ├── Controllers/
│   │   ├── BacklogController.cs               # GET/POST/PUT/DELETE /api/Backlog
│   │   ├── MembersController.cs               # GET/POST /api/Members
│   │   ├── PlanController.cs                  # Submit plan, progress, dashboard
│   │   └── WeekCycleController.cs             # Week cycle + set percentages (lead)
│   ├── DTOs/
│   │   ├── PercentageDto.cs                   # Cat1/2/3 percent payload
│   │   ├── ProgressDto.cs                     # Progress percent + actual hours
│   │   └── SubmitPlanDto.cs                   # Member + week + entries payload
│   ├── Helpers/
│   │   └── RequestContext.cs                  # Reads X-Role header for lead check
│   ├── Middleware/
│   │   └── ExceptionMiddleware.cs             # Global error handling
│   ├── appsettings.json                       # App configuration
│   └── Program.cs                             # DI, CORS, Swagger, EF, Middleware
│
├── WeeklyPlanner.Tests/                       # Test suite (xUnit)
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
│   ├── src/
│   │   ├── app/
│   │   │   ├── guards/
│   │   │   │   └── lead.guard.ts              # Route guard — lead-only pages
│   │   │   ├── interceptors/
│   │   │   │   └── role.interceptor.ts        # Attaches X-Role header to all requests
│   │   │   ├── models/
│   │   │   │   └── index.ts                   # Member, BacklogItem, WeekCycle,
│   │   │   │                                  # PlanEntry, WeeklyPlan interfaces
│   │   │   ├── services/
│   │   │   │   ├── app-state.service.ts       # Global toast / error state
│   │   │   │   ├── backlog.service.ts         # Backlog API calls
│   │   │   │   ├── plan.service.ts            # Plan submit / progress API calls
│   │   │   │   ├── role.service.ts            # Lead / member role management
│   │   │   │   └── week-cycle.service.ts      # Week cycle API calls
│   │   │   ├── app.config.ts                  # Angular providers + HTTP setup
│   │   │   ├── app.routes.ts                  # Client-side routing
│   │   │   └── app.ts                         # Root component
│   │   ├── environments/
│   │   │   ├── environment.ts                 # Dev: http://localhost:5162/api
│   │   │   └── environment.prod.ts            # Prod: Azure API URL
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss                        # Global styles
│   ├── staticwebapp.config.json               # Azure Static Web Apps routing config
│   ├── angular.json
│   ├── vitest.config.ts                       # Vitest test configuration
│   ├── tsconfig.json
│   └── package.json
│
└── WeeklyPlanner.sln                          # Solution file
```

---

## 📡 API Reference

### Members

| Method | Endpoint       | Description     |
| ------ | -------------- | --------------- |
| GET    | `/api/Members` | Get all members |
| POST   | `/api/Members` | Add a member    |

### Backlog Items

| Method | Endpoint            | Description              |
| ------ | ------------------- | ------------------------ |
| GET    | `/api/Backlog`      | Get all backlog items    |
| GET    | `/api/Backlog/{id}` | Get a backlog item by ID |
| POST   | `/api/Backlog`      | Create a backlog item    |
| PUT    | `/api/Backlog/{id}` | Update a backlog item    |
| DELETE | `/api/Backlog/{id}` | Delete a backlog item    |

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
| POST   | `/api/Plan/submit`                       | Submit a member's plan               |
| PUT    | `/api/Plan/progress/{entryId}`           | Update progress on a plan entry      |
| GET    | `/api/Plan/week/{weekCycleId}/all`       | Get all plans for a week             |
| GET    | `/api/Plan/week/{weekCycleId}/dashboard` | **Lead only** — aggregated dashboard |
| DELETE | `/api/Plan/{memberId}/{weekCycleId}`     | Delete a member's plan (dev only)    |
| DELETE | `/api/Plan/admin/reset`                  | Wipe all plans (dev only)            |

> 🔒 **Lead-only endpoints** require the `X-Role: lead` header, injected automatically by Angular's `RoleInterceptor`.

---

## 🗂️ Domain Models

### BacklogItem

| Field         | Type   | Description                                |
| ------------- | ------ | ------------------------------------------ |
| `Id`          | int    | Primary key                                |
| `Title`       | string | Task title                                 |
| `Description` | string | Task description                           |
| `Category`    | int    | 1 = Client Focused, 2 = Tech Debt, 3 = R&D |
| `IsActive`    | bool   | Soft delete flag                           |

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
| `WeekStartDate`    | DateTime | Wednesday                         |
| `WeekEndDate`      | DateTime | Following Monday                  |
| `Category1Percent` | decimal  | Client Focused %                  |
| `Category2Percent` | decimal  | Tech Debt %                       |
| `Category3Percent` | decimal  | R&D % (all three must sum to 100) |
| `IsActive`         | bool     | Active cycle flag                 |

---

## 🚀 Running Locally

### Prerequisites

- .NET 8 SDK
- Node.js 20+
- Angular CLI 21 (`npm install -g @angular/cli`)

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

### Backend

```bash
# From repo root (API must be stopped)
dotnet test
```
you can view backend test report at - WeeklyPlanner.Tests/coverage.cobertura.xml

| Test File                     | What it covers                            |
| ----------------------------- | ----------------------------------------- |
| `BacklogServiceTests.cs`      | BacklogService CRUD logic                 |
| `BacklogControllerTests.cs`   | BacklogController HTTP responses          |
| `PlanServiceTests.cs`         | Plan submit, progress updates, freeze     |
| `PlanControllerTests.cs`      | PlanController endpoints + dashboard      |
| `WeekCycleServiceTests.cs`    | WeekCycle creation and percentage setting |
| `WeekCycleControllerTests.cs` | WeekCycleController endpoints             |
| `MembersControllerTests.cs`   | Members endpoints                         |
| `ExceptionMiddlewareTests.cs` | Global error handling middleware          |
| `RequestContextTests.cs`      | X-Role header parsing                     |

```
**Coverage:** ~89% line coverage, ~96% branch coverage,
- 10+ comprehensive test classes
- 95.77% branch coverage
- All controllers tested
- All services tested
- All core models 100% covered
```

### Frontend

```bash
cd weekly-planner-ui
npx vitest run --coverage
```
- 301/301 tests passing (100%)
- All edge cases tested
- Stress tested (1000 members, 500 items)


| Details | Value |
|---|---|
| Test runner | Vitest v4.0.18 |
| Framework | Angular Testing Library |
| Test files | `*.spec.ts` co-located with each service |

---

## 🧠 Key Design Decisions

**1. Role via HTTP Header**
Instead of authentication, a lightweight `X-Role: lead` header is injected by Angular's `RoleInterceptor` when the selected role is Lead. The API reads this via `RequestContext.IsLead()` to gate lead-only endpoints such as setting category percentages and viewing the dashboard.

**2. Standalone Angular Components**
All Angular components are standalone (no NgModules), following Angular 17+ best practices for simpler dependency management and tree-shaking.

**3. Vitest instead of Karma**
Vitest was chosen over the default Karma/Jasmine setup for faster test execution and better ESM support with Angular 21.

**4. SQL Server for persistence**
The backend uses SQL Server via Azure SQL, connected through EF Core with connection strings managed via Azure App Service environment variables (`SQLAZURECONNSTR_DefaultConnection`).

**5. Clean Architecture layers**
The solution is split into Core (interfaces + models), Infrastructure (EF Core + services), and API (controllers) layers — making services fully unit-testable with mocked dependencies using Moq.

**6. EF Core InMemory for tests**
Backend tests use `Microsoft.EntityFrameworkCore.InMemory` to test services and controllers without a real database, keeping tests fast and isolated.

---

## ⚙️ Deployment

### Backend — Azure App Service
Deployed via GitHub Actions on push to `main`. The connection string is stored as an Azure App Service connection string environment variable (`SQLAZURECONNSTR_DefaultConnection`) and resolved automatically at startup.

### Frontend — Azure Static Web Apps
```bash
cd weekly-planner-ui
npm run build
````

The `staticwebapp.config.json` handles:

- Build output directory: `dist/weekly-planner-ui/browser`
- SPA routing: all paths fall back to `index.html`
- Static assets (`.js`, `.css`, `.ico`) served with correct MIME types

---

## 👤 Author

**Vaibhav Udhane**

- Live app: [https://kind-flower-09f143d00.1.azurestaticapps.net/](https://kind-flower-09f143d00.1.azurestaticapps.net/)
