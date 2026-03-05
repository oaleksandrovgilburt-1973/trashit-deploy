# TRASHit Setup & Testing Guide

## Quick Setup

### 1. Install Dependencies
```bash
cd /home/ubuntu/trashit
pnpm install
```

### 2. Configure Supabase

1. Create a free account at https://supabase.com
2. Create a new project
3. Go to **Project Settings → API** and copy:
   - Project URL
   - Anon Key (public)
4. Update `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Initialize Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the entire contents of `docs/schema.sql`
4. Execute the query
5. Verify: Go to **Table Editor** and confirm these tables exist:
   - `profiles`
   - `regions` (should have 8 rows)
   - `requests`
   - `messages`
   - `provider_regions`

### 4. Run Dev Server
```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

---

## Testing Flows

### Test 1: Customer Signup & Create Request

**Steps:**
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Select **Customer** role
4. Fill in details:
   - Full Name: `John Doe`
   - Email: `customer@test.com`
   - Password: `Test123!`
5. Click "Sign Up"
6. You'll be redirected to `/dashboard/customer`
7. Click "Create New Request"
8. Fill in request form:
   - Description: `Old furniture and boxes`
   - Address: `123 Main St, Sofia`
   - Region: `Lozenets`
   - Preferred Time: `Tomorrow 10 AM`
   - Price Offer: `50`
9. Click "Create Request"
10. Request should appear in the list below

**Expected Result:** Request shows with status "Open" and price "BGN 50.00"

---

### Test 2: Provider Signup & Region Selection

**Steps:**
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Select **Provider** role
4. Fill in details:
   - Full Name: `Jane Smith`
   - Email: `provider@test.com`
   - Password: `Test123!`
5. Click "Next: Select Regions"
6. Select at least 2 regions (e.g., `Lozenets`, `Mladost`)
7. Click "Complete Sign Up"
8. You'll see "Pending Approval" alert
9. Regions you selected should show in the sidebar

**Expected Result:** Provider dashboard shows "Pending Approval" status with selected regions

---

### Test 3: Provider Browsing Available Jobs

**Steps:**
1. As the provider from Test 2, you should see the customer's request from Test 1
2. Go to "Available Jobs" tab
3. The request "Old furniture and boxes" should appear (if Lozenets is selected)
4. Note: You cannot click "Accept" yet because account is pending approval

**Expected Result:** Request appears in Available Jobs list

---

### Test 4: Login

**Steps:**
1. Go to http://localhost:3000
2. Click "Sign In"
3. Enter credentials from Test 1:
   - Email: `customer@test.com`
   - Password: `Test123!`
4. Click "Sign In"
5. You should be redirected to customer dashboard

**Expected Result:** Successfully logged in and can see your requests

---

## Database Schema Overview

### Profiles Table
- `id` (UUID) - Supabase auth user ID
- `role` - 'customer' | 'provider' | 'admin'
- `full_name` - User's full name
- `phone` - Optional phone number
- `provider_status` - 'pending' | 'approved' | 'suspended' (only for providers)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### Regions Table
- `id` (number) - Region ID
- `name` - Sofia district name (8 seeded: Lozenets, Mladost, etc.)

### Requests Table
- `id` (UUID) - Request ID
- `customer_id` (UUID) - Customer's profile ID
- `provider_id` (UUID, nullable) - Assigned provider's ID
- `region_id` (number) - Sofia region
- `description` - What needs to be removed
- `address` - Full address
- `preferred_time` - Preferred service time
- `price_offer` (decimal) - Price in BGN
- `status` - 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
- `created_at` - Request creation time
- `updated_at` - Last status update

### Provider Regions Table
- `provider_id` (UUID) - Provider's profile ID
- `region_id` (number) - Region they serve
- Primary key: (provider_id, region_id)

### Messages Table
- `id` (UUID) - Message ID
- `request_id` (UUID) - Associated request
- `sender_id` (UUID) - Who sent the message
- `body` - Message text
- `created_at` - Timestamp

---

## Row Level Security (RLS)

All tables have RLS enabled:

- **Profiles:** Users can read all profiles, update only their own
- **Regions:** Public read access
- **Requests:** 
  - Customers can CRUD their own requests
  - Providers can see open requests in their regions
  - Both can update status
- **Messages:** Only request participants can read/write
- **Provider Regions:** Providers manage their own, all can read

---

## Admin Tasks (Manual)

To approve a provider:

1. In Supabase Dashboard, go to **Table Editor**
2. Open `profiles` table
3. Find the provider row
4. Update `provider_status` from `'pending'` to `'approved'`
5. Provider can now accept jobs

To suspend a provider:
- Update `provider_status` to `'suspended'`

---

## Troubleshooting

### "Module not found: Can't resolve 'lucide-react'"
- Run: `pnpm add lucide-react`
- Restart dev server: `pnpm dev`

### Supabase connection errors
- Verify `.env.local` has correct URL and key
- Check that Supabase project is active
- Ensure RLS policies are enabled in schema

### TypeScript errors in IDE
- These are Supabase type generation issues
- The app runs fine despite them
- Run: `pnpm tsc --noEmit` to see all errors

### Database tables not appearing
- Verify `docs/schema.sql` was executed completely
- Check Supabase SQL Editor for error messages
- Ensure RLS is enabled on all tables

---

## Next Steps

1. **Admin Dashboard** - Create `/dashboard/admin` to approve/suspend providers
2. **Messaging System** - Build real-time chat between customer and provider
3. **Request Details** - Create detail pages to view full request info
4. **Provider Profiles** - Let providers add phone, bio, ratings
5. **Payment Integration** - Add Stripe for secure payments
6. **Real-time Notifications** - Use Supabase Realtime for live updates

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Home/landing page
│   ├── layout.tsx                  # Root layout with AuthProvider
│   ├── auth/
│   │   ├── signup/page.tsx        # Signup with role selector & regions
│   │   └── signin/page.tsx        # Login page
│   └── dashboard/
│       ├── page.tsx               # Dashboard router
│       ├── customer/
│       │   ├── page.tsx           # Customer dashboard
│       │   └── new-request/page.tsx # Create request form
│       └── provider/
│           └── page.tsx           # Provider dashboard
├── contexts/
│   └── AuthContext.tsx            # Auth state & functions
├── components/
│   └── ProtectedRoute.tsx         # Route protection wrapper
└── lib/
    ├── supabase.ts                # Supabase client config
    └── database.types.ts          # TypeScript types

docs/
└── schema.sql                     # Database schema & seed data
```

---

## Support

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- TypeScript Docs: https://www.typescriptlang.org/docs
