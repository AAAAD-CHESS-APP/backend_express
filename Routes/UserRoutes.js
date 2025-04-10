const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Auth = require("../middleware/Auth");
const nodemailer = require("nodemailer");
const User = require('../database/Models/User');
const Game = require('../database/Models/Game');
const Report = require("../database/Models/Reports");
const express = require("express");
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({ error: "Invalid Credentials" });
        }
        
        if(!user.isVerified) return res.status(300).send({message : "Please verify yourself"});

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).send({ error: "Invalid Credentials" });
        }

        const token = jwt.sign({ user_id: user._id }, process.env.JWT_TOKEN_SECRET, { expiresIn: '30d' });
        res.status(200).send({
            token: token,
            username: user.name
        });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

router.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const exist = await User.findOne({
            email : email

        })
        console.log(exist)
        if(exist && !exist.isVerified) {
            const delc = await User.deleteOne({email : email});
            console.log(delc)
        }
        const user = new User({ email, password, name });
        await user.save();
        const token = jwt.sign({ user_id: user._id }, process.env.JWT_TOKEN_SECRET, { expiresIn: '30d' });
        res.status(200).send({ token });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
})

router.post('/verifytokenAndGetUsername', async (req, res) => {
    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
        const user = await User.findById(decoded.user_id);

        if (!user) {
            return res.status(404).send({ error: 'Invalid or expired token' });
        }

        if(!user.isVerified) return res.status(400).send({error : "Your Email is not verfied !"})

        res.status(200).send({ user: user.name });
    } catch (e) {
        res.status(400).send({ error: 'Invalid or expired token' });
    }
});

router.post('/resetPasswordToken', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) return res.status(400).send({ error: 'Email is not registered with us' });
        const token = jwt.sign({ user_id: user._id, email: user.email }, process.env.JWT_RESET_PASSWORD_SECRET, { expiresIn: "5m" });
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: "aichess.dev@gmail.com",
                pass: process.env.NODEMAIL_APP_PASSWORD,
            },
        });

        let mailOptions = {
            from: "aichess.dev@gmail.com",
            to: email,
            subject: 'Password Reset Link',
            text: `You requested to reset your password. Click the link below to proceed. This link is valid for 5 minutes:\n\nhttp://localhost:5173/update-password/${token}`,
            html: `
              <p>You requested to reset your password.</p>
              <p>This link is valid for <strong>5 minutes</strong>:</p>
              <a href="http://localhost:5173/update-password/${token}">Reset Password</a>
            `,
          };
          

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(400).send(error);
            }
            res.status(200).send({ message: "Open Mail" });
        });

    } catch (e) {
        res.status(400).send(e);
    }
})

router.patch("/resetPassword/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPass } = req.body;

       if (confirmPass !== password) {
            return res.status(400).send("Passwords don't match");
        }

        
        const decoded = jwt.verify(token, process.env.JWT_RESET_PASSWORD_SECRET);
        if (!decoded || !decoded.user_id) {
            return res.status(400).send({ message: "Invalid or expired token" });
        }

    
        const user = await User.findById(decoded.user_id);
        if (!user) {
            return res.status(400).send({ message: "User not found" });
        }

        
        user.password = password;
        await user.save();

        return res.status(200).send("success");
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

router.get('/userGames/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(400).send({ message: "Invalid user Id" });
        const whitegames = await Game.find({ white: user._id });
        const blackgames = await Game.find({ black: user._id });
        const merged = whitegames + blackgames;
        res.status(200).send(merged);
    } catch (err) {
        res.status(400).send(err);
    }
})

router.get('/userStats/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) return res.status(400).send({ message: "User not found" });
        res.status(200).send({
            id: user._id,
            elo: user.elo,
            name: user.name,
            wins: user.wins,
            loses: user.loses,
            draws: user.draws,
            gamesPlayed: user.gamesHistory
        })
    } catch (err) {
        res.status(400).send(err);
    }

})

router.get("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(400).send({ message: "Invalid user ID" });
        res.status(200).send(user);
    } catch (err) {
        res.status(500).send(err);
    }
})

router.delete("/user/:id", Auth, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        if (id != userId) return res.status(400).send("Access Denied");
        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(400).send("Invalid Id");
        res.status(200).send({
            message: "User has been deleted",
            user: user
        });
    } catch (err) {
        res.status(400).send(err);
    }
})

router.put("/updateUser/:id", Auth, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        if (id != userId) return res.status(400).send({ message: "Access Denied" });
        const { name, email } = req.body;
        const user = await User.findById(id);
        if (name) user.name = name;
        if (email) user.email = email;
        await user.save();
        res.status(200).send(user);
    } catch (err) {
        res.status(400).send(err);
    }
})

router.post("/verifyToken", Auth, async (req, res) => {
    try {
      const id = req.userId;
      const user = await User.findById(id);
  
      if (!user) {
        return res.status(400).send({ message: "Invalid user ID" });
      }
  
      const token = jwt.sign(
        { user_id: user._id, email: user.email },
        process.env.JWT_TOKEN_SIGNUP_MAIL_SECRET,
        { expiresIn: "5m" }
      );
  
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: "aichess.dev@gmail.com",
          pass: process.env.NODEMAIL_APP_PASSWORD,
        },
      });
  
      const mailOptions = {
        from: '"AI Chess" <aichess.dev@gmail.com>',
        to: user.email,
        subject: 'Email Verification Link',
        html: `
  <h3>Email Verification</h3>
  <p>Click the button below to verify your email:</p>
  <a 
    href="http://localhost:5173/verify-email/${token}" 
    style="display: inline-block; margin: 10px 0; padding: 10px 20px; background-color: #000814; color: #ffffff; text-decoration: none; border-radius: 5px;"
  >
    Verify Email
  </a>
  <p>If the button doesn't work, copy and paste this URL into your browser:</p>
  <p>http://localhost:5173/verify-email/${token}</p>
  <p><b>Note:</b> This link is valid for only 5 minutes.</p>
`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending mail:", error);
          return res.status(400).send({ message: "Error sending email", error });
        }
        res.status(200).send({ message: "Verification email sent. Check your inbox." });
      });
  
    } catch (err) {
      console.error("Server error:", err.message);
      res.status(400).send({ message: err.message });
    }
  });

router.get("/verify/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_TOKEN_SIGNUP_MAIL_SECRET);
        if (!decoded) res.status(400).send({ message: "Invalid Token" });
        const user = await User.findById(decoded.user_id);
        if (!user) return res.status(400).send({ message: "Invalid Token" });
        user.isVerified = true;
        await user.save();
        res.status(200).send({ message: "User has been verified" });
    } catch (err) {
        res.status(400).send(err);
    }
})

router.post("/isVerified", async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findOne({ name: name });
        if (!user) return res.status(400).send({ message: "Invalid User" });
        res.status(200).send({
            verified: user.isVerified
        })
    } catch (err) {
        res.status(400).send(err);
    }
})

router.post("/getUser", async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ name: username });
        if (!user) return res.status(400).send({ message: "No User Found" });
        res.status(200).send({
            userId: user._id
        });
    } catch (err) {
        res.status(400).send(err);
    }
})

router.post("/report",Auth, async (req, res) => {
    try {
        const {reportedBy,reportedReason,reportedTo} = req.body;
        const user = await User.findById(reportedTo);
        if(reportedBy!=req.userId) return res.status(400).send("Access Denied");
        if (!user) return res.status(400).send("Invalid User Id");
        user.reports += 1;
        await user.save();
        
        const report = new Report({
            reportedBy : reportedBy,
            reportedTo : reportedTo,
            reportedReason : reportedReason
        })
        await report.save();
        
        res.status(200).send("success");
    } catch (err) {
        res.status(400).send(err);
    }
})


router.post("/feedback/:playerId", async (req, res) => {
    try {
        const { text } = req.body;
        const { playerId } = req.params;
        const user = await User.findById(playerId);
        if (!user) res.status(400).send("Invalid User Id");
        user.feedback.push(text);
        await user.save();
        res.status(200).send("thanks for feedback");
    } catch (err) {
        res.status(400).send(err);
    }
})

router.post("/request-unban/:playerId", async (req, res) => {
    const { playerId } = req.params;
    const { text } = req.body;
    try {
        const user = await User.findById(playerId);
        if (!user) return res.status(400).send("Invalid User Id");
        if (!user.isBanned) return res.status(200).send({ message: "You are not banned" });
        user?.unbanReason?.push(text);
        await user.save();
        res.status(200).send({ message: "We are Processing your request" });
    } catch (err) {
        res.status(400).send(err);
    }
})

router.get("/all-cheaters", async (req, res) => {
    try {
        const cheaters = await User.find({ isBanned: true });
        res.status(200).send(cheaters);
    } catch (err) {
        res.status(400).send(err);
    }
})


module.exports = router;
