import { Plus, Power } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PageLoader } from '@/components/feedback/PageLoader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { useCreateFeature, useFeatures, useToggleFlag } from '@/hooks/queries';
import { cn } from '@/lib/utils';
import type { Environment, FeatureRow, Project } from '@/types/domain';

export default function FeatureGrid() {
  const { project } = useOutletContext<{ project: Project }>();
  const { data: features, isLoading } = useFeatures(project.id);
  const toggleFlag = useToggleFlag(project.id);
  const createFeature = useCreateFeature(project.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultEnabled, setDefaultEnabled] = useState(false);
  const [formError, setFormError] = useState('');

  const environments: Environment[] = project.environments ?? [];

  const resetForm = () => {
    setKey('');
    setName('');
    setDescription('');
    setDefaultEnabled(false);
    setFormError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await createFeature.mutateAsync({
        key: key.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        defaultEnabled,
      });
      resetForm();
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create feature');
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  const pending = toggleFlag.variables;
  const isToggling = (envSlug: string, featureKey: string) =>
    toggleFlag.isPending && pending?.envSlug === envSlug && pending?.key === featureKey;

  return (
    <div className="space-y-4" data-testid="feature-grid">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Toggle flag state per environment. Changes apply immediately for connected SDKs.
        </p>
        <Button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={environments.length === 0}
          data-testid="add-feature"
        >
          <Plus className="h-4 w-4" />
          New feature
        </Button>
      </div>

      {environments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-6 text-sm text-amber-800 dark:text-amber-200">
          Add at least one environment before you can define feature flags for this project.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="feature-table">
            <thead className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 md:px-6">Feature</th>
                {environments.map((env) => (
                  <th key={env.id} className="px-4 py-3 text-center md:px-6">
                    <span className="inline-flex items-center justify-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full ring-2 ring-background"
                        style={{ backgroundColor: env.color ?? '#6B7280' }}
                      />
                      {env.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {features?.length === 0 ? (
                <tr>
                  <td
                    colSpan={environments.length + 1}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No features yet. Create one to start rolling out safely.
                  </td>
                </tr>
              ) : null}

              {(features ?? []).map((feature: FeatureRow) => (
                <tr
                  key={feature.id}
                  className="hover:bg-muted/20"
                  data-testid={`feature-row-${feature.key}`}
                >
                  <td className="px-4 py-4 md:px-6">
                    <span className="font-mono text-xs font-medium text-foreground">
                      {feature.key}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">{feature.name}</p>
                  </td>
                  {environments.map((env) => {
                    const stateVal = feature.states[env.slug] ?? feature.defaultEnabled;
                    return (
                      <td key={env.id} className="px-4 py-4 text-center md:px-6">
                        <button
                          type="button"
                          data-testid={`flag-toggle-${feature.key}-${env.slug}`}
                          onClick={() =>
                            toggleFlag.mutate({
                              envSlug: env.slug,
                              key: feature.key,
                              enabled: !stateVal,
                            })
                          }
                          disabled={isToggling(env.slug, feature.key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            stateVal
                              ? 'border-success/30 bg-success/10 text-success hover:bg-success/15'
                              : 'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted',
                          )}
                        >
                          <Power className={cn('h-3.5 w-3.5', !stateVal && 'opacity-50')} />
                          {stateVal ? 'On' : 'Off'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title="New feature flag"
        description="Keys should be stable identifiers (e.g. billing-v2). They cannot be renamed lightly in production."
        data-testid="feature-modal"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="feat-key">Key</Label>
            <Input
              id="feat-key"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="font-mono"
              placeholder="new-checkout"
              data-testid="feature-key-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feat-name">Display name</Label>
            <Input
              id="feat-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New checkout flow"
              data-testid="feature-name-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feat-desc">Description (optional)</Label>
            <textarea
              id="feat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={defaultEnabled}
              onChange={(e) => setDefaultEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Default on (when no per-environment state exists)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createFeature.isPending} data-testid="feature-submit">
              {createFeature.isPending ? 'Creating…' : 'Create feature'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
