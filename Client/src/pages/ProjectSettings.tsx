import { Copy, Check, Trash2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { useArchiveProject, useUpdateProject } from '@/hooks/queries';
import type { Project } from '@/types/domain';

export default function ProjectSettings() {
  const { project } = useOutletContext<{ project: Project }>();
  const navigate = useNavigate();
  const updateProject = useUpdateProject(project.id);
  const archiveProject = useArchiveProject(project.id);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiveName, setArchiveName] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedMsg(false);
    try {
      await updateProject.mutateAsync({
        name,
        description: description.trim() === '' ? null : description,
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(project.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const handleArchive = async () => {
    if (archiveName !== project.name) {
      return;
    }
    setError('');
    try {
      await archiveProject.mutateAsync();
      setConfirmArchive(false);
      navigate('/projects', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8" data-testid="project-settings">
      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Name and description appear across the control plane.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && !confirmArchive ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            {savedMsg ? (
              <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                Changes saved.
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="project-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">Description</Label>
              <textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Optional context for your team"
                data-testid="project-description-input"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateProject.isPending} data-testid="project-save">
                {updateProject.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle>Project API key</CardTitle>
          </div>
          <CardDescription>
            Use this key with the Aura SDK to evaluate flags in your services. Treat it like a
            secret.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code
              className="flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs"
              data-testid="project-api-key"
            >
              {project.apiKey}
            </code>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => void copyKey()}
              data-testid="copy-api-key"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Archiving hides the project from the dashboard. This action can be extended server-side
            for hard deletes if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setArchiveName('');
              setError('');
              setConfirmArchive(true);
            }}
            data-testid="archive-project-open"
          >
            <Trash2 className="h-4 w-4" />
            Archive project
          </Button>
        </CardContent>
      </Card>

      <Modal
        open={confirmArchive}
        onClose={() => {
          setConfirmArchive(false);
          setArchiveName('');
          setError('');
        }}
        title="Archive this project?"
        description={`Type the project name "${project.name}" to confirm.`}
        data-testid="archive-modal"
      >
        <div className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="confirm-name">Project name</Label>
            <Input
              id="confirm-name"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              placeholder={project.name}
              data-testid="archive-confirm-input"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmArchive(false);
                setArchiveName('');
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={archiveName !== project.name || archiveProject.isPending}
              onClick={() => void handleArchive()}
              data-testid="archive-confirm"
            >
              {archiveProject.isPending ? 'Archiving…' : 'Archive project'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
