import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Briefcase, Mail, Lock, UserCheck, AlertCircle } from "lucide-react";

const Signup: React.FC = () => {
  const { signup, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "client" as "client" | "freelancer",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const selectRole = (role: "client" | "freelancer") => {
    setFormData({
      ...formData,
      role,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { username, firstName, lastName, email, password, role } = formData;

    if (!username || !firstName || !lastName || !email || !password || !role) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await signup(formData);
      if (res.success) {
        // Since backend signup logs the user in (returns cookies), navigate to dashboard
        navigate("/dashboard", { 
          state: { message: "Account created successfully! Please verify your email." } 
        });
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card" style={{ maxWidth: "540px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "6px" }}>Create Account</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Join Skill Sphere to start hiring or freelancing</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Toggle Selector */}
          <div className="form-group">
            <span className="form-label" style={{ display: "block", marginBottom: "10px" }}>Select Account Type</span>
            <div className="role-toggle-container">
              <div 
                className={`role-card ${formData.role === "client" ? "active" : ""}`}
                onClick={() => selectRole("client")}
              >
                <Briefcase className="role-icon" size={24} />
                <div className="role-title">Client</div>
                <div className="role-desc">I want to hire freelancers for projects</div>
              </div>
              <div 
                className={`role-card ${formData.role === "freelancer" ? "active" : ""}`}
                onClick={() => selectRole("freelancer")}
              >
                <User className="role-icon" size={24} />
                <div className="role-title">Freelancer</div>
                <div className="role-desc">I want to apply to gigs & earn money</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                  style={{ paddingLeft: "16px" }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  style={{ paddingLeft: "16px" }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="johndoe123"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
              />
              <UserCheck className="input-icon" size={18} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              <Mail className="input-icon" size={18} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <Lock className="input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading} style={{ marginTop: "12px" }}>
            {isLoading ? <div className="spinner"></div> : "Register Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" style={{ fontWeight: 700 }}>Log In here</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
