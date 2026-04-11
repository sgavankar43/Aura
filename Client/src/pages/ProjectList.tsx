import { Plus, Layout } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useCreateProject } from '../hooks/queries';

export default function ProjectList() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      return;
    }

    await createProject.mutateAsync({ name });
    setName('');
    setShowNew(false);
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground animate-pulse">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      {showNew && (
        <div className="bg-card border rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium mb-4">Create New Project</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Project Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="e.g. Frontend App"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground h-10 py-2 px-4 border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createProject.isPending}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
              >
                {createProject.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.length === 0 && !showNew && (
          <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-muted text-muted-foreground">
            <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No projects</h3>
            <p className="mt-1">Get started by creating a new project.</p>
          </div>
        )}

        {projects?.map((project: any) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="group block">
            <div className="h-full rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors p-6">
              <h3 className="font-semibold leading-none tracking-tight group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {project.description || 'No description provided.'}
              </p>

              <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono bg-muted px-2 py-1 rounded-md">
                  ID: {project.id.slice(0, 8)}...
                </span>
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
