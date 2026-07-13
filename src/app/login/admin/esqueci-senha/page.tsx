import { ForgotPasswordView } from "@/components/auth/forgot-password-view";

export default function AdminForgotPasswordPage() {
  return (
    <ForgotPasswordView
      backHref="/login/admin"
      expectedRole="admin"
      roleLabel="Admin"
    />
  );
}
