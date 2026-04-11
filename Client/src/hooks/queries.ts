import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';

// Projects
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch('/projects').then((res) => res.projects),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

// Features
export function useFeatures(projectId: string) {
  return useQuery({
    queryKey: ['features', projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/features`).then((res) => res.features),
    enabled: !!projectId,
  });
}

// Flags
export function useToggleFlag(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ envSlug, key, enabled }: { envSlug: string; key: string; enabled: boolean }) =>
      apiFetch(`/projects/${projectId}/flags/${envSlug}/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      }),
    onMutate: async (params) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['features', projectId] });
      const previous = queryClient.getQueryData(['features', projectId]);

      queryClient.setQueryData(['features', projectId], (old: any) => {
        if (!old) {
          return old;
        }
        return old.map((f: any) => {
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
    onError: (err, params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['features', projectId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['features', projectId] });
    },
  });
}
