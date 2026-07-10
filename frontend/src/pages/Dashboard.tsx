import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, Shield, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user, logout, resendVerification } = useAuth();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

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
    <div className="auth-wrapper" style={{ minHeight: "100vh", alignItems: "flex-start", paddingTop: "80px" }}>
      <div className="glass-card" style={{ maxWidth: "800px", padding: "40px" }}>
        
        {/* Banner for Email Verification */}
        {!user.isEmailVerified && (
          <div className="alert alert-error" style={{ marginBottom: "30px", flexDirection: "column", gap: "8px" }}>
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

        {/* Success / Error notification */}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: "30px" }}>
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "30px" }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h1 style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "4px" }}>
              Welcome, {user.firstName}!
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Manage your Skill Sphere profile credentials and account actions
            </p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "10px 18px", gap: "6px" }}>
            <LogOut size={16} /> Logout
          </button>
        </div>

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

      </div>
    </div>
  );
};

export default Dashboard;
