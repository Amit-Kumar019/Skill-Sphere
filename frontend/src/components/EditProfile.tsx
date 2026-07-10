import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Upload, Plus, Trash2, AlertCircle } from "lucide-react";

interface Certification {
  name: string;
  issuer: string;
  year: number;
}

interface EditProfileProps {
  profileData: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ profileData, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common User fields
  const [phone, setPhone] = useState(profileData?.user?.phone || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Freelancer Fields
  const [title, setTitle] = useState(profileData?.title || "");
  const [bio, setBio] = useState(profileData?.bio || "");
  const [experience, setExperience] = useState<number>(profileData?.experience || 0);
  const [hourlyRate, setHourlyRate] = useState<number>(profileData?.hourlyRate || 0);
  const [availability, setAvailability] = useState<"Available" | "Busy" | "Unavailable">(profileData?.availability || "Available");
  const [skills, setSkills] = useState<string[]>(profileData?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  
  // Certifications
  const [certifications, setCertifications] = useState<Certification[]>(profileData?.certifications || []);
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certYear, setCertYear] = useState<number>(new Date().getFullYear());
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Client Fields
  const [companyName, setCompanyName] = useState(profileData?.companyName || "");
  const [companyWebsite, setCompanyWebsite] = useState(profileData?.companyWebsite || "");
  const [companyDescription, setCompanyDescription] = useState(profileData?.companyDescription || "");
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (indexToRemove: number) => {
    setSkills(skills.filter((_, index) => index !== indexToRemove));
  };

  const handleAddCertification = () => {
    if (certName.trim() && certIssuer.trim()) {
      setCertifications([
        ...certifications,
        { name: certName.trim(), issuer: certIssuer.trim(), year: certYear }
      ]);
      setCertName("");
      setCertIssuer("");
      setCertYear(new Date().getFullYear());
    }
  };

  const handleRemoveCertification = (indexToRemove: number) => {
    setCertifications(certifications.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("phone", phone);
    
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    if (user?.role === "freelancer") {
      if (!title || !bio || !hourlyRate) {
        setError("Title, Bio, and Hourly Rate are required.");
        setIsLoading(false);
        return;
      }
      formData.append("title", title);
      formData.append("bio", bio);
      formData.append("skills", skills.join(","));
      formData.append("experience", String(experience));
      formData.append("hourlyRate", String(hourlyRate));
      formData.append("availability", availability);
      formData.append("certifications", JSON.stringify(certifications));

      if (resumeFile) {
        formData.append("resume", resumeFile);
      }
    } else {
      if (!companyName) {
        setError("Company Name is required.");
        setIsLoading(false);
        return;
      }
      formData.append("companyName", companyName);
      formData.append("companyWebsite", companyWebsite);
      formData.append("companyDescription", companyDescription);

      if (companyLogoFile) {
        formData.append("companyLogo", companyLogoFile);
      }
    }

    try {
      const res = await fetch("/api/v1/profile/me", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to update profile.");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div className="glass-card" style={{ 
        maxWidth: "600px", 
        maxHeight: "90vh", 
        overflowY: "auto",
        position: "relative",
        animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: "1.75rem", color: "var(--text-main)", marginBottom: "24px" }}>Edit Profile</h2>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "20px" }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Avatar Upload */}
          <div className="form-group">
            <label className="form-label">Profile Avatar</label>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border-color)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {profileData?.user?.avatar?.url ? (
                  <img src={profileData.user.avatar.url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Upload size={20} style={{ color: "var(--text-muted)" }} />
                )}
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  style={{ display: "block", fontSize: "0.85rem" }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input 
              type="text" 
              className="form-input" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555-0199"
              style={{ paddingLeft: "16px" }}
            />
          </div>

          {/* ======================= FREELANCER FIELDS ======================= */}
          {user?.role === "freelancer" && (
            <div>
              <div className="form-group">
                <label className="form-label">Professional Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  style={{ paddingLeft: "16px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Hourly Rate ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    min={0}
                    style={{ paddingLeft: "16px" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Availability Status</label>
                  <select 
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as any)}
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 16px",
                      color: "var(--text-main)",
                      fontFamily: "inherit"
                    }}
                  >
                    <option value="Available" style={{ background: "#1c1936" }}>Available</option>
                    <option value="Busy" style={{ background: "#1c1936" }}>Busy</option>
                    <option value="Unavailable" style={{ background: "#1c1936" }}>Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Experience (Years)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  min={0}
                  style={{ paddingLeft: "16px" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio (Description)</label>
                <textarea 
                  className="form-input" 
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ paddingLeft: "16px", resize: "vertical" }}
                  maxLength={1000}
                />
              </div>

              {/* Skills Interactive list */}
              <div className="form-group">
                <label className="form-label">Skills (Press Enter to add)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Node, React"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  style={{ paddingLeft: "16px", marginBottom: "8px" }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {skills.map((skill, index) => (
                    <span key={index} style={{
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "var(--secondary)",
                      border: "1px solid rgba(6, 182, 212, 0.15)",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(index)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer" }}>&times;</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications edit list */}
              <div className="form-group" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <label className="form-label">Certifications</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                  {certifications.map((cert, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "8px 12px", borderRadius: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{cert.name} ({cert.issuer})</span>
                      <button type="button" onClick={() => handleRemoveCertification(index)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <input type="text" placeholder="Cert Name" className="form-input" value={certName} onChange={(e) => setCertName(e.target.value)} style={{ paddingLeft: "12px", fontSize: "0.85rem" }} />
                  <input type="text" placeholder="Issuer" className="form-input" value={certIssuer} onChange={(e) => setCertIssuer(e.target.value)} style={{ paddingLeft: "12px", fontSize: "0.85rem" }} />
                </div>
                <button type="button" className="btn btn-secondary btn-block" onClick={handleAddCertification} style={{ fontSize: "0.8rem", padding: "6px" }}>
                  <Plus size={14} /> Add Cert
                </button>
              </div>

              {/* Resume update */}
              <div className="form-group" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <label className="form-label">Upload New Resume PDF</label>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  style={{ display: "block", fontSize: "0.85rem" }}
                />
              </div>

            </div>
          )}

          {/* ======================= CLIENT FIELDS ======================= */}
          {user?.role === "client" && (
            <div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{ paddingLeft: "16px" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Website</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://company.com"
                  style={{ paddingLeft: "16px" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Logo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setCompanyLogoFile(e.target.files?.[0] || null)}
                  style={{ display: "block", fontSize: "0.85rem" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Overview (Description)</label>
                <textarea 
                  className="form-input" 
                  rows={4}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  style={{ paddingLeft: "16px", resize: "vertical" }}
                  maxLength={1000}
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "30px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ flex: 1 }}>
              {isLoading ? <div className="spinner"></div> : "Save Changes"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default EditProfile;
