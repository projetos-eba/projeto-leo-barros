// Compatibility entry point. New consumers should import from ./_actions/clinical.
export {
  saveClientAnamnesisEntry,
  saveClientPrescriptionNote,
  sendExistingFormToClient,
  setClientPrescriptionStatus,
  type ClinicalActionResult,
} from "./_actions/clinical";
