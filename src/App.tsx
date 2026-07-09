import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Explore from "./pages/Explore.tsx";
import Messages from "./pages/Messages.tsx";
import Pairings from "./pages/Pairings.tsx";
import Sessions from "./pages/Sessions.tsx";
import Admin from "./pages/Admin.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminRouteGuard from "./components/admin/AdminRouteGuard.tsx";
import Settings from "./pages/Settings.tsx";
import Subscribe from "./pages/Subscribe.tsx";
import Profile from "./pages/Profile.tsx";
import Courses from "./pages/Courses.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import ProfilePreview from "./pages/ProfilePreview.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import BookMentor from "./pages/BookMentor.tsx";
import CancelBooking from "./pages/CancelBooking.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AuthRecoveryRedirect from "./components/AuthRecoveryRedirect.tsx";
import Privacy from "./pages/Privacy.tsx";
import Onboarding from "./pages/Onboarding.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthRecoveryRedirect />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/mentor-auth" element={<Auth />} />
            <Route path="/mentee-auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/explore" element={<Explore />} />
            <Route path="/dashboard/messages" element={<Messages />} />
            <Route path="/dashboard/pairings" element={<Pairings />} />
            <Route path="/dashboard/sessions" element={<Sessions />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminRouteGuard><Admin /></AdminRouteGuard>} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/subscribe" element={<Subscribe />} />
            <Route path="/dashboard/courses" element={<Courses />} />
            <Route path="/dashboard/marketplace" element={<Marketplace />} />
            <Route path="/dashboard/profile/preview" element={<ProfilePreview />} />
            <Route path="/dashboard/profile/:userId" element={<Profile />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/book/:username" element={<BookMentor />} />
            <Route path="/cancel/:token" element={<CancelBooking />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
