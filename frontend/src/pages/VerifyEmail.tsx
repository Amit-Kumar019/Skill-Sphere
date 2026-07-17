import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
} from "lucide-react";

const VerifyEmail: React.FC = () => {
  const { verifyEmail, resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "prompt"
  >("prompt");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Auto-verify if token is in URL
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
          // Auto-redirect after 3 seconds
          setTimeout(() => navigate("/dashboard"), 3000);
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
  }, [token, verifyEmail, navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await resendVerification(email);
      if (res.success) {
        setSuccess(
          "✓ Verification email sent! Check your inbox and spam folder.",
        );
        setEmail("");
        setResendCountdown(60);

        // Countdown timer
        const interval = setInterval(() => {
          setResendCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
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
      <div className="glass-card" style={{ maxWidth: "500px", textAlign: "center" }}>
        {/* Icon Section */}
        <div
          style={{
            marginBottom: "30px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background:
                status === "success"
                  ? "rgba(16, 185, 129, 0.15)"
                  : status === "error"
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(99, 102, 241, 0.15)",
              padding: "20px",
              borderRadius: "50%",
              color:
                status === "success"
                  ? "var(--success)"
                  : status === "error"
                    ? "var(--error)"
                    : "var(--primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {status === "success" ? (
              <CheckCircle2 size={40} />
            ) : status === "error" ? (
              <AlertCircle size={40} />
            ) : (
              <Mail size={40} />
            )}
          </div>
        </div>

        {/* Loading State */}
        {status === "loading" && (
          <div>
            <h2
              style={{
                fontSize: "1.8rem",
                fontWeight: "700",
                marginBottom: "12px",
                color: "var(--text-main)",
              }}
            >
              Verifying your email...
            </h2>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "30px 0",
              }}
            >
              <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "3px", borderTopColor: "var(--primary)" }} />
            </div>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
              Please wait while we confirm your verification token...
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div>
            <h2
              style={{
                fontSize: "1.8rem",
                fontWeight: "700",
                marginBottom: "12px",
                color: "var(--success)",
              }}
            >
              Email Verified! 🎉
            </h2>
            <p
              style={{ color: "var(--text-muted)", marginBottom: "24px", lineHeight: "1.6" }}
            >
              Thank you for verifying your email address. Your account is now
              fully active and ready to use.
            </p>
            <div className="alert alert-success">
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
            <Link to="/dashboard" className="btn btn-primary btn-block">
              Go to Dashboard →
            </Link>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                marginTop: "16px",
              }}
            >
              Redirecting automatically in 3 seconds...
            </p>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div>
            <h2
              style={{
                fontSize: "1.8rem",
                fontWeight: "700",
                marginBottom: "12px",
                color: "var(--error)",
              }}
            >
              Verification Failed
            </h2>
            <p
              style={{ color: "var(--text-muted)", marginBottom: "24px", lineHeight: "1.6" }}
            >
              The verification link was invalid, expired, or already used.
              Request a new verification email below to try again.
            </p>
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Prompt State */}
        {status === "prompt" && (
          <div>
            <h2
              style={{
                fontSize: "1.8rem",
                fontWeight: "700",
                marginBottom: "12px",
                color: "var(--text-main)",
              }}
            >
              Verify Your Email
            </h2>
            <p
              style={{ color: "var(--text-muted)", marginBottom: "24px", lineHeight: "1.6" }}
            >
              We've sent a verification link to your email address. Please check
              your inbox (and spam folder) and click the link to verify.
            </p>
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
          </div>
        )}

        {/* Resend Form - shown for error and prompt states */}
        {(status === "error" || status === "prompt") && (
          <form
            onSubmit={handleResend}
            style={{
              marginTop: "30px",
              paddingTop: "30px",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                marginBottom: "16px",
                fontWeight: "500",
              }}
            >
              Didn't receive the email? Resend it:
            </p>

            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  disabled={isResending || resendCountdown > 0}
                  className="form-input"
                  style={{ paddingLeft: "16px" }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isResending || resendCountdown > 0}
              className="btn btn-primary btn-block"
              style={{ marginTop: "16px" }}
            >
              {isResending ? (
                <>
                  <div className="spinner" />
                  <span>Sending...</span>
                </>
              ) : resendCountdown > 0 ? (
                <>
                  <Clock size={16} />
                  <span>Resend in {resendCountdown}s</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>

            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginTop: "16px",
              }}
            >
              Check your spam/junk folder if you don't see the email
            </p>
          </form>
        )}

        {/* Footer Links */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            fontSize: "0.9rem",
          }}
        >
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: "600" }}>
            Back to Login
          </Link>
          <Link to="/signup" style={{ color: "var(--primary)", fontWeight: "600" }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
