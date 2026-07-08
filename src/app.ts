import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

export default app;