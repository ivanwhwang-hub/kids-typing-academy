import { useState } from "react";
import { useLocation } from "wouter";
import { Keyboard, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadProfiles, saveProfiles } from "@/lib/storage";
import { Profile } from "@/lib/types";
import { LEVEL_NAMES } from "@/lib/content";
import { motion, AnimatePresence } from "framer-motion";

const AVATARS = ["🦁", "🐯", "🐸", "🐧", "🦊", "🐼", "🦄", "🐬", "🦋", "🚀", "⭐", "🌈", "🐉", "🦖", "🌺", "🐙"];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getLevelColor(level: number) {
  const colors = ["bg-indigo-500", "bg-blue-500", "bg-teal-500", "bg-orange-500", "bg-rose-500"];
  return colors[(level - 1) % colors.length];
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  function addProfile() {
    if (!newName.trim()) return;
    const profile: Profile = {
      id: generateId(),
      name: newName.trim(),
      avatar: selectedAvatar,
      createdAt: Date.now(),
      currentLevel: 1,
      currentLesson: 0,
      assessmentHistory: [],
      badges: [],
      lessonResults: [],
      totalPracticeTime: 0,
      currentStreak: 0,
      lastPracticeDate: null,
      unlockedGames: [],
      miniGamesCompleted: 0,
      soundTheme: 'classic',
      gameHighScores: {},
    };
    const updated = [...profiles, profile];
    saveProfiles(updated);
    setProfiles(updated);
    setDialogOpen(false);
    setNewName("");
    setSelectedAvatar(AVATARS[0]);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="home-page">
      <header className="py-8 text-center border-b border-border/50">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="bg-primary rounded-2xl p-3 shadow-lg">
            <Keyboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Kids Typing Academy</h1>
        </div>
        <p className="text-muted-foreground text-lg">Build your typing skills from beginner to expert</p>
        <button
          className="absolute top-6 right-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          onClick={() => setLocation("/admin")}
          data-testid="link-admin"
        >
          <Settings className="w-4 h-4" />
          Parent Panel
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        {profiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">⌨️</div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">No profiles yet!</h2>
            <p className="text-muted-foreground mb-8 text-lg">Add a child's profile to get started on their typing journey.</p>
            <Button size="lg" onClick={() => setDialogOpen(true)} data-testid="button-add-first-profile" className="text-lg px-8 py-6 rounded-2xl shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Add First Profile
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">Choose a Profile</h2>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-add-profile" className="rounded-xl shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Add Profile
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              <AnimatePresence>
                {profiles.map((profile, i) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-3xl p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 flex flex-col items-center gap-3 group"
                    onClick={() => setLocation(`/profile/${profile.id}`)}
                    data-testid={`card-profile-${profile.id}`}
                  >
                    <div className="text-6xl">{profile.avatar}</div>
                    <div className="font-bold text-lg text-foreground">{profile.name}</div>
                    <div className={`${getLevelColor(profile.currentLevel)} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                      Level {profile.currentLevel}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {LEVEL_NAMES[profile.currentLevel - 1]}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md" data-testid="dialog-add-profile">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center">Create a Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="text-center text-7xl">{selectedAvatar}</div>
            <div>
              <Label className="text-sm font-bold mb-2 block">Choose an Avatar</Label>
              <div className="grid grid-cols-8 gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    className={`text-2xl p-2 rounded-xl transition-all hover:scale-110 ${selectedAvatar === emoji ? "bg-primary/20 ring-2 ring-primary scale-110" : "hover:bg-muted"}`}
                    onClick={() => setSelectedAvatar(emoji)}
                    data-testid={`button-avatar-${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="profile-name" className="text-sm font-bold mb-2 block">Your Name</Label>
              <Input
                id="profile-name"
                placeholder="Enter name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addProfile()}
                className="text-lg rounded-xl"
                data-testid="input-profile-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl" data-testid="button-cancel-profile">
              Cancel
            </Button>
            <Button onClick={addProfile} disabled={!newName.trim()} className="rounded-xl" data-testid="button-save-profile">
              Create Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
