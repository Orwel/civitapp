import { ActionStateOverview } from "@/components/features/actions/ActionStateOverview";
import { loadActionStatePage } from "@/lib/loadActionStatePage";

export default async function EnEsperaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { action, publicAction, signatures, isLeader, actionType, milestones } = await loadActionStatePage(
    id,
    "EN_ESPERA_DE_OTRO_PROCESO"
  );

  return (
    <ActionStateOverview
      action={action}
      publicAction={publicAction}
      isLeader={isLeader}
      signatures={signatures}
      actionType={actionType}
      milestones={milestones}
    />
  );
}
