"use client";

import { useEffect, useState } from "react";
import { Key, Plus, Copy, Check, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  Button,
  Input,
  Modal,
  Badge,
  LoadingScreen,
} from "@/components/ui";

interface ApiKey {
  id: string;
  label: string | null;
  createdAt: string;
  lastFourChars: string;
}

export default function KeysPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Create key modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke confirmation modal state
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  const keyLimit = user?.plan === "standard" ? 2 : 1;
  const canCreateKey = keys.length < keyLimit;

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (error) {
      console.error("Failed to fetch keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newKeyLabel || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        await fetchKeys();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create key");
        setShowCreateModal(false);
      }
    } catch {
      alert("Failed to create key");
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    setRevoking(keyId);
    try {
      const res = await fetch(`/api/keys/${keyId}`, { method: "DELETE" });
      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== keyId));
        setKeyToRevoke(null);
      } else {
        alert("Failed to revoke key");
      }
    } catch {
      alert("Failed to revoke key");
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewKeyLabel("");
    setNewKey(null);
    setCopied(false);
  };

  if (loading) {
    return <LoadingScreen message="Loading API keys..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted mt-1">
            Manage your API keys for accessing VaultLine data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default">
            {keys.length} / {keyLimit} keys
          </Badge>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreateKey}
            title={!canCreateKey ? (user?.plan === "sandbox" ? "Upgrade to Standard for 2 API keys" : "Maximum keys reached") : undefined}
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Key
          </Button>
        </div>
      </div>

      {/* Upgrade banner for sandbox users at limit */}
      {!canCreateKey && user?.plan === "sandbox" && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Need more API keys?</p>
              <p className="text-sm text-muted">
                Upgrade to Standard for 2 API keys and unlimited calls.
              </p>
            </div>
            <Button size="sm" onClick={() => window.location.href = "/dashboard/billing"}>
              Upgrade
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Keys list */}
      {keys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted/10 mb-4">
              <Key className="w-8 h-8 text-muted" />
            </div>
            <h3 className="font-medium mb-1">No API keys yet</h3>
            <p className="text-sm text-muted mb-4">
              Generate your first API key to start making requests.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <Card key={key.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted/10">
                    <Key className="w-5 h-5 text-muted" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {key.label || "Unnamed Key"}
                    </div>
                    <div className="text-sm text-muted flex items-center gap-2">
                      <code className="px-1.5 py-0.5 rounded bg-muted/10">
                        vl_...{key.lastFourChars}
                      </code>
                      <span>
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKeyToRevoke(key)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create key modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title={newKey ? "API Key Created" : "Generate New API Key"}
        size="md"
      >
        {newKey ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-500">Save this key now!</p>
                <p className="text-muted mt-1">
                  This is the only time you&apos;ll see this key. Store it securely.
                </p>
              </div>
            </div>

            <div className="relative">
              <code className="block w-full p-3 pr-12 rounded-lg bg-muted/10 border border-border text-sm font-mono break-all">
                {newKey}
              </code>
              <button
                onClick={() => copyToClipboard(newKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-muted/20 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted" />
                )}
              </button>
            </div>

            <Button className="w-full" onClick={closeCreateModal}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Label (optional)"
              placeholder="e.g., Production, Development"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateKey} loading={creating}>
                Generate
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revoke confirmation modal */}
      <Modal
        isOpen={!!keyToRevoke}
        onClose={() => setKeyToRevoke(null)}
        title="Revoke API Key"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted">
            Are you sure you want to revoke{" "}
            <span className="text-foreground font-medium">
              {keyToRevoke?.label || "this key"}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setKeyToRevoke(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => keyToRevoke && handleRevokeKey(keyToRevoke.id)}
              loading={revoking === keyToRevoke?.id}
            >
              Revoke Key
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
