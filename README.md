# UhvatiBus – Full-Stack Bus Reservation System

## Overview

**UhvatiBus** is a full-stack web application that allows **bus companies** to publish and manage scheduled trips, and enables **users** to search for and book seats on available bus routes.

## Problem

### For Users:

- Finding available intercity bus trips is often complicated (websites, call centers, printed schedules)
- Booking a seat requires manual calls or visiting terminals and sometimes impossible
- Users rarely get clear seat assignments or confirmations

### For Companies:

- Managing reservations is error-prone when done manually
- Avoiding overbooking and scheduling conflicts is difficult without a centralized system
- Communication about bookings and cancellations takes time and resources

## Solution

### Users Can:

- Search for available bus trips based on **departure**, **destination**, and **date**
- Book one or more seats and receive an email **confirmation**
- Get **assigned seat numbers** automatically

### Companies Can:

- **Create accounts** and log in securely
- Define their **routes**, **cities**, **trip schedules**, and **available seats**
- Prevent **duplicate or overlapping trips**
- Manage their **reservations** and **trip listings** easily

## Technologies Used

### Frontend:

- **Next.js App Router (React)** – UI rendering, routing, and SSR
- **Tailwind and SAAS** – Styling
- **Zod** – Client-side validation for form inputs

### Backend:

- **Next.js API routes (`/app/api`)** – Controller layer handling RESTful logic
- **Prisma ORM** – Database access and schema modeling
- **PostgreSQL** – Relational database
- **Zod** – Request validation on the backend
- **Bcrypt & JWT** – Secure authentication and session management

### Testing:

- **Jest** & **Supertest** – Automated API testing
- **In-memory test server** – Simulates real HTTP requests
