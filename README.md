# Trocker

A Next.js application for tracking Rocky the cat's movements between apartments in a building and outdoor areas.

## Features

- **Location Tracking**: Track Rocky's movements across apartments, outdoor areas, and building common spaces
- **Interactive Map**: Visual grid-based map showing all locations in the neighborhood
- **Timeline History**: View a complete history of Rocky's location changes with entry/exit times
- **User Authentication**: Secure login with NextAuth.js supporting both credentials and OAuth (Google)
- **Role-based Access**: Admin and user roles with different permissions
- **Apartment Management**: Users can manage their own apartments where Rocky can be tracked
- **Auto-exit Logic**: Automatically fills exit times when Rocky moves to a new location
- **Real-time Updates**: Server-sent events for live location updates
- **Retro 70s Aesthetic**: Custom color palette with a nostalgic visual design

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16+ (App Router, TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Bun installed
- PostgreSQL running locally

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables (copy `.env.example` to `.env`):
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trocker"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"
   ```

4. Run database migrations:
   ```bash
   bun run db:migrate
   ```

5. Seed the database:
   ```bash
   bun run db:seed
   ```

6. Start the development server:
   ```bash
   bun run dev
   ```

## Usage

1. **Login** with your credentials or OAuth provider
2. **Create an apartment** to track Rocky at your location
3. **Report Rocky's location** by clicking on locations on the interactive map
4. **View the timeline** to see Rocky's movement history
5. **Admins** can manage users, outdoor locations, and application settings

## Development

```bash
# Start dev server
bun run dev

# Run migrations
bun run db:migrate

# Open Prisma Studio
bun run db:studio

# Build for production
bun run build
```

## License

Private project for tracking Rocky the cat.
