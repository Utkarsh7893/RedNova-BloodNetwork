const express = require('express');
const app = express();
const port = process.env.PORT || 3000;;
const cors = require('cors');
const mongoose = require('mongoose');
require("dotenv").config();
const http = require("http");

const Forgot=require('./models/forgot');
const Signup=require('./models/signup');
const BloodBank = require("./models/BloodBank");
const Request = require("./models/Request");
const Stats = require("./models/Stats");
const Donor = require("./models/Donors");
const Event=require("./models/Event");
const Contact=require("./models/ContactMsg");
const CompletedRequest=require("./models/CompletedRequest");


app.use(cors({
  origin: 'https://rednovafrontend.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
app.use(express.json());          // <-- parse JSON
app.use(express.urlencoded({ extended: true })); // optional, for form data

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*" }
});

// MongoDB connected
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));



  app.post('/forgot',async(req,res)=>{
    try{
      const forgot=new Forgot({
        email:req.body.email,
      });
      await forgot.save();
      res.send('email saved!');
    }catch(err){
      res.status(500).send(err.message);
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

      // 2️⃣ Create new user
      const signup = new Signup({
        name,
        email,
        bloodgrp,
        address,
        pincode,
        contact,
        password
      });

      await signup.save();

      // 3️⃣ Success response
      res.status(201).json({
        message: "Signup successful!"
      });

    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({
        message: "Server error during signup"
      });
    }
  });


  app.post('/login',async(req,res)=>{
    const {email,password}=req.body;
    try{
      const user=await Signup.findOne({email});
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      if (user.password === password) {
        return res.status(200).json({ message: "Login successful", user });
      } else {
        return res.status(400).json({ message: "Invalid password" });
      }
    }catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
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
  
      // broadcast new event in realtime
      io.emit("eventCreated", evt);
  
      res.json({ success: true, event: evt });
    } catch (err) {
      console.error("Error creating event:", err);
      res.status(500).json({ error: "Failed to create event" });
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
  app.get("/api/hello", (req,res)=> res.json({ ok: true }));
  
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
