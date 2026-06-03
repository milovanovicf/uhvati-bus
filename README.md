# UhvatiBus – Full-Stack Bus Reservation System

## Overview

**UhvatiBus** is a full-stack web application for the Serbian market that allows **bus companies** to publish and manage scheduled trips, enables **passengers** to search for and book seats (one-way or round-trip), and gives **administrators** control over which companies operate on the platform.

## Problem

### For Passengers:

- Finding available intercity bus trips is often complicated (websites, call centers, printed schedules)
- Booking a seat requires manual calls or visiting terminals and is sometimes impossible
- Passengers rarely get clear seat assignments or confirmations
- Round trips mean two separate, disconnected searches and bookings

### For Companies:

- Managing reservations is error-prone when done manually
- Avoiding overbooking and scheduling conflicts is difficult without a centralized system
- Communication about bookings and cancellations takes time and resources
- No visibility into route performance and occupancy

### For the Platform:

- No control over who can publish trips — anyone could create a company account

## Solution

### Passengers Can:

- Search for available bus trips by **departure**, **destination**, and **date**
- Book one or more seats and receive an email **confirmation** with a booking reference
- Get **assigned seat numbers** automatically (no double-booking)
- Book a **round trip** via a multi-step flow — pick outbound, then optionally pick a return trip; both confirmed in a single email
- **Manage their reservation** from an emailed link: cancel anytime, or **change the date** (locked within 24h of departure)
- Add a **return ticket later** from a dedicated link in the confirmation email

### Companies Can:

- **Register accounts** with email verification, then log in securely
- Define their **routes**, **cities**, **trip schedules**, and **available seats**
- Create **recurring trips** (e.g. daily / weekday schedules) in one action
- Prevent **duplicate or overlapping trips**
- Manage their **reservations** and **trip listings**
- View a **statistics dashboard** — monthly trips/bookings/seats sold, average occupancy, per-route performance, upcoming departures, and recent reservations

### Administrators Can:

- Log into a dedicated **admin panel** (`/admin`)
- **Approve** new company accounts before they can operate
- **Enable / disable / delete** company accounts
- New companies start as `PENDING` and cannot access their dashboard, create trips, or log in until approved

## Key Features

- **SEO-friendly route URLs** — `/rute/beograd/novi-sad/2026-06-04` instead of query params, with dynamic page metadata, Schema.org JSON-LD (BreadcrumbList + Service), `sitemap.xml`, and `robots.txt`
- **Round-trip booking** with a multi-step selection flow on the results page
- **Reservation self-service** — token-signed links for cancellation and date changes (24h cutoff)
- **Company approval workflow** — `PENDING` / `ACTIVE` / `DISABLED` account states gated by an admin
- **Company statistics dashboard** — occupancy bars, route performance, recent activity
- **Internationalization** — full Serbian (sr-Latn) and English support
- **Email** — verification codes, booking confirmations, and round-trip confirmations via Resend

## Technologies Used

### Frontend:

- **Next.js 15 App Router (React 19)** – UI rendering, routing, SSR, and Server Actions
- **Tailwind CSS 4** + **Shadcn/UI** (Radix primitives) – Styling and components
- **Luxon** – Timezone-aware date/time formatting (Europe/Belgrade)
- **Zod** – Client-side validation for form inputs

### Backend:

- **Next.js API routes (`/app/api`)** – RESTful endpoints (login, register, admin, trips, cities, routes)
- **Next.js Server Actions (`/app/actions.ts`)** – Centralized mutation logic
- **Prisma 7 ORM** with the **Neon serverless adapter** – Database access and schema modeling
- **PostgreSQL** (Neon) – Relational database
- **Zod** – Request validation on the backend
- **Bcrypt & JWT** – Secure authentication and session management
- **Resend** – Transactional email delivery

### Hosting:

- **Vercel** – App hosting and serverless functions
- **Neon** – Managed serverless PostgreSQL

### Testing:

- **Jest** & **Supertest** – Automated API testing
- **In-memory test server** – Simulates real HTTP requests

## Data Model

`Company` (status: PENDING/ACTIVE/DISABLED) → owns `Route`s (City→City) → owns `Trip`s (scheduled departures) → has `Reservation`s. A round-trip return reservation links to its outbound via the `returnOf` booking reference.

## Environment Variables

```
DATABASE_URL          # Neon PostgreSQL connection string
JWT_SECRET            # secret for signing company + admin + reservation tokens
RESEND_API_KEY        # Resend API key for transactional email
NEXT_PUBLIC_BASE_URL  # public site URL (used in emails, sitemap, canonical URLs)
ADMIN_EMAIL           # hardcoded admin panel login email
ADMIN_PASSWORD        # hardcoded admin panel login password
```

## Getting Started

```bash
npm install                    # installs deps + runs prisma generate (postinstall)
npx prisma migrate deploy      # apply migrations to the database
npx prisma db seed             # seed cities (optional)
npm run dev                    # start dev server
```

Admin panel: visit `/admin/login` and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
