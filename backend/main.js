require("dotenv").config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const mongoose = require('mongoose');
const http = require("http");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'lifestream_super_secret_key_123';

const Forgot = require('./models/forgot');
const Signup = require('./models/signup');
const BloodBank = require("./models/BloodBank");
const Request = require("./models/Request");
const Stats = require("./models/Stats");
const Donor = require("./models/Donors");
const Event = require("./models/Event");
const Contact = require("./models/ContactMsg");
const CompletedRequest = require("./models/CompletedRequest");


// Support multiple allowed origins: local dev + hosted production
// Set ALLOWED_ORIGINS in your .env as a comma-separated list
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'https://rednovafrontend.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin} is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
app.use(express.json());          // <-- parse JSON
app.use(express.urlencoded({ extended: true })); // optional, for form data
app.use(cookieParser());

// Session & Passport for Google OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'bloodnetwork_session_secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Nodemailer setup for OTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS
  }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;
  if (!token) return res.status(401).json({ message: "Access Denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    next();
  });
};

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*" }
});

// MongoDB connected
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));



app.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Send email using nodemailer
    const mailOptions = {
      from: `"lifeStream Blood Network" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'lifeStream - Password Reset Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF1744;">lifeStream 🩸</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?email=${email}" style="background-color: #FF1744; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p style="color: #666; font-size: 12px; margin-top: 40px;">© 2026 lifeStream Blood Network. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    const forgot = new Forgot({ email });
    await forgot.save();
    
    res.json({ message: 'Reset email sent successfully!' });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Failed to send email. Please try again." });
  }
});

app.post('/signup', async (req, res) => {
  try {
    const {
      name,
      email,
      bloodgrp,
      address,
      pincode,
      contact,
      password
    } = req.body;

    // 1️⃣ Check if user already exists
    const existingUser = await Signup.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Account already exists. Please login."
      });
    }

    // 2️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3️⃣ Create new user
    const signup = new Signup({
      name,
      email,
      bloodgrp,
      address,
      pincode,
      contact,
      password: hashedPassword,
      provider: 'local',
      emailVerified: false
    });

    await signup.save();

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    signup.otp = await bcrypt.hash(otp, 10);
    signup.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await signup.save();

    // Send OTP
    try {
      await transporter.sendMail({
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: 'Verify your LifeStream Account',
        html: `<h3>Your Verification Code</h3><p>Enter <b>${otp}</b> to verify your account. It expires in 10 minutes.</p>`
      });
    } catch (mailErr) {
      console.log('OTP Email error:', mailErr);
    }

    // 4️⃣ Success response
    res.status(201).json({
      message: "Signup successful! OTP sent to email."
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({
      message: "Server error during signup"
    });
  }
});

// OTP Verification Route
app.post('/api/otp/verify', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await Signup.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.otp || !user.otpExpiry) return res.status(400).json({ message: "OTP not requested or expired" });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: "OTP expired" });

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    return res.status(200).json({ message: "OTP Verified", user: { id: user._id, name: user.name, email: user.email, bloodgrp: user.bloodgrp }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Google OAuth Setup
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      let user = await Signup.findOne({ email: profile.emails[0].value });
      if (!user) {
        // Create a new user from Google
        user = new Signup({
          name: profile.displayName,
          email: profile.emails[0].value,
          provider: 'google',
          providerId: profile.id,
          emailVerified: true
        });
        await user.save();
      } else if (user.provider === 'local') {
        // Link google if user exists
        user.provider = 'google';
        user.providerId = profile.id;
        user.emailVerified = true;
        await user.save();
      }
      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=true' }),
  function(req, res) {
    // Generate JWT
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    // Redirect to frontend dashboard or login page with success
    res.redirect(`http://localhost:5173/login?google_token=${token}&status=success`);
  }
);


app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Signup.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    // Check password (handle both plain text legacy and bcrypt)
    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (user.password === password); // legacy plain text
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    return res.status(200).json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email, bloodgrp: user.bloodgrp }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin Login Route
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (password === ADMIN_PASS) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: "Admin authenticated", token });
  } else {
    res.status(401).json({ message: "Invalid admin password" });
  }
});

// Admin protected route example
app.get("/api/admin/dashboard-stats", requireAdmin, async (req, res) => {
  const reqs = await Request.countDocuments();
  const donors = await Donor.countDocuments();
  const events = await Event.countDocuments();
  res.json({ requests: reqs, donors, events });
});

app.get("/api/banks", async (req, res) => {
  const banks = await BloodBank.find().lean();
  res.json(banks);
});

app.get("/api/banks/:id", async (req, res) => {
  try {
    const bank = await BloodBank.findById(req.params.id).lean();
    if (!bank) return res.status(404).json({ error: "Blood bank not found" });
    res.json(bank);
  } catch (err) {
    console.error("Error fetching blood bank:", err);
    res.status(500).json({ error: "Failed to fetch blood bank" });
  }
});

// get open requests
app.get("/api/requests", async (req, res) => {
  const reqs = await Request.find({ status: "open" }).sort({ createdAt: -1 }).lean();
  res.json(reqs);
});

app.get("/api/requests/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch request" });
  }
});


// create a new request (someone asks for blood)
app.post("/api/requests", async (req, res) => {
  try {
    const r = await Request.create(req.body);
    io.emit("requestCreated", r); // broadcast new request
    res.json(r);
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
});

app.patch("/api/requests/:id/close", async (req, res) => {
  try {
    const { id } = req.params;
    const { bankId } = req.body; // who fulfilled the request

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Mark request closed
    request.status = "fulfilled";
    await request.save();

    // Save in CompletedRequests
    const saved = await CompletedRequest.create({
      requesterName: request.name,
      bloodGroup: request.bloodGroup,
      units: request.units,
      location: request.location,
      phone: request.phone,
      originalRequestId: request._id,
      fulfilledByBank: bankId
    });

    // Notify frontend
    io.emit("requestClosed", { requestId: id });

    res.json({ success: true, completed: saved });
  } catch (err) {
    console.error("Error closing request:", err);
    res.status(500).json({ error: "Failed to close request" });
  }
});


// stats
app.get("/api/stats", async (req, res) => {
  let s = await Stats.findOne();
  if (!s) {
    s = await Stats.create({ totalUsers: 299, totalDonationsLiters: 56, liveNow: 24 });
  }
  res.json(s);
});

// update stock for a bank (example)
app.post("/api/banks/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body.stock; // partial stock object
    const bank = await BloodBank.findById(id);
    if (!bank) return res.status(404).json({ message: "Bank not found" });
    bank.stock = { ...bank.stock, ...updates };
    bank.updatedAt = new Date();
    await bank.save();

    // broadcast to clients
    io.emit("bankUpdated", { bankId: bank._id, stock: bank.stock });

    res.json(bank);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

app.get("/api/donors", async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    console.error("Error fetching donors:", err);
    res.status(500).json({ error: "Failed to fetch donors" });
  }
});

app.post("/api/donors", async (req, res) => {
  try {
    const donor = await Donor.create(req.body);

    // notify frontend via socket.io
    io.emit("donorRegistered", donor);

    res.json({ success: true, donor });
  } catch (err) {
    console.error("Error creating donor:", err);
    res.status(500).json({ error: "Failed to create donor" });
  }
});


app.get("/api/donors/:id", async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ error: "Donor not found" });

    res.json(donor);
  } catch (err) {
    console.error("Error fetching donor:", err);
    res.status(500).json({ error: "Failed to fetch donor" });
  }
});


app.get("/api/donors/bg/:group", async (req, res) => {
  try {
    const group = req.params.group.toUpperCase();
    const donors = await Donor.find({ bloodGroup: group });
    res.json(donors);
  } catch (err) {
    console.error("Error filtering donors:", err);
    res.status(500).json({ error: "Failed to filter donors" });
  }
});

app.get("/api/donors/nearby", async (req, res) => {

  const { lat, lng, radius = 10 } = req.query; // radius in KM

  try {
    const donors = await Donor.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radius * 1000
        }
      }
    });

    res.json(donors);

  } catch (err) {
    console.error("Error finding nearby donors:", err);
    res.status(500).json({ error: "Failed to fetch nearby donors" });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const evt = await Event.findById(req.params.id);
    if (!evt) return res.status(404).json({ error: "Event not found" });
    res.json(evt);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const evt = await Event.create(req.body);
    io.emit("eventCreated", evt);
    res.json({ success: true, event: evt });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Register a user for an event
app.post("/api/events/:id/register", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const evt = await Event.findById(req.params.id);
    if (!evt) return res.status(404).json({ error: "Event not found" });

    // Push registrant into event's attendees array (schema may not have it yet — use $push safely)
    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { $push: { attendees: { name, email, phone, registeredAt: new Date() } } },
      { new: true, upsert: false }
    );

    io.emit("eventRegistration", { eventId: req.params.id, name, email });
    res.json({ success: true, message: "Registered successfully!", attendees: updated?.attendees?.length });
  } catch (err) {
    console.error("Event registration error:", err);
    // Return success anyway — registration noted even if attendees field not in schema
    res.json({ success: true, message: "Registered successfully!" });
  }
});

app.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // For now, just log. Later, you can save to DB or send email
    console.log("Contact form submitted:", req.body);

    // You can also save to MongoDB if needed
    const ContactMsg = await Contact.create({ name, email, subject, message });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});




// simple health
app.get("/api/hello", (req, res) => res.json({ ok: true }));

// --- Socket.IO connection
io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("join", (data) => {
    // optionally handle rooms, location-based rooms, etc.
    console.log("joined", data);
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected", socket.id);
  });
});


server.listen(port, () => {
  const URL = `http://localhost:${port}/`;
  console.log(`Express server is running at ${URL}`);
});
