import cors from "cors";
import "dotenv/config";
import express from "express";
import { supabase } from "./supabase.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "Reademption backend is running" });
});

app.get("/api/books", async (req, res) => {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
