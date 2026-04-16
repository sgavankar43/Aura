import { Palette, Plus } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { useCreateEnvironment } from '@/hooks/queries';
import type { Environment, Project } from '@/types/domain';

export default function EnvironmentsPage() {
  const { project } = useOutletContext<{ project: Project }>();
  const createEnv = useCreateEnvironment(project.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [error, setError] = useState('');

  const environments = project.environments ?? [];

  const resetForm = () => {
    setName('');
    setSlug('');
    setColor('#6B7280');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createEnv.mutateAsync({
        name,
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
        color,
      });
      resetForm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create environment');
    }
  };

  return (
    <div className="space-y-6" data-testid="environments-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Environments</h2>
          <p className="text-sm text-muted-foreground">
            Map deployment targets (development, staging, production) to flag columns.
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)} data-testid="add-environment">
          <Plus className="h-4 w-4" />
          Add environment
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {environments.length === 0 ? (
          <Card className="border-dashed sm:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <Palette className="mb-3 h-10 w-10 text-muted-foreground opacity-60" />
              <p className="font-medium">No environments yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create at least one environment to toggle flags per deployment target.
              </p>
              <Button type="button" className="mt-6" onClick={() => setOpen(true)}>
                Create environment
              </Button>
            </CardContent>
          </Card>
        ) : (
          environments.map((env: Environment) => (
            <Card key={env.id} data-testid={`environment-card-${env.slug}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
                    style={{ backgroundColor: env.color ?? '#6B7280' }}
                  />
                  <CardTitle className="text-base">{env.name}</CardTitle>
                </div>
                <CardDescription className="font-mono text-xs">{env.slug}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Added {new Date(env.createdAt).toLocaleDateString()}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="New environment"
        description="Slug must be unique within this project (e.g. production, staging)."
        data-testid="environment-modal"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="env-name">Display name</Label>
            <Input
              id="env-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production"
              data-testid="environment-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="env-slug">Slug</Label>
            <Input
              id="env-slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="production"
              className="font-mono"
              data-testid="environment-slug"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="env-color">Accent color</Label>
            <div className="flex gap-2">
              <Input
                id="env-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer p-1"
                data-testid="environment-color"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="font-mono"
                placeholder="#6B7280"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createEnv.isPending} data-testid="environment-submit">
              {createEnv.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
