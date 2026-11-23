import LeadsPageContent from "@/components/crm/LeadsPageContent";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  pageSize?: string;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <LeadsPageContent mode="all" searchParams={searchParams} />;
}
