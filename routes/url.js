import { ShortURL } from "../models/shortURL.js";
import express from "express";

// express router is initialized to router variable and used
const router = express.Router();

router.get("/", async (req, res) => {
  const shortUrls = await ShortURL.find();
  res.render("url", { shortUrls: shortUrls });
});

router.post("/shortUrls", async (req, res) => {
  await ShortURL.create({ full: req.body.fullUrl });

  res.redirect("/");
});

router.get("/:shortUrl", async (req, res) => {
  const shortUrl = await ShortURL.findOne({ short: req.params.shortUrl });
  if (shortUrl == null) return res.sendStatus(404);

  shortUrl.clicks++;
  shortUrl.save();

  res.redirect(`${shortUrl.full}`);
});

export const urlRouter = router;
