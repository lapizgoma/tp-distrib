const HEARTBEAT_EVERY_MS = 3000;

// Espera sin dejar que Kafka nos de por muertos: durante un reintento largo
// hay que avisar al broker cada pocos segundos, o saca al consumidor del grupo.
export async function sleepWithHeartbeat(ms, heartbeat) {
  let remaining = ms;
  while (remaining > 0) {
    const slice = Math.min(remaining, HEARTBEAT_EVERY_MS);
    await new Promise((resolve) => setTimeout(resolve, slice));
    remaining -= slice;
    await heartbeat();
  }
}