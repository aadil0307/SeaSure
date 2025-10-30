# 🌊 SeaSure Pro - Coastal Fishing Safety App

A comprehensive mobile application for coastal fishermen, providing real-time weather updates, maritime boundary alerts, fish recognition, and safety features.

## 📱 Features

- **Weather Monitoring** - Real-time weather data from OpenWeather API
- **Maritime Boundaries** - GPS-based boundary alerts and zone tracking
- **Fish Recognition** - AI-powered fish species identification
- **SOS Emergency** - Quick emergency alert system
- **Trip Planner** - Plan fishing trips with weather forecasts
- **Logbook** - Track catches and fishing activities
- **Multi-language Support** - English, Hindi, Tamil, Telugu, Marathi, Bengali
- **Offline Mode** - Core features work without internet

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. **Clone the repository**
```bash
cd SeaSure
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Environment Variables**
The `.env` file is already configured with:
- ✅ Firebase credentials
- ✅ Google Maps API key
- ✅ OpenWeather API key
- ✅ INCOIS endpoints

4. **Start the development server**
```bash
npx expo start
```

5. **Run on your device**
- Scan the QR code with Expo Go app (Android/iOS)
- Or press `a` for Android emulator
- Or press `i` for iOS simulator

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

## 🔧 Available Scripts

```bash
# Start development server
npm start

# Start with cleared cache
npx expo start -c

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 📞 Support

For issues and questions:
- Check troubleshooting section above
- Review Firebase and API configurations
- Ensure all environment variables are set correctly

---

**Version:** 1.0.0  
**Last Updated:** October 31, 2025  
**Status:** ✅ Ready for Development
