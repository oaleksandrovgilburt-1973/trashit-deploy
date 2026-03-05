# TRASHit Features & Complete Guide

## Overview

TRASHit is a two-sided garbage disposal marketplace built with Next.js 14, TypeScript, Tailwind CSS, and Supabase. The platform connects customers who need trash removal with approved service providers.

---

## Core Features

### 1. Authentication System
- **Email/Password Signup** with role selection (Customer/Provider/Admin)
- **Login** with persistent sessions via Supabase Auth
- **Automatic Profile Creation** on signup
- **Role-Based Access Control** with protected routes

### 2. Customer Features

#### Create Service Requests
- **Description**: What needs to be removed
- **Address**: Full address of the location
- **Region**: Select from 8 Sofia districts
- **Preferred Time**: Optional time preference
- **Price Offer**: Offer price in BGN
- Status starts as **Open**

#### View Requests
- Dashboard shows all customer's requests
- Status tracking: Open → Assigned → In Progress → Completed
- Click any request to view details and chat with assigned provider

#### Request Details Page
- Full request information
- Assigned provider details (if assigned)
- Real-time messaging with provider
- Messages poll every 5 seconds for updates

### 3. Provider Features

#### Region Selection
- Choose service regions during signup
- Can edit regions anytime from dashboard
- Only see open requests in selected regions

#### Provider Status
- **Pending**: Account awaiting admin approval (can't accept jobs)
- **Approved**: Can accept jobs in selected regions
- **Suspended**: Account disabled by admin

#### Browse Available Jobs
- See all open requests in selected regions
- View job details: description, address, price, preferred time
- Click "Accept Request" to claim the job

#### Accept Job (Concurrency-Safe)
- Prevents race conditions: only one provider can accept each job
- Checks if request is still open before accepting
- Updates request status to **Assigned** and sets provider_id
- Moves job to "My Jobs" tab

#### Manage Assigned Jobs
- "My Jobs" tab shows assigned and in-progress requests
- View full job details and customer info
- Send messages to customer
- Click "Mark Complete" to finish job

#### Mark Complete
- Changes request status to **Completed**
- Completes the transaction
- Customer can still view request history

#### Messaging System
- Real-time chat with customer on each request
- Messages poll every 5 seconds
- Shows sender, timestamp, and message content
- Disabled when request is completed/cancelled

### 4. Admin Features

#### Admin Dashboard (`/dashboard/admin`)
- **Users & Providers Tab**: List all users with their roles and status
- **Approve Providers**: Set provider_status to "approved"
- **Suspend Providers**: Set provider_status to "suspended"
- **Reactivate Providers**: Change suspended back to approved
- **All Requests Tab**: View all requests in the system with status

#### Provider Approval Workflow
1. Provider signs up with "pending" status
2. Admin reviews provider in admin dashboard
3. Admin clicks "Approve" to enable job acceptance
4. Provider can now accept jobs

---

## User Flows

### Customer Flow
```
1. Sign Up (Customer role)
2. Dashboard → Create New Request
3. Fill request details (description, address, region, price)
4. Request appears in list with "Open" status
5. Provider accepts → status changes to "Assigned"
6. Click request → View provider details & chat
7. Provider marks complete → status changes to "Completed"
```

### Provider Flow
```
1. Sign Up (Provider role)
2. Select service regions
3. Dashboard shows "Pending Approval"
4. Admin approves account
5. "Available Jobs" tab shows open requests in regions
6. Click "Accept Request" → status changes to "Assigned"
7. Move to "My Jobs" tab
8. Chat with customer
9. Click "Mark Complete" → status changes to "Completed"
```

### Admin Flow
```
1. Sign Up (Admin role) - Must be created in database manually
2. Go to /dashboard/admin
3. Users & Providers tab → View all users
4. Find pending providers → Click "Approve"
5. Requests tab → View all requests and their status
6. Can suspend providers if needed
```

---

## Database Schema

### Profiles Table
```
id (UUID)              - Supabase auth user ID
role (enum)            - 'customer' | 'provider' | 'admin'
full_name (text)       - User's full name
phone (text, nullable) - Optional phone number
provider_status (enum) - 'pending' | 'approved' | 'suspended' (only for providers)
created_at (timestamp) - Account creation time
updated_at (timestamp) - Last update time
```

### Regions Table
```
id (int)   - Region ID
name (text) - Sofia district name (8 seeded: Lozenets, Mladost, etc.)
```

### Requests Table
```
id (UUID)                - Request ID
customer_id (UUID)       - Customer's profile ID
provider_id (UUID, null) - Assigned provider's ID
region_id (int)          - Sofia region
description (text)       - What needs to be removed
address (text)           - Full address
preferred_time (text)    - Preferred service time
price_offer (decimal)    - Price in BGN
status (enum)            - 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
created_at (timestamp)   - Request creation time
updated_at (timestamp)   - Last status update
```

### Messages Table
```
id (UUID)        - Message ID
request_id (UUID) - Associated request
sender_id (UUID)  - Who sent the message
body (text)       - Message content
created_at (timestamp) - Message timestamp
```

### Provider Regions Table
```
provider_id (UUID) - Provider's profile ID
region_id (int)    - Region they serve
Primary Key: (provider_id, region_id)
```

---

## Design & Theme

### Color Scheme
- **Primary**: Green (#10b981) - Action buttons, accents
- **Background**: Dark gray (#111827) - Main background
- **Card Background**: Darker gray (#1f2937) - Cards and containers
- **Text**: White/Light gray - Primary and secondary text
- **Accents**: Green for success, Yellow for pending, Red for errors

### Layout
- **Responsive**: Mobile-first design with breakpoints for tablet/desktop
- **Header**: Dark header with TRASHit logo and user info
- **Sidebar**: Collapsible sidebar for provider regions (desktop)
- **Cards**: Clean cards with subtle borders and shadows
- **Forms**: Dark input fields with green focus rings

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: Readable sans-serif font
- **Buttons**: Clear CTA with hover effects

---

## Technical Implementation

### Concurrency Control
Provider job acceptance uses SQL WHERE clause to prevent race conditions:
```sql
UPDATE requests 
SET provider_id = $1, status = 'assigned'
WHERE id = $2 AND status = 'open' AND provider_id IS NULL
```

This ensures only one provider can accept each job.

### Messaging Polling
Messages poll every 5 seconds:
```javascript
const interval = setInterval(async () => {
  const { data: messagesData } = await supabase
    .from('messages')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });
  setMessages(messagesData);
}, 5000);
```

### Row Level Security (RLS)
- **Profiles**: Users read all, update only their own
- **Regions**: Public read access
- **Requests**: Customers CRUD their own; providers see open/assigned; both can update status
- **Messages**: Only request participants can read/write
- **Provider Regions**: Providers manage their own

---

## Testing Checklist

### Customer Flow Test
- [ ] Sign up as Customer
- [ ] Create a request with all fields
- [ ] Request appears in dashboard with "Open" status
- [ ] Click request to view details
- [ ] Try sending a message (should fail until provider accepts)

### Provider Flow Test
- [ ] Sign up as Provider
- [ ] Select 2+ regions
- [ ] Dashboard shows "Pending Approval"
- [ ] Try to accept a job (should fail - not approved)
- [ ] (Admin approves)
- [ ] Available Jobs tab shows customer's request
- [ ] Click "Accept Request"
- [ ] Request status changes to "Assigned"
- [ ] Move to "My Jobs" tab
- [ ] Send message to customer
- [ ] Click "Mark Complete"
- [ ] Status changes to "Completed"

### Admin Flow Test
- [ ] Go to /dashboard/admin
- [ ] Users & Providers tab shows all users
- [ ] Find pending provider
- [ ] Click "Approve"
- [ ] Provider status changes to "Approved"
- [ ] Requests tab shows all requests

### Concurrency Test
- [ ] Two providers in same region
- [ ] Same open request visible to both
- [ ] First provider clicks "Accept"
- [ ] Second provider tries to accept (should fail with alert)

### Messaging Test
- [ ] Customer creates request
- [ ] Provider accepts
- [ ] Customer sends message
- [ ] Wait 5 seconds
- [ ] Provider sees message
- [ ] Provider replies
- [ ] Wait 5 seconds
- [ ] Customer sees reply

---

## Deployment

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup
1. Create Supabase project
2. Run `docs/schema.sql` in SQL Editor
3. Verify 8 regions are seeded
4. Create admin user manually in profiles table

### Running Locally
```bash
pnpm install
pnpm dev
# Open http://localhost:3000
```

---

## Future Enhancements

1. **Ratings & Reviews** - Customer can rate provider after completion
2. **Provider Profiles** - Bio, portfolio, ratings, response time
3. **Payment Integration** - Stripe for secure payments
4. **Real-time Notifications** - Supabase Realtime for instant updates
5. **Email Notifications** - SendGrid for email alerts
6. **Request Cancellation** - Allow cancelling open/assigned requests
7. **Provider Availability** - Set working hours and availability
8. **Search & Filtering** - Advanced search by category, price range
9. **Analytics Dashboard** - Admin stats on requests, providers, revenue
10. **Mobile App** - React Native version for iOS/Android

---

## Support & Troubleshooting

### Common Issues

**"Request not found"**
- Verify request ID in URL
- Check request exists in database
- Ensure you're logged in as correct user

**"Cannot accept job"**
- Check provider status is "approved"
- Verify request is still "open" status
- Check request is in your selected regions

**Messages not updating**
- Wait 5 seconds for poll
- Refresh page manually
- Check Supabase connection

**Admin dashboard not accessible**
- Verify user role is "admin" in profiles table
- Check you're logged in
- Navigate directly to /dashboard/admin

### Database Debugging

View all requests:
```sql
SELECT id, customer_id, provider_id, status, description FROM requests;
```

View all providers and status:
```sql
SELECT id, full_name, role, provider_status FROM profiles WHERE role = 'provider';
```

View messages for a request:
```sql
SELECT * FROM messages WHERE request_id = 'request-id-here' ORDER BY created_at;
```

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                              # Home/landing
│   ├── auth/
│   │   ├── signup/page.tsx                  # Signup with role selector
│   │   └── signin/page.tsx                  # Login
│   └── dashboard/
│       ├── page.tsx                         # Dashboard router
│       ├── admin/page.tsx                   # Admin dashboard
│       ├── customer/
│       │   ├── page.tsx                     # Customer dashboard
│       │   ├── new-request/page.tsx         # Create request
│       │   └── request/[id]/page.tsx        # Request details
│       └── provider/
│           ├── page.tsx                     # Provider dashboard
│           └── request/[id]/page.tsx        # Request details
├── contexts/
│   └── AuthContext.tsx                      # Auth state
├── components/
│   └── ProtectedRoute.tsx                   # Route protection
└── lib/
    ├── supabase.ts                          # Supabase client
    └── database.types.ts                    # TypeScript types

docs/
└── schema.sql                               # Database schema
```

---

## Contact & Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase documentation: https://supabase.com/docs
3. Check Next.js docs: https://nextjs.org/docs
4. Review TypeScript docs: https://www.typescriptlang.org/docs
