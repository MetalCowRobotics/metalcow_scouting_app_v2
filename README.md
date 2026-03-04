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

### User Settings
- Configurable event selection per user
- Personal scout name
- Auto-sync and offline mode support
- Display preferences (compact view, TBA data)
- Notification settings

### Admin Panel
- User role management (admin/scout/viewer)
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
```

### 4. Set up the database

The project includes a `supabase/master_schema.sql` file with the complete database schema. Run this in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/master_schema.sql`
4. Run the SQL to create all tables, views, and functions

After the main schema, apply any pending migrations from `supabase/migrations/`:

- `add_profiles_role_columns.sql` - Adds role column to profiles
- `add_profiles_admin_policies.sql` - RLS policies for profiles
- `create_user_settings.sql` - User settings table
- `add_pit_scouting_unique_constraint.sql` - Unique constraint for pit scouting
- `add_scouting_unique_constraints.sql` - Unique constraints for match scouting

**Important**: If you encounter schema cache errors (e.g., "Could not find column X in schema cache"), you may need to add missing columns manually. After modifying the schema, refresh the Supabase dashboard or trigger a schema cache refresh.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create your admin account

1. Sign up for an account at `/login`
2. In Supabase SQL Editor, assign yourself the admin role:

```sql
-- Find your user ID from auth.users table
SELECT id, email FROM auth.users;

-- Update your profile to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your_email@example.com';
```

User roles:
- **admin** - Full access to all features including user management
- **scout** - Can create/edit scouting data and view analytics
- **viewer** - Read-only access (default for new users)

## Project Structure

```
app/
├── page.tsx              # Landing page
├── login/                # Authentication
├── settings/             # User settings
├── admin/                # Admin panel (admin only)
├── analytics/            # Analytics dashboard
├── teams/                # Team database
│   └── [teamNumber]/    # Individual team profile
├── scout/
│   ├── match/            # Match scouting form
│   └── pit/              # Pit scouting form
├── tba/                  # The Blue Alliance integration
└── api/                  # API routes

components/
├── ui/                   # shadcn/ui components
├── auth/                 # Authentication components
├── AnalyticsDashboard/   # Analytics components
└── scouting/             # Scouting form components

lib/
├── supabase.ts           # Supabase client
├── tba.ts                # TBA API utilities
└── admin.ts              # Admin/permissions utilities

contexts/
├── PermissionsContext.tsx  # User permissions & roles
└── SettingsContext.tsx    # User settings

supabase/
├── master_schema.sql     # Complete database schema
└── migrations/           # Database migrations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Schema

The main tables are:

- **`profiles`** - User accounts with roles (admin/scout/viewer)
- **`user_settings`** - Per-user settings (event, scout name, preferences)
- **`match_scouting`** - Match performance data
- **`pit_scouting`** - Robot specifications (one per team per event)

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
