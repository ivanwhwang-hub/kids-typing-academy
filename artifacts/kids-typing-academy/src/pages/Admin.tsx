import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Trash2, Save, AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { loadProfiles, saveProfiles, loadCustomWords, saveCustomWords } from "@/lib/storage";
import { Profile } from "@/lib/types";
import { LEVEL_NAMES } from "@/lib/content";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import { motion } from "framer-motion";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles);
  const [customWords, setCustomWords] = useState(loadCustomWords);
  const [selectedLevel, setSelectedLevel] = useState("1");
  const [wordText, setWordText] = useState(() => {
    const cw = loadCustomWords();
    return (cw[1] ?? []).join("\n");
  });
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  function handleToggleSound() {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  }

  function handleDelete(profile: Profile) {
    const updated = profiles.filter((p) => p.id !== profile.id);
    saveProfiles(updated);
    setProfiles(updated);
    setDeleteTarget(null);
  }

  function handleSaveWords() {
    const words = wordText.split("\n").map((w) => w.trim()).filter(Boolean);
    const updated = { ...customWords, [Number(selectedLevel)]: words };
    saveCustomWords(updated);
    setCustomWords(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLevelChange(val: string) {
    setSelectedLevel(val);
    const cw = loadCustomWords();
    setWordText((cw[Number(val)] ?? []).join("\n"));
  }

  function avgWpm(profile: Profile) {
    if (!profile.lessonResults.length) return "-";
    const avg = profile.lessonResults.reduce((s, r) => s + r.wpm, 0) / profile.lessonResults.length;
    return Math.round(avg);
  }

  function lastActive(profile: Profile) {
    if (!profile.lessonResults.length) return "Never";
    const latest = Math.max(...profile.lessonResults.map((r) => r.date));
    return timeAgo(latest);
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-page">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          onClick={() => setLocation("/")}
          data-testid="button-back-admin"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground mb-1">Parent Panel</h1>
            <p className="text-muted-foreground text-sm">Manage profiles and customize lesson content</p>
            <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3 h-3" />
              Keep this page bookmarked for parents
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg text-foreground">All Profiles</h2>
            </div>
            {profiles.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground">
                No profiles yet. Add a child's profile from the home screen.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="profiles-table">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-bold text-muted-foreground">Child</th>
                      <th className="text-left px-6 py-3 text-sm font-bold text-muted-foreground">Level</th>
                      <th className="text-left px-6 py-3 text-sm font-bold text-muted-foreground">Lessons</th>
                      <th className="text-left px-6 py-3 text-sm font-bold text-muted-foreground">Avg WPM</th>
                      <th className="text-left px-6 py-3 text-sm font-bold text-muted-foreground">Last Active</th>
                      <th className="text-left px-6 py-3 text-sm font-bold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-profile-${profile.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{profile.avatar}</span>
                            <span className="font-bold text-foreground">{profile.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-foreground">
                            {profile.currentLevel} — {LEVEL_NAMES[profile.currentLevel - 1]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-foreground">{profile.lessonResults.length}</td>
                        <td className="px-6 py-4 text-foreground font-bold">{avgWpm(profile)}</td>
                        <td className="px-6 py-4 text-muted-foreground text-sm">{lastActive(profile)}</td>
                        <td className="px-6 py-4">
                          <button
                            className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 text-sm font-medium"
                            onClick={() => setDeleteTarget(profile)}
                            data-testid={`button-delete-${profile.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-foreground mb-1">Game Sounds</h2>
                <p className="text-sm text-muted-foreground">Toggle keypress clicks, pop sounds, and the win fanfare for all kids on this device.</p>
              </div>
              <button
                onClick={handleToggleSound}
                data-testid="button-toggle-sound"
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                  soundOn
                    ? 'bg-teal-50 border-teal-400 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300'
                    : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                {soundOn ? 'Sounds On' : 'Sounds Off'}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg text-foreground mb-1">Custom Word Lists</h2>
            <p className="text-sm text-muted-foreground mb-5">Add your own words or phrases for a specific level. One per line.</p>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-bold mb-2 block">Level</Label>
                <Select value={selectedLevel} onValueChange={handleLevelChange}>
                  <SelectTrigger className="w-64 rounded-xl" data-testid="select-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_NAMES.map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        Level {i + 1}: {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-bold mb-2 block">Words / Phrases</Label>
                <Textarea
                  value={wordText}
                  onChange={(e) => setWordText(e.target.value)}
                  placeholder={"Enter one word or phrase per line...\nexample\nhello world\ntype fast"}
                  className="h-40 rounded-xl font-mono text-sm"
                  data-testid="textarea-custom-words"
                />
              </div>
              <Button
                onClick={handleSaveWords}
                className="rounded-xl"
                data-testid="button-save-words"
              >
                <Save className="w-4 h-4 mr-2" />
                {saved ? "Saved!" : "Save Words"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-3xl max-w-sm" data-testid="dialog-delete-profile">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-xl">Delete Profile?</DialogTitle>
          </DialogHeader>
          <div className="text-center py-3">
            <div className="text-5xl mb-3">{deleteTarget?.avatar}</div>
            <p className="text-muted-foreground">
              This will permanently delete <span className="font-bold text-foreground">{deleteTarget?.name}</span>'s profile and all their progress.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl flex-1" data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)} className="rounded-xl flex-1" data-testid="button-confirm-delete">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
