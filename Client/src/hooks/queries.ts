import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, publicFetch } from '@/lib/api';
import type { Environment, FeatureRow, PaginatedAuditLogs, Project } from '@/types/domain';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiFetch<{ projects: Project[] }>('/projects');
      return res.projects;
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiFetch<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await apiFetch<{ project: Project }>(`/projects/${projectId}`);
      return res.project;
    },
    enabled: Boolean(projectId),
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string | null }) =>
      apiFetch<{ project: Project }>(`/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(['project', projectId], res.project);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useArchiveProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ project: Project }>(`/projects/${projectId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useFeatures(projectId: string) {
  return useQuery({
    queryKey: ['features', projectId],
    queryFn: async () => {
      const res = await apiFetch<{ features: FeatureRow[] }>(`/projects/${projectId}/features`);
      return res.features;
    },
    enabled: Boolean(projectId),
  });
}

export function useCreateFeature(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      key: string;
      name: string;
      description?: string;
      defaultEnabled?: boolean;
    }) =>
      apiFetch(`/projects/${projectId}/features`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features', projectId] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useCreateEnvironment(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; color?: string }) =>
      apiFetch<{ environment: Environment }>(`/projects/${projectId}/environments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useToggleFlag(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ envSlug, key, enabled }: { envSlug: string; key: string; enabled: boolean }) =>
      apiFetch(
        `/projects/${projectId}/flags/${encodeURIComponent(envSlug)}/${encodeURIComponent(key)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ enabled }),
        },
      ),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['features', projectId] });
      const previous = queryClient.getQueryData<FeatureRow[]>(['features', projectId]);

      queryClient.setQueryData<FeatureRow[]>(['features', projectId], (old) => {
        if (!old) {
          return old;
        }
        return old.map((f) => {
          if (f.key !== params.key) {
            return f;
          }
          return {
            ...f,
            states: {
              ...f.states,
              [params.envSlug]: params.enabled,
            },
          };
        });
      });

      return { previous };
    },
    onError: (_err, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['features', projectId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['features', projectId] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs', projectId] });
    },
  });
}

export function useAuditLogs(projectId: string, page: number) {
  return useQuery({
    queryKey: ['audit-logs', projectId, page],
    queryFn: () =>
      apiFetch<PaginatedAuditLogs>(`/projects/${projectId}/audit-logs?page=${page}&limit=20`),
    enabled: Boolean(projectId),
  });
}

/** Server returns `{ status: 'ok' }` or similar — keep loose for forward compatibility. */
interface HealthJson {
  status?: string;
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => publicFetch<HealthJson>('/health'),
    staleTime: 30_000,
    retry: 1,
  });
}
