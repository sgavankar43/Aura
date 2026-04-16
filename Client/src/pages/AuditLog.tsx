import { Activity, ChevronLeft, ChevronRight, FileEdit, Flag, PlusSquare, Zap } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PageLoader } from '@/components/feedback/PageLoader';
import { Button } from '@/components/ui/Button';
import { useAuditLogs } from '@/hooks/queries';
import type { AuditLogEntry, Project } from '@/types/domain';

function getLogIcon(action: string) {
  switch (action) {
    case 'flag.toggled':
      return <Zap className="h-5 w-5 text-accent" />;
    case 'feature.created':
      return <Flag className="h-5 w-5 text-success" />;
    case 'project.created':
      return <PlusSquare className="h-5 w-5 text-primary" />;
    default:
      return <FileEdit className="h-5 w-5 text-muted-foreground" />;
  }
}

function formatMessage(log: AuditLogEntry) {
  const meta = log.metadata ?? {};

  switch (log.action) {
    case 'flag.toggled': {
      const enabled = meta['enabled'] as boolean | undefined;
      const featureKey = meta['featureKey'] as string | undefined;
      const envSlug = meta['envSlug'] as string | undefined;
      return (
        <>
          Toggled <span className="rounded bg-muted px-1 font-mono">{featureKey ?? '?'}</span> to{' '}
          <span className={`font-medium ${enabled ? 'text-success' : 'text-muted-foreground'}`}>
            {enabled ? 'ON' : 'OFF'}
          </span>
          {envSlug ? <> in {envSlug}</> : null}
        </>
      );
    }
    case 'feature.created': {
      const featureKey = meta['featureKey'] as string | undefined;
      return (
        <>
          Created feature{' '}
          <span className="rounded bg-muted px-1 font-mono">{featureKey ?? '?'}</span>
        </>
      );
    }
    case 'project.created':
      return <>Created the project</>;
    default:
      return <span className="text-muted-foreground">{log.action}</span>;
  }
}

export default function AuditLog() {
  const { project } = useOutletContext<{ project: Project }>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs(project.id, page);

  if (isLoading) {
    return <PageLoader />;
  }

  const logs = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm" data-testid="audit-log">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <Activity className="h-5 w-5 text-primary" />
        Activity history
      </h2>

      {logs.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">No activity recorded yet.</div>
      ) : (
        <>
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent md:before:mx-auto md:before:translate-x-0">
            {logs.map((log) => (
              <div
                key={log.id}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse"
                data-testid={`audit-entry-${log.id}`}
              >
                <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card shadow transition-colors md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  {getLogIcon(log.action)}
                </div>
                <div className="w-[calc(100%-4rem)] rounded-xl border bg-card/70 p-4 shadow-sm backdrop-blur-sm transition-all hover:bg-card md:w-[calc(50%-2.5rem)]">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      User <span className="font-mono text-xs">{log.userId.slice(0, 8)}…</span>
                    </span>
                    <time className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <div className="text-sm">{formatMessage(log)}</div>
                </div>
              </div>
            ))}
          </div>

          {meta && totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <p className="text-xs text-muted-foreground">
                Page {meta.page} of {totalPages} · {meta.total} events
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  data-testid="audit-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  data-testid="audit-next"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
