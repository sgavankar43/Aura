import { ChevronRight } from 'lucide-react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { PageLoader } from '@/components/feedback/PageLoader';
import { useProject } from '@/hooks/queries';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
    isActive
      ? 'border-primary text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  );

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError, error } = useProject(id);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !project) {
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Project not found';
    return (
      <div
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive"
        data-testid="project-error"
      >
        {message}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="project-detail">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground" data-testid="breadcrumb-projects">
          Projects
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        <span className="font-medium text-foreground">{project.name}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{project.name}</h1>
        <p className="mt-1 text-muted-foreground">
          {project.description?.trim() ? project.description : 'No description'}
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border/80 pb-px">
        <NavLink to="." end className={tabClass} data-testid="tab-flags">
          Feature flags
        </NavLink>
        <NavLink to="environments" className={tabClass} data-testid="tab-environments">
          Environments
        </NavLink>
        <NavLink to="audit" className={tabClass} data-testid="tab-audit">
          Audit log
        </NavLink>
        <NavLink to="settings" className={tabClass} data-testid="tab-settings">
          Settings
        </NavLink>
      </div>

      <div className="pt-2">
        <Outlet context={{ project }} />
      </div>
    </div>
  );
}
