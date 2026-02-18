"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface ApiKeysClientProps {
  initialKeys: ApiKeyData[];
}

export function ApiKeysClient({ initialKeys }: ApiKeysClientProps) {
  const [keys, setKeys] = useState<ApiKeyData[]>(initialKeys);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);

  const handleCreateKey = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Default Key" }),
      });
      const data = await res.json();

      if (data.success) {
        setShowNewKey(data.data.key);
        // Refresh the page to get updated list
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to create key:", error);
    } finally {
      setIsCreating(false);
      setNewKeyName("");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this key? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/keys?keyId=${keyId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setKeys(keys.filter((k) => k.id !== keyId));
      }
    } catch (error) {
      console.error("Failed to revoke key:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Key name (optional)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 bg-background"
          />
          <Button onClick={handleCreateKey} disabled={isCreating}>
            {isCreating ? "Creating..." : "Generate New Key"}
          </Button>
        </div>
      </div>

      {showNewKey && (
        <Card className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-green-200">
          <p className="font-medium text-green-800 dark:text-green-200 mb-2">
            New API Key Created
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Copy this key now. You won&apos;t be able to see it again.
          </p>
          <code className="block bg-background p-3 rounded border text-sm font-mono break-all">
            {showNewKey}
          </code>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => {
              navigator.clipboard.writeText(showNewKey);
            }}
          >
            Copy to Clipboard
          </Button>
        </Card>
      )}

      <Card>
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Key</th>
              <th className="text-left p-4 font-medium">Created</th>
              <th className="text-left p-4 font-medium">Last Used</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={5}>
                  No API keys yet. Generate your first key to get started.
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="border-b border-border last:border-0">
                  <td className="p-4">{key.name}</td>
                  <td className="p-4 font-mono text-sm">{key.keyPrefix}...</td>
                  <td className="p-4 text-muted-foreground">{formatDate(key.createdAt)}</td>
                  <td className="p-4 text-muted-foreground">
                    {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                  </td>
                  <td className="p-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeKey(key.id)}
                    >
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
