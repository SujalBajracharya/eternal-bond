import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  History,
  DollarSign,
  Users,
  ShieldCheck,
  Image as ImageIcon,
  Flag,
  UserCheck,
  Heart,
  MessageSquare,
  FileText,
  Sliders,
  Award,
  Bell,
  Menu,
  X,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuGroups = [
    {
      title: "Core Operations",
      items: [
        { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
        { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
        { label: "Audit Logs", path: "/admin/audit", icon: History },
        { label: "Revenue", path: "/admin/revenue", icon: DollarSign },
      ],
    },
    {
      title: "User Management",
      items: [
        { label: "Users", path: "/admin/users", icon: Users },
        { label: "KYC Review", path: "/admin/kyc", icon: ShieldCheck },
        { label: "Photo Moderation", path: "/admin/photos", icon: ImageIcon },
        { label: "Reports & Safety", path: "/admin/reports", icon: Flag },
        { label: "Roles", path: "/admin/roles", icon: UserCheck },
      ],
    },
    {
      title: "System Config",
      items: [
        { label: "Matches", path: "/admin/matches", icon: Heart },
        { label: "Conversations", path: "/admin/conversations", icon: MessageSquare },
        { label: "CMS", path: "/admin/cms", icon: FileText },
        { label: "Filters", path: "/admin/filters", icon: Sliders },
        { label: "Badges", path: "/admin/badges", icon: Award },
        { label: "Notifications", path: "/admin/notifications", icon: Bell },
      ],
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card/85 backdrop-blur-md border-r border-border/50 text-foreground relative z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-border/40">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-8 h-8 rounded-full bg-gradient-sunset text-primary-foreground shadow-soft transition-transform duration-500 group-hover:rotate-12">
            <Heart className="w-3.5 h-3.5 fill-current" />
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight">
            Eternal<span className="text-primary">Admin</span>
          </span>
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-soft scale-[1.02]"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-primary"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-border/40 space-y-3 bg-muted/30">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-warm flex items-center justify-center text-xs font-semibold text-primary shadow-sm uppercase border border-primary/20">
            {user?.fullName?.slice(0, 2) || "AD"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-foreground">{user?.fullName || "Admin"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/"
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Exit</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-transparent bg-destructive/10 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
          >
            <LogOut className="w-3 h-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-sunset opacity-15 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[30rem] h-[30rem] rounded-full bg-gradient-plum opacity-10 blur-3xl animate-blob [animation-delay:3s]" />

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:block w-64 h-screen shrink-0 sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-64 z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-background/70 backdrop-blur-md border-b border-border/30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl border border-border/60 hover:bg-secondary/40 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 text-xs font-semibold text-primary border border-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Secure Console
            </span>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
