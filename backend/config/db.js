const mongoose = require("mongoose");
const Category = require("../models/Category");
const Skill = require("../models/Skill");

const seedDatabase = async () => {
  try {
    const count = await Category.countDocuments();
    if (count > 0) return; // Already seeded

    console.log("Database categories and skills empty. Seeding database...");

    const seedData = [
      {
        name: "Software Development",
        description: "Web development, mobile apps, database design, APIs, and DevOps.",
        icon: "Code",
        skills: ["React", "Node.js", "MongoDB", "JavaScript", "Python", "TypeScript", "HTML5", "CSS3", "Docker", "Express"]
      },
      {
        name: "Design & Creative",
        description: "Graphic design, brand identities, Figma wireframes, UI/UX, and illustrations.",
        icon: "Palette",
        skills: ["Figma", "UI/UX Design", "Photoshop", "Illustrator", "Graphic Design", "Logo Design", "After Effects"]
      },
      {
        name: "Writing & Translation",
        description: "Copywriting, technical blogs, translation services, and academic reviews.",
        icon: "FileText",
        skills: ["Technical Writing", "Content Writing", "Copywriting", "SEO Writing", "Proofreading", "Translation"]
      },
      {
        name: "Marketing & Sales",
        description: "Ad campaigns, SEO optimization, social media strategies, and sales growth.",
        icon: "TrendingUp",
        skills: ["SEO", "Digital Marketing", "Social Media Marketing", "Google Ads", "Content Marketing", "Google Analytics"]
      },
      {
        name: "Video & Audio",
        description: "Motion graphics, video editing, audio mixing, and production.",
        icon: "Video",
        skills: ["Video Editing", "Premiere Pro", "After Effects", "Motion Graphics", "Audio Mixing", "DaVinci Resolve"]
      }
    ];

    for (const data of seedData) {
      const category = await Category.create({
        name: data.name,
        description: data.description,
        icon: data.icon
      });

      for (const skillName of data.skills) {
        await Skill.create({
          name: skillName,
          category: category._id,
          description: `Expertise in ${skillName}`
        });
      }
    }

    console.log("Database seeded successfully with Categories and Skills!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skillsphere");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto Seed Categories and Skills on start
    await seedDatabase();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
