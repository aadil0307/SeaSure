# 🌊 SeaSure Pro - Coastal Fishing Safety App

<div align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.81-blue?style=for-the-badge&logo=react" alt="React Native"/>
  <img src="https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo" alt="Expo"/>
  <img src="https://img.shields.io/badge/Firebase-12.2-orange?style=for-the-badge&logo=firebase" alt="Firebase"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
</div>

<div align="center">
  <h3>🎥 <a href="https://drive.google.com/file/d/1YW183jX3cA040SeZIpAeTTINPKUK8PgJ/view?usp=drive_link">Watch Demo Video</a></h3>
</div>

---

## 📱 About SeaSure Pro

**SeaSure Pro** is a comprehensive mobile application designed specifically for coastal fishermen in India. It provides real-time weather updates, maritime boundary alerts, AI-powered fish recognition, and critical safety features to ensure safe and productive fishing expeditions.

Built with React Native and Expo, SeaSure Pro integrates multiple data sources including OpenWeather API, Google Maps, INCOIS (Indian National Centre for Ocean Information Services), and Firebase for a seamless fishing experience.

---

## ✨ Key Features

### 🗺️ **Interactive Maritime Map**
- Real-time GPS tracking with Google Maps integration
- Indian coastal zone boundaries (EEZ visualization)
- PFZ (Potential Fishing Zones) overlay with sector-wise data
- 400+ landing centres across Indian coastline
- Nearest port/landing centre finder
- Multi-layer map controls (Sectors, PFZ Lines, Landing Centres)

### 🌤️ **Marine Weather Intelligence**
- Real-time weather conditions for fishing locations
- Wind speed, direction, and wave height monitoring
- Visibility tracking for safe navigation
- UV index and barometric pressure data
- Smart fishing insights with AI-powered recommendations
- "DO NOT GO FISHING" warnings for dangerous conditions
- 5-day weather forecasts

### 🐟 **AI Fish Recognition**
- Camera-based fish species identification
- Comprehensive fish database (CMFRI data)
- Species information including local names
- Market value estimation
- Season and habitat information
- Manual species selection fallback

### 📊 **Smart Trip Planner**
- AI-powered trip optimization
- Weather-based trip suggestions
- Quick trip ideas (Morning Pomfret Run, etc.)
- Expected catch predictions
- Success rate percentage
- Distance and duration estimates

### 📖 **Digital Fishing Logbook**
- Track all catches with weight and species
- Auto-sync when online
- Trip statistics and summaries
- Historical catch data
- Photo documentation support

### 🚨 **Emergency SOS System**
- One-tap emergency alert
- Automatic GPS location sharing
- Call 112 (Indian Coast Guard) integration
- Share location via multiple platforms
- Emergency contact management
- Real-time location accuracy display

### 🔔 **Maritime Alert System**
- Boundary violation warnings with loud alarms
- Progressive alert system (warning → violation)
- Weather-based fishing warnings
- Regulatory compliance alerts
- Multi-zone boundary monitoring
- Demo mode for testing alerts

### 👤 **User Profile & Stats**
- Personalized fisher profiles
- Experience tracking (years at sea)
- Total catches and weight statistics
- Verified fisher badge system
- Profile photo management

### 🌍 **Multi-Language Support**
Supports 6 Indian languages:
- 🇬🇧 English
- 🇮🇳 Hindi (हिंदी)
- 🇮🇳 Tamil (தமிழ்)
- 🇮🇳 Telugu (తెలుగు)
- 🇮🇳 Marathi (मराठी)
- 🇮🇳 Bengali (বাংলা)

---

## � Screenshots

<div align="center">

### User Profile & Stats
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/profile.jpg" width="250" alt="User Profile"/>

*Personalized fisher profile with experience tracking and catch statistics*

---

### Interactive Maritime Map
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/map-main.jpg" width="250" alt="Main Map"/>
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/map-pfz.jpg" width="250" alt="PFZ Map"/>
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/map-landing.jpg" width="250" alt="Landing Centre"/>

*Maritime boundaries, PFZ zones, and 400+ landing centres across India*

---

### Marine Weather & Insights
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/weather-main.jpg" width="250" alt="Weather Main"/>
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/weather-insights.jpg" width="250" alt="Weather Insights"/>
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/weather-warning.jpg" width="250" alt="Weather Warning"/>

*Real-time marine weather with AI-powered fishing insights and safety warnings*

---

### Smart Trip Planner
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/trip-planner.jpg" width="250" alt="Trip Planner"/>

*AI-powered trip optimization with weather-based suggestions*

---

### Emergency SOS & Alerts
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/sos-emergency.jpg" width="250" alt="SOS Emergency"/>
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/alerts.jpg" width="250" alt="Alerts"/>
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/judge-demo.jpg" width="250" alt="Demo Mode"/>

*One-tap emergency alerts with GPS location sharing and boundary violation warnings*

---

### Digital Logbook
<img src="https://github.com/aadil0307/SeaSure/assets/screenshots/logbook.jpg" width="250" alt="Logbook"/>

*Track catches with AI fish recognition and automatic sync*

</div>

---

## �🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/aadil0307/SeaSure.git
cd SeaSure
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Environment Variables**
Create a `.env` file in the root directory (use `.env.example` as template):
```env
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
# ... (see .env.example for all variables)
```

4. **Start the development server**
```bash
npx expo start
```

5. **Run on your device**
- Scan the QR code with Expo Go app (Android/iOS)
- Or press `a` for Android emulator
- Or press `i` for iOS simulator
- Or press `w` for web browser

## 📋 Configuration

### Firebase Setup (Already Configured ✅)

Firebase is configured for authentication and data storage. If you need to change the Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Get your Firebase config from Project Settings
3. Update `.env` file with new credentials

### API Keys Configured

| Service | Status | Purpose |
|---------|--------|---------|
| Firebase | ✅ Configured | Authentication & Database |
| Google Maps | ✅ Configured | Map display and location |
| OpenWeather | ✅ Configured | Weather data |
| INCOIS | ✅ Configured | Indian Ocean data |

## 📁 Project Structure

```
SeaSure/
├── app/                    # Next.js app directory (web)
├── components/             # Reusable React components
│   ├── FishCamera.tsx     # Fish recognition camera
│   ├── MapComponent.tsx   # Map display
│   └── LanguageSelector.tsx
├── screens/               # App screens
│   ├── LoginScreen.tsx
│   ├── MapScreen.tsx
│   ├── WeatherScreen.tsx
│   ├── FishRecognitionScreen.tsx
│   └── ...
├── services/              # Business logic & API calls
│   ├── firebase.ts       # Firebase initialization
│   ├── weather.ts        # Weather service
│   ├── fishRecognition.ts
│   └── location.ts
├── config/               # Configuration files
│   └── index.ts
├── i18n/                 # Internationalization
│   └── locales/         # Translation files
├── data/                 # Static data
│   ├── fishDatabase.ts
│   └── zones.ts
└── .env                  # Environment variables

```

---

## 🎯 Core Technologies

### Frontend
- **React Native 0.81** - Cross-platform mobile development
- **Expo 54.0** - Development framework and tooling
- **TypeScript** - Type-safe code
- **React Navigation** - Seamless navigation

### Backend & Services
- **Firebase 12.2** - Authentication & Firestore database
- **Google Maps API** - Interactive maps and location services
- **OpenWeather API** - Real-time weather data
- **INCOIS API** - Indian Ocean marine data (PFZ, landing centres)

### Key Libraries
- `react-native-maps` - Native map components
- `expo-location` - GPS and location tracking
- `expo-camera` - Fish recognition camera
- `i18next` - Multi-language support
- `@react-native-async-storage/async-storage` - Local data persistence
- `expo-notifications` - Push notification system

---

## 🗂️ Project Structure

```
SeaSure/
├── 📱 App.tsx                   # Main app entry point
├── 🎨 components/               # Reusable UI components
│   ├── FishCamera.tsx          # Fish recognition camera
│   ├── MapComponent.tsx        # Interactive map
│   ├── SOSButton.tsx           # Emergency SOS button
│   └── LanguageSelector.tsx    # Multi-language switcher
├── 📺 screens/                  # App screens
│   ├── MapScreen.tsx           # Maritime map with zones
│   ├── WeatherScreen.tsx       # Marine weather display
│   ├── FishRecognitionScreen.tsx
│   ├── TripPlannerScreen.tsx   # AI trip planner
│   ├── LogbookScreen.tsx       # Fishing logbook
│   ├── AlertsScreen.tsx        # Notification center
│   └── UserProfileScreen.tsx   # Fisher profile
├── ⚙️ services/                 # Business logic & APIs
│   ├── firebase.ts             # Firebase configuration
│   ├── weather.ts              # Weather service
│   ├── fishRecognition.ts      # AI fish detection
│   ├── location.ts             # GPS tracking
│   ├── maritimeBoundary.ts     # Boundary monitoring
│   ├── emergencyService.ts     # SOS system
│   └── notificationService.ts  # Alert system
├── 🗄️ data/                     # Static data & databases
│   ├── fishDatabase.ts         # CMFRI fish species data
│   ├── productionMaritimeZones.ts # Indian EEZ boundaries
│   └── zones.ts                # Coastal zones
├── 🌍 i18n/                     # Internationalization
│   └── locales/                # Translation files (6 languages)
├── 🎨 theme/                    # Design system
│   └── colors.ts               # Color palette
└── 📋 config/                   # Configuration
    └── index.ts                # Environment config
```

---

## 🔧 Available Scripts

```bash
# Start development server
npm start

# Start with cleared cache (recommended after env changes)
npx expo start -c

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web

# Build for production
expo build:android
expo build:ios
```

## 🌍 Multi-language Support

The app supports 6 languages:
- 🇬🇧 English
- 🇮🇳 Hindi (हिंदी)
- 🇮🇳 Tamil (தமிழ்)
- 🇮🇳 Telugu (తెలుగు)
- 🇮🇳 Marathi (मराठी)
- 🇮🇳 Bengali (বাংলা)

Language files are located in `i18n/locales/`

## 🔒 Security

- Environment variables are stored in `.env` (not committed to git)
- Firebase security rules should be configured in Firebase Console
- API keys have domain restrictions enabled

## 🆘 Troubleshooting

### Firebase Error
If you see `auth/invalid-api-key`:
1. Check `.env` file has valid Firebase credentials
2. Restart dev server: `npx expo start -c`

### Map Not Loading
- Verify Google Maps API key in `.env`
- Enable Maps SDK in Google Cloud Console

### Weather Data Issues
- Check OpenWeather API key
- Verify API quota hasn't been exceeded

## 📦 Key Dependencies

- **expo** - React Native framework
- **firebase** - Authentication & database
- **react-navigation** - Navigation
- **react-native-maps** - Map display
- **i18next** - Internationalization
- **expo-location** - GPS tracking
- **expo-camera** - Fish recognition

---

## 🎥 Demo Video

**🎬 Full App Demonstration:** [Watch on Google Drive](https://drive.google.com/file/d/1YW183jX3cA040SeZIpAeTTINPKUK8PgJ/view?usp=drive_link)

The demo video showcases:
- ✅ User authentication and profile management
- ✅ Real-time maritime map with PFZ zones
- ✅ Weather monitoring and fishing insights
- ✅ Emergency SOS system in action
- ✅ Boundary alert demonstrations
- ✅ AI fish recognition and logbook
- ✅ Multi-language interface
- ✅ Trip planning features

---

## 🔒 Security & Privacy

- **Environment Variables:** All API keys stored securely in `.env` (not committed)
- **Firebase Security:** Rules configured for authenticated users only
- **Location Privacy:** GPS data only shared during emergencies
- **Data Encryption:** All network requests use HTTPS
- **Offline Support:** Critical features work without internet

---

## 🌟 Unique Features

### What Makes SeaSure Pro Special?

1. **India-Specific Data Integration**
   - INCOIS PFZ data for Indian Ocean
   - 400+ Indian landing centres
   - State-wise coastal zone boundaries
   - Regional fish species database (CMFRI)

2. **Fisherman-Centric Design**
   - Simple, intuitive interface for all age groups
   - Multi-language support for coastal communities
   - Offline mode for areas with poor connectivity
   - Voice-based alerts for critical warnings

3. **AI-Powered Intelligence**
   - Smart trip suggestions based on weather
   - Fish species auto-detection
   - Fishing condition analysis
   - Success rate predictions

4. **Safety First Approach**
   - Real-time boundary monitoring
   - Progressive alert system (warning → alarm)
   - One-tap emergency response
   - Automatic location sharing with coast guard

---

## 🗺️ Roadmap

### Phase 1 - Current (v1.0) ✅
- ✅ Core map and weather features
- ✅ Emergency SOS system
- ✅ Basic fish recognition
- ✅ Multi-language support

### Phase 2 - Upcoming (v1.5)
- 🔄 Offline map caching
- � Community fishing reports
- 🔄 Tide predictions
- 🔄 Fuel price tracking

### Phase 3 - Future (v2.0)
- 📋 Fish market price integration
- 📋 Insurance claim assistance
- 📋 License renewal reminders
- 📋 Weather-based loan recommendations

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the repository**
2. **Create your feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines
- Follow the existing code style (TypeScript, ESLint)
- Write meaningful commit messages
- Update documentation for new features
- Test on both Android and iOS before submitting

---

## 👨‍💻 Developer

**Mohd Aadil Shaikh**
- Email: aadils1811@gmail.com
- GitHub: [@aadil0307](https://github.com/aadil0307)

---

## 🙏 Acknowledgments

Special thanks to:
- **CMFRI** (Central Marine Fisheries Research Institute) for fish species data
- **INCOIS** (Indian National Centre for Ocean Information Services) for marine data
- **OpenWeather** for weather API
- **Google Maps** for mapping services
- **Firebase** for backend infrastructure

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Feedback

For issues, questions, or feature requests:

- 🐛 **Bug Reports:** [Open an issue](https://github.com/aadil0307/SeaSure/issues)
- 💡 **Feature Requests:** [Start a discussion](https://github.com/aadil0307/SeaSure/discussions)
- 📧 **Email:** aadils1811@gmail.com

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ for Indian Fishermen**

**Version:** 1.0.0 | **Last Updated:** October 31, 2025 | **Status:** ✅ Production Ready

[🎥 Watch Demo](https://drive.google.com/file/d/1YW183jX3cA040SeZIpAeTTINPKUK8PgJ/view?usp=drive_link) • [📱 Download APK](#) • [🌐 Visit Website](#)

</div>
