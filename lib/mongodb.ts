import { MongoClient, type Collection, type Document } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
  mongoIndexesPromise?: Promise<void>;
};

function getClient() {
  if (!globalForMongo.mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not configured.");
    globalForMongo.mongoClientPromise = new MongoClient(uri).connect();
  }
  return globalForMongo.mongoClientPromise;
}

export async function getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  const client = await getClient();
  const db = client.db(process.env.MONGODB_DATABASE || "fastvpn");
  if (!globalForMongo.mongoIndexesPromise) {
    globalForMongo.mongoIndexesPromise = Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("users").createIndex({ id: 1 }, { unique: true }),
      db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
      db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("subscriptions").createIndex({ userId: 1 }, { unique: true }),
      db.collection("devices").createIndex({ id: 1 }, { unique: true }),
      db.collection("devices").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("payments").createIndex({ orderId: 1 }, { unique: true }),
      db.collection("payments").createIndex({ userId: 1, createdAt: -1 }),
    ]).then(() => undefined);
  }
  await globalForMongo.mongoIndexesPromise;
  return db.collection<T>(name);
}
