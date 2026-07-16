import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrencyProvider } from "@/hooks/useCurrency";
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
import MarketplaceListing from "./pages/MarketplaceListing.tsx";
import ProfilePreview from "./pages/ProfilePreview.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import BookMentor from "./pages/BookMentor.tsx";
import CancelBooking from "./pages/CancelBooking.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AuthRecoveryRedirect from "./components/AuthRecoveryRedirect.tsx";
import Privacy from "./pages/Privacy.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Forum from "./pages/Forum.tsx";
import Feedback from "./pages/Feedback.tsx";
import Help from "./pages/Help.tsx";
import FAQ from "./pages/FAQ.tsx";
import Agreement from "./pages/Agreement.tsx";
import EmployerDashboard from "./pages/employer/Dashboard.tsx";
import EmployerCourses from "./pages/employer/Courses.tsx";
import EmployerAnalytics from "./pages/employer/Analytics.tsx";
import EmployerTeam from "./pages/employer/Team.tsx";
import EmployerProfile from "./pages/employer/Profile.tsx";
import EmployerMarketplace from "./pages/employer/Marketplace.tsx";
import AcceptEmployerInvite from "./pages/AcceptEmployerInvite.tsx";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthRecoveryRedirect />
          <CurrencyProvider>
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
            <Route path="/dashboard/marketplace/listing" element={<MarketplaceListing />} />
            <Route path="/dashboard/forum" element={<Forum />} />
            <Route path="/dashboard/feedback" element={<Feedback />} />
            <Route path="/dashboard/help" element={<Help />} />
            <Route path="/dashboard/agreement/:pairingId" element={<Agreement />} />
            <Route path="/dashboard/profile/preview" element={<ProfilePreview />} />
            <Route path="/dashboard/profile/:userId" element={<Profile />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/book/:username" element={<BookMentor />} />
            <Route path="/cancel/:token" element={<CancelBooking />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/employer" element={<EmployerDashboard />} />
            <Route path="/employer/courses" element={<EmployerCourses />} />
            <Route path="/employer/analytics" element={<EmployerAnalytics />} />
            <Route path="/employer/team" element={<EmployerTeam />} />
            <Route path="/employer/profile" element={<EmployerProfile />} />
            <Route path="/employer/marketplace" element={<EmployerMarketplace />} />
            <Route path="/employer/invite" element={<AcceptEmployerInvite />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
