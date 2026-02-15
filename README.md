# Metal Cow Scouting

Advanced robotics scouting and analytics platform for FRC (FIRST Robotics Competition). Track matches, analyze performance, and dominate the competition with real-time data collection and strategic insights.

## Features

### Match Scouting
- Multi-step wizard for logging match data in real-time
- Autonomous period tracking (mobility, scoring)
- Teleoperated scoring (notes, fouls)
- Endgame actions (climb, trap)
- QR code generation for quick entry
- Defense and accuracy ratings

### Pit Scouting
- Capture robot specifications and team capabilities
- Drivetrain type & motor configuration
- Sensor suite details (vision, encoders)
- Scoring mechanism details
- Team contacts & notes

### Analytics Dashboard
- Ranking predictions & OPR calculations
- Climb success rates by alliance
- Defensive impact scoring
- Match timeline visualizations
- Hybrid team stats combining pit + match data

### Team Database
- Comprehensive team profiles with historical data
- Full team roster & history
- Performance trends over time
- Strengths & weaknesses analysis

### The Blue Alliance Integration
- Official match results sync
- Event schedules & rankings
- Team event history
- Live score updates

### Admin Panel
- Export data to CSV/JSON
- Event configuration
- Scout management
- Data backup & restore

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Analytics**: The Blue Alliance API, Recharts
- **Auth**: Supabase Auth

## Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase account
- The Blue Alliance API key (optional, for live data)

## Setup Development Environment

### 1. Clone the repository

```bash
git clone <repository-url>
cd jai_metal_cow_scouting_app
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# The Blue Alliance API (get from https://www.thebluealliance.com/account)
NEXT_PUBLIC_TBA_API_KEY=your_tba_api_key

# Event Configuration
NEXT_PUBLIC_DEFAULT_EVENT_KEY=2026ilpe

# Admin Configuration (comma-separated emails)
NEXT_PUBLIC_ADMIN_EMAILS=your.email@example.com

# Reserved emails for scout accounts
RESERVED_EMAILS=email1@example.com, email2@example.com
```

### 4. Set up the database

The project includes a `master_schema.sql` file with the complete database schema. Run this in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `master_schema.sql`
4. Run the SQL to create all tables, views, and functions

**Important**: If you encounter schema cache errors (e.g., "Could not find column X in schema cache"), you may need to add missing columns manually:

```sql
-- Example: Adding missing column
ALTER TABLE public.match_scouting 
ADD COLUMN IF NOT EXISTS robot_on_field BOOLEAN DEFAULT TRUE;
```

After modifying the schema, refresh the Supabase dashboard or trigger a schema cache refresh.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── page.tsx              # Landing page
├── login/                # Authentication
├── admin/                # Admin panel
├── analytics/            # Analytics dashboard
├── teams/                # Team database
│   └── [teamNumber]/    # Individual team profile
├── scout/
│   ├── match/            # Match scouting form
│   └── pit/              # Pit scouting form
└── tba/                  # The Blue Alliance integration

components/
├── ui/                   # shadcn/ui components
├── auth/                 # Authentication components
└── AnalyticsDashboard/    # Analytics components

lib/
├── supabase.ts           # Supabase client
└── tba.ts                # TBA API utilities
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Schema

The main tables are:

- **`match_scouting`** - Match performance data
- **`pit_scouting`** - Robot specifications
- **`users`** - Scout user accounts

Views:
- **`hybrid_team_stats`** - Combined pit + match analytics

## Deployment

The easiest way to deploy is via Vercel:

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/new)
3. Import your repository
4. Add your environment variables in Vercel project settings
5. Deploy

## License

MIT
