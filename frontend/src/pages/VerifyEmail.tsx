import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const VerifyEmail: React.FC = () => {
  const { verifyEmail, resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "prompt">("prompt");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const confirmVerification = async () => {
      if (!token) {
        setStatus("prompt");
        return;
      }

      setStatus("loading");
      try {
        const res = await verifyEmail(token);
        if (res.success) {
          setStatus("success");
          setSuccess(res.message);
        } else {
          setStatus("error");
          setError(res.message);
        }
      } catch (err: any) {
        setStatus("error");
        setError(err.message || "Email verification failed.");
      }
    };

    confirmVerification();
  }, [token, verifyEmail]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await resendVerification(email);
      if (res.success) {
        setSuccess("Verification email has been resent successfully. Please check your inbox.");
        setEmail("");
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send verification email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <div style={{
            background: "rgba(99, 102, 241, 0.1)",
            padding: "16px",
            borderRadius: "50%",
            color: "var(--primary)"
          }}>
            <Mail size={32} />
          </div>
        </div>

        {status === "loading" && (
          <div>
            <h2 style={{ fontSize: "1.75rem", marginBottom: "12px" }}>Verifying your email...</h2>
            <div style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}>
              <div className="spinner" style={{ width: "32px", height: "32px", borderWidth: "3px" }}></div>
            </div>
            <p style={{ color: "var(--text-muted)" }}>Please wait while we confirm your verification token.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <h2 style={{ fontSize: "1.75rem", color: "var(--success)", marginBottom: "12px" }}>Email Verified!</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
              Thank you for verifying your email address. Your account is now fully active.
            </p>
            {success && (
              <div className="alert alert-success" style={{ justifyContent: "center" }}>
                <CheckCircle2 size={20} />
                <span>{success}</span>
              </div>
            )}
            <Link to="/dashboard" className="btn btn-primary btn-block" style={{ display: "inline-flex" }}>
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <h2 style={{ fontSize: "1.75rem", color: "var(--error)", marginBottom: "12px" }}>Verification Failed</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
              The verification link was invalid or may have expired. You can request a new verification email below.
            </p>
            {error && (
              <div className="alert alert-error" style={{ justifyContent: "center" }}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {status === "prompt" && (
          <div>
            <h2 style={{ fontSize: "1.75rem", marginBottom: "12px" }}>Verify your Email</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
              Please check your email inbox and click the verification link we sent to activate your account.
            </p>
            {success && (
              <div className="alert alert-success" style={{ justifyContent: "center" }}>
                <CheckCircle2 size={20} />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="alert alert-error" style={{ justifyContent: "center" }}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {(status === "error" || status === "prompt") && (
          <form onSubmit={handleResend} style={{ marginTop: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
            <div className="form-group">
              <label className="form-label">Resend Verification Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isResending}
                  style={{ paddingLeft: "16px" }}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-secondary btn-block" disabled={isResending}>
              {isResending ? <RefreshCw className="spinner" size={18} /> : "Send Link"}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: "28px" }}>
          Already verified? <Link to="/login" style={{ fontWeight: 700 }}>Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
