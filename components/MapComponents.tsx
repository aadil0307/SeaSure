// Platform-specific map components resolver
import { Platform } from 'react-native';

// Web-compatible map components
const WebMapView = require('./MapComponent.web').default;
const WebMarker = require('react-native').View;
const WebPolygon = require('react-native').View;
const WebCircle = require('react-native').View;

// Export platform-specific components
export const MapView = Platform.OS === 'web' ? WebMapView : require('react-native-maps').default;
export const Marker = Platform.OS === 'web' ? WebMarker : require('react-native-maps').Marker;
export const Polygon = Platform.OS === 'web' ? WebPolygon : require('react-native-maps').Polygon;
export const Circle = Platform.OS === 'web' ? WebCircle : require('react-native-maps').Circle;