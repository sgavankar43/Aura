import { useQuery } from '@tanstack/react-query';
import { Activity, Zap, Flag, PlusSquare, FileEdit } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function AuditLog() {
  const { project } = useOutletContext<{ project: any }>();

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', project.id],
    queryFn: () => apiFetch(`/projects/${project.id}/audit-logs`),
  });

  if (isLoading) {
    return <div className="animate-pulse p-4">Loading audit logs...</div>;
  }

  const logs = data?.data || [];

  const getLogIcon = (action: string) => {
    switch (action) {
      case 'flag.toggled':
        return <Zap className="w-5 h-5 text-accent" />;
      case 'feature.created':
        return <Flag className="w-5 h-5 text-success" />;
      case 'project.created':
        return <PlusSquare className="w-5 h-5 text-primary" />;
      default:
        return <FileEdit className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatMessage = (log: any) => {
    switch (log.action) {
      case 'flag.toggled': {
        const enabled = log.metadata?.enabled;
        return (
          <>
            Toggled{' '}
            <span className="font-mono bg-muted px-1 rounded">{log.metadata?.featureKey}</span> to{' '}
            <span className={`font-medium ${enabled ? 'text-success' : 'text-muted-foreground'}`}>
              {enabled ? 'ON' : 'OFF'}
            </span>{' '}
            in {log.metadata?.envSlug}
          </>
        );
      }
      case 'feature.created':
        return (
          <>
            Created feature{' '}
            <span className="font-mono bg-muted px-1 rounded">{log.metadata?.featureKey}</span>
          </>
        );
      case 'project.created':
        return <>Created the project</>;
      default:
        return <span className="text-muted-foreground">{log.action}</span>;
    }
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-primary" />
        Activity History
      </h2>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No activity recorded yet</div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {logs.map((log: any) => (
            <div
              key={log.id}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                {getLogIcon(log.action)}
              </div>

              {/* Content */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:bg-card">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">User {log.userId.slice(0, 8)}...</span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </time>
                </div>
                <div className="text-sm">{formatMessage(log)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
