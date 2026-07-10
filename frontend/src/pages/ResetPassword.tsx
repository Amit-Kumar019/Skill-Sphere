import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";

const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid or missing password reset token.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await resetPassword(token, password);
      if (res.success) {
        setSuccess("Password has been reset successfully. Redirecting you to login...");
        setTimeout(() => {
          navigate("/login", { state: { message: "Password reset successful! Please log in." } });
        }, 3000);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card">
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "8px" }}>Reset Password</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Enter your new password below</p>
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
            <label className="form-label">New Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || !!success}
              />
              <Lock className="input-icon" size={18} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                className="form-input"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || !!success}
              />
              <Lock className="input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading || !!success} style={{ marginTop: "8px" }}>
            {isLoading ? <div className="spinner"></div> : "Reset Password"}
          </button>
        </form>

        <div className="auth-footer">
          Remember your password? <Link to="/login" style={{ fontWeight: 700 }}>Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
