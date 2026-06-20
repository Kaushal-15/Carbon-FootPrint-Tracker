# EcoTrace — Personal Carbon Footprint Tracker

EcoTrace is a production-grade full-stack web application designed to help individuals **understand**, **track**, and **reduce** their personal carbon footprint. It features authentication, daily footprint logging, visual trends analysis, AI-powered sustainability recommendations, and a gamified experience with points, streaks, badges, and opt-in eco-challenges.

---

## 🚀 Key Features

### 1. Understand (Insights & Benchmarks)
- **Visual Trend Analysis**: Stacked charts showing emissions over time, broken down by category (Transport, Energy, Food, Waste).
- **Benchmark Comparison**: Real-time comparisons between your daily average CO2 emissions and the national average (e.g. US average: 44 kg CO2e/day) and global average targets.
- **Hotspots Highlight**: Instantly flags your single biggest contributing category each week.

### 2. Track (Daily Carbon Logging)
- Simple daily forms to record activities:
  - **Transport**: Distance (km) and mode (Car, Bus, Train, Flight, Bike, Walk).
  - **Energy**: Electricity consumption (kWh) and heating fuel usage.
  - **Food**: Diet types (Vegan, Vegetarian, Pescatarian, Moderate/Heavy Meat).
  - **Waste**: Generated volume levels (Low, Medium, High) and active recycling.
- Realistic, cited emission factors mapped to CO2-equivalent calculations.

### 3. Reduce (AI Coach & Gamification)
- **Groq Llama-3 Personal Coach**: A secure server-side endpoint parses recent activities and uses the `llama-3.3-70b-versatile` model to generate hyper-personalized, non-generic recommendations.
- **Streaks**: Tracks consecutive logging days.
- **Levels & XP**: Awarded points for regular tracking and week-over-week emission reductions.
- **Badges**: Unlock milestones like *First Step*, *Eco Warrior*, *Zero Waste Champion*, and *Carbon Cutter*.
- **Challenges**: Opt-in challenges (e.g. *Meat-Free Week*, *Active Commuting*) with point rewards.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router), TypeScript (Strict Mode)
- **Database**: PostgreSQL (via Neon or Supabase)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Auth**: [NextAuth.js](https://next-auth.js.org/) (Credentials Provider, BCrypt password hashing, secure JWT-based sessions)
- **AI**: [Groq API](https://groq.com/) (`llama-3.3-70b-versatile` model)
- **Styling**: Tailwind CSS (fully responsive, dark theme, Outfit typeface)
- **Testing**: [Vitest](https://vitest.dev/) (Unit and integration testing)

---

## 📂 Project Architecture

```text
├── app/                  # Next.js App Router Pages & API Routes
│   ├── api/
│   │   ├── auth/         # NextAuth configuration & Register routes
│   │   ├── challenges/   # Challenge opt-in endpoints
│   │   ├── dashboard/    # Calculations & statistics endpoint
│   │   └── insights/     # AI insights from Groq (cached & rate-limited)
│   │   └── entries/      # Logging endpoints (posts activity logs)
│   ├── dashboard/        # Dashboard page
│   ├── log/              # Footprint logging wizard
│   ├── profile/          # Profile & gamification wall
│   ├── login/            # Sign in page
│   ├── register/         # Sign up page
│   ├── layout.tsx        # Global SEO & Providers setup
│   └── page.tsx          # Landing page
├── components/           # Reusable UI Components (Navbar, Charts, etc.)
├── lib/                  # Core calculation & helper functions
│   ├── carbonCalculator.ts  # Pure calculations engine
│   ├── gamification.ts      # Streaks, points, & badge processor
│   └── prisma.ts            # Global Prisma Client instance
├── prisma/               # Schema definitions and seeding script
├── tests/                # Unit and Integration test suites
├── types/                # NextAuth types augmentations
└── package.json          # Project configurations & scripts
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm / yarn / pnpm

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecotrace?schema=public"
NEXTAUTH_SECRET="your_nextauth_secret_minimum_32_characters_long"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY="your_groq_api_key_here"
```

### 3. Run Database Migrations & Seed
Synchronize the PostgreSQL schema and pre-seed the database with standard eco-badges and challenges:
```bash
npx prisma db push
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

The codebase includes comprehensive unit testing for the carbon calculator, streaks, and points math, along with integration tests for API authentication and rate-limiting.

Run the test suite using Vitest:
```bash
npm test
```

---

## 🔒 Security & Performance Compliance

- **SQL Injection Prevention**: Parameterized queries via Prisma.
- **CSRF & Session Security**: Secure HttpOnly cookies managed by NextAuth.
- **AI Rate-Limiting**: Manual refreshes are rate-limited to once every 5 minutes, and Groq outputs are cached in the database for 24 hours to prevent duplicate API costs.
- **User Enumeration Defense**: Generic login error messages prevent attackers from discovering existing email addresses.
- **Accessibility**: High-contrast ratios, semantic HTML layout structure, visible focus ring states for keyboard-only navigation, and screen reader announcements.
- **Asset Optimization**: Recharts and chart libraries are lazy-loaded dynamically with SSR disabled to optimize Client JS bundle weight and page load speed.
