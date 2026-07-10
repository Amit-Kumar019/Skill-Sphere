import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FileText, ArrowLeft, 
  User, CheckCircle2, AlertCircle, Clock, Link as LinkIcon, Send, ShieldCheck
} from "lucide-react";

interface Attachment {
  url: string;
  public_id: string;
}

interface Milestone {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  status: "Pending" | "In Progress" | "Submitted" | "Approved" | "Rejected";
  paymentStatus: "Pending" | "Paid" | "Refunded";
}

interface Proposal {
  _id: string;
  coverLetter: string;
  bidAmount: number;
  estimatedDuration: number;
  durationUnit: "Days" | "Weeks" | "Months";
  attachments: Attachment[];
  status: "Pending" | "Accepted" | "Rejected" | "Withdrawn";
  freelancer: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: {
      url: string;
    };
  };
  createdAt: string;
}

const GigDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [gig, setGig] = useState<any>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Proposal Form State (for Freelancers)
  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [estDuration, setEstDuration] = useState<number>(1);
  const [durUnit, setDurUnit] = useState<"Days" | "Weeks" | "Months">("Days");
  const [propAttachments, setPropAttachments] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGigDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/gigs/${id}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to load gig details.");
      }

      setGig(json.data.gig);
      setMilestones(json.data.milestones || []);
      setProposals(json.data.proposals || []);
      setIsOwner(json.data.isOwner);

      // Default the freelancer's bid amount to the max budget of the gig
      if (json.data.gig && bidAmount === 0) {
        setBidAmount(json.data.gig.budget.max);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchGigDetails();
    }
  }, [id, user]);

  // Submit Proposal Handler
  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverLetter || !bidAmount || !estDuration) {
      setError("Please fill out all proposal fields.");
      return;
    }

    setActionLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("coverLetter", coverLetter);
    formData.append("bidAmount", String(bidAmount));
    formData.append("estimatedDuration", String(estDuration));
    formData.append("durationUnit", durUnit);

    propAttachments.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      const res = await fetch(`/api/v1/gigs/${id}/proposals`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to submit proposal.");
      }

      // Reset form & refetch
      setCoverLetter("");
      setPropAttachments([]);
      fetchGigDetails();
    } catch (err: any) {
      setError(err.message || "Failed to submit proposal.");
    } finally {
      setActionLoading(false);
    }
  };

  // Client accept/reject proposal
  const handleProposalAction = async (proposalId: string, action: "Accepted" | "Rejected") => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/gigs/proposals/${proposalId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
        credentials: "include"
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to process hiring action.");
      }

      fetchGigDetails(); // Reload page to update gig status
    } catch (err: any) {
      setError(err.message || "Hiring process failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px" }}>
        <div className="spinner" style={{ width: "32px", height: "32px" }}></div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading project deliverables...</p>
      </div>
    );
  }

  if (error && !gig) {
    return (
      <div className="auth-wrapper">
        <div className="glass-card" style={{ textAlign: "center" }}>
          <AlertCircle size={32} style={{ color: "var(--error)", marginBottom: "16px" }} />
          <h2 style={{ marginBottom: "8px" }}>Gig Not Found</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>{error}</p>
          <Link to="/gigs" className="btn btn-secondary btn-block">
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Check if current freelancer user already submitted a proposal
  const ownProposal = !isOwner && proposals.find(p => p.freelancer._id === user?._id);

  return (
    <div className="auth-wrapper" style={{ minHeight: "100vh", alignItems: "flex-start", paddingTop: "80px", paddingBottom: "60px" }}>
      <div style={{ width: "100%", maxWidth: "1000px", display: "grid", gridTemplateColumns: "1fr", gap: "28px" }}>
        
        {/* Top bar toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/gigs" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <ArrowLeft size={14} /> Back to Marketplace
          </Link>
        </div>

        {/* Main Grid: Details left, Actions right */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "28px", alignItems: "flex-start" }}>
          
          {/* Left Column: Gig Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* Main Overview Card */}
            <div className="glass-card" style={{ padding: "40px", margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", background: "rgba(99, 102, 241, 0.1)", color: "var(--secondary)", border: "1px solid rgba(6, 182, 212, 0.15)", padding: "2px 10px", borderRadius: "12px", textTransform: "uppercase", fontWeight: 700 }}>
                    {gig.category?.name}
                  </span>
                  <h1 style={{ fontSize: "2rem", color: "var(--text-main)", fontWeight: 800, marginTop: "8px" }}>{gig.title}</h1>
                </div>
                <span style={{
                  background: gig.status === "Open" 
                    ? "rgba(16, 185, 129, 0.15)"
                    : gig.status === "In Progress"
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(255,255,255,0.05)",
                  color: gig.status === "Open"
                    ? "var(--success)"
                    : gig.status === "In Progress"
                    ? "var(--warning)"
                    : "var(--text-muted)",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 700
                }}>{gig.status}</span>
              </div>

              {/* Client Info block */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "24px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <span>Posted by Client:</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                  {gig.client?.firstName} {gig.client?.lastName}
                </span>
                <span>&bull;</span>
                <span>{new Date(gig.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Description */}
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "24px", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)", marginBottom: "10px" }}>Project Scope</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                  {gig.description}
                </p>
              </div>

              {/* Skills Required */}
              {gig.skillsRequired && gig.skillsRequired.length > 0 && (
                <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "24px", marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)", marginBottom: "12px" }}>Skills Required</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {gig.skillsRequired.map((skill: any) => (
                      <span key={skill._id} style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-main)",
                        fontSize: "0.8rem",
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontWeight: 600
                      }}>
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {gig.attachments && gig.attachments.length > 0 && (
                <div>
                  <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)", marginBottom: "12px" }}>Reference Documents</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {gig.attachments.map((file: Attachment, idx: number) => (
                      <a 
                        key={idx}
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--secondary)", background: "rgba(6, 182, 212, 0.05)", border: "1px solid rgba(6, 182, 212, 0.15)", padding: "10px 14px", borderRadius: "var(--radius-md)", textDecoration: "none" }}
                      >
                        <FileText size={16} /> Reference Attachment #{idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Timeline Milestones Card */}
            {milestones.length > 0 && (
              <div className="glass-card" style={{ padding: "40px", margin: 0 }}>
                <h3 style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "20px" }}>Deliverables Milestones Checklist</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {milestones.map((m, idx) => (
                    <div key={m._id} style={{ display: "flex", gap: "16px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "20px", alignItems: "center" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--secondary)" }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-main)", display: "block" }}>{m.title}</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Due Date: {new Date(m.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 700, color: "var(--success)", fontSize: "1.1rem", display: "block" }}>${m.amount}</span>
                        <span style={{
                          fontSize: "0.75rem",
                          background: m.status === "Approved" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                          color: m.status === "Approved" ? "var(--success)" : "var(--text-muted)",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* proposals list (Client owner sees candidates) */}
            {isOwner && (
              <div className="glass-card" style={{ padding: "40px", margin: 0 }}>
                <h3 style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "20px" }}>
                  Submitted Applications ({proposals.length})
                </h3>

                {proposals.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No proposals submitted for this gig yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {proposals.map((prop) => (
                      <div key={prop._id} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        
                        {/* Profile Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {prop.freelancer.avatar?.url ? (
                                <img src={prop.freelancer.avatar.url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <User size={20} style={{ color: "var(--text-muted)" }} />
                              )}
                            </div>
                            <div>
                              <Link 
                                to={`/profile/${prop.freelancer._id}`} 
                                style={{ fontWeight: 600, color: "var(--text-main)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                {prop.freelancer.firstName} {prop.freelancer.lastName} <LinkIcon size={12} />
                              </Link>
                              <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>@{prop.freelancer.username}</span>
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--success)", display: "block" }}>
                              ${prop.bidAmount}
                            </span>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              in {prop.estimatedDuration} {prop.durationUnit}
                            </span>
                          </div>
                        </div>

                        {/* Cover Letter */}
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5, whiteSpace: "pre-line", background: "rgba(255,255,255,0.01)", padding: "14px", borderLeft: "2px solid var(--primary)", borderRadius: "2px" }}>
                          {prop.coverLetter}
                        </p>

                        {/* Attachments */}
                        {prop.attachments && prop.attachments.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {prop.attachments.map((file, idx) => (
                              <a 
                                key={idx}
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--secondary)", background: "rgba(6, 182, 212, 0.05)", padding: "4px 10px", borderRadius: "6px", textDecoration: "none" }}
                              >
                                <FileText size={12} /> Bid Document #{idx + 1}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Accept / Reject actions */}
                        {gig.status === "Open" && prop.status === "Pending" && (
                          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                            <button 
                              onClick={() => handleProposalAction(prop._id, "Accepted")}
                              disabled={actionLoading}
                              className="btn btn-primary"
                              style={{ padding: "8px 14px", fontSize: "0.8rem", flex: 1, gap: "4px" }}
                            >
                              <ShieldCheck size={14} /> Accept & Hire
                            </button>
                            <button 
                              onClick={() => handleProposalAction(prop._id, "Rejected")}
                              disabled={actionLoading}
                              className="btn btn-secondary"
                              style={{ padding: "8px 14px", fontSize: "0.8rem", flex: 1 }}
                            >
                              Reject Application
                            </button>
                          </div>
                        )}

                        {prop.status !== "Pending" && (
                          <span style={{
                            alignSelf: "flex-start",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "4px",
                            background: prop.status === "Accepted" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: prop.status === "Accepted" ? "var(--success)" : "var(--error)"
                          }}>Hiring Decision: {prop.status}</span>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Pricing & Proposal Submission panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* Pricing Summary Card */}
            <div className="glass-card" style={{ padding: "28px", margin: 0 }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Client Budget Range</span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "4px", display: "flex", alignItems: "center", color: "var(--success)" }}>
                ${gig.budget.min} - ${gig.budget.max}
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px", fontSize: "0.85rem", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Target Duration</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{gig.duration}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Experience Req.</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{gig.experienceLevel}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Applications</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{gig.proposalsCount} Bids</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Apply Deadline</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{new Date(gig.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Show who is hired if status in progress */}
              {gig.hiredFreelancer && (
                <div style={{ marginTop: "20px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "var(--radius-md)", padding: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: 700, textTransform: "uppercase" }}>Hired Freelancer</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.9rem" }}>
                    {gig.hiredFreelancer.firstName} {gig.hiredFreelancer.lastName}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>@{gig.hiredFreelancer.username}</span>
                </div>
              )}
            </div>

            {/* Bidding Panel for Freelancer */}
            {user?.role === "freelancer" && gig.status === "Open" && (
              <div className="glass-card" style={{ padding: "28px", margin: 0 }}>
                {ownProposal ? (
                  <div style={{ textAlign: "center" }}>
                    <CheckCircle2 size={36} style={{ color: "var(--success)", marginBottom: "12px", display: "inline-block" }} />
                    <h4 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Proposal Submitted</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "16px" }}>
                      You bid **${ownProposal.bidAmount}** in **{ownProposal.estimatedDuration} {ownProposal.durationUnit}**.
                    </p>
                    <span style={{
                      background: ownProposal.status === "Pending" ? "rgba(245, 158, 11, 0.15)" : ownProposal.status === "Accepted" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                      color: ownProposal.status === "Pending" ? "var(--warning)" : ownProposal.status === "Accepted" ? "var(--success)" : "var(--error)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "4px"
                    }}>{ownProposal.status}</span>
                  </div>
                ) : (
                  <form onSubmit={handleProposalSubmit}>
                    <h3 style={{ fontSize: "1.15rem", color: "var(--text-main)", marginBottom: "16px" }}>Apply to Gig</h3>
                    
                    {error && (
                      <div className="alert alert-error" style={{ marginBottom: "16px", padding: "8px 12px", fontSize: "0.8rem" }}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Bid Rate */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Your Bid Amount ($)</label>
                      <div className="input-wrapper">
                        <input
                          type="number"
                          className="form-input"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Number(e.target.value))}
                          disabled={actionLoading}
                          style={{ paddingLeft: "12px" }}
                          min={1}
                          required
                        />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                        Suggested range: ${gig.budget.min} - ${gig.budget.max}
                      </span>
                    </div>

                    {/* Duration input */}
                    <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <label className="form-label" style={{ fontSize: "0.8rem" }}>Duration</label>
                        <input
                          type="number"
                          className="form-input"
                          value={estDuration}
                          onChange={(e) => setEstDuration(Number(e.target.value))}
                          disabled={actionLoading}
                          style={{ paddingLeft: "10px" }}
                          min={1}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: "0.8rem" }}>Unit</label>
                        <select
                          className="form-input"
                          value={durUnit}
                          onChange={(e) => setDurUnit(e.target.value as any)}
                          disabled={actionLoading}
                          style={{
                            width: "100%",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            padding: "10px",
                            color: "var(--text-main)",
                            fontFamily: "inherit"
                          }}
                        >
                          <option value="Days" style={{ background: "#1c1936" }}>Days</option>
                          <option value="Weeks" style={{ background: "#1c1936" }}>Weeks</option>
                          <option value="Months" style={{ background: "#1c1936" }}>Months</option>
                        </select>
                      </div>
                    </div>

                    {/* Cover Letter */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Proposal Cover Letter</label>
                      <textarea
                        className="form-input"
                        rows={5}
                        placeholder="Explain why you are the perfect fit, your methodology, and experience with similar projects..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        disabled={actionLoading}
                        style={{ paddingLeft: "10px", resize: "vertical", fontSize: "0.85rem" }}
                        maxLength={2000}
                        required
                      />
                    </div>

                    {/* PDF/Zip File upload */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Attachments (Brief, mocks, zip)</label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            setPropAttachments(Array.from(e.target.files));
                          }
                        }}
                        disabled={actionLoading}
                        style={{ fontSize: "0.75rem", marginTop: "4px" }}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary btn-block" 
                      disabled={actionLoading}
                      style={{ gap: "6px", marginTop: "20px" }}
                    >
                      {actionLoading ? <div className="spinner"></div> : <><Send size={14} /> Submit Application</>}
                    </button>

                  </form>
                )}
              </div>
            )}

            {/* Display message if gig closed */}
            {gig.status !== "Open" && (
              <div className="glass-card" style={{ padding: "20px", margin: 0, textAlign: "center", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.01)" }}>
                <Clock size={20} style={{ color: "var(--text-muted)", marginBottom: "6px" }} />
                <h4 style={{ fontSize: "0.95rem" }}>Gig is Closed</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>This gig is no longer accepting new bids or applications.</p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default GigDetails;
