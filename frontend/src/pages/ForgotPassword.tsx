import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setSuccess("Password reset instructions have been sent to your email.");
        setEmail("");
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
        <div style={{ marginBottom: "28px" }}>
          <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>
          <h2 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "8px" }}>Forgot Password</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
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
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                className="form-input"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Mail className="input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading} style={{ marginTop: "8px" }}>
            {isLoading ? <div className="spinner"></div> : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
