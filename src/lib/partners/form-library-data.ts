import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";
import type { PartnerFormQuestionDraft, PartnerFormTemplate } from "./form-library";

export async function fetchPartnerFormLibrary(): Promise<PartnerFormTemplate[]> {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();
  if (!profile || profile.role !== "parceiro") return [];
  const { data: partner, error: partnerError } = await supabase.from("partners").select("id").eq("profile_id", profile.id).maybeSingle();
  if (partnerError) throw new Error("partner_forms_partner_unavailable");
  if (!partner) return [];
  const [templatesResult, versionsResult, assignmentsResult, assignedResult] = await Promise.all([
    supabase.from("partner_form_templates").select("id,title,description,default_message,status,updated_at").eq("partner_id", partner.id).order("updated_at", { ascending: false }),
    supabase.from("partner_form_template_versions").select("template_id,version_number,questions_snapshot").eq("partner_id", partner.id).order("version_number", { ascending: false }),
    supabase.from("partner_form_assignments").select("id,template_id").eq("partner_id", partner.id),
    supabase.from("partner_form_assignment_clients").select("assignment_id,status").eq("partner_id", partner.id),
  ]);
  if (templatesResult.error || versionsResult.error || assignmentsResult.error || assignedResult.error) {
    throw new Error("partner_forms_library_unavailable");
  }
  const templates = templatesResult.data;
  const versions = versionsResult.data;
  const assignments = assignmentsResult.data;
  const assigned = assignedResult.data;
  return (templates ?? []).map((template) => {
    const version = (versions ?? []).find((item) => item.template_id === template.id);
    const templateAssignments = (assignments ?? []).filter((item) => item.template_id === template.id);
    const assignmentIds = new Set(templateAssignments.map((item) => item.id));
    const recipients = (assigned ?? []).filter((item) => assignmentIds.has(item.assignment_id));
    const questions = Array.isArray(version?.questions_snapshot) ? version.questions_snapshot as unknown as PartnerFormQuestionDraft[] : [];
    return { defaultMessage: template.default_message, description: template.description, id: template.id, questionCount: questions.length, questions, responseCount: recipients.filter((item) => item.status === "submitted").length, sendCount: recipients.length, status: template.status as PartnerFormTemplate["status"], title: template.title, updatedAt: template.updated_at, version: version?.version_number ?? 0 };
  });
}
