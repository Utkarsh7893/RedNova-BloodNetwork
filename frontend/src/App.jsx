import React from 'react';
import './App.css'
//import { useState, useEffect } from 'react';
import FrontPage from '../Components/frontPage';
import LoginPage from '../Components/loginPage';
import ForgotPage from '../Components/forgotPage';
import DashBoard from '../Components/dashBoard';
import BloodBanks from '../Components/bloodBanks';
import Donors from '../Components/donors';
import DonorRegister from '../Components/registerDonor';
import AboutPage from '../Components/about';
import DonorProfile from '../Components/donorProfile';
import Events from '../Components/event';
import Contact from '../Components/contact';
import DashboardRequests from '../Components/DashboardRequests';
import RequestBlood from '../Components/requestBlood';
import BloodBankDetails from '../Components/bloodBankDetails';
import PrivacyPolicy from '../Components/privacyPolicy';
import Awareness from '../Components/awareness';
import AdminDashboard from '../Components/adminDashboard';
import { Routes, Route } from "react-router-dom";
// import AddUser from '../Components/AddUser';
// import AddItem from '../Components/AddItem';
// import GetItem from '../Components/GetItem';
// import { useParams } from "react-router-dom";

// function DashboardRequestWrapper() {
//   const { id } = useParams();
//   return <DashboardRequests requestId={id} />;
// }

export default function App() {

  //   const[msg,setMsg]=useState("");
  //   useEffect(()=>{
  //     fetch('http://localhost:3000/')
  //     .then(res=>res.text())
  //     .then(data=>setMsg(data))
  //   },[])

  return (
    <Routes>
      <Route path="/" element={<FrontPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot" element={<ForgotPage />} />
      <Route path="/dashboard" element={<DashBoard />} />
      <Route path="/bloodbank" element={<BloodBanks />} />
      <Route path="/donors" element={<Donors />} />
      <Route path="/registerdonor" element={<DonorRegister />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/donor/:id" element={<DonorProfile />} />
      <Route path="/events" element={<Events />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/requestblood" element={<RequestBlood />} />
      <Route path="/bloodbank/:id" element={<BloodBankDetails />} />
      <Route path="/dashboardrequests/:requestId" element={<DashboardRequests />} />
      <Route path="/privacypolicy" element={<PrivacyPolicy />} />
      <Route path="/awareness" element={<Awareness />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
