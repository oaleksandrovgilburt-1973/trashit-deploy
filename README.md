# TRASHit - Trash Removal Service Marketplace

A modern web application connecting customers with professional trash removal providers in Sofia, Bulgaria.

**Stack:** Next.js 14 + TypeScript + Tailwind CSS + Supabase

## Features

- **Customer Flow:** Post trash removal requests, track status, communicate with providers
- **Provider Flow:** Browse available jobs in selected regions, accept requests, manage assignments
- **Admin Dashboard:** Manage users, requests, and system settings
- **Real-time Messaging:** Chat between customers and providers
- **Role-based Access:** Customer, Provider, and Admin roles with appropriate permissions

## Quick Start

### 1. Prerequisites

- Node.js 18+ and pnpm
- Supabase account (free tier available at https://supabase.com)

### 2. Installation

```bash
cd /home/ubuntu/trashit
pnpm install
```

### 3. Configure Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key from **Project Settings → API**
3. Create `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Database

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query and paste the contents of `docs/schema.sql`
3. Execute the query to create all tables, indexes, and RLS policies
4. Verify that 8 Sofia regions are seeded

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page
│   ├── layout.tsx           # Root layout with AuthProvider
│   └── dashboard/
│       ├── page.tsx         # Dashboard router
│       ├── customer/        # Customer pages
│       └── provider/        # Provider pages
├── contexts/
│   └── AuthContext.tsx      # Authentication state management
├── components/
│   └── ProtectedRoute.tsx   # Route protection wrapper
└── lib/
    ├── supabase.ts          # Supabase client
    └── database.types.ts    # TypeScript types for database
docs/
└── schema.sql               # Database schema and RLS policies
```

## Database Schema

### Tables

- **profiles** - User profiles with role (customer, provider, admin)
- **regions** - Sofia districts (8 seeded regions)
- **requests** - Trash removal service requests
- **messages** - Chat messages between customer and provider
- **provider_regions** - Many-to-many relationship between providers and service regions

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Customers can view open requests
- Providers can see open requests in their service regions
- Only request participants can view/send messages

## Authentication

- Email/password signup with role selection (Customer/Provider)
- Automatic profile creation on signup
- Session management via Supabase Auth

## User Flows

### Customer
1. Sign up as Customer
2. Create a trash removal request (description, address, region, preferred time, price offer)
3. View all requests with status tracking
4. Chat with assigned provider
5. Mark request as completed

### Provider
1. Sign up as Provider
2. Select service regions
3. Browse open requests in selected regions
4. Accept requests to be assigned
5. Manage assigned jobs
6. Chat with customers

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Your Supabase anon key
```

## Development

### TypeScript

```bash
pnpm tsc --noEmit
```

### Format Code

```bash
pnpm format
```

## Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## Next Steps

- [ ] Add provider ratings and reviews
- [ ] Implement payment processing (Stripe)
- [ ] Add real-time notifications
- [ ] Build admin dashboard UI
- [ ] Add image uploads for requests
- [ ] Implement provider verification workflow
- [ ] Add SMS notifications
- [ ] Build mobile app

## Support

For issues or questions, please check the Supabase documentation.

## License

MIT
