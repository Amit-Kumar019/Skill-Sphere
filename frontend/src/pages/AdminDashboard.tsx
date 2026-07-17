import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Users, Lock, Unlock, ArrowLeft, Loader2, FileText 
} from "lucide-react";

interface VerificationItem {
  _id: string;
  freelancer: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: { url: string };
  };
  aadhaar?: { url: string };
  pan?: { url: string };
  selfie?: { url: string };
  status: string;
  remarks?: string;
}

interface UserItem {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isBlocked: boolean;
  isEmailVerified: boolean;
}

interface DisputeItem {
  _id: string;
  gig: { title: string; budget: { min: number; max: number } };
  payment: { amount: number; transactionId: string };
  client: { username: string; firstName: string; lastName: string };
  freelancer: { username: string; firstName: string; lastName: string };
  reason: string;
  status: string;
  resolution?: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "kyc" | "disputes">("kyc");

  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Verification resolution form state
  const [selectedVerifId, setSelectedVerifId] = useState<string | null>(null);
  const [verifRemarks, setVerifRemarks] = useState("");

  // Dispute resolution form state
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [disputeResolutionText, setDisputeResolutionText] = useState("");

  const fetchVerifications = async () => {
    try {
      const res = await fetch("/api/v1/admin/verifications", { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) setVerifications(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/v1/admin/users", { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) setUsers(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await fetch("/api/v1/admin/disputes", { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) setDisputes(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchVerifications(), fetchUsers(), fetchDisputes()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadData();
    }
  }, [user]);

  // Auth Guard
  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Block/Unblock action
  const handleBlockToggle = async (userId: string, currentBlockStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentBlockStatus ? "unblock" : "block"} this user?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/block`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ block: !currentBlockStatus }),
        credentials: "include"
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const json = await res.json();
        alert(json.message || "Failed to update block status.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // KYC approval/rejection handler
  const handleVerifyDocs = async (status: "Verified" | "Rejected") => {
    if (!selectedVerifId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/verifications/${selectedVerifId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks: verifRemarks }),
        credentials: "include"
      });
      if (res.ok) {
        setSelectedVerifId(null);
        setVerifRemarks("");
        fetchVerifications();
      } else {
        const json = await res.json();
        alert(json.message || "Failed to submit verification status.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Dispute resolution handler
  const handleResolveDispute = async (status: "Resolved" | "Rejected") => {
    if (!selectedDisputeId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/disputes/${selectedDisputeId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution: disputeResolutionText }),
        credentials: "include"
      });
      if (res.ok) {
        setSelectedDisputeId(null);
        setDisputeResolutionText("");
        fetchDisputes();
      } else {
        const json = await res.json();
        alert(json.message || "Failed to resolve dispute.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ minHeight: "100vh", alignItems: "flex-start", paddingTop: "80px", paddingBottom: "60px" }}>
      <div className="glass-card" style={{ maxWidth: "1000px", padding: "40px" }}>
        
        {/* Navigation Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
          <div>
            <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 style={{ fontSize: "2.25rem", color: "var(--text-main)" }}>Admin Platform Console</h1>
          </div>
          <span style={{ fontSize: "0.8rem", background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "4px 12px", borderRadius: "16px", fontWeight: 700, textTransform: "uppercase" }}>
            Admin Level Access
          </span>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "30px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
          <button 
            onClick={() => setActiveTab("kyc")} 
            className={`btn ${activeTab === "kyc" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "0.9rem" }}
          >
            KYC Verifications ({verifications.length})
          </button>
          <button 
            onClick={() => setActiveTab("users")} 
            className={`btn ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "0.9rem" }}
          >
            Platform Users ({users.length})
          </button>
          <button 
            onClick={() => setActiveTab("disputes")} 
            className={`btn ${activeTab === "disputes" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "0.9rem" }}
          >
            Disputes ({disputes.length})
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <Loader2 className="spinner" size={32} style={{ color: "var(--primary)" }} />
          </div>
        ) : (
          <>
            {/* Tab content: KYC */}
            {activeTab === "kyc" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {verifications.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", textAlign: "center", padding: "20px 0" }}>No pending KYC audits found.</p>
                ) : (
                  verifications.map((item) => (
                    <div key={item._id} style={{
                      background: "rgba(255,255,255,0.01)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {item.freelancer.avatar?.url ? (
                              <img src={item.freelancer.avatar.url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <Users size={16} />
                            )}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, display: "block" }}>{item.freelancer.firstName} {item.freelancer.lastName}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>@{item.freelancer.username} &bull; {item.freelancer.email}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: "0.8rem", background: "rgba(245, 158, 11, 0.15)", color: "var(--warning)", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                          Pending Audit
                        </span>
                      </div>

                      {/* Documents link */}
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "16px 0" }}>
                        {item.aadhaar?.url && (
                          <a href={item.aadhaar.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", gap: "6px" }}>
                            <FileText size={14} /> Aadhaar Document
                          </a>
                        )}
                        {item.pan?.url && (
                          <a href={item.pan.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", gap: "6px" }}>
                            <FileText size={14} /> PAN Card
                          </a>
                        )}
                        {item.selfie?.url && (
                          <a href={item.selfie.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", gap: "6px" }}>
                            <Users size={14} /> Selfie Verification
                          </a>
                        )}
                      </div>

                      {/* Audit inputs */}
                      {selectedVerifId === item._id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <textarea
                            className="form-input"
                            placeholder="Add remarks or justification details (especially if rejecting)..."
                            value={verifRemarks}
                            onChange={(e) => setVerifRemarks(e.target.value)}
                            style={{ paddingLeft: "12px" }}
                            rows={2}
                          />
                          <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={() => setSelectedVerifId(null)} className="btn btn-secondary" style={{ flex: 1 }} disabled={actionLoading}>Cancel</button>
                            <button onClick={() => handleVerifyDocs("Rejected")} className="btn btn-secondary" style={{ flex: 1, background: "rgba(239, 68, 68, 0.15)", color: "var(--error)" }} disabled={actionLoading}>Reject KYC</button>
                            <button onClick={() => handleVerifyDocs("Verified")} className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading}>Verify & Approve</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setSelectedVerifId(item._id)} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                          Process KYC Audit
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab content: Platform Users */}
            {activeTab === "users" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                      <th style={{ padding: "12px 10px" }}>Name / Username</th>
                      <th style={{ padding: "12px 10px" }}>Email</th>
                      <th style={{ padding: "12px 10px" }}>Role</th>
                      <th style={{ padding: "12px 10px" }}>Verified</th>
                      <th style={{ padding: "12px 10px" }}>Status</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                        <td style={{ padding: "16px 10px", fontWeight: 600 }}>
                          {u.firstName} {u.lastName}
                          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}>@{u.username}</span>
                        </td>
                        <td style={{ padding: "16px 10px" }}>{u.email}</td>
                        <td style={{ padding: "16px 10px", textTransform: "capitalize" }}>{u.role}</td>
                        <td style={{ padding: "16px 10px" }}>{u.isEmailVerified ? "✅" : "❌"}</td>
                        <td style={{ padding: "16px 10px" }}>
                          {u.isBlocked ? (
                            <span style={{ color: "var(--error)", fontWeight: 600 }}>Blocked</span>
                          ) : (
                            <span style={{ color: "var(--success)" }}>Active</span>
                          )}
                        </td>
                        <td style={{ padding: "16px 10px", textAlign: "right" }}>
                          <button
                            onClick={() => handleBlockToggle(u._id, u.isBlocked)}
                            disabled={actionLoading}
                            className={`btn ${u.isBlocked ? "btn-primary" : "btn-secondary"}`}
                            style={{ padding: "6px 12px", fontSize: "0.75rem", gap: "4px" }}
                          >
                            {u.isBlocked ? <><Unlock size={12} /> Unblock</> : <><Lock size={12} /> Block</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab content: Disputes */}
            {activeTab === "disputes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {disputes.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", textAlign: "center", padding: "20px 0" }}>No active disputes raised.</p>
                ) : (
                  disputes.map((item) => (
                    <div key={item._id} style={{
                      background: "rgba(255,255,255,0.01)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <h3 style={{ fontSize: "1.1rem" }}>Dispute on Project: {item.gig?.title}</h3>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Escrow Amount: <strong>${item.payment?.amount}</strong> &bull; TXN: {item.payment?.transactionId}
                          </span>
                        </div>
                        <span style={{
                          fontSize: "0.75rem",
                          background: item.status === "Open" ? "rgba(239, 68, 68, 0.15)" : item.status === "Resolved" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                          color: item.status === "Open" ? "var(--error)" : item.status === "Resolved" ? "var(--success)" : "var(--text-muted)",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontWeight: 700
                        }}>{item.status}</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "rgba(255,255,255,0.01)", padding: "16px", borderRadius: "4px", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block" }}>Client</span>
                          <strong>{item.client?.firstName} {item.client?.lastName}</strong> (@{item.client?.username})
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block" }}>Freelancer</span>
                          <strong>{item.freelancer?.firstName} {item.freelancer?.lastName}</strong> (@{item.freelancer?.username})
                        </div>
                      </div>

                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Dispute Reason:</span>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-main)" }}>{item.reason}</p>
                      </div>

                      {item.status === "Open" ? (
                        selectedDisputeId === item._id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <textarea
                              className="form-input"
                              placeholder="Write dispute audit findings and resolution terms..."
                              value={disputeResolutionText}
                              onChange={(e) => setDisputeResolutionText(e.target.value)}
                              style={{ paddingLeft: "12px" }}
                              rows={2}
                            />
                            <div style={{ display: "flex", gap: "12px" }}>
                              <button onClick={() => setSelectedDisputeId(null)} className="btn btn-secondary" style={{ flex: 1 }} disabled={actionLoading}>Cancel</button>
                              <button onClick={() => handleResolveDispute("Rejected")} className="btn btn-secondary" style={{ flex: 1, background: "rgba(239, 68, 68, 0.15)", color: "var(--error)" }} disabled={actionLoading}>Dismiss Dispute</button>
                              <button onClick={() => handleResolveDispute("Resolved")} className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading}>Resolve & Release</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setSelectedDisputeId(item._id)} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                            Resolve Dispute
                          </button>
                        )
                      ) : (
                        item.resolution && (
                          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.85rem" }}>
                            <span style={{ color: "var(--text-muted)", display: "block" }}>Resolution Details:</span>
                            <p style={{ fontStyle: "italic" }}>{item.resolution}</p>
                          </div>
                        )
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
