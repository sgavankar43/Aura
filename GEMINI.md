## graphify

This project has a graphify knowledge graph at .graphify/.

Rules:

- Before answering architecture or codebase questions, read .graphify/GRAPH_REPORT.md for god nodes and community structure
- If .graphify/wiki/index.md exists, navigate it instead of reading raw files
- If .graphify/graph.json is missing but graphify-out/graph.json exists, run `graphify migrate-state --dry-run` first; if tracked legacy artifacts are reported, ask before using the recommended `git mv -f graphify-out .graphify` and commit message
- If .graphify/needs_update exists or .graphify/branch.json has stale=true, warn before relying on semantic results and run /graphify . --update when appropriate
- In Gemini CLI, the reliable explicit custom command is `/graphify ...`
- If the user asks to build, update, query, path, or explain the graph, use the installed `/graphify` custom command or the configured `graphify` MCP server instead of ad-hoc file traversal
- Before deep graph traversal, prefer `graphify summary --graph .graphify/graph.json` or MCP `first_hop_summary` for compact first-hop orientation
- For review impact on changed files, use `graphify review-delta --graph .graphify/graph.json` or MCP `review_delta` instead of generic traversal
- After modifying code files in this session, run `npx graphify hook-rebuild` to keep the graph current
