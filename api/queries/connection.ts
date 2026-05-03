import { MongoClient, Db } from "mongodb";
import { env } from "../lib/env";

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function getDb(): Promise<Db> {
  if (dbInstance) return dbInstance;

  const uri = env.databaseUrl;
  if (!uri) {
    throw new Error("DATABASE_URL is not set in environment");
  }

  client = new MongoClient(uri);
  await client.connect();
  dbInstance = client.db("wedding_planner");
  return dbInstance;
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
  }
}
