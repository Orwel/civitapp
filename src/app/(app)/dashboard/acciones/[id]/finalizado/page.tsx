import { ActionStateOverview } from "@/components/features/actions/ActionStateOverview";
import { loadActionStatePage } from "@/lib/loadActionStatePage";

export default async function FinalizadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { action, publicAction, signatures, isLeader, actionType, milestones } = await loadActionStatePage(
    id,
    "FINALIZADO"
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
