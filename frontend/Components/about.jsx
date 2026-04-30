import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchRandomImage4,
  fetchRandomImage5,
  fetchRandomImage6,
  fetchRandomImage7,
  fetchRandomImage8,
  fetchRandomImage9,
} from "./api";
import * as THREE from "three";
import Navbar from "./Navbar.jsx";

const COMPANY_NAME = "lifeStream";

export default function AboutPage() {
  const mountRef = useRef(null);
  const navigate = useNavigate();

  // carousel images
  const [imageUrl1, setImageUrl1] = useState("https://images.unsplash.com/photo-1615461066159-fea0960485d5?w=800&q=80");
  const [imageUrl2, setImageUrl2] = useState("https://images.unsplash.com/photo-1576671494552-5a6d9d87c000?w=800&q=80");
  const [imageUrl3, setImageUrl3] = useState("https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&q=80");
  const [imageUrl4, setImageUrl4] = useState("https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80");
  const [imageUrl5, setImageUrl5] = useState("https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80");
  const [imageUrl6, setImageUrl6] = useState("https://images.unsplash.com/photo-1582719471324-7eb38c9ce722?w=800&q=80");

  useEffect(() => {
    const fetchImages = async () => {
      try { const img = await fetchRandomImage4(); if (img) setImageUrl1(img); } catch (e) {}
      try { const img = await fetchRandomImage5(); if (img) setImageUrl2(img); } catch (e) {}
      try { const img = await fetchRandomImage6(); if (img) setImageUrl3(img); } catch (e) {}
      try { const img = await fetchRandomImage7(); if (img) setImageUrl4(img); } catch (e) {}
      try { const img = await fetchRandomImage8(); if (img) setImageUrl5(img); } catch (e) {}
      try { const img = await fetchRandomImage9(); if (img) setImageUrl6(img); } catch (e) {}
    };
    fetchImages();
  }, []);

  const carouselImages = [imageUrl1, imageUrl2, imageUrl3];
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCarouselIndex(i => (i + 1) % carouselImages.length), 4000);
    return () => clearInterval(id);
  }, [carouselImages.length]);

  // three.js background
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0); // transparent
    el.appendChild(renderer.domElement);

    const particlesCount = 180;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xaa2b2b, size: 0.12, opacity: 0.85, transparent: true });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let frame = 0;
    let rafId;
    const animate = () => {
      frame += 0.01;
      const arr = geo.attributes.position.array;
      for (let i = 0; i < particlesCount; i++) {
        const idx = i * 3 + 1;
        arr[idx] += Math.sin(frame + i) * 0.0008 - 0.002;
        if (arr[idx] < -6) arr[idx] = 6;
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <style>{`
        html, body { height:auto !important; overflow-y:auto !important; }

        .about-page {
          min-height:100vh;
          position:relative;
          background: var(--ls-bg);
        }
        .about-bg {
          position: fixed; inset:0; z-index:0; pointer-events:none;
        }
        .about-content {
          position:relative; z-index:5;
          max-width:1400px; margin:0 auto;
          padding:28px 20px 60px;
        }
        h2 { font-weight:800; color:var(--ls-text); font-family:'Manrope',sans-serif; }
        h5,h6 { font-weight:700; color:var(--ls-text); }

        .carousel {
          position:relative; width:100%; height:360px; border-radius:18px;
          overflow:hidden; background: var(--ls-surface); margin-bottom:24px;
          box-shadow: var(--ls-shadow-lg);
        }
        .carousel img {
          position:absolute; left:0; top:0; width:100%; height:100%;
          object-fit:cover; opacity:0; transition:opacity 900ms ease;
          filter: saturate(1.1) contrast(1.05);
        }
        .carousel img.active { opacity:1; }

        .section {
          background: var(--ls-surface);
          backdrop-filter: blur(16px);
          border: 1px solid var(--ls-border);
          border-radius:16px;
          padding:24px;
          margin-bottom:24px;
          box-shadow: var(--ls-shadow-sm);
          color: var(--ls-text-sub);
        }
        .section li { margin-bottom: 8px; color: var(--ls-text-sub); }

        .image-strip {
          display:flex; gap:16px; overflow-x:auto; padding-top:12px;
        }
        .image-strip img {
          height:160px; min-width:260px; border-radius:12px; object-fit:cover;
          transition:transform 0.3s;
        }
        .image-strip img:hover { transform:scale(1.06); }

        .highlight {
          background: var(--ls-grad-crimson);
          color:white;
          padding:30px;
          border-radius:18px;
          margin-bottom:24px;
        }
        .highlight h2 { color: white; }
        .highlight p { color: rgba(255,255,255,0.9); }

        @media (max-width:991px) {
          .carousel { height:240px; }
        }
      `}</style>

      <div className="about-page">
        <div className="about-bg" ref={mountRef} />
        <Navbar />
        <div className="about-content">

          <div className="mb-4 d-flex gap-3">
            <Link className="btn btn-top" to="/dashboard">← Dashboard</Link>
            <Link className="btn btn-top" to="/donors">Donor Network</Link>
          </div>


          <div className="carousel">
            {carouselImages.map((src,i)=>(
              <img key={i} src={src} className={i===carouselIndex?"active":""} />
            ))}
          </div>

          <div className="section">
            <h2>About {COMPANY_NAME}</h2>
            <p>
              <strong>{COMPANY_NAME}</strong> is a <em>technology-driven platform</em> that aims to transform the way blood donation, monitoring, and distribution are managed. In today’s fast-paced world, ensuring that safe blood reaches patients exactly when it is needed is not just a challenge—it is a matter of life and death. Our platform leverages <strong>real-time technology, data-driven insights, and community collaboration</strong> to bridge the gap between donors, hospitals, and patients. By combining these critical elements, we ensure efficiency, safety, and timely delivery of life-saving blood to those who need it most.
            </p>

            <p>
              The core philosophy of <strong>{COMPANY_NAME}</strong> revolves around making blood donation and management a seamless, transparent, and effective process. Here’s how we achieve this:
            </p>

            <ul>
              <li>
                <strong>Real-Time Donor Availability:</strong> <em>Instantly track available donors</em> within the system, ensuring that hospitals have access to immediate resources during emergencies. This feature allows for rapid mobilization of blood donors, reducing delays and saving lives in critical situations.
              </li>
              <li>
                <strong>Hospital Demand Tracking:</strong> <em>Monitor blood requirements across multiple hospitals</em> to efficiently allocate resources where they are needed most. This feature ensures that no hospital experiences shortages during emergencies or routine operations.
              </li>
              <li>
                <strong>Intelligent Alerts & Notifications:</strong> Our system sends <em>automated alerts to donors and hospitals</em> based on blood demand, donor eligibility, and emergency requirements. Timely notifications ensure proactive participation and prompt response during critical situations.
              </li>
              <li>
                <strong>Safe & Verified Donations:</strong> <em>Every donor undergoes screening and verification</em> before donating. This guarantees that the blood supply is safe and free from any risk of contamination or infection.
              </li>
              <li>
                <strong>Data-Driven Insights:</strong> By analyzing historical trends in blood usage and donation patterns, <em>{COMPANY_NAME}</em> provides actionable insights to hospitals and administrators. This enables better inventory management, predicts potential shortages, and optimizes logistics for blood distribution.
              </li>
              <li>
                <strong>Community Engagement:</strong> Our platform fosters a <em>culture of social responsibility and volunteering</em> by connecting donors, hospitals, and organizations. We encourage regular donations and community participation, helping build a sustainable and reliable blood donor network.
              </li>
              <li>
                <strong>Emergency Response:</strong> In critical scenarios such as accidents, surgeries, and natural disasters, <em>{COMPANY_NAME}</em> ensures rapid deployment of blood supplies. Our system prioritizes urgent cases, enabling quick access to the right blood type for patients in need.
              </li>
              <li>
                <strong>Transparency & Trust:</strong> <em>Real-time tracking, reporting, and verification mechanisms</em> allow both donors and hospitals to monitor the status of donations. This transparency builds trust and encourages continued participation from donors while ensuring hospitals have reliable information.
              </li>
            </ul>

            <p>
              Beyond technology, <strong>{COMPANY_NAME}</strong> is committed to creating a <em>human-centered approach</em> in the blood donation ecosystem. Donors are not just contributors—they are valued members of a lifesaving network. Our platform provides them with timely updates, educational resources, and reminders, helping them understand the impact of their contributions. Every donation is tracked, acknowledged, and appreciated, motivating donors to participate regularly and responsibly.
            </p>

            <p>
              Hospitals benefit from a <em>centralized and streamlined system</em> that reduces administrative burdens and enhances coordination. By integrating demand forecasting, donor availability, and emergency alerts into a single platform, <strong>{COMPANY_NAME}</strong> empowers hospitals to maintain optimal blood inventory levels and respond efficiently to patient needs. This ensures that no patient waits for blood when it is critical, significantly improving healthcare outcomes.
            </p>

            <p>
              Furthermore, the platform encourages <strong>educational initiatives</strong> and <em>awareness campaigns</em> about the importance of regular blood donation. By providing donors with clear guidelines, eligibility criteria, and benefits of donation, we build a knowledgeable community committed to saving lives. Awareness campaigns also help reduce misconceptions about blood donation, increasing participation and engagement in the long term.
            </p>

            <p>
              <strong>{COMPANY_NAME}</strong> also emphasizes <em>sustainability and scalability</em>. Our cloud-based infrastructure allows the platform to adapt to growing communities, integrate additional hospitals and blood banks, and manage increasing numbers of donors without compromising performance or security. This forward-thinking approach ensures that LifeFlow remains relevant and effective as healthcare demands evolve.
            </p>

            <p>
              In summary, <strong>{COMPANY_NAME}</strong> combines <em>advanced technology, real-time coordination, verified donor networks, data insights, and community engagement</em> to create a holistic blood monitoring and donation ecosystem. By connecting donors, hospitals, and patients efficiently, we ensure that every drop counts, every donor feels valued, and every patient receives life-saving blood exactly when it is needed.
            </p>

            <p>
              <em>LifeFlow Blood Monitoring System</em> is not just a platform—it is a commitment to <strong>saving lives, fostering trust, and building a resilient blood donation network</strong> for communities everywhere.
            </p>
          </div>

          <div className="section">
            <h2>Why Blood Donation Matters</h2>
            <p>
              <strong>Blood is a precious, irreplaceable resource</strong>—it cannot be manufactured in a lab and is entirely dependent on generous donors. Every donation has the potential to save multiple lives and plays a vital role in modern healthcare. The impact of donating blood extends far beyond the immediate act; it contributes to the survival, recovery, and well-being of patients in various critical situations.
            </p>

            <p>
              Here’s why blood donation is crucial:
            </p>

            <ul>
              <li>
                <strong>Emergency Surgeries:</strong> <em>Trauma cases, accidents, and urgent surgeries</em> often require immediate blood transfusions. A single donation can support life-saving procedures for multiple patients in need.
              </li>
              <li>
                <strong>Trauma Care:</strong> Patients suffering from severe injuries or accidents rely on a readily available blood supply. Your donation ensures hospitals can respond instantly to emergencies.
              </li>
              <li>
                <strong>Cancer Treatments:</strong> <em>Chemotherapy and other cancer therapies</em> often reduce blood cell counts, making transfusions necessary to sustain patient health and energy levels.
              </li>
              <li>
                <strong>Maternity Care:</strong> Mothers facing complications during childbirth may require blood transfusions. Regular donations guarantee safety and reduce maternal mortality rates.
              </li>
              <li>
                <strong>Chronic Illness Management:</strong> Patients with anemia, hemophilia, or other chronic conditions frequently need blood support to maintain their quality of life.
              </li>
              <li>
                <strong>Community Health:</strong> Blood donation strengthens local healthcare networks and ensures that blood is available during disasters, epidemics, or seasonal shortages.
              </li>
            </ul>

            <p>
              Beyond saving lives, <strong>donating blood fosters a sense of community and social responsibility</strong>. It encourages a culture of generosity, awareness, and preparedness. Regular donors not only help meet immediate needs but also create a stable and reliable blood supply for the entire community.
            </p>

            <p>
              Additionally, blood donation has <em>personal health benefits</em>. It can stimulate blood cell production, improve cardiovascular health, and provide donors with regular health check-ups. Each donation is a small act with a significant ripple effect—impacting patients, families, and the healthcare system as a whole.
            </p>

            <p>
              <strong>Every unit counts.</strong> Your contribution could save up to three lives, assist in critical medical treatments, and provide hope in urgent situations. By donating blood, you become an essential part of a lifesaving chain that spans hospitals, donors, and patients.
            </p>

            <div className="image-strip">
              <img src={imageUrl1} />
              <img src={imageUrl2} />
              <img src={imageUrl3} />
              <img src={imageUrl1} />
              <img src={imageUrl2} />
            </div>
          </div>


          <div className="section">
            <h2>Benefits & Responsibilities of Donation</h2>
            <p>
              Donating blood is not only a selfless act that saves lives, but it also comes with several <strong>health benefits and responsibilities</strong> for donors. Understanding these aspects ensures a safe and rewarding experience for everyone involved.
            </p>

            <p>
              <strong>Pros:</strong>
            </p>
            <ul>
              <li><strong>Saves Lives:</strong> Each donation can potentially help multiple patients, from trauma victims to those undergoing surgeries, cancer treatments, or chronic illness management.</li>
              <li><strong>Improves Cardiovascular Health:</strong> Regular donations can help reduce excess iron in the blood, which may improve heart health and reduce the risk of cardiovascular diseases.</li>
              <li><strong>Provides Free Health Screening:</strong> Every donor undergoes a brief health check before donating, helping to detect potential health issues such as anemia or blood pressure irregularities.</li>
              <li><strong>Builds Community Responsibility:</strong> Donating blood fosters a culture of compassion, volunteerism, and social responsibility, inspiring others to participate in lifesaving efforts.</li>
            </ul>

            <p>
              <strong>Considerations:</strong>
            </p>
            <ul>
              <li><em>Temporary Fatigue or Dizziness:</em> After donation, some donors may experience mild weakness or lightheadedness. This is normal and temporary.</li>
              <li><em>Post-Donation Care:</em> It is important to rest, stay hydrated, and follow recommended nutrition to recover quickly.</li>
              <li><em>Eligibility Criteria:</em> Donors should meet basic health standards, such as being in good health, aged 18–65, and having a minimum weight of around 50kg, to ensure both donor and recipient safety.</li>
              <li><em>Regular Monitoring:</em> Our system tracks donation frequency to ensure safe intervals between donations and prevent donor fatigue or iron depletion.</li>
            </ul>

            <p>
              By understanding the <strong>benefits and responsibilities</strong> of blood donation, donors not only contribute to saving lives but also maintain their own well-being. <em>Every donation counts, and every donor plays a vital role in building a safe, reliable, and compassionate blood network.</em>
            </p>
          </div>


          <div className="highlight">
            <h2>First-Time Lifetime Donor Appreciation</h2>
            <p>
              To honor your first lifetime donation, we provide a special appreciation gift along
              with fresh fruits and an energy drink to help your body recover quickly. Your first
              donation marks the beginning of a lifelong impact.
            </p>
          </div>

          <div className="section">
            <h2>Our Impact So Far</h2>
            <div className="image-strip">
              <img src={imageUrl4} />
              <img src={imageUrl5} />
              <img src={imageUrl6} />
              <img src={imageUrl4} />
              <img src={imageUrl5} />
              
            </div>
          </div>

          <div className="section">
            <h2>Join the Lifesaving Network</h2>
            <p>
              By becoming a regular donor with {COMPANY_NAME}, you join a trusted network committed
              to reliability, safety, and transparency. Together, we are building a future where no
              patient suffers due to lack of blood.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
