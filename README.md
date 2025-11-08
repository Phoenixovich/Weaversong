# Weaversong

## Andrei's branch

# 🏡 NeighborHelpboard  
**Micro-Help in Your Building / Street**

## 📖 Overview  
**NeighborHelpboard** is a hyper-local help board that connects neighbors who need or offer small favors — like carrying groceries, borrowing tools, or fixing something.  
It encourages real-life cooperation and builds stronger, friendlier communities within apartment buildings or streets.

## ✨ Features  
- 🧾 Post small help requests or offers  
- 🤝 Respond to nearby requests  
- 📍 Filter by building, street, or distance  
- 🔔 Get notifications when someone nearby needs help  
- 💬 Lightweight chat or confirmation system  
- 🏅 Optional trust and thank-you badges  

## 👥 Target Users  
- Apartment residents  
- Elderly people needing small assistance  
- Students and young professionals  
- Anyone who wants to help or connect locally  

## 🚀 Future Ideas  
- 🗺️ Map view of nearby requests  
- 🎙️ Voice posts for accessibility  
- 🏆 Neighborhood leaderboard for active helpers

## Sofiia's branch

# 🏙️ CityPulse  
**Local Alerts & Community Awareness**

## 📖 Overview  
**CityPulse** is a real-time alert board that helps residents stay aware of what’s happening in their neighborhood - from lost pets and local events to safety notices and weather alerts.  
It provides both **list** and **map** visualizations, making it easy to understand what’s happening right around you.

All alerts are **publicly viewable** without login, ensuring accessibility.  
Users only need to sign in when they want to **post** or contribute alerts, helping keep information responsible and trustworthy.

## ✨ Features  
- 📝 Create alerts quickly via:
  - Simple form input  
  - Free-text description  
  - **Voice recording** (for accessibility or convenience)
- 📃 **Two Display Modes**
  - List View - compact browsing  
  - Map View - alerts shown by location  
- 🎚️ Filter alerts by **sector** and **priority level**
- 🔄 Real-time updates for immediate local awareness

## 📌 Example Alerts  
| Category | Examples |
|---|---|
| 🐕 Lost & Found | Lost pet, missing items |
| 🔒 Safety Notice | Suspicious activity, break-ins, street hazards |
| 🌧️ Weather & Environment | Storm warnings, flooding, icy roads |
| 🎉 Community Announcements | Local meetups, building notices, events |

## 🔑 Access Rules  
| Action | Login Required? |
|-------|:----------------:|
| View alerts | No |
| Use filters / map | No |
| Create or post alert | **Yes** |
| Submit voice alert | **Yes** |

## 🚀 Future Ideas  
- 📬 Subscribe to alerts in your area  
- 🎤 AI-generated text summary from voice input  
- 🛡️ Community moderation badges for trusted reporters

## Lucas's branch 

# 🌐 Community Service Hub  
**Unified Access to Public Services and Information**

## 📖 Overview  
**Community Service Hub** is an all-in-one platform that connects Romanian citizens with essential public services in a simple, accessible way.  
Built with **React**, **FastAPI**, and **MongoDB**, it brings together authentication, AI-driven document simplification, and open government data — helping users better understand and navigate healthcare, legal, and social systems.

All users can **explore open data and view insights** freely.  
Login is only required for **personalized services**, such as saving reminders or accessing protected dashboards.

---

## ✨ Services  

### 🔐 **Authentication Service**  
A secure, fast, and reliable login system:  
- User registration and JWT-based authentication  
- Encrypted passwords using bcrypt  
- Token refresh and session management  
- Protected routes for personalized experiences  

---

### 🤖 **ClarifAI Service**  
Turn complex information into simple, everyday language.  
ClarifAI helps users understand critical documents:  
- **Medical Documents**: Simplifies doctor notes and discharge summaries  
- **Legal Documents**: Explains contracts and government forms in plain terms  

**Features:**  
- Accepts text, PDFs, or images (with OCR support)  
- Powered by **Gemini AI models** (`gemini-2.5-pro`, `gemini-2.5-flash-lite`, `gemini-2.5-flash`)  
- Multiple output styles: *default*, *shorter*, *“explain like I’m 5”*  
- Built-in reminder system to save key information  
- Markdown-formatted, clear responses  

---

### 📊 **Public Data Hub**  
Access and interpret open Romanian government data effortlessly.  
- Live dashboards powered by **data.gov.ro API**  
- **Social Aid Helper**: Simplified info on benefits, eligibility, and how to apply  
- **Data Explorer**: AI-assisted insights and statistics from official datasets  

**Supports:**  
- CSV, JSON, Excel (XLS/XLSX), and ZIP archives  
- Automatic extraction and parsing  
- Aggregated summaries using Gemini AI  

---

## 🚀 Future Ideas  
- 📬 Personalized “My Services” dashboard showing relevant public programs  
- 🗣️ AI voice assistant for reading simplified documents aloud  
- 🕵️ Transparency tracker: monitor how public funds are spent locally  
- 🤝 Community-driven “Help Desk” for sharing citizen knowledge  
- 🌍 Integration with EU-level datasets (Eurostat, data.europa.eu)  
- 🧩 Mobile app for quick document uploads and summaries on the go
