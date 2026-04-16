import { Layout, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLoader } from '@/components/feedback/PageLoader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { useCreateProject, useProjects } from '@/hooks/queries';
import type { Project } from '@/types/domain';

export default function ProjectList() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setDescription('');
    setError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    setError('');
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      reset();
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project');
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8" data-testid="project-list">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize feature flags by product or service. Each project has its own API key and audit
            trail.
          </p>
        </div>
        <Button type="button" onClick={() => setModalOpen(true)} data-testid="new-project">
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title="New project"
        description="Projects isolate environments, flags, and audit logs for a single surface area."
        data-testid="project-modal"
      >
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="proj-name">Name</Label>
            <Input
              id="proj-name"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Payments API"
              data-testid="project-name-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Description (optional)</Label>
            <textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Owns checkout and billing flags"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProject.isPending}
              data-testid="project-create-submit"
            >
              {createProject.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects?.length === 0 ? (
          <Card className="border-dashed md:col-span-2 xl:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Layout className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold">No projects yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create a project to receive an API key and start defining flags per environment.
              </p>
              <Button type="button" className="mt-6" onClick={() => setModalOpen(true)}>
                Create project
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {(projects ?? []).map((project: Project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid={`project-card-${project.id}`}
          >
            <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:shadow-md">
              <CardContent className="p-6">
                <h3 className="font-semibold tracking-tight group-hover:text-primary">
                  {project.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {project.description?.trim() ? project.description : 'No description'}
                </p>
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-2 py-1 font-mono">
                    {project.id.slice(0, 8)}…
                  </span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
