// API Keys Page - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

export default function ApiKeysPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
          Generate New Key
        </button>
      </div>

      {/* TODO: Add API keys table */}
      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Key</th>
              <th className="text-left p-4">Created</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-4 text-muted-foreground" colSpan={4}>
                No API keys yet. Generate your first key to get started.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
