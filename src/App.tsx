import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { EntitlementsProvider } from "@/hooks/useEntitlements";
import RequireAuth from "./components/auth/RequireAuth.tsx";
import RequireAdmin from "./integrations/auth/RequireAdmin.tsx";

import Index from "./pages/Index.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import DailyMatches from "./pages/DailyMatches.tsx";
import Conversations from "./pages/Conversations.tsx";
import Chat from "./pages/Chat.tsx";
import Settings from "./pages/Settings.tsx";
import Premium from "./pages/Premium.tsx";
import Receipts from "./pages/Receipts.tsx";
import Filters from "./pages/Filters.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProfilePage from "./pages/Profile.tsx";
import OthersProfilePageView from "./pages/Othersprofilepageview.tsx";
import Notifications from "./pages/Notifications.tsx";
import CreateKundaliProfile from "./pages/CreateKundaliProfile.tsx";
import Pricing from "./pages/Pricing.tsx";
import Billing from "./pages/Billing.tsx";
import RevealLikes from "./pages/RevealLikes.tsx";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import PaymentCancelled from "./pages/PaymentCancelled.tsx";

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
              {/* Public Unauthenticated Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected User Routes (Require Authentication) */}
              <Route
                path="/onboarding"
                element={
                  <RequireAuth requireProfile={false}>
                    <Onboarding />
                  </RequireAuth>
                }
              />
              <Route
                path="/today"
                element={
                  <RequireAuth>
                    <DailyMatches />
                  </RequireAuth>
                }
              />
              <Route
                path="/matches"
                element={
                  <RequireAuth>
                    <Conversations />
                  </RequireAuth>
                }
              />
              <Route
                path="/chat"
                element={
                  <RequireAuth>
                    <Chat />
                  </RequireAuth>
                }
              />
              <Route
                path="/chat/:id"
                element={
                  <RequireAuth>
                    <Chat />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <Settings />
                  </RequireAuth>
                }
              />
              <Route
                path="/premium"
                element={
                  <RequireAuth>
                    <Premium />
                  </RequireAuth>
                }
              />
              <Route
                path="/receipts"
                element={
                  <RequireAuth>
                    <Receipts />
                  </RequireAuth>
                }
              />
              <Route
                path="/filters"
                element={
                  <RequireAuth>
                    <Filters />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <ProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile/:id"
                element={
                  <RequireAuth>
                    <OthersProfilePageView />
                  </RequireAuth>
                }
              />
              <Route
                path="/notifications"
                element={
                  <RequireAuth>
                    <Notifications />
                  </RequireAuth>
                }
              />
              <Route
                path="/create-kundali-profile"
                element={
                  <RequireAuth>
                    <CreateKundaliProfile />
                  </RequireAuth>
                }
              />
              <Route
                path="/pricing"
                element={
                  <RequireAuth>
                    <Pricing />
                  </RequireAuth>
                }
              />
              <Route
                path="/billing"
                element={
                  <RequireAuth>
                    <Billing />
                  </RequireAuth>
                }
              />
              <Route
                path="/reveal-likes"
                element={
                  <RequireAuth>
                    <RevealLikes />
                  </RequireAuth>
                }
              />
              <Route
                path="/payment/success"
                element={
                  <RequireAuth>
                    <PaymentSuccess />
                  </RequireAuth>
                }
              />
              <Route
                path="/payment/cancelled"
                element={
                  <RequireAuth>
                    <PaymentCancelled />
                  </RequireAuth>
                }
              />

              {/* Protected Admin Routes (Require Admin Role) */}
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

              {/* Catch-all 404 Not Found Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </EntitlementsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
