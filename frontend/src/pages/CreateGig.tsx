import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Plus, Trash2, ArrowLeft, AlertCircle 
} from "lucide-react";

interface Category {
  _id: string;
  name: string;
}

interface Skill {
  _id: string;
  name: string;
  category: string;
}

interface MilestoneInput {
  title: string;
  amount: number;
  dueDate: string;
  description?: string;
}

const CreateGig: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not client
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "client") {
      navigate("/dashboard", { state: { error: "Only clients can create Gigs." } });
    }
  }, [user, navigate]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState<number>(100);
  const [maxBudget, setMaxBudget] = useState<number>(1000);
  const [experienceLevel, setExperienceLevel] = useState<"Beginner" | "Intermediate" | "Expert">("Intermediate");
  const [duration, setDuration] = useState("1 Month");
  const [deadline, setDeadline] = useState("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  // Milestones State
  const [milestones, setMilestones] = useState<MilestoneInput[]>([]);
  const [mTitle, setMTitle] = useState("");
  const [mAmount, setMAmount] = useState<number>(0);
  const [mDueDate, setMDueDate] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories & skills
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch("/api/v1/gigs/categories");
        const json = await res.json();
        if (res.ok && json.data) {
          setCategories(json.data.categories || []);
          setAllSkills(json.data.skills || []);
        }
      } catch (err) {
        console.error("Failed to load skills and categories:", err);
      }
    };
    fetchMetadata();
  }, []);

  // Filter skills when category changes
  useEffect(() => {
    if (category) {
      setFilteredSkills(allSkills.filter(s => s.category === category));
      setSelectedSkills([]); // Reset selected skills
    } else {
      setFilteredSkills([]);
    }
  }, [category, allSkills]);

  const handleToggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  // Milestones Handlers
  const handleAddMilestone = () => {
    if (!mTitle.trim() || !mAmount || !mDueDate) {
      setError("Please fill in Milestone Title, Amount, and Due Date.");
      return;
    }

    const currentTotal = milestones.reduce((sum, m) => sum + m.amount, 0);
    if (currentTotal + mAmount > maxBudget) {
      setError(`Milestones sum ($${currentTotal + mAmount}) exceeds your maximum budget ($${maxBudget}).`);
      return;
    }

    setMilestones([
      ...milestones,
      { title: mTitle.trim(), amount: mAmount, dueDate: mDueDate }
    ]);
    setMTitle("");
    setMAmount(0);
    setMDueDate("");
    setError(null);
  };

  const handleRemoveMilestone = (indexToRemove: number) => {
    setMilestones(milestones.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !deadline) {
      setError("Please fill out all required fields.");
      return;
    }

    if (minBudget > maxBudget) {
      setError("Minimum budget cannot exceed maximum budget.");
      return;
    }

    const totalMilestones = milestones.reduce((sum, m) => sum + m.amount, 0);
    if (milestones.length > 0 && totalMilestones !== maxBudget) {
      setError(`Warning: The sum of your milestones ($${totalMilestones}) should equal your maximum budget ($${maxBudget}) to support secure escrow deposits.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("skillsRequired", selectedSkills.join(","));
    formData.append("minBudget", String(minBudget));
    formData.append("maxBudget", String(maxBudget));
    formData.append("experienceLevel", experienceLevel);
    formData.append("duration", duration);
    formData.append("deadline", deadline);
    formData.append("milestones", JSON.stringify(milestones));

    attachmentFiles.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      const res = await fetch("/api/v1/gigs", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to create gig.");
      }

      navigate("/dashboard", { state: { message: "Gig posted successfully on the marketplace!" } });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ minHeight: "100vh", alignItems: "flex-start", paddingTop: "80px", paddingBottom: "60px" }}>
      <div className="glass-card" style={{ maxWidth: "720px", padding: "40px" }}>
        
        <div style={{ marginBottom: "28px" }}>
          <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h2 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "8px" }}>Post a Gig</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Specify project requirements, budget, deliverables milestones, and find elite freelancers.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "24px" }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Gig Title */}
          <div className="form-group">
            <label className="form-label">Gig Title*</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Build a Responsive Next.js Web App with Stripe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              style={{ paddingLeft: "16px" }}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Detailed Scope Description*</label>
            <textarea
              className="form-input"
              rows={6}
              placeholder="Describe the application features, deliverables, tech constraints, and any design guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              style={{ paddingLeft: "16px", resize: "vertical" }}
              required
            />
          </div>

          {/* Category Selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Category*</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 16px",
                  color: "var(--text-main)",
                  fontFamily: "inherit"
                }}
                required
              >
                <option value="" style={{ background: "#1c1936" }}>Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id} style={{ background: "#1c1936" }}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level*</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                disabled={isLoading}
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
                <option value="Beginner" style={{ background: "#1c1936" }}>Beginner (Entry-Level)</option>
                <option value="Intermediate" style={{ background: "#1c1936" }}>Intermediate (Mid-Level)</option>
                <option value="Expert" style={{ background: "#1c1936" }}>Expert (Senior-Level)</option>
              </select>
            </div>
          </div>

          {/* Skills Required Checkboxes */}
          {category && filteredSkills.length > 0 && (
            <div className="form-group" style={{ animation: "fadeIn 0.3s ease-out" }}>
              <label className="form-label">Select Skills Required</label>
              <div style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: "8px", 
                maxHeight: "120px", 
                overflowY: "auto", 
                background: "rgba(255,255,255,0.01)", 
                border: "1px solid var(--border-color)", 
                padding: "12px", 
                borderRadius: "var(--radius-md)" 
              }}>
                {filteredSkills.map((skill) => {
                  const isChecked = selectedSkills.includes(skill._id);
                  return (
                    <button
                      type="button"
                      key={skill._id}
                      onClick={() => handleToggleSkill(skill._id)}
                      style={{
                        background: isChecked ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isChecked ? "var(--primary)" : "var(--border-color)"}`,
                        color: isChecked ? "var(--secondary)" : "var(--text-muted)",
                        borderRadius: "16px",
                        padding: "4px 12px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        transition: "var(--transition)"
                      }}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget Min/Max & Duration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Min Budget ($)*</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  className="form-input"
                  value={minBudget}
                  onChange={(e) => setMinBudget(Number(e.target.value))}
                  disabled={isLoading}
                  style={{ paddingLeft: "16px" }}
                  min={0}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Max Budget ($)*</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  className="form-input"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  disabled={isLoading}
                  style={{ paddingLeft: "16px" }}
                  min={0}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Duration*</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2 Weeks"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={isLoading}
                style={{ paddingLeft: "16px" }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Deadline */}
            <div className="form-group">
              <label className="form-label">Application Deadline*</label>
              <input
                type="date"
                className="form-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isLoading}
                style={{ paddingLeft: "16px" }}
                required
              />
            </div>

            {/* Attachments */}
            <div className="form-group">
              <label className="form-label">Attachments Files (Optional)</label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachmentFiles(Array.from(e.target.files));
                  }
                }}
                disabled={isLoading}
                style={{ fontSize: "0.85rem", marginTop: "4px" }}
              />
            </div>
          </div>

          {/* ========================================================== */}
          {/* ==================== MILESTONES MANAGER ================== */}
          {/* ========================================================== */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "24px", marginTop: "12px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)", marginBottom: "8px" }}>Deliverables Milestones (Optional)</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "16px" }}>
              Break down project deliverables. Accepting a freelancer locks their payment against these milestone amounts.
            </p>

            <div style={{ 
              background: "rgba(255,255,255,0.01)", 
              border: "1px solid var(--border-color)", 
              borderRadius: "var(--radius-md)", 
              padding: "20px",
              marginBottom: "16px"
            }}>
              <div className="form-group">
                <label className="form-label">Milestone Title</label>
                <input
                  type="text"
                  placeholder="e.g. Design Wireframes and Mockups"
                  className="form-input"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  style={{ paddingLeft: "12px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Milestone Allocation ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={mAmount}
                    onChange={(e) => setMAmount(Number(e.target.value))}
                    min={0}
                    style={{ paddingLeft: "12px" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={mDueDate}
                    onChange={(e) => setMDueDate(e.target.value)}
                    style={{ paddingLeft: "12px" }}
                  />
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-secondary btn-block" 
                onClick={handleAddMilestone}
                style={{ fontSize: "0.85rem", gap: "4px" }}
              >
                <Plus size={16} /> Add Milestone
              </button>
            </div>

            {/* List of Milestones */}
            {milestones.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span className="form-label">Defined Milestones Breakdown</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--secondary)" }}>
                    Total: ${milestones.reduce((sum, m) => sum + m.amount, 0)} / ${maxBudget}
                  </span>
                </div>
                {milestones.map((m, index) => (
                  <div 
                    key={index} 
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", display: "block" }}>{m.title}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Amount: <strong style={{ color: "var(--success)" }}>${m.amount}</strong> &bull; Due: {new Date(m.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveMilestone(index)}
                      style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading} style={{ marginTop: "16px" }}>
            {isLoading ? <div className="spinner"></div> : "Post Gig to Marketplace"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default CreateGig;
