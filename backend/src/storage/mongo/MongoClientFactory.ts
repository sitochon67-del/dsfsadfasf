/**
 * MongoClientFactory — stub vacío.
 * MongoDB fue eliminado. Todo el almacenamiento se maneja
 * en memoria a través de FirebaseService y StorageService.
 */

export async function getMongoClient(): Promise<never> {
  throw new Error("MongoDB no está en uso. Use StorageService/FirebaseService en su lugar.");
}

export async function getMongoDb(): Promise<never> {
  throw new Error("MongoDB no está en uso. Use StorageService/FirebaseService en su lugar.");
}
