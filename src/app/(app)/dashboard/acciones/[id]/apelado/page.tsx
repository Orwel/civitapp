import { ActionStateOverview } from "@/components/features/actions/ActionStateOverview";
import { loadActionStatePage } from "@/lib/loadActionStatePage";

export default async function ApeladoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { action, publicAction, signatures, isLeader } = await loadActionStatePage(
    id,
    "APELADO"
  );

  return (
    <ActionStateOverview
      action={action}
      publicAction={publicAction}
      isLeader={isLeader}
      signatures={signatures}
    />
  );
}
