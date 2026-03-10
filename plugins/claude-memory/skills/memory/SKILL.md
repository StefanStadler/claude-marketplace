# Memory

Use the `memory` MCP server to store and retrieve knowledge across sessions.

## Instructions

The user is asking you to interact with their persistent memory store.

Based on their request, use the appropriate memory tool:

- **View stats / what's stored**: call `memory_stats`
- **Search for something**: call `memory_search` with their query
- **Store something**: call `memory_store` with title, content, category (`context`, `decision`, `working_style`, or `snippet`), and optional project/tags
- **Update an entry**: call `memory_update` with the ID and new values
- **Delete an entry**: call `memory_delete` with the ID
- **List projects**: call `memory_list_projects`

If no specific action is requested, call `memory_stats` to show an overview, then ask what the user would like to do.
