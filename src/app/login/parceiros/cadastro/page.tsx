import { PartnerSignupView } from "@/components/auth/partner-signup-view";

type PartnerSignupPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function PartnerSignupPage({
  searchParams,
}: PartnerSignupPageProps) {
  const params = await searchParams;
  const safeNext = params?.next?.startsWith("/") && !params.next.startsWith("//")
    ? params.next
    : undefined;

  return <PartnerSignupView next={safeNext} />;
}
