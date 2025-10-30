import { Platform } from 'react-native'
import MapScreenSimple from './MapScreenSimple'

// Platform-specific component import - enabling full featured map with landing centres
const MapScreenComponent = Platform.OS === 'web' 
  ? require('./MapScreen.web').default
  : require('./MapScreen.native').default

export default MapScreenComponent

// Simple version for testing (commented out)
// export default MapScreenSimple
