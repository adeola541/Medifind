# MediFind Admin Dashboard

Welcome to the **MediFind Admin Dashboard**. This platform allows Pharmacy Administrators and System Super Admins to manage the MediFind ecosystem efficiently.

## 🔗 Access the Dashboard
**Live URL:** [https://medifind-dashboard-production.up.railway.app/](https://medifind-dashboard-production.up.railway.app/)

---

## 🏥 Guide for Pharmacy Admins

As a Pharmacy Admin, you can manage your pharmacy's incoming orders, inventory, and profile details.

### 1. Logging In
- Use your registered email and password to sign in.
- Once logged in, you will be directed to the **Pharmacy Dashboard**.

### 2. Managing Orders
Navigate to the **Orders** section to view customer requests.
- **Incoming Orders**: New orders appear as `PENDING`.
- **Actions**:
    - **Confirm**: Accept the order and prepare it for pickup/delivery.
    - **Cancel**: Reject the order if stock is unavailable.
    - **Mark Completed**: Once the customer receives the order, mark it as `COMPLETED`.

### 3. Inventory Management
- Go to the **Inventory** tab to view your current list of drugs and prices.
- *(Future Update)*: You will be able to add new drugs and update stock levels here.

### 4. Pharmacy Profile
- View your **Pharmacy Profile** to check your registered address, contact info, and approval status.
- To update these details, please contact a Super Admin.

---

## 🛡️ Guide for Super Admins

As a Super Admin, you have full oversight of the platform's users and pharmacies.

### 1. Managing Pharmacies
Navigate to the **Pharmacy Management** page.
- **View All**: See a list of all registered pharmacies.
- **Approvals**:
    - **Approve**: Grant a new pharmacy access to the system.
    - **Revoke**: Remove a pharmacy's access if they violate guidelines.
- **Status Indicators**: Easily see which pharmacies are `Approved` (Green) or `Pending` (Yellow).

### 2. User Management
Navigate to the **User Management** page.
- **View Users**: See all registered users (Customers, Admins).
- **Control Access**:
    - **Block**: Temporarily disable a suspicious or abusive user account.
    - **Unblock**: Restore access to a previously blocked user.

---

## 🛠️ Developer Guide

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Language**: TypeScript

### Local Development
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000`.

### 🚀 Deployment (Railway)
This project is configured for **Railway Nixpacks**.
1.  Ensure `package.json` has `engines` set to `node: 20.x`.
2.  Deploy via CLI:
    ```bash
    railway up
    ```

---

## ❓ Need Help?
If you encounter any technical issues or need assistance, please contact the development team or file a support ticket.
