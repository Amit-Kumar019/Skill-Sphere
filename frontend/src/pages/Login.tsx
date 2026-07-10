import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2 } from "lucide-react";

declare global {
  interface Window {
    google: any;
  }
}

const Login: React.FC = () => {
  const { login, googleAuth, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "freelancer">("client"); // For Google Sign-in role mapping
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Keep a ref of the active role so the Google callback can access it
  // without having to re-initialize the Google client whenever role changes
  const roleRef = useRef(role);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Display success/info messages passed from other pages (e.g. signup or reset password)
  useEffect(() => {
    const state = location.state as { message?: string; error?: string };
    if (state?.message) {
      setSuccess(state.message);
      // Clear state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
    if (state?.error) {
      setError(state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Disable Google Auto-Select on mount to prevent login bypassing on logout
  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  }, []);

  // Google OAuth Initialization
  useEffect(() => {
    const handleGoogleCallback = async (response: any) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await googleAuth(response.credential, roleRef.current);
        if (res.success) {
          navigate("/dashboard");
        } else {
          setError(res.message);
        }
      } catch (err: any) {
        setError(err.message || "Google Sign-In failed.");
      } finally {
        setIsLoading(false);
      }
    };

    if (window.google) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your_google_client_id.apps.googleusercontent.com";
      
      window.google.accounts.id.initialize({
        client_id: clientId === "your_google_client_id.apps.googleusercontent.com" ? "1064560706240-placeholder.apps.googleusercontent.com" : clientId,
        callback: handleGoogleCallback,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { 
          theme: "filled_blue", 
          size: "large", 
          width: "360", 
          text: "signin_with",
          shape: "rectangular"
        }
      );
    }
  }, [googleAuth, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await login(emailOrUsername, password);
      if (res.success) {
        navigate("/dashboard");
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "8px" }}>Welcome Back</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Log in to access your Skill Sphere dashboard</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="Enter your email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                disabled={isLoading}
              />
              <Mail className="input-icon" size={18} />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Forgot Password?</Link>
            </div>
            <div className="input-wrapper">
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <Lock className="input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading} style={{ marginTop: "8px" }}>
            {isLoading ? <div className="spinner"></div> : "Log In"}
          </button>
        </form>

        <div className="divider">Or Sign In With</div>

        {/* Selected Role for OAuth Sign-Up fallback */}
        <div style={{ marginBottom: "16px", textAlign: "left" }}>
          <span className="form-label" style={{ display: "block", marginBottom: "8px" }}>Select Role (If new Google account)</span>
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              type="button" 
              className={`btn btn-secondary`} 
              style={{ 
                flex: 1, 
                fontSize: "0.85rem",
                borderColor: role === "client" ? "var(--primary)" : "var(--border-color)",
                background: role === "client" ? "rgba(99, 102, 241, 0.1)" : "rgba(255,255,255,0.02)"
              }}
              onClick={() => setRole("client")}
              disabled={isLoading}
            >
              <UserIcon size={14} /> Client (Hiring)
            </button>
            <button 
              type="button" 
              className={`btn btn-secondary`} 
              style={{ 
                flex: 1, 
                fontSize: "0.85rem",
                borderColor: role === "freelancer" ? "var(--primary)" : "var(--border-color)",
                background: role === "freelancer" ? "rgba(99, 102, 241, 0.1)" : "rgba(255,255,255,0.02)"
              }}
              onClick={() => setRole("freelancer")}
              disabled={isLoading}
            >
              <UserIcon size={14} /> Freelancer (Work)
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", minHeight: "44px" }}>
          <div id="google-login-btn"></div>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup" style={{ fontWeight: 700 }}>Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
