# Meridian OS

Meridian OS is the central operational brain and internal operating system built exclusively to power the operations of **Campus Marketplace**. 

It consolidates campaigns, internal knowledge, brand assets, contacts, workflows, and analytics into a single, cohesive, AI-first platform.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (Strict Mode)
- **Package Manager:** pnpm
- **Database:** Supabase PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** Supabase Auth
- **Validation:** Zod
- **State Management:** Zustand (Global State), TanStack Query (Server State)
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Testing:** Vitest, Playwright

---

## 📂 Repository Structure

The project strictly follows the **Clean Architecture** and **Feature-First** structure defined in the [Repository Structure Specification](file:///d:/Documents/Meridian%20OS/docs/06_REPOSITORY_STRUCTURE.md):

```
meridian-os/
├── app/                    # Routing layer (layouts, pages, loading/error UI)
├── application/            # Application logic (use cases, commands, queries, DTOs)
├── domain/                 # Core business models, entities, and validation rules
├── features/               # Feature-first modules (self-contained components, hooks, etc.)
├── infrastructure/         # External implementation adapters (Supabase, Auth, AI, Storage)
├── shared/                 # Reusable level-1 UI components, hooks, and utilities
├── config/                 # Navigation, feature flags, constants, roles, and settings
├── styles/                 # Global styles and tailwind configuration
├── public/                 # Static assets (favicons, images, fonts)
├── scripts/                # Utility and database migration/seed scripts
├── tests/                  # Test suites (unit, integration, and E2E)
├── types/                  # Shared global TypeScript typings
├── docs/                   # Preserved engineering specifications
├── proxy.ts                # Next.js 16 Proxy layer (replaces deprecated middleware)
└── tsconfig.json           # Compiler configuration with strict paths
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install all dependencies using `pnpm`:
```bash
pnpm install
```

### 2. Environment Configuration
Copy the environment variables template and fill in the values:
```bash
cp .env.example .env.local
```

### 3. Running Locally
Start the development server with Turbopack:
```bash
pnpm dev
```

### 4. Code Quality and Testing
Verify code compilation, quality, and tests:
```bash
pnpm type-check     # Verify strict TypeScript compilation
pnpm lint           # Check code quality via ESLint
pnpm test           # Run Vitest unit/integration tests
pnpm test:e2e       # Run Playwright E2E tests
```

---

## 🔐 AI Credential Encryption & Failover

Meridian OS secures third-party AI provider keys (OpenAI, Anthropic, Gemini) using database-backed, AES-256-GCM encrypted storage:

1. **Master Encryption Key:** Stored only in the `CREDENTIAL_ENCRYPTION_KEY` environment variable. Must be exactly 32 bytes (64 hex characters). Generate a new one with:
   ```bash
   openssl rand -hex 32
   ```
2. **Encrypted Storage:** Keys are encrypted on the server before insertion and stored as `iv:authTag:ciphertext` in PostgreSQL. They are never exposed in log lines, client code, or API responses.
3. **Decryption & Failover:** The `CredentialResolver` fetches active credentials for the requested provider/tier, decrypts them in-memory, and injects them into the provider adapters at call time. It handles 401/403/429 failures automatically, marking credentials appropriately and attempting the next active key.

---

## 📐 Engineering Guidelines

- **No `any`:** Strict TypeScript is enabled and enforced.
- **Feature Isolation:** Features own their domain, application, hooks, components, validation schemas, and tests. Feature boundaries must be strictly respected.
- **Business Logic:** Business logic belongs in Application Use Cases, never in React components.
- **Clean Architecture Imports:** Dependency direction must always flow downwards: `Presentation (UI) → Application → Domain → Infrastructure`.
- **Barrel Files:** Use `index.ts` barrel files to expose public APIs from each subdirectory.
- **CSS Variables & Tokens:** Never hardcode colors, border-radii, spacing, or font-sizes. Always use Tailwind CSS theme tokens configured in `app/globals.css`.

For detailed specifications, review the engineering documents inside the `docs/` folder.
