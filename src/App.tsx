import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { EntitlementsProvider } from "@/hooks/useEntitlements";
import Index from "./pages/Index.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import DailyMatches from "./pages/DailyMatches.tsx";
import Conversations from "./pages/Conversations.tsx";
import Chat from "./pages/Chat.tsx";
import Settings from "./pages/Settings.tsx";
import Premium from "./pages/Premium.tsx";
import Receipts from "./pages/Receipts.tsx";
import Filters from "./pages/Filters.tsx";
// import GameNight from "./pages/GameNight.tsx";
import NotFound from "./pages/NotFound.tsx";
import RequireAdmin from "./components/auth/RequireAuth.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminKyc from "./pages/admin/AdminKyc.tsx";
import AdminRoles from "./pages/admin/AdminRoles.tsx";
import AdminPhotos from "./pages/admin/AdminPhotos.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import AdminMatches from "./pages/admin/AdminMatches.tsx";
import AdminConversations from "./pages/admin/AdminConversations.tsx";
import AdminRevenue from "./pages/admin/AdminRevenue.tsx";
import AdminCms from "./pages/admin/AdminCms.tsx";
import AdminFilters from "./pages/admin/AdminFilters.tsx";
import AdminBadges from "./pages/admin/AdminBadges.tsx";
import AdminNotifications from "./pages/admin/AdminNotifications.tsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics.tsx";
import AdminAudit from "./pages/admin/AdminAudit.tsx";
import ProfilePage from "./pages/Profile.tsx";
import OthersProfilePageView from "./pages/Othersprofilepageview.tsx";
import Notifications from "./pages/Notifications.tsx";
import CreateKundaliProfile from "./pages/CreateKundaliProfile.tsx";
import Pricing from "./pages/Pricing.tsx";
import Billing from "./pages/Billing.tsx";
import RevealLikes from "./pages/RevealLikes.tsx";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import PaymentCancelled from "./pages/PaymentCancelled.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <EntitlementsProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/today" element={<DailyMatches />} />
            <Route path="/matches" element={<Conversations />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/filters" element={<Filters />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<OthersProfilePageView />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/create-kundali-profile" element={<CreateKundaliProfile />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/reveal-likes" element={<RevealLikes />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancelled" element={<PaymentCancelled />} />
            {/* <Route path="/gamenight" element={<GameNight />} /> */}

            {/* admin side routes */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAdmin>
                  <AdminUsers />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/kyc"
              element={
                <RequireAdmin>
                  <AdminKyc />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/photos"
              element={
                <RequireAdmin>
                  <AdminPhotos />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <RequireAdmin>
                  <AdminReports />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/matches"
              element={
                <RequireAdmin>
                  <AdminMatches />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/conversations"
              element={
                <RequireAdmin>
                  <AdminConversations />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/revenue"
              element={
                <RequireAdmin>
                  <AdminRevenue />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/cms"
              element={
                <RequireAdmin>
                  <AdminCms />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/filters"
              element={
                <RequireAdmin>
                  <AdminFilters />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/badges"
              element={
                <RequireAdmin>
                  <AdminBadges />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <RequireAdmin>
                  <AdminNotifications />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RequireAdmin>
                  <AdminAnalytics />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <RequireAdmin>
                  <AdminRoles />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <RequireAdmin>
                  <AdminAudit />
                </RequireAdmin>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </EntitlementsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
