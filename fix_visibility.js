import pg from 'pg';

const config = {
  host: 'aws-1-ap-southeast-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.tTwSzkjudvxmmeqbkzfiy', // wait, let's make sure it's the exact same username
  password: '@dmin@mail.com956',
  ssl: {
    rejectUnauthorized: false
  }
};

// Let's print config for double check, wait, let's copy the username correctly: postgres.twszkjudvxmmeqbkzfiy
config.user = 'postgres.twszkjudvxmmeqbkzfiy';

const client = new pg.Client(config);

async function run() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL database successfully!");

  try {
    console.log("Adding photo_visibility...");
    await client.query("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_visibility varchar(255);");
    await client.query("UPDATE public.profiles SET photo_visibility = 'everyone' WHERE photo_visibility IS NULL;");
    await client.query("ALTER TABLE public.profiles ALTER COLUMN photo_visibility SET NOT NULL;");
    await client.query("ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS photo_visibility_check;");
    await client.query("ALTER TABLE public.profiles ADD CONSTRAINT photo_visibility_check CHECK (photo_visibility IN ('everyone','verified_only','matches_only','premium_only'));");
    console.log("photo_visibility added successfully.");

    console.log("Adding profile_visibility...");
    await client.query("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_visibility varchar(255);");
    await client.query("UPDATE public.profiles SET profile_visibility = 'everyone' WHERE profile_visibility IS NULL;");
    await client.query("ALTER TABLE public.profiles ALTER COLUMN profile_visibility SET NOT NULL;");
    await client.query("ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profile_visibility_check;");
    await client.query("ALTER TABLE public.profiles ADD CONSTRAINT profile_visibility_check CHECK (profile_visibility IN ('everyone','verified_only','matches_only','premium_only'));");
    console.log("profile_visibility added successfully.");

    console.log("All database migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

run();
