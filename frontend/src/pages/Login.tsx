import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"client" | "freelancer">("client");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Display messages from other pages
  useEffect(() => {
    const state = location.state as { message?: string; error?: string };
    if (state?.message) {
      setSuccess(state.message);
      window.history.replaceState({}, document.title);
    }
    if (state?.error) {
      setError(state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Disable Google Auto-Select
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
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1064560706240-placeholder.apps.googleusercontent.com";

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        {
          theme: "filled_blue",
          size: "large",
          width: "100%",
          text: "signin_with"
        }
      );
    }
  }, [googleAuth, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOrUsername.trim()) {
      setError("Please enter your email or username");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await login(emailOrUsername, password);
      if (res.success) {
        setSuccess("✓ Login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setError(res.message || "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };  return (
    <div className="auth-wrapper">
      <div className="glass-card" style={{ maxWidth: "480px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "6px" }}>Welcome Back</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Sign in to access your Skill Sphere account
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email/Username Input */}
          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Enter email or username"
                value={emailOrUsername}
                onChange={(e) => {
                  setEmailOrUsername(e.target.value);
                  setError(null);
                }}
                disabled={isLoading}
                className="form-input"
              />
              <Mail className="input-icon" size={18} />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px"
            }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{
                fontSize: "0.8rem",
                color: "var(--primary)",
                fontWeight: "600"
              }}>
                Forgot?
              </Link>
            </div>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                disabled={isLoading}
                className="form-input"
              />
              <Lock className="input-icon" size={18} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
            style={{ marginTop: "28px" }}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">Or</div>

        {/* Google Sign In */}
        <div id="google-login-btn" style={{ marginBottom: "24px", minHeight: "40px" }} />

        {/* Role Selection for New Google Accounts */}
        <div style={{
          background: "rgba(255, 255, 255, 0.02)",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          marginBottom: "24px",
          border: "1px solid var(--border-color)"
        }}>
          <p style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginBottom: "12px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            New Google user? Select your role first:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`btn ${role === "client" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "8px 12px", fontSize: "0.85rem" }}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => setRole("freelancer")}
              className={`btn ${role === "freelancer" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "8px 12px", fontSize: "0.85rem" }}
            >
              Freelancer
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/signup" style={{ fontWeight: "600", color: "var(--primary)" }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

