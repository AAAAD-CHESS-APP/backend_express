const Admin = require("../database/Models/Admin");
const AdminPasskey = require("../")
const express = require("express");
const router = express.Router();
const User = require("../database/Models/User");
const AdminAuth = require("../middleware/AdminAuth");
const Admin = require("../database/Models/Admin");
const Report = require("../database/Models/Reports");
const Game = require("../database/Models/Game");

router.post("/signup",AdminPasskey,async(req,res)=>{
    try{
    const {adminname,password,email} = req.body;
    const admin = new Admin({
        name : adminname,
        password : password,
        email : email
    })
    await admin.save();
    const token = jwt.sign({ admin_id: admin._id }, process.env.JWT_TOKEN_SECRET, { expiresIn: '30d' });
    res.status(200).send({ token });
    }catch(err){
        res.status(400).send(err);
    }
})

router.post("/login",async(req,res)=>{
    try{
        const {email,password} = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).send({ error: "Invalid Credentials" });
        }
        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
            return res.status(400).send({ error: "Invalid Credentials" });
        }

        const token = jwt.sign({ user_id: user._id }, process.env.JWT_TOKEN_SECRET, { expiresIn: '30d' });
        res.status(200).send({
            token: token,
            adminname : admin.name
        });
    }catch(err){
        res.status(400).send(err);
    }
})

router.get("/ban/:playerId",AdminAuth, async (req, res) => {
    try {

        const adminId = req.adminId;
        const Admin = await Admin.findById(adminId);
        if(!Admin) return res.status(400).send("Unauthorised Access");

        const { playerId } = req.params;
        const user = await User.findById(playerId);
        if (!user) res.status(400).send("Invalid User Id");
        user.isBanned = true;
        await user.save();
        res.status(200).send("User has been banned");
    } catch (err) {
        res.status(400).send(err);
    }
})

router.get("/unban/:playerId",AdminAuth, async (req, res) => {
    try {
        const adminId = req.adminId;
        const Admin = await Admin.findById(adminId);
        if(!Admin) return res.status(400).send("Unauthorised Access");

        const { playerId } = req.params;
        const user = await User.findById(playerId);
        if (!user) res.status(400).send("Invalid User Id");
        user.isBanned = false;
        await user.save();
        res.status(200).send("User has been unbanned");
    } catch (err) {
        res.status(400).send(err);
    }
})

router.get("/allReportedPlayers",AdminAuth,async(req,res)=>{
    try{
        const adminId = req.adminId;
        const Admin = await Admin.findById(adminId);
        if(!Admin) return res.status(400).send("Unauthorised Access");

        const users = await User.find({});
        res.status(200).send(users).sort({ reports: -1 });
    }catch (err) {
        res.status(400).send(err);
    }
})

router.get("/reports/:playerId",async(req,res)=>{
    try{
        const {playerId} = req.params;
        const user = await User.findById(playerId);
        if(!user) return res.status(400).send("User does not exist");
        const userReports = await Report.find({reportedTo : user._id});
        res.status(200).send(userReports);
    }catch(err){
        res.status(400).send(err);
    }
})

router.get("/totalUsers",async(req,res)=>{
    const users = await User.find({});
    res.status(200).send(users.length);
})

router.get("/totalGames",async(req,res)=>{
    const games = await Game.find({});
    res.status(200).send(games.length);
})

router.get("/totalReports",async(req,res)=>{
    const reports = await Report.find({});
    res.status(200).send(reports.length);
})


router.get("/recentGames",async(req,res)=>{
    const games = await Game.find({}).sort({startTime:-1});
    res.status(200).send(games);
})


module.exports = router;