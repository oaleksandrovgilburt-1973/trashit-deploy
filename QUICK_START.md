# TRASHit Quick Start

## 1. Setup (5 minutes)

```bash
cd /home/ubuntu/trashit

# Install dependencies
pnpm install

# Create .env.local with Supabase credentials
# Get these from https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Run database migrations
# Copy docs/schema.sql and run in Supabase SQL Editor

# Start dev server
pnpm dev
```

Open http://localhost:3000

## 2. Test Customer Flow (5 minutes)

1. **Sign Up**: Go to /auth/signup
   - Select "Customer"
   - Email: customer@test.com
   - Password: Test123!
   - Name: John Doe

2. **Create Request**: Click "Create New Request"
   - Description: "Old furniture and boxes"
   - Address: "123 Main St, Sofia"
   - Region: "Lozenets"
   - Price: "50"
   - Submit

3. **View Request**: Click on request in list
   - See request details
   - Chat section (empty until provider accepts)

## 3. Test Provider Flow (5 minutes)

1. **Sign Up**: Go to /auth/signup
   - Select "Provider"
   - Email: provider@test.com
   - Password: Test123!
   - Name: Jane Smith
   - Select regions: "Lozenets" + "Mladost"

2. **See Status**: Dashboard shows "Pending Approval"

3. **Admin Approval**: (In Supabase)
   - Go to profiles table
   - Find provider row
   - Change provider_status from "pending" to "approved"

4. **Accept Job**: 
   - Refresh page
   - "Available Jobs" tab shows customer's request
   - Click "Accept Request"

5. **View My Job**:
   - Move to "My Jobs" tab
   - Click request to view details
   - Send message to customer

6. **Complete Job**:
   - Click "Mark Complete"
   - Status changes to "Completed"

## 4. Test Admin Flow (2 minutes)

1. **Create Admin** (in Supabase):
   - profiles table → Insert row
   - id: any UUID
   - role: "admin"
   - full_name: "Admin User"

2. **Login**: Sign in with admin credentials

3. **Admin Dashboard**: Go to /dashboard/admin
   - See all users
   - See all requests
   - Approve/suspend providers

## 5. Test Messaging (3 minutes)

1. **Customer sends message**: In request details, type message and click Send

2. **Wait 5 seconds**: Provider's page auto-updates with message

3. **Provider replies**: Type and send message

4. **Wait 5 seconds**: Customer's page auto-updates

## 6. Test Concurrency (2 minutes)

1. **Two providers**: Open two browser windows
   - Both logged in as different providers
   - Both in same region

2. **Same request**: Both see same open request

3. **First accepts**: Click "Accept Request"
   - Status changes to "Assigned"

4. **Second tries**: Click "Accept Request"
   - Alert: "Another provider has already accepted this job"

---

## URLs

- Home: http://localhost:3000
- Sign Up: http://localhost:3000/auth/signup
- Sign In: http://localhost:3000/auth/signin
- Customer Dashboard: http://localhost:3000/dashboard/customer
- Provider Dashboard: http://localhost:3000/dashboard/provider
- Admin Dashboard: http://localhost:3000/dashboard/admin

## Test Credentials

**Customer**
- Email: customer@test.com
- Password: Test123!

**Provider**
- Email: provider@test.com
- Password: Test123!

**Admin** (create in Supabase)
- Email: admin@test.com
- Password: Test123!

---

## Troubleshooting

**Dev server won't start**
```bash
pnpm install
pnpm dev
```

**Supabase connection error**
- Check .env.local has correct URL and key
- Verify Supabase project is active
- Check internet connection

**Can't see requests**
- Refresh page
- Check you're logged in
- Verify request was created in correct region

**Messages not updating**
- Wait 5 seconds for poll
- Refresh page
- Check Supabase connection

**Can't accept job**
- Verify provider status is "approved"
- Check request is in your regions
- Ensure request is still "open" status

---

See FEATURES.md for complete documentation.
