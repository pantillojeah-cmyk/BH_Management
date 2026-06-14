# Boarding House Vacancy Tracker — Build Plan

## Overview
Build a modern, responsive web-based Boarding House Vacancy Tracker for ZDSPGC-Dimataling Campus with three roles (Admin, Owner, Customer), real-time vacancy updates, photo uploads, inquiry system, and PDF reporting.

## Phase 1: Foundation & Public Surface
1. **Design System** — Campus Green & Warm palette, semantic tokens in `src/styles.css`, dark mode toggle, custom shadcn variants (hero, dashboard-card, badge variants).
2. **Database Schema** — Migration creating:
   - `profiles` (linked to `auth.users`)
   - `user_roles` enum/table for RBAC (admin, owner, customer)
   - `boarding_houses` with owner FK, approval status, address/landmark/distance/photos
   - `rooms` with vacancy status, price, capacity
   - `inquiries` (customer → owner messaging)
   - `favorites` (customer bookmarks)
   - `activity_logs` (admin audit trail)
   - All tables get GRANTs + RLS + policies.
3. **Auth** — Email/password + Google OAuth (configure same turn). Register/login pages with role selection. Auto-create profile on signup. Password reset with `/reset-password` page.
4. **Public Landing** — Hero section for ZDSPGC-Dimataling, featured boarding houses, search bar, navigation to customer browse.
5. **Customer Browse** — Searchable, filterable listing grid (price range, vacancy status, distance from campus, boarding house type). Only approved listings visible.

## Phase 2: Owner Dashboard
1. **Owner Registration Flow** — Sign up as owner, pending approval by admin.
2. **Owner Dashboard** — Stats cards (total rooms, vacant, occupied, inquiries). Sidebar navigation.
3. **Boarding House Management** — CRUD for boarding house info (name, address, landmark, description, contact, distance in meters/km, photos via Supabase Storage).
4. **Room Management** — Add/edit/delete rooms, set monthly rent, capacity, toggle vacancy/occupied status.
5. **Inquiry Management** — View customer inquiries, see contact details, mark as responded.
6. **Profile Settings** — Update owner profile.

## Phase 3: Customer Features
1. **Boarding House Detail Page** — Photos carousel, room list with availability & pricing, contact info, landmark, description.
2. **Inquiry Form** — Send inquiry to owner (stored in DB), owner contact revealed.
3. **Favorites** — Save/unsave boarding houses, view favorites list.
4. **Inquiry History** — View past inquiries with status.
5. **Profile Management** — Update customer profile.

## Phase 4: Admin Dashboard & Reporting
1. **Admin Dashboard** — Stats overview (total boarding houses, owners, customers, vacant/occupied rooms).
2. **Owner Management** — Approve/reject owner registrations, edit/delete owners.
3. **Listing Moderation** — Approve/reject boarding house listings.
4. **Customer Management** — View all customers.
5. **Activity Logs** — System-wide audit trail.
6. **Reports** — Vacancy reports, owner reports, customer reports with printable PDF export.

## Technical Details
- **Frontend**: React 19 + TanStack Router + Tailwind CSS v4 + shadcn/ui + Recharts for stats.
- **Backend**: Lovable Cloud (PostgreSQL, Auth, Storage, Realtime).
- **Server Functions**: `createServerFn` for all DB operations; `requireSupabaseAuth` for authenticated actions; `supabaseAdmin` loaded inside handlers for admin/elevated ops.
- **File Storage**: Supabase Storage bucket for boarding house photos.
- **Realtime**: `postgres_changes` subscriptions for vacancy status updates so dashboards refresh automatically.
- **PDF Reports**: Client-side PDF generation for reports.
- **Dark Mode**: CSS custom properties + `dark` class toggle, persisted in localStorage.
- **SEO**: Per-route `head()` with unique titles/descriptions/OG tags.

## Role Routing
- Public routes: `/`, `/boarding-houses`, `/boarding-houses/$id`
- Auth routes: `/auth`, `/reset-password`
- Customer routes: `/_authenticated/customer/*`
- Owner routes: `/_authenticated/owner/*`
- Admin routes: `/_authenticated/admin/*`

## Key UI Patterns
- Sidebar nav for Admin and Owner dashboards (collapsible icon variant).
- Card-based dashboard stats with icon accents.
- Data tables with pagination for listings, users, inquiries.
- Toast notifications for CRUD feedback (Sonner).
- Mobile-first responsive with bottom nav for customer mobile view.
