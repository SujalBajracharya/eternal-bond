# Running the Eternal Bond Matrimonial Platform

This guide outlines how to configure and run the **Database**, **Backend (Spring Boot)**, and **Frontend (Vite + React)** components of the project.

---

## ⚠️ Important: Port Conflict Notice
By default:
* The Frontend is configured to run on port **8080** (in `vite.config.ts`).
* The Backend is configured to run on port **8081** (in `application.properties`).

**To run both concurrently on your local machine, you must change one of the ports.** We recommend changing the backend server port to **8081**:
1. Open `eternal-bond-backend/src/main/resources/application.properties`
2. Change `server.port=8080` to `server.port=8081`

---

## 1. Prerequisites
Ensure you have the following installed on your machine:
* **Java Development Kit (JDK) 17** (Verify with `java -version`)
* **Maven** (Verify with `mvn -version`)
* **Node.js** (v18+) or **Bun** (Verify with `node -v` or `bun -v`)
* **Docker Desktop** (Required only if running the database locally via Supabase CLI)

---

## 2. Database Setup

You can run the database in two ways: **Locally** using Supabase CLI and Docker, or **Remotely** using a hosted Supabase cloud project.

### Option A: Local Database (Supabase CLI + Docker)
If you want to run the database entirely on your local machine:
1. Make sure **Docker Desktop** is open and running.
2. In your terminal, navigate to the root directory and start the local Supabase environment:
   ```bash
   supabase start
   ```
3. Once started, Supabase will output your local service URLs and keys. Note the local credentials:
   * **GraphQL / API URL**: `http://127.0.0.1:54321`
   * **DB Connection String**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
   * **JWT Secret**: Used for backend API validation (typically `super-secret-jwt-key-with-at-least-32-characters`).
4. Apply the database schemas and migrations:
   ```bash
   supabase db reset
   ```

### Option B: Remote Cloud Database (Supabase Cloud)
If you are using a cloud-hosted project:
1. Go to your [Supabase Dashboard](https://supabase.com) and create or select your project.
2. Extract the SQL migrations in `./supabase/migrations` and apply them to your database using the Supabase SQL editor, or run them from the CLI:
   ```bash
   supabase db push --db-url "YOUR_SUPABASE_TRANSACTION_CONNECTION_POOLING_STRING"
   ```

---

## 3. Running the Backend (Spring Boot)

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd eternal-bond-backend
   ```
2. Configure the database connection environment variables in your terminal (or edit `src/main/resources/application.properties` directly):
   * **Windows (PowerShell)**:
     ```powershell
     $env:SUPABASE_DB_HOST="localhost" # Or your cloud DB host URL
     $env:SUPABASE_DB_USER="postgres" # Or cloud DB username
     $env:SUPABASE_DB_PASSWORD="your-db-password"
     $env:SUPABASE_JWT_SECRET="your-supabase-jwt-secret"
     ```
   * **Windows (CMD)**:
     ```cmd
     set SUPABASE_DB_HOST=localhost
     set SUPABASE_DB_USER=postgres
     set SUPABASE_DB_PASSWORD=your-db-password
     set SUPABASE_JWT_SECRET=your-supabase-jwt-secret
     ```
3. Run the Spring Boot application:
   ```bash
   mvn clean spring-boot:run
   ```
   Alternatively, you can build a JAR and run it:
   ```bash
   mvn clean package
   java -jar target/api-0.0.1-SNAPSHOT.jar
   ```

---

## 4. Running the Frontend (Vite + React)

1. Navigate to the root directory.
2. Check your `.env` file in the root to ensure it points to the correct Supabase API URL and keys:
   ```env
   VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
   ```
   *(If you are running the database locally via Supabase CLI, update these to point to your local endpoints, e.g. `http://127.0.0.1:54321`)*.
3. Install frontend dependencies:
   ```bash
   npm install
   # Or if you prefer Bun
   bun install
   ```
4. Run the development server:
   ```bash
   npm run dev
   # Or if using Bun
   bun dev
   ```
5. Open your browser and go to `http://localhost:8080`.
