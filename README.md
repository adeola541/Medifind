# MediFind: Hyper-Local Pharmacy Aggregator & Price Comparison

MediFind is a full-stack platform designed to connect users with the best pharmacy options based on price, distance, and reliability. This project is architected to handle real-time pharmacy discovery, verified partner data enrichment, and seamless order management.

---

## Project Architecture

For any AI agent/IDE exploring this codebase, here is the high-level layout:

### 1. [backend/](file:///media/fortune/30326D63326D2ED2/Medifind/backend) (Express.js API)
The core logic and data layer.
- **ORM**: Prisma with PostgreSQL.
- **Schema**: Defined in [schema.prisma](file:///media/fortune/30326D63326D2ED2/Medifind/backend/prisma/schema.prisma).
- **Core Controllers**:
    - `pharmacyController`: Handles Foursquare proxy discovery and local DB matching.
    - `drugController`: Implements the **Smart Match** scoring algorithm.
    - `orderController`: Manages the lifecycle of medicine orders.
- **Auth**: JWT-based authentication with role-based access control (USER, PHARMACY_ADMIN, SUPER_ADMIN).

### 2. [medifind-app/](file:///media/fortune/30326D63326D2ED2/Medifind/medifind-app) (Expo/React Native)
The user-facing mobile application.
- **Routing**: Expo Router (File-based).
- **States**: Uses React Hooks for location tracking and real-time polling.
- **API Connectivity**: Centralized in [services/api.ts](file:///media/fortune/30326D63326D2ED2/Medifind/medifind-app/services/api.ts).

### 3. [web/](file:///media/fortune/30326D63326D2ED2/Medifind/web) (React Dashboard)
Administrative interface for pharmacy owners to manage inventory and for super-admins to verify partners.

---

## Core Domain Context

### Discovery vs. Partners
- **Discovery**: Real-time pharmacy locations fetched via **Foursquare Places API**. These are external entities.
- **Partners**: Pharmacies that have registered on the platform. They have verified stocks, prices, and ratings in our PostgreSQL DB.
- **The "Enrichment" Flow**: When a user discovery nearby pharmacies, we match their `foursquare_id` against our DB to highlight "Verified Partners" and display their real product pricing.

### Smart Match Algorithm
The system ranks results using a weighted score:
`Score = (Price * 0.5) + (Distance * 0.3) - (Rating * 0.2)`
This ensures users find the best value, not just the closest or cheapest option.

---

## Tech Stack & Key Integrations

- **Infrastructure**: Hosted on **Railway** (Automated Nixpacks builds).
- **External APIs**:
    - **Foursquare**: Pharmacy discovery (Proxying through backend to bypass CORS).
    - **LocationIQ**: Reverse geocoding for user address display.
- **Environment**: Node.js 20.x+

---

## Development Quick Start

### 1. Run the Backend
```bash
cd backend
npm install
npm start # External port is 5000
```

### 2. Run the Mobile App
```bash
cd medifind-app
npm install
npx expo start # Use 'w' for web or 'a' for android
```

---