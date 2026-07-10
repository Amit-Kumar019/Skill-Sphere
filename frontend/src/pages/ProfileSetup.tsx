import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Briefcase, User, Award, FileText, Plus, Trash2, 
  ArrowLeft, ArrowRight, Upload, Check, Globe, AlertCircle 
} from "lucide-react";

interface Certification {
  name: string;
  issuer: string;
  year: number;
}

const ProfileSetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================= FREELANCER STATE =========================
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState<number>(0);
  const [hourlyRate, setHourlyRate] = useState<number>(20);
  const [availability, setAvailability] = useState<"Available" | "Busy" | "Unavailable">("Available");
  
  // Interactive Skills Tagger
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  
  // Dynamic Certifications list
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certYear, setCertYear] = useState<number>(new Date().getFullYear());

  // Files
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // ========================= CLIENT STATE =========================
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);

  // Add skill to tag list
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

  // Add certification to list
  const handleAddCertification = () => {
    if (certName.trim() && certIssuer.trim()) {
      setCertifications([
        ...certifications,
        { name: certName.trim(), issuer: certIssuer.trim(), year: certYear }
      ]);
      setCertName("");
      setCertIssuer("");
      setCertYear(new Date().getFullYear());
    } else {
      setError("Please fill out both certification name and issuer.");
    }
  };

  const handleRemoveCertification = (indexToRemove: number) => {
    setCertifications(certifications.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();

    if (user.role === "freelancer") {
      if (!title || !bio || !hourlyRate) {
        setError("Please complete all professional details (Title, Bio, and Rate).");
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
        setError("Company Name is a required field.");
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

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const response = await fetch("/api/v1/profile/me", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save profile.");
      }

      navigate("/dashboard", { state: { message: "Profile configured successfully!" } });
    } catch (err: any) {
      setError(err.message || "An error occurred while saving your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="auth-wrapper" style={{ paddingTop: "60px", paddingBottom: "60px" }}>
      <div className="glass-card" style={{ maxWidth: "600px", padding: "40px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "6px" }}>Setup Profile</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {user.role === "freelancer" 
              ? "Tell clients about your professional skills and expertise" 
              : "Tell freelancers about your company and projects"}
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "24px" }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ======================= FREELANCER MULTISTEP ONBOARDING ================= */}
        {/* ========================================================================= */}
        {user.role === "freelancer" && (
          <div>
            {/* Step Indicators */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", position: "relative" }}>
              <div style={{ position: "absolute", top: "15px", left: "0", right: "0", height: "2px", background: "rgba(255,255,255,0.05)", zIndex: 1 }}></div>
              <div style={{ position: "absolute", top: "15px", left: "0", width: `${((currentStep - 1) / 3) * 100}%`, height: "2px", background: "var(--primary)", zIndex: 1, transition: "var(--transition)" }}></div>
              
              {[1, 2, 3, 4].map((step) => (
                <div 
                  key={step} 
                  style={{ 
                    position: "relative",
                    zIndex: 2,
                    background: currentStep >= step ? "var(--primary)" : "var(--bg-main)",
                    color: currentStep >= step ? "white" : "var(--text-muted)",
                    border: `2px solid ${currentStep >= step ? "var(--primary)" : "var(--border-color)"}`,
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    transition: "var(--transition)"
                  }}
                >
                  {currentStep > step ? <Check size={16} /> : step}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              
              {/* STEP 1: Basic Info */}
              {currentStep === 1 && (
                <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Briefcase size={18} style={{ color: "var(--primary)" }} /> Step 1: Professional Details
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Professional Title</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Full Stack React & Node Developer"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ paddingLeft: "16px" }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hourly Rate ($ / hr)</label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        className="form-input"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                        style={{ paddingLeft: "16px" }}
                        min={0}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group">
                      <label className="form-label">Years of Experience</label>
                      <div className="input-wrapper">
                        <input
                          type="number"
                          className="form-input"
                          value={experience}
                          onChange={(e) => setExperience(Number(e.target.value))}
                          style={{ paddingLeft: "16px" }}
                          min={0}
                        />
                      </div>
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
                        <option value="Available" style={{ background: "#1c1936" }}>Available for Work</option>
                        <option value="Busy" style={{ background: "#1c1936" }}>Busy (Limited Slots)</option>
                        <option value="Unavailable" style={{ background: "#1c1936" }}>Unavailable</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Professional Summary (Bio)</label>
                    <textarea
                      className="form-input"
                      rows={5}
                      placeholder="Write a short summary about your background, projects you've completed, and your core strengths..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      style={{ paddingLeft: "16px", resize: "vertical" }}
                      maxLength={1000}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "30px" }}>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => {
                        if (!title || !bio) {
                          setError("Please provide a Title and Summary Bio.");
                        } else {
                          setError(null);
                          setCurrentStep(2);
                        }
                      }}
                    >
                      Next Step <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Skills Selector */}
              {currentStep === 2 && (
                <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <User size={18} style={{ color: "var(--primary)" }} /> Step 2: Tech Skills
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                    Type a skill (e.g. React, Mongoose, Python) and press **Enter** to add it.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Add Skills</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Type skill & press Enter"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        style={{ paddingLeft: "16px" }}
                      />
                    </div>
                  </div>

                  {/* Skills Tag Box */}
                  <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    gap: "8px", 
                    minHeight: "80px", 
                    background: "rgba(255,255,255,0.02)", 
                    border: "1px solid var(--border-color)",
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "30px"
                  }}>
                    {skills.length === 0 ? (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No skills added yet.</span>
                    ) : (
                      skills.map((skill, index) => (
                        <span 
                          key={index} 
                          style={{
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "var(--secondary)",
                            border: "1px solid rgba(6, 182, 212, 0.2)",
                            borderRadius: "20px",
                            padding: "4px 12px",
                            fontSize: "0.85rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          {skill}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSkill(index)}
                            style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", display: "inline-flex", fontSize: "0.8rem", fontWeight: 700 }}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => {
                        if (skills.length === 0) {
                          setError("Please specify at least one skill.");
                        } else {
                          setError(null);
                          setCurrentStep(3);
                        }
                      }}
                    >
                      Next Step <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Certifications */}
              {currentStep === 3 && (
                <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Award size={18} style={{ color: "var(--primary)" }} /> Step 3: Certifications (Optional)
                  </h3>

                  <div style={{ 
                    background: "rgba(255,255,255,0.02)", 
                    border: "1px solid var(--border-color)",
                    padding: "20px",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "24px"
                  }}>
                    <div className="form-group">
                      <label className="form-label">Certification Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="AWS Certified Solutions Architect"
                        value={certName}
                        onChange={(e) => setCertName(e.target.value)}
                        style={{ paddingLeft: "16px" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div className="form-group">
                        <label className="form-label">Issuer</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Amazon Web Services"
                          value={certIssuer}
                          onChange={(e) => setCertIssuer(e.target.value)}
                          style={{ paddingLeft: "16px" }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Year</label>
                        <input
                          type="number"
                          className="form-input"
                          value={certYear}
                          onChange={(e) => setCertYear(Number(e.target.value))}
                          style={{ paddingLeft: "16px" }}
                          min={2000}
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-block" 
                      onClick={handleAddCertification}
                      style={{ gap: "4px" }}
                    >
                      <Plus size={16} /> Add Certification
                    </button>
                  </div>

                  {/* Certifications listing */}
                  {certifications.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "30px" }}>
                      <label className="form-label">Added Certifications</label>
                      {certifications.map((cert, index) => (
                        <div 
                          key={index} 
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--border-color)",
                            padding: "12px 16px",
                            borderRadius: "var(--radius-md)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, fontSize: "0.9rem", display: "block" }}>{cert.name}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{cert.issuer} &bull; {cert.year}</span>
                          </div>
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => handleRemoveCertification(index)}
                            style={{ padding: "6px", color: "var(--error)", border: "none" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => { setError(null); setCurrentStep(4); }}>
                      Next Step <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Resume PDF & Avatar */}
              {currentStep === 4 && (
                <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={18} style={{ color: "var(--primary)" }} /> Step 4: Documents Upload
                  </h3>

                  {/* Profile Picture Upload */}
                  <div className="form-group">
                    <label className="form-label">Profile Picture (Optional)</label>
                    <div style={{
                      border: "2px dashed var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "20px",
                      textAlign: "center",
                      background: "rgba(255,255,255,0.01)",
                      cursor: "pointer",
                      position: "relative"
                    }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                      />
                      <Upload size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {avatarFile ? avatarFile.name : "Select or Drop a Profile Image"}
                      </p>
                    </div>
                  </div>

                  {/* Resume Upload */}
                  <div className="form-group">
                    <label className="form-label">Resume PDF (Optional - Stored in Cloudinary)</label>
                    <div style={{
                      border: "2px dashed var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "20px",
                      textAlign: "center",
                      background: "rgba(255,255,255,0.01)",
                      cursor: "pointer",
                      position: "relative"
                    }}>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                      />
                      <FileText size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {resumeFile ? resumeFile.name : "Upload your PDF Resume"}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(3)} disabled={isLoading}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? <div className="spinner"></div> : "Complete Profile"}
                    </button>
                  </div>
                </div>
              )}
              
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ========================== CLIENT FORM ONBOARDING ======================= */}
        {/* ========================================================================= */}
        {user.role === "client" && (
          <form onSubmit={handleSubmit} style={{ animation: "fadeIn 0.4s ease-out" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Briefcase size={18} style={{ color: "var(--primary)" }} /> Company Details
            </h3>

            <div className="form-group">
              <label className="form-label">Company Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Tech Solutions"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isLoading}
                  style={{ paddingLeft: "16px" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Company Website (Optional)</label>
              <div className="input-wrapper">
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://acme.com"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  disabled={isLoading}
                />
                <Globe className="input-icon" size={18} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Company Logo (Optional)</label>
              <div style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                textAlign: "center",
                background: "rgba(255,255,255,0.01)",
                cursor: "pointer",
                position: "relative"
              }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setCompanyLogoFile(e.target.files?.[0] || null)}
                  disabled={isLoading}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                />
                <Upload size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {companyLogoFile ? companyLogoFile.name : "Select or Drop a Logo Image"}
                </p>
              </div>
            </div>

            {/* Profile Avatar Upload */}
            <div className="form-group">
              <label className="form-label">Personal Profile Picture (Optional)</label>
              <div style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                textAlign: "center",
                background: "rgba(255,255,255,0.01)",
                cursor: "pointer",
                position: "relative"
              }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  disabled={isLoading}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                />
                <Upload size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {avatarFile ? avatarFile.name : "Select or Drop your Personal Profile Pic"}
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Company Description</label>
              <textarea
                className="form-input"
                rows={5}
                placeholder="Write a brief overview of what your company does, your culture, and the kind of talent you usually seek..."
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                disabled={isLoading}
                style={{ paddingLeft: "16px", resize: "vertical" }}
                maxLength={1000}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading} style={{ marginTop: "16px" }}>
              {isLoading ? <div className="spinner"></div> : "Complete Profile"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default ProfileSetup;
