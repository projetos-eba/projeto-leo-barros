// Compatibility entry point. Domain consumers import from ./_actions/<domain>.
export {
  createClientAppointment,
  createClientTask,
  setClientTaskCompleted,
} from "./_actions/overview";
export * from "./_actions/legacy";
