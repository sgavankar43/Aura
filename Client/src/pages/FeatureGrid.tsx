import { Power } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useFeatures, useToggleFlag } from '../hooks/queries';

export default function FeatureGrid() {
  const { project } = useOutletContext<{ project: any }>();
  const { data: features, isLoading } = useFeatures(project.id);
  const toggleFlag = useToggleFlag(project.id);

  if (isLoading) {
    return <div className="animate-pulse">Loading features...</div>;
  }

  const handleToggle = (envSlug: string, key: string, currentState: boolean) => {
    toggleFlag.mutate({ envSlug, key, enabled: !currentState });
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4 rounded-tl-xl whitespace-nowrap">Features</th>
              {project.environments?.map((env: any) => (
                <th key={env.id} className="px-6 py-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: env.color || '#6B7280' }}
                    />
                    {env.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {features?.length === 0 && (
              <tr>
                <td
                  colSpan={project.environments?.length + 1}
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  No features created yet.
                </td>
              </tr>
            )}

            {features?.map((feature: any) => (
              <tr key={feature.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded border">
                      {feature.key}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs font-normal mt-1">
                    {feature.name}
                  </div>
                </td>

                {project.environments?.map((env: any) => {
                  // Fallback to defaultEnabled if no specific state exists
                  const stateVal = feature.states?.[env.slug] ?? feature.defaultEnabled;

                  return (
                    <td key={env.id} className="px-6 py-4 text-center text-xs">
                      <button
                        onClick={() => handleToggle(env.slug, feature.key, stateVal)}
                        disabled={
                          toggleFlag.isPending &&
                          toggleFlag.variables?.key === feature.key &&
                          toggleFlag.variables?.envSlug === env.slug
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                          stateVal
                            ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                            : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                        }`}
                      >
                        <Power
                          className={`w-3.5 h-3.5 ${stateVal ? 'opacity-100' : 'opacity-50'}`}
                        />
                        {stateVal ? 'ON' : 'OFF'}
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
  );
}
