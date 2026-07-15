import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import ProfilePage from "@/pages/Profile";
import LessonPage from "@/pages/Lesson";
import AssessmentPage from "@/pages/Assessment";
import AdminPage from "@/pages/Admin";
import MiniGamePage from "@/pages/MiniGame";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile/:id" component={ProfilePage} />
      <Route path="/lesson/:id" component={LessonPage} />
      <Route path="/assessment/:id" component={AssessmentPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/minigame/:profileId/:gameId/:difficulty" component={MiniGamePage} />
      <Route path="/minigame/:profileId/:gameId" component={MiniGamePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
