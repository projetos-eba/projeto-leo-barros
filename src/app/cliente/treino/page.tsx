import { fetchClientWorkout } from "@/lib/clients/workout-data";

import { ClientWorkoutView } from "./client-workout-view";

export const dynamic = "force-dynamic";

export default async function ClienteTreinoPage() {
  const workout = await fetchClientWorkout();

  return <ClientWorkoutView workout={workout} />;
}
