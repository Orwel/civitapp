import Link from "next/link";

export function ActionAuxLinks({
  actionId,
  slug,
}: {
  actionId: string;
  slug: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/acciones/${slug}`}
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
      >
        Vista pública
      </Link>
      <Link
        href={`/dashboard/acciones/${actionId}/chat`}
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
      >
        Chat del equipo
      </Link>
      <Link
        href={`/dashboard/acciones/${actionId}/events`}
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
      >
        Bitácora
      </Link>
      <Link
        href={`/dashboard/acciones/${actionId}/meetups`}
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
      >
        Eventos
      </Link>
    </div>
  );
}
