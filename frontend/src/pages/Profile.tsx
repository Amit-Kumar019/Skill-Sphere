import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EditProfile from "../components/EditProfile";
import { 
  User, Briefcase, Mail, DollarSign, 
  Award, FileText, Globe, Edit3, ArrowLeft, ShieldCheck, AlertCircle,
  FolderGit, Plus, Trash2, Lock, Upload, ShieldAlert, Clock
} from "lucide-react";

interface Certification {
  name: string;
  issuer: string;
  year: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>(); // Parameter for viewing other user profiles
  const navigate = useNavigate();
  const [chatLoading, setChatLoading] = useState(false);

  const handleStartChat = async () => {
    if (!user) return;
    setChatLoading(true);
    try {
      const targetUserId = id || profileData?.user?._id;
      if (!targetUserId) {
        alert("Target user ID not found.");
        return;
      }
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: targetUserId }),
        credentials: "include"
      });
      const json = await res.json();
      if (res.ok && json.data) {
        navigate(`/chat?chatId=${json.data._id}`);
      } else {
        alert(json.message || "Failed to start conversation.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  // Portfolio state
  const [portfolio, setPortfolio] = useState<any[]>([]);

  // Form states: Portfolio
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [portTitle, setPortTitle] = useState("");
  const [portDesc, setPortDesc] = useState("");
  const [portTech, setPortTech] = useState("");
  const [portGithub, setPortGithub] = useState("");
  const [portLive, setPortLive] = useState("");
  const [portImages, setPortImages] = useState<File[]>([]);
  const [portLoading, setPortLoading] = useState(false);

  // Form states: Verification
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [verifLoading, setVerifLoading] = useState(false);

  const isOwnProfile = !id || id === user?._id;

  const fetchDetails = async (freelancerId: string) => {
    try {
      const res = await fetch(`/api/v1/profile/freelancer/${freelancerId}/portfolio`, { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) setPortfolio(json.data);
    } catch (e) {
      console.error("Error fetching detail sub-objects:", e);
    }
  };

  useEffect(() => {
    if (profileData && profileData.type === "freelancer") {
      const freelancerId = id || user?._id;
      if (freelancerId) {
        fetchDetails(freelancerId);
      }
    }
  }, [profileData, id, user]);

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portTitle) return;
    setPortLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", portTitle);
      formData.append("description", portDesc);
      formData.append("technologies", portTech);
      formData.append("githubLink", portGithub);
      formData.append("liveDemo", portLive);
      portImages.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/v1/profile/me/portfolio", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const json = await res.json();
      if (res.ok) {
        setPortTitle("");
        setPortDesc("");
        setPortTech("");
        setPortGithub("");
        setPortLive("");
        setPortImages([]);
        setShowAddPortfolio(false);
        if (user) fetchDetails(id || user._id);
      } else {
        alert(json.message || "Failed to add portfolio item.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPortLoading(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!window.confirm("Are you sure you want to delete this portfolio item?")) return;
    try {
      const res = await fetch(`/api/v1/profile/me/portfolio/${portfolioId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        if (user) fetchDetails(id || user._id);
      } else {
        const json = await res.json();
        alert(json.message || "Failed to delete item.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaarFile || !panFile || !selfieFile) {
      alert("Please upload Aadhaar Card, PAN Card, and Selfie.");
      return;
    }
    setVerifLoading(true);
    try {
      const formData = new FormData();
      formData.append("aadhaar", aadhaarFile);
      formData.append("pan", panFile);
      formData.append("selfie", selfieFile);

      const res = await fetch("/api/v1/profile/me/verification", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const json = await res.json();
      if (res.ok) {
        alert("Verification documents submitted successfully!");
        setShowVerificationModal(false);
        setAadhaarFile(null);
        setPanFile(null);
        setSelfieFile(null);
        fetchProfile();
      } else {
        alert(json.message || "Failed to submit verification.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifLoading(false);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/v1/profile/me";
      
      // If a parameter ID is provided, query public profiles
      if (id && user) {
        // Try fetching as freelancer first
        try {
          const res = await fetch(`/api/v1/profile/freelancer/${id}`, { credentials: "include" });
          const json = await res.json();
          if (res.ok) {
            setProfileData({ ...json.data, type: "freelancer" });
            setLoading(false);
            return;
          }
        } catch (e) {}

        // Try fetching as client
        try {
          const res = await fetch(`/api/v1/profile/client/${id}`, { credentials: "include" });
          const json = await res.json();
          if (res.ok) {
            setProfileData({ ...json.data, type: "client" });
            setLoading(false);
            return;
          }
        } catch (e) {}

        throw new Error("Profile not found.");
      } else {
        // Fetch current user's profile
        const res = await fetch(url, { credentials: "include" });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || "Failed to load profile.");
        }
        if (json.data) {
          setProfileData({ ...json.data, type: user?.role });
        } else {
          // Profile exists but is null (not configured yet)
          setProfileData(null);
        }
      }
    } catch (err: any) {
      setError(err.message || "Profile not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id, user]);

  const handleEditSuccess = () => {
    setShowEdit(false);
    fetchProfile(); // Reload profile after successful update
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px" }}>
        <div className="spinner" style={{ width: "32px", height: "32px" }}></div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading profile details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-wrapper">
        <div className="glass-card" style={{ textAlign: "center" }}>
          <AlertCircle size={32} style={{ color: "var(--error)", marginBottom: "16px" }} />
          <h2 style={{ marginBottom: "8px" }}>Error Loading Profile</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>{error}</p>
          <Link to="/dashboard" className="btn btn-secondary btn-block">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // If own profile and has not set it up yet
  if (!profileData && isOwnProfile) {
    return (
      <div className="auth-wrapper">
        <div className="glass-card" style={{ textAlign: "center" }}>
          <User size={36} style={{ color: "var(--primary)", marginBottom: "16px" }} />
          <h2 style={{ marginBottom: "8px" }}>No Profile Set Up</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            You haven't configured your professional profile details yet. Let's do it now!
          </p>
          <Link to="/profile-setup" className="btn btn-primary btn-block">
            Complete Profile Setup
          </Link>
        </div>
      </div>
    );
  }

  const profileUser = profileData?.user || user;
  const isFreelancer = profileData?.type === "freelancer";

  return (
    <div className="auth-wrapper" style={{ minHeight: "100vh", alignItems: "flex-start", paddingTop: "80px", paddingBottom: "60px" }}>
      <div className="glass-card" style={{ maxWidth: "900px", padding: "40px" }}>
        
        {/* Header toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
          <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          {isOwnProfile ? (
            <button onClick={() => setShowEdit(true)} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem", gap: "6px" }}>
              <Edit3 size={14} /> Edit Profile
            </button>
          ) : (
            <button 
              onClick={handleStartChat} 
              className="btn btn-primary" 
              style={{ padding: "8px 16px", fontSize: "0.85rem", gap: "6px" }}
              disabled={chatLoading}
            >
              <Mail size={14} /> {chatLoading ? "Initiating..." : "Message"}
            </button>
          )}
        </div>

        {/* Verification Alert Banner */}
        {isFreelancer && isOwnProfile && profileData?.verificationStatus !== "Verified" && (
          <div className="alert alert-error" style={{ 
            marginBottom: "24px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "16px 20px",
            background: profileData?.verificationStatus === "Pending" ? "rgba(245, 158, 11, 0.08)" : "rgba(239, 68, 68, 0.08)",
            borderColor: profileData?.verificationStatus === "Pending" ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)",
            color: "var(--text-main)"
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {profileData?.verificationStatus === "Pending" ? (
                <>
                  <Clock size={20} style={{ color: "var(--warning)", flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>Identity Verification Under Review</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Our administrators are currently validating your uploaded Aadhaar, PAN, and Selfie documentation.</span>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert size={20} style={{ color: "var(--error)", flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>
                      {profileData?.verificationStatus === "Rejected" ? "Identity Verification Rejected" : "Identity Verification Required"}
                    </strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {profileData?.verificationStatus === "Rejected" 
                        ? "Your documents did not pass our check. Please review guidelines and submit again."
                        : "Verify your profile identity documents to unlock payment releases and trust badges."}
                    </span>
                  </div>
                </>
              )}
            </div>
            {profileData?.verificationStatus !== "Pending" && (
              <button 
                onClick={() => setShowVerificationModal(true)} 
                className="btn btn-primary" 
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
              >
                Verify Identity
              </button>
            )}
          </div>
        )}

        {/* Profile Info block */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
          
          {/* Section: Overview */}
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Avatar / Logo */}
            <div style={{ position: "relative" }}>
              {isFreelancer ? (
                <div style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  border: "2px solid var(--border-color)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {profileUser?.avatar?.url ? (
                    <img src={profileUser.avatar.url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <User size={40} style={{ color: "var(--text-muted)" }} />
                  )}
                </div>
              ) : (
                <div style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "var(--radius-md)",
                  background: "white",
                  border: "2px solid var(--border-color)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {profileData?.companyLogo?.url ? (
                    <img src={profileData.companyLogo.url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }} />
                  ) : (
                    <Briefcase size={40} style={{ color: "#1f2937" }} />
                  )}
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: "250px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "2rem", color: "var(--text-main)" }}>
                  {isFreelancer ? `${profileUser?.firstName} ${profileUser?.lastName}` : profileData?.companyName}
                </h1>
                {isFreelancer && profileData?.verificationStatus === "Verified" && (
                  <ShieldCheck size={20} style={{ color: "var(--success)" }} />
                )}
                {!isFreelancer && profileData?.isVerified && (
                  <ShieldCheck size={20} style={{ color: "var(--success)" }} />
                )}
              </div>
              
              <p style={{ color: "var(--primary)", fontWeight: 600, fontSize: "1.05rem", marginTop: "4px" }}>
                {isFreelancer ? profileData?.title : "Client Entity"}
              </p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Mail size={14} /> {profileUser?.email}
                </span>
                {isFreelancer && (
                  <span style={{
                    background: profileData?.availability === "Available" 
                      ? "rgba(16, 185, 129, 0.15)"
                      : profileData?.availability === "Busy"
                      ? "rgba(245, 158, 11, 0.15)"
                      : "rgba(239, 68, 68, 0.15)",
                    color: profileData?.availability === "Available"
                      ? "var(--success)"
                      : profileData?.availability === "Busy"
                      ? "var(--warning)"
                      : "var(--error)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: 700
                  }}>{profileData?.availability}</span>
                )}
                {!isFreelancer && profileData?.companyWebsite && (
                  <a href={profileData.companyWebsite} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--secondary)" }}>
                    <Globe size={14} /> Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px", marginTop: "10px" }}>
            
            {/* Left side: Bio and Skill Tags */}
            <div>
              <h3 style={{ fontSize: "1.2rem", color: "var(--text-main)", marginBottom: "12px" }}>
                {isFreelancer ? "Professional Summary" : "About the Company"}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {isFreelancer ? profileData?.bio : profileData?.companyDescription || "No description provided."}
              </p>

              {isFreelancer && profileData?.skills && profileData.skills.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "12px" }}>Skills</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {profileData.skills.map((skill: string, index: number) => (
                      <span 
                        key={index}
                        style={{
                          background: "rgba(99, 102, 241, 0.08)",
                          color: "var(--secondary)",
                          border: "1px solid rgba(6, 182, 212, 0.15)",
                          padding: "4px 12px",
                          borderRadius: "16px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Grid for Freelancer Meta Data */}
            {isFreelancer && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", borderTop: "1px solid var(--border-color)", paddingTop: "30px" }}>
                
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", display: "block" }}>Hourly Rate</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center" }}>
                    <DollarSign size={18} style={{ color: "var(--success)" }} /> {profileData?.hourlyRate} / hr
                  </span>
                </div>

                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", display: "block" }}>Experience</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)" }}>
                    {profileData?.experience} Years
                  </span>
                </div>

                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", display: "block" }}>Reputation Rating</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)" }}>
                    {profileData?.rating > 0 ? `${profileData.rating} ⭐` : "No rating"}
                  </span>
                </div>

                {profileData?.resume && (
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", display: "block" }}>Documents</span>
                    <a 
                      href={profileData.resume} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-secondary" 
                      style={{ fontSize: "0.75rem", padding: "6px 12px", width: "100%", marginTop: "8px", gap: "6px" }}
                    >
                      <FileText size={12} /> View Resume PDF
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Certifications (Freelancer) */}
            {isFreelancer && profileData?.certifications && profileData.certifications.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "30px" }}>
                <h3 style={{ fontSize: "1.2rem", color: "var(--text-main)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Award size={18} style={{ color: "var(--primary)" }} /> Certifications
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
                  {profileData.certifications.map((cert: Certification, index: number) => (
                    <div 
                      key={index}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--border-color)",
                        padding: "16px",
                        borderRadius: "var(--radius-md)"
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.95rem", display: "block" }}>{cert.name}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{cert.issuer} &bull; {cert.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Gallery (Freelancer) */}
            {isFreelancer && (
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "30px", marginTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "1.2rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FolderGit size={18} style={{ color: "var(--primary)" }} /> Portfolio Projects
                  </h3>
                  {isOwnProfile && (
                    <button 
                      onClick={() => setShowAddPortfolio(true)} 
                      className="btn btn-primary" 
                      style={{ padding: "6px 12px", fontSize: "0.8rem", gap: "4px" }}
                    >
                      <Plus size={14} /> Add Project
                    </button>
                  )}
                </div>

                {portfolio.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No portfolio items added yet.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    {portfolio.map((item) => (
                      <div 
                        key={item._id}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          position: "relative"
                        }}
                      >
                        {isOwnProfile && (
                          <button
                            onClick={() => handleDeletePortfolio(item._id)}
                            style={{
                              position: "absolute",
                              top: "16px",
                              right: "16px",
                              background: "none",
                              border: "none",
                              color: "var(--error)",
                              cursor: "pointer",
                              opacity: 0.7,
                              transition: "var(--transition)"
                            }}
                            title="Delete project"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        
                        <div>
                          {item.images && item.images.length > 0 && (
                            <div style={{ width: "100%", height: "140px", borderRadius: "var(--radius-sm)", overflow: "hidden", marginBottom: "12px", border: "1px solid var(--border-color)" }}>
                              <img src={item.images[0].url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          )}
                          <h4 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px", paddingRight: isOwnProfile ? "24px" : "0" }}>
                            {item.title}
                          </h4>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.4, marginBottom: "12px" }}>
                            {item.description}
                          </p>
                        </div>

                        <div>
                          {item.technologies && item.technologies.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                              {item.technologies.map((tech: string, i: number) => (
                                <span key={i} style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-muted)" }}>
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem" }}>
                            {item.githubLink && (
                              <a href={item.githubLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", fontWeight: "500" }}>GitHub</a>
                            )}
                            {item.liveDemo && (
                              <a href={item.liveDemo} target="_blank" rel="noopener noreferrer" style={{ color: "var(--secondary)", fontWeight: "500" }}>Live Demo</a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Modal Drawer: Edit profile overlay */}
      {showEdit && isOwnProfile && (
        <EditProfile 
          profileData={profileData} 
          onClose={() => setShowEdit(false)} 
          onSuccess={handleEditSuccess} 
        />
      )}

      {/* Modal Dialog: Add Portfolio Overlay */}
      {showAddPortfolio && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(11, 9, 20, 0.8)", backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div className="glass-card" style={{ maxWidth: "520px", padding: "30px", margin: "0 20px" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FolderGit style={{ color: "var(--primary)" }} /> Add Portfolio Project
            </h2>

            <form onSubmit={handleAddPortfolio}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. E-Commerce Platform"
                  value={portTitle}
                  onChange={(e) => setPortTitle(e.target.value)}
                  style={{ paddingLeft: "12px" }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="Describe your role, architecture, achievements..."
                  value={portDesc}
                  onChange={(e) => setPortDesc(e.target.value)}
                  style={{ paddingLeft: "12px", resize: "vertical" }}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Technologies (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. React, Redux, Node.js"
                  value={portTech}
                  onChange={(e) => setPortTech(e.target.value)}
                  style={{ paddingLeft: "12px" }}
                />
              </div>

              <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">GitHub Repository</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://github.com/..."
                    value={portGithub}
                    onChange={(e) => setPortGithub(e.target.value)}
                    style={{ paddingLeft: "10px" }}
                  />
                </div>
                <div>
                  <label className="form-label">Live Deployment Link</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://..."
                    value={portLive}
                    onChange={(e) => setPortLive(e.target.value)}
                    style={{ paddingLeft: "10px" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Project Screenshot Image</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files) {
                      setPortImages(Array.from(e.target.files));
                    }
                  }}
                  style={{ fontSize: "0.8rem", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPortfolio(false);
                    setPortImages([]);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={portLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={portLoading}
                >
                  {portLoading ? <div className="spinner" style={{ width: "16px", height: "16px" }}></div> : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Verification Form Overlay */}
      {showVerificationModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(11, 9, 20, 0.8)", backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div className="glass-card" style={{ maxWidth: "480px", padding: "30px", margin: "0 20px" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Lock style={{ color: "var(--primary)" }} /> Submit KYC Verification
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
              Upload your official documents to verify your freelancer status. Files will be stored securely and deleted after audit.
            </p>

            <form onSubmit={handleSubmitVerification}>
              <div className="form-group" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "14px" }}>
                <label className="form-label" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Upload size={12} /> Aadhaar Card (PDF/Image)
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files) setAadhaarFile(e.target.files[0]);
                  }}
                  style={{ fontSize: "0.75rem", marginTop: "6px" }}
                  required
                />
              </div>

              <div className="form-group" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "14px", marginTop: "12px" }}>
                <label className="form-label" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Upload size={12} /> PAN Card (PDF/Image)
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files) setPanFile(e.target.files[0]);
                  }}
                  style={{ fontSize: "0.75rem", marginTop: "6px" }}
                  required
                />
              </div>

              <div className="form-group" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "14px", marginTop: "12px" }}>
                <label className="form-label" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Upload size={12} /> Live Selfie Verification (Image)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) setSelfieFile(e.target.files[0]);
                  }}
                  style={{ fontSize: "0.75rem", marginTop: "6px" }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setAadhaarFile(null);
                    setPanFile(null);
                    setSelfieFile(null);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={verifLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={verifLoading}
                >
                  {verifLoading ? <div className="spinner" style={{ width: "16px", height: "16px" }}></div> : "Submit Audit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
