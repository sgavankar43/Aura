import { useQuery } from '@tanstack/react-query';
import { useParams, NavLink, Outlet } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiFetch(`/projects/${id}`).then((res) => res.project),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-muted-foreground animate-pulse">Loading project details...</div>
    );
  }

  if (!project) {
    return <div className="p-8 text-destructive">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground mt-1">
          {project.description || 'No description provided'}
        </p>
      </div>

      <div className="flex border-b">
        <NavLink
          to="."
          end
          className={({ isActive }) =>
            `px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`
          }
        >
          Feature Flags
        </NavLink>
        <NavLink
          to="audit"
          className={({ isActive }) =>
            `px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`
          }
        >
          Audit Logs
        </NavLink>
        <NavLink
          to="settings"
          className={({ isActive }) =>
            `px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`
          }
        >
          Settings
        </NavLink>
      </div>

      <div className="pt-4">
        <Outlet context={{ project }} />
      </div>
    </div>
  );
}
