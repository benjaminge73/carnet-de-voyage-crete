// Barrel module: keeps the historical `@/data/trip` import path stable.
// Types and shared constants live in trip.types.ts; the TRIP object lives in trip.data.ts.
export * from "./trip.types";
export { TRIP } from "./trip.data";
