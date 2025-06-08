# 📍 PingMe – Smart Travel Alert App

> **Track your destination, relax your mind. PingMe takes care of the alerts.**  
> Powered by voice calls using Twilio and GPS with Google Maps.  
> Built entirely in **React Native using Expo SDK 53+**.

---

## 🧠 What is PingMe?

PingMe is a **location-based travel assistant** that tracks your live location and automatically alerts you via a **Twilio voice call** as you approach your destination.

Whether you're on a bus, train, or car ride — you won’t miss your stop again.

---

## ✨ Key Features

- 🗺️ **Live GPS tracking** (with Google Maps)
- 🔍 **Search and set destination** via Google Places API
- 🎯 **Trip-specific options**:
  - Personalized reminder message
  - Voice call on reaching destination
  - Call a friend/parent before arrival
- 📞 **Voice call alerts** via Twilio (no SMS needed)
- 🎒 **Reminder list** (e.g. "Don’t forget your bag")
- 🧠 **Auto-call prevention** if already made once
- 💾 All data stored in **AsyncStorage** (no backend)

---

## 📸 Screenshots

> Add these later (suggested):
- Home screen with map + trip plan button
- Destination selection
- Trip planning screen with reminders
- Settings screen with Twilio inputs
- Call success screen or alert preview

---

## 🔧 Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pingme-app.git
cd pingme-app

### 2. Install Dependencies
bash
Copy
Edit
npm install
or

bash
Copy
Edit
yarn install
🔑 Google Maps API Setup
PingMe uses Google Maps and Places API for maps + destination search.

🔹 Step 1: Get your API Key
Follow this guide:
➡️ https://developers.google.com/maps/documentation/javascript/get-api-key

Enable:

Maps SDK for Android

Places API

🔹 Step 2: Save the Key in keys.js
Create a new file keys.js at the root of the project:

js
Copy
Edit
export const GOOGLE_MAPS_API_KEY = "YOUR_API_KEY_HERE";
🔹 Step 3: Add it to app.json
In your app.json:

json
Copy
Edit
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_API_KEY_HERE"
    }
  }
}
Without this, the app will crash or maps will be blank.

🔐 Twilio Setup (User Controlled)
This app uses Twilio directly from the app. No backend needed.

In Settings screen, you must enter:

✅ Twilio Account SID

✅ Twilio Auth Token

✅ Your Twilio verified number

You must verify the recipient number via Twilio Console.

▶️ Running the App (Expo)
bash
Copy
Edit
npx expo start
⚠️ Voice calling and some GPS features won’t work inside Expo Go.
You must use a real .apk build to test everything.

🏗️ Building APK (using EAS)
1. Login to EAS
bash
Copy
Edit
eas login
2. Confirm eas.json
json
Copy
Edit
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
3. Build the app
bash
Copy
Edit
eas build --platform android --profile production
After build completes, download the .apk and install on your phone.

📂 Project Structure
bash
Copy
Edit
pingme-app/
├── App.js
├── app.json
├── keys.js                # Your Google Maps API Key
├── /screens
│   ├── HomeScreen.js
│   ├── PlanTripScreen.js
│   ├── SettingsScreen.js
│   └── LoginScreen.js
├── /services
│   ├── locationServices.js
│   └── twilioServices.js
├── /components
│   └── AppAlert.js
├── /context
│   └── UserContext.js
└── eas.json
✅ Required Permissions
In app.json:

json
Copy
Edit
"android": {
  "permissions": [
    "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION",
    "FOREGROUND_SERVICE",
    "POST_NOTIFICATIONS"
  ]
}
🧪 Troubleshooting
Issue	Fix
Blank map	Ensure correct Google Maps API key in keys.js and app.json
App crashes on trip start	Avoid using expo-task-manager, use watchPositionAsync
Twilio call fails	Check if your Auth Token, SID, and verified number are correct
Push notifications don’t show	expo-notifications is disabled in Expo Go — test in .apk

🙏 Credits
💻 Built with React Native + Expo

📞 Call powered by Twilio Voice API

🗺️ Maps &amp; Directions from Google Maps SDK

🛡️ License
MIT License © 2025 Sanket Gadhe
Feel free to fork and modify. Star the repo ⭐ if it helped you!

🧠 Final Tips
You can disable voice call and only show local alerts if needed.

Always test trip alerts with real location movement (or simulate GPS).

Want to add Firebase Analytics or FCM? Ask in Issues tab.

Built with ❤️ by @sanketgadhe
“PingMe before the chaos begins.”

