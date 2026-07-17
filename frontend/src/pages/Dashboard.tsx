import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import { 
  LogOut, User, Shield, CheckCircle2, AlertTriangle, 
  RefreshCw, Briefcase, DollarSign, ArrowRight, Eye,
  Bell, Trash2, Clock, MessageSquare
} from "lucide-react";

const Dashboard: React.FC = () => {
  const { user, logout, resendVerification } = useAuth();
  const location = useLocation();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  
  // Profile check states
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // My Gigs states
  const [myGigs, setMyGigs] = useState<any[]>([]);
  const [gigsLoading, setGigsLoading] = useState(true);

  const fetchMyGigs = async () => {
    setGigsLoading(true);
    try {
      const res = await fetch("/api/v1/gigs/my-gigs", { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) {
        setMyGigs(json.data);
      }
    } catch (err) {
      console.error("Error fetching my gigs:", err);
    } finally {
      setGigsLoading(false);
    }
  };

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/v1/notifications", { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      const socket = io(window.location.origin, {
        query: { userId: user._id }
      });
      
      socket.on("connect", () => {
        socket.emit("join_user", user._id);
      });

      socket.on("notification", (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      });

      socket.on("chat_message_notification", (data) => {
        setNotifications((prev) => [
          {
            _id: `msg_${Date.now()}`,
            title: `New message from ${data.senderName}`,
            message: data.message,
            type: "Message",
            isRead: false,
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/v1/notifications/read-all", {
        method: "PATCH",
        credentials: "include"
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/notifications/${notifId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== notifId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync state messages passed from setup wizards
  useEffect(() => {
    const state = location.state as { message?: string };
    if (state?.message) {
      setSuccess(state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch own profile on load
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/v1/profile/me", { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) {
        setProfile(json.data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyGigs();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  const handleResend = async () => {
    if (!user?.email) return;
    setIsResending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await resendVerification(user.email);
      if (res.success) {
        setSuccess("Verification link sent successfully! Please check your email inbox.");
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="auth-wrapper" style={{ minHeight: "100vh", alignItems: "flex-start", paddingTop: "80px", paddingBottom: "60px" }}>
      <div className="glass-card" style={{ maxWidth: "850px", padding: "40px" }}>
        
        {/* Banner for Email Verification */}
        {!user.isEmailVerified && (
          <div className="alert alert-error" style={{ marginBottom: "24px", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <AlertTriangle size={22} style={{ flexShrink: 0 }} />
              <strong style={{ fontSize: "1rem" }}>Email Account Unverified</strong>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#fca5a5" }}>
              Your account email has not been verified yet. Please check your inbox for a verification email to access all platform features.
            </p>
            <button 
              onClick={handleResend} 
              disabled={isResending}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "none",
                borderRadius: "4px",
                color: "white",
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                marginTop: "4px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                alignSelf: "flex-start"
              }}
            >
              {isResending ? <RefreshCw className="spinner" size={12} /> : "Resend Verification Link"}
            </button>
          </div>
        )}

        {/* Profile Configuration Warning Banner */}
        {!profileLoading && !profile && (
          <div className="alert alert-error" style={{ 
            marginBottom: "24px", 
            flexDirection: "column", 
            gap: "10px",
            background: "rgba(99, 102, 241, 0.08)",
            borderColor: "rgba(99, 102, 241, 0.3)",
            color: "var(--text-main)"
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Briefcase size={22} style={{ color: "var(--primary)", flexShrink: 0 }} />
              <strong style={{ fontSize: "1rem" }}>Profile Setup Required</strong>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {user.role === "freelancer"
                ? "Configure your freelancer profile (skills, rates, and portfolio) to start bidding on jobs."
                : "Configure your client company details to start posting gigs and hiring talent."}
            </p>
            <Link 
              to="/profile-setup" 
              className="btn btn-primary"
              style={{ padding: "6px 14px", fontSize: "0.8rem", alignSelf: "flex-start", gap: "4px" }}
            >
              Complete Setup Wizard <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Success / Error notification */}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: "24px" }}>
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "24px" }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard Title Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h1 style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "4px" }}>
              Welcome, {user.firstName}!
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Manage your Skill Sphere profile credentials and account actions
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", position: "relative" }}>
            {user.role === "admin" && (
              <Link to="/admin" className="btn btn-primary" style={{ padding: "10px 18px", gap: "6px" }}>
                <Shield size={16} /> Admin Console
              </Link>
            )}
            
            {/* Inbox / Chat Link */}
            <Link to="/chat" className="btn btn-secondary" style={{ padding: "10px 18px", gap: "6px" }}>
              <MessageSquare size={16} /> Inbox
            </Link>

            {/* Notification Bell */}
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="btn btn-secondary" 
                style={{ padding: "10px 14px", position: "relative" }}
              >
                <Bell size={18} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "var(--error)",
                    color: "white",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {/* Dropdown menu */}
              {showNotifications && (
                <div className="glass-card" style={{
                  position: "absolute",
                  top: "50px",
                  right: 0,
                  width: "360px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  padding: "20px",
                  zIndex: 200,
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-lg)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Notifications</span>
                    <button 
                      onClick={handleMarkAllRead} 
                      style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
                    >
                      Mark all as read
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>No notifications</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
                      {notifications.map((notif) => (
                        <div 
                          key={notif._id} 
                          style={{
                            padding: "10px",
                            background: notif.isRead ? "rgba(255,255,255,0.01)" : "rgba(99, 102, 241, 0.05)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-color)",
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                          }}
                        >
                          <button 
                            onClick={(e) => handleDeleteNotif(notif._id, e)}
                            style={{ position: "absolute", top: "8px", right: "8px", background: "none", border: "none", color: "var(--error)", cursor: "pointer", opacity: 0.6 }}
                          >
                            <Trash2 size={12} />
                          </button>
                          
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, paddingRight: "16px" }}>{notif.title}</span>
                          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.3 }}>{notif.message}</p>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={10} /> {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "10px 18px", gap: "6px" }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Dynamic Profile Summary Section (If Profile Exists) */}
        {!profileLoading && profile && (
          <div style={{
            background: "rgba(99, 102, 241, 0.04)",
            border: "1px solid rgba(99, 102, 241, 0.15)",
            borderRadius: "var(--radius-md)",
            padding: "24px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px"
          }}>
            <div>
              <span style={{ color: "var(--secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Your Active Profile</span>
              <h2 style={{ fontSize: "1.5rem", marginTop: "4px" }}>
                {user.role === "freelancer" ? profile.title : profile.companyName}
              </h2>
              {user.role === "freelancer" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center" }}>
                    <DollarSign size={14} style={{ color: "var(--success)" }} /> {profile.hourlyRate} / hr
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.15)" }}>&bull;</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    {profile.skills?.slice(0, 3).join(", ")}
                    {profile.skills?.length > 3 && "..."}
                  </span>
                </div>
              ) : (
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  {profile.companyWebsite || "No website specified"}
                </p>
              )}
            </div>
            
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {user.role === "client" ? (
                <Link to="/create-gig" className="btn btn-primary" style={{ padding: "10px 18px", gap: "6px" }}>
                  <Briefcase size={16} /> Post a Gig
                </Link>
              ) : (
                <Link to="/gigs" className="btn btn-primary" style={{ padding: "10px 18px", gap: "6px" }}>
                  <Briefcase size={16} /> Explore Gigs
                </Link>
              )}
              <Link to="/profile" className="btn btn-secondary" style={{ padding: "10px 18px", gap: "6px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Eye size={16} /> View Profile
              </Link>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "10px" }}>
          
          {/* User Profile Card */}
          <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "24px"
          }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} style={{ color: "var(--primary)" }} /> User Information
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Full Name</span>
                <span style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Username</span>
                <span style={{ fontWeight: 600 }}>@{user.username}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Email Address</span>
                  <span style={{ fontWeight: 600 }}>{user.email}</span>
                </div>
                {user.isEmailVerified ? (
                  <span style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "var(--success)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 700
                  }}>Verified</span>
                ) : (
                  <span style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "var(--error)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 700
                  }}>Unverified</span>
                )}
              </div>
            </div>
          </div>

          {/* Account Permissions Card */}
          <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "24px"
          }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={18} style={{ color: "var(--secondary)" }} /> Security & Role
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Role Type</span>
                <span style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "capitalize",
                  marginTop: "4px",
                  background: user.role === "admin" 
                    ? "linear-gradient(135deg, #ef4444, #b91c1c)"
                    : user.role === "freelancer"
                    ? "linear-gradient(135deg, #06b6d4, #0891b2)"
                    : "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "white"
                }}>{user.role}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Authentication Provider</span>
                <span style={{ fontWeight: 600 }}>{user.googleId ? "Google OAuth 2.0" : "Credentials (Email/Password)"}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Two-Factor Auth (2FA)</span>
                <span style={{ color: "var(--text-muted)" }}>Disabled</span>
              </div>
            </div>
          </div>

        </div>

        {/* My Gigs Section */}
        {user.role !== "admin" && (
          <div style={{ marginTop: "30px", borderTop: "1px solid var(--border-color)", paddingTop: "30px" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Briefcase size={18} style={{ color: "var(--primary)" }} /> 
              {user.role === "client" ? "My Posted Gigs" : "My Active Contracts"}
            </h3>

            {gigsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <div className="spinner" style={{ width: "24px", height: "24px" }}></div>
              </div>
            ) : myGigs.length === 0 ? (
              <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  {user.role === "client" 
                    ? "You haven't posted any gigs yet." 
                    : "You haven't been hired for any active gigs yet."}
                </p>
                {user.role === "client" && (
                  <Link to="/create-gig" className="btn btn-primary" style={{ marginTop: "16px", display: "inline-flex" }}>
                    Post Your First Gig
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                {myGigs.map((gig) => (
                  <div 
                    key={gig._id}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{
                          fontSize: "0.75rem",
                          background: gig.status === "Open" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                          color: gig.status === "Open" ? "var(--success)" : "var(--text-muted)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: 700
                        }}>{gig.status}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(gig.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                        {gig.title}
                      </h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.4, marginBottom: "12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {gig.description}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "12px" }}>
                        <span style={{ fontWeight: 700, color: "var(--success)", fontSize: "1rem" }}>
                          ${gig.budget?.min} - ${gig.budget?.max}
                        </span>
                        <Link to={`/gigs/${gig._id}`} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.75rem", gap: "4px" }}>
                          Track Gig <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
