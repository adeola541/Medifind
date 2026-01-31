# MediFind Backend API

This is the Node.js/Express backend for the MediFind project. It uses Prisma with PostgreSQL and handles authentication, pharmacy management, and drug inventory.

## 🚀 Deployment Guide (Railway)

This project is optimized for deployment on [Railway](https://railway.app/).

### 1. Prerequisites
- **Railway CLI**: Install it using `npm i -g @railway/cli`.
- **Railway Account**: Log in via `railway login`.

### 2. Initial Deployment

1.  **Initialize Project**
    Navigate to the backend folder and initialize a Railway project:
    ```bash
    railway init
    ```
    *Select "Create New Project" or "Connect to Existing Project".*

2.  **Add a Database**
    - Run `railway add` and select **PostgreSQL**.
    - This will automatically create a database service and link the credentials.

3.  **Configure Environment Variables**
    Run the following command to open the Railway dashboard or set variables via CLI:
    ```bash
    railway open
    ```
    Go to the **Variables** tab for your backend service and add:

    | Variable | Description | Example Value |
    | :--- | :--- | :--- |
    | `DATABASE_URL` | *Auto-set by Railway Postgres* | `postgresql://...` |
    | `JWT_SECRET` | Secret key for signing tokens | `superseqretkey123` |
    | `PORT` | Port to run on (Railway default) | `3000` |
    | `LOCATIONIQ_KEY` | API Key for location services | `your_locationiq_key` |

4.  **Deploy**
    This project uses **Nixpacks** (automatic buildpacks). Ensure your `package.json` includes the `engines` field for Node 20.
    ```bash
    railway up
    ```

### 3. Database Migrations (Production)
⚠️ **Critical Step**: Your deployed application will fail if the database schema works locally but hasn't been applied to the live database.

**To apply your Prisma Schema to the Production Database:**

We use the `railway run` command. This executes the command on your **local machine**, but injects the **production environment variables** (like `DATABASE_URL`) from Railway.

1.  **Open your terminal** in the `backend/` directory.
2.  **Ensure you are logged in**: `railway login`
3.  **Run the push command**:
    ```bash
    railway run npx prisma db push
    ```
    *Note: If prompted to select a service, choose **medifind-api** (your backend service).*
    *You should see output indicating that the database is being synchronized.*

**Alternative: Automatic Migration (Optional)**
You can also set the *Start Command* in Railway Settings to:
`npx prisma db push && node src/server.js`
*This will try to update the database every time the server starts, which is convenient for simple updates.*

### 4. Updating the Service
To redeploy changes:
```bash
git add .
git commit -m "Update backend"
railway up
```

## 🛠️ Local Development
1.  Copy `.env` variables:
    ```bash
    DATABASE_URL="postgresql://user:password@localhost:5432/medifind"
    JWT_SECRET="dev-secret"
    ```
2.  Install dependencies: `npm install`
3.  Run migrations: `npx prisma db push`
4.  Start server: `npm run dev`