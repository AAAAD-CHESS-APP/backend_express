const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/dailyPuzzle", async (req, res) => {
    try {
        const response = await axios.get("https://lichess.org/api/puzzle/daily");
        const data = response.data;
        res.status(200).send(data);
    } catch (err) {
        res.status(400).send(err);
    }
})


router.post("/analyze", async (req, res) => {
    try {
        const { fen } = req.body;
        const response = await axios.get(`https://lichess.org/api/cloud-eval?fen=${fen}`);
        const data = response.data;
        res.status(200).send(data);
    } catch (err) {
        res.status(400).send("Invalid Fen Position");
    }
})

router.post("/fide-details", async (req, res) => {
    try {
        const { playerId } = req.body;
        const response = await axios.get(`https://lichess.org/api/fide/player/${playerId}`);
        const data = response.data;
        res.status(200).send(data);
    } catch (err) {
        res.status(400).send(err);
    }
})

router.get("/openings", async (req, res) => {
    try {
        const response = await axios.get("https://explorer.lichess.ovh/masters");
        const data = response.data;
        res.status(200).send(data);
    } catch (err) {
        res.status(400).send(err);
    }
})

async function getTopPlayers(type, count) {
    try {
        const response = await fetch(`https://lichess.org/api/player/top/${count}/${type}`);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}

router.post("/top-10", async (req, res) => {
    try {
        const { mode } = req.body;
        const players = await getTopPlayers(mode, 10 || "blitz", 10);
        res.status(200).json(players);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;


