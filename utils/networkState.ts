import { useState, useEffect } from 'react'

// Simple network state hook for basic connectivity detection
export const useNetworkState = () => {
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    // Basic connectivity check
    const checkConnectivity = async () => {
      try {
        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
        })
        setIsConnected(response.ok)
      } catch (error) {
        setIsConnected(false)
      }
    }

    // Check immediately
    checkConnectivity()

    // Check every 30 seconds
    const interval = setInterval(checkConnectivity, 30000)

    return () => clearInterval(interval)
  }, [])

  const refreshNetworkState = async () => {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      })
      setIsConnected(response.ok)
      return response.ok
    } catch (error) {
      setIsConnected(false)
      return false
    }
  }

  return {
    isConnected,
    refreshNetworkState
  }
}