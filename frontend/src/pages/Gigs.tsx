import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, Briefcase, DollarSign, Calendar, Tag, 
  ChevronRight, Filter, AlertCircle, Sparkles 
} from "lucide-react";

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface Skill {
  _id: string;
  name: string;
}

interface Gig {
  _id: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
  };
  experienceLevel: "Beginner" | "Intermediate" | "Expert";
  duration: string;
  deadline: string;
  proposalsCount: number;
  client: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: {
      url: string;
    };
  };
  category: {
    _id: string;
    name: string;
  };
  skillsRequired: Skill[];
  createdAt: string;
}

const Gigs: React.FC = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedExp, setSelectedExp] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/v1/gigs/categories");
        const json = await res.json();
        if (res.ok && json.data) {
          setCategories(json.data.categories || []);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Gigs with active filters
  const fetchGigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedExp) params.append("experienceLevel", selectedExp);
      if (minBudget) params.append("minBudget", minBudget);
      if (maxBudget) params.append("maxBudget", maxBudget);

      const res = await fetch(`/api/v1/gigs?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to load gigs.");
      }
      setGigs(json.data || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce/Trigger search & filter queries
    const delayDebounce = setTimeout(() => {
      fetchGigs();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategory, selectedExp, minBudget, maxBudget]);

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedExp("");
    setMinBudget("");
    setMaxBudget("");
  };

  return (
    <div className="auth-wrapper" style={{ minHeight: "100vh", alignItems: "flex-start", paddingTop: "80px", paddingBottom: "60px" }}>
      <div style={{ width: "100%", maxWidth: "1200px", display: "flex", gap: "28px", flexDirection: "column" }}>
        
        {/* Marketplace Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", color: "var(--text-main)", marginBottom: "4px" }}>
              Gig Marketplace
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Browse through open development, design, and audio-video projects and submit bids
            </p>
          </div>
          <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Back to Dashboard <ChevronRight size={14} />
          </Link>
        </div>

        {/* Filters and List wrapper */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "28px", alignItems: "flex-start" }}>
          
          {/* Sidebar Filter Panel */}
          <div className="glass-card" style={{ padding: "24px", margin: 0 }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <Filter size={18} style={{ color: "var(--primary)" }} /> Filters
            </h3>

            {/* Keyword Search */}
            <div className="form-group">
              <label className="form-label">Keyword Search</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="form-input"
                  placeholder="React, logo, content..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: "38px" }}
                />
                <Search className="input-icon" size={16} style={{ left: "12px" }} />
              </div>
            </div>

            {/* Category Filter */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  color: "var(--text-main)",
                  fontFamily: "inherit"
                }}
              >
                <option value="" style={{ background: "#1c1936" }}>All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id} style={{ background: "#1c1936" }}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div className="form-group">
              <label className="form-label">Experience Level</label>
              <select
                value={selectedExp}
                onChange={(e) => setSelectedExp(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  color: "var(--text-main)",
                  fontFamily: "inherit"
                }}
              >
                <option value="" style={{ background: "#1c1936" }}>Any Experience</option>
                <option value="Beginner" style={{ background: "#1c1936" }}>Beginner</option>
                <option value="Intermediate" style={{ background: "#1c1936" }}>Intermediate</option>
                <option value="Expert" style={{ background: "#1c1936" }}>Expert</option>
              </select>
            </div>

            {/* Budget Filter */}
            <div className="form-group">
              <label className="form-label">Budget Range ($)</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <input
                  type="number"
                  placeholder="Min"
                  className="form-input"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  style={{ paddingLeft: "12px", fontSize: "0.85rem" }}
                  min={0}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="form-input"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  style={{ paddingLeft: "12px", fontSize: "0.85rem" }}
                  min={0}
                />
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleClearFilters}
              className="btn btn-secondary btn-block"
              style={{ fontSize: "0.85rem", marginTop: "16px" }}
            >
              Clear All Filters
            </button>
          </div>

          {/* Gigs List Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "12px" }}>
                <div className="spinner" style={{ width: "32px", height: "32px" }}></div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Filtering gigs list...</span>
              </div>
            ) : error ? (
              <div className="alert alert-error" style={{ justifyContent: "center" }}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            ) : gigs.length === 0 ? (
              <div className="glass-card" style={{ textAlign: "center", padding: "60px 40px", margin: 0 }}>
                <Sparkles size={36} style={{ color: "var(--primary)", marginBottom: "16px" }} />
                <h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>No Gigs Found</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  No open jobs match your current search criteria. Try modifying your filters or checking back later.
                </p>
              </div>
            ) : (
              gigs.map((gig) => (
                <div key={gig._id} className="glass-card" style={{ padding: "30px", margin: 0, display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <h2 style={{ fontSize: "1.4rem", color: "var(--text-main)", fontWeight: 700 }}>{gig.title}</h2>
                      <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", display: "inline-block", marginTop: "4px" }}>
                        {gig.category?.name}
                      </span>
                    </div>
                    <span style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "var(--success)",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center"
                    }}>
                      <DollarSign size={14} />{gig.budget.min} - ${gig.budget.max}
                    </span>
                  </div>

                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {gig.description}
                  </p>

                  {/* Skills required */}
                  {gig.skillsRequired && gig.skillsRequired.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {gig.skillsRequired.slice(0, 5).map((skill, index) => (
                        <span 
                          key={index} 
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-main)",
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontWeight: 600
                          }}
                        >
                          {skill.name}
                        </span>
                      ))}
                      {gig.skillsRequired.length > 5 && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>+{gig.skillsRequired.length - 5} more</span>
                      )}
                    </div>
                  )}

                  {/* Meta Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "16px", flexWrap: "wrap", gap: "12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Briefcase size={14} /> {gig.experienceLevel}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={14} /> {new Date(gig.deadline).toLocaleDateString()}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Tag size={14} /> {gig.proposalsCount} {gig.proposalsCount === 1 ? "Proposal" : "Proposals"}
                      </span>
                    </div>
                    
                    <Link to={`/gigs/${gig._id}`} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "0.8rem", gap: "4px" }}>
                      View Details <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Gigs;
