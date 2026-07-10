import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EditProfile from "../components/EditProfile";
import { 
  User, Briefcase, Mail, DollarSign, 
  Award, FileText, Globe, Edit3, ArrowLeft, ShieldCheck, AlertCircle 
} from "lucide-react";

interface Certification {
  name: string;
  issuer: string;
  year: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>(); // Parameter for viewing other user profiles

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const isOwnProfile = !id || id === user?._id;

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
          {isOwnProfile && (
            <button onClick={() => setShowEdit(true)} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem", gap: "6px" }}>
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>

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
    </div>
  );
};

export default Profile;
