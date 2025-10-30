import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native"
import { Button, Card, SectionTitle, Badge } from "../components/ui"
import { alertStorage, StoredAlert } from "../services/alertStorage"
import { theme } from "../theme/colors"
import { Ionicons } from "@expo/vector-icons"

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<StoredAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'demo' | 'real'>('all')

  const loadAlerts = async () => {
    setLoading(true)
    try {
      // Get alerts based on current filter
      let filteredAlerts: StoredAlert[];
      switch (filter) {
        case 'unread':
          filteredAlerts = alertStorage.getAlerts({ isRead: false });
          break;
        case 'demo':
          filteredAlerts = alertStorage.getAlerts({ source: ['demo', 'boundary_system'] });
          break;
        case 'real':
          filteredAlerts = alertStorage.getAlerts({ source: ['real'] });
          break;
        default:
          filteredAlerts = alertStorage.getAlerts();
      }
      setAlerts(filteredAlerts);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial load
    loadAlerts()
    
    // Listen for alert updates
    const unsubscribe = alertStorage.addListener((updatedAlerts) => {
      loadAlerts() // Refresh when alerts change
    });

    return unsubscribe;
  }, [filter])

  const markAsRead = async (alertId: string) => {
    await alertStorage.markAsRead(alertId)
    // loadAlerts will be called automatically via listener
  }

  const markAllAsRead = async () => {
    await alertStorage.markAllAsRead()
    // loadAlerts will be called automatically via listener
  }

  const clearAllAlerts = async () => {
    await alertStorage.clearAllAlerts()
    // loadAlerts will be called automatically via listener
  }

  const getAlertIcon = (type: string, priority: string) => {
    const icons: Record<string, string> = {
      emergency: 'alert-circle',
      boundary: 'warning',
      weather: 'cloud-circle',
      fishing: 'fish',
      regulatory: 'document-text',
      demo: 'play-circle'
    };
    return icons[type] || 'information-circle';
  }

  const getAlertColor = (priority: string, source: string) => {
    if (source === 'demo') return '#6366f1'; // Purple for demo
    
    const colors: Record<string, string> = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#d97706',
      low: '#65a30d'
    };
    return colors[priority] || '#6b7280';
  }

  const getPriorityBadgeVariant = (priority: string): "danger" | "warning" | "success" => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high':
      case 'medium': return 'warning';
      default: return 'success';
    }
  }

  const stats = alertStorage.getStatistics();

  const renderAlert = ({ item }: { item: StoredAlert }) => (
    <Card style={!item.isRead ? {...styles.alertCard, ...styles.unreadCard} : styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={styles.alertTitleRow}>
          <Ionicons 
            name={getAlertIcon(item.type, item.priority) as any} 
            size={20} 
            color={getAlertColor(item.priority, item.source)}
            style={styles.alertIcon}
          />
          <Text style={[styles.alertTitle, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
        </View>
        <View style={styles.badgeContainer}>
          {!item.isRead && <Badge text="New" variant={getPriorityBadgeVariant(item.priority)} />}
          {item.source === 'demo' && <Badge text="Demo" variant="success" />}
        </View>
      </View>
      
      <Text style={styles.alertMeta}>
        {new Date(item.timestamp).toLocaleString()} • {item.type} • {item.priority}
        {item.source === 'boundary_system' && ' • Boundary System'}
      </Text>
      
      <Text style={styles.alertMessage}>{item.message}</Text>
      
      {item.location && (
        <Text style={styles.locationText}>
          📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
        </Text>
      )}
      
      {!item.isRead && (
        <TouchableOpacity 
          style={styles.markReadButton}
          onPress={() => markAsRead(item.id)}
        >
          <Text style={styles.markReadText}>Mark as Read</Text>
        </TouchableOpacity>
      )}
    </Card>
  )

  const renderFilterButton = (filterType: typeof filter, label: string, count?: number) => (
    <TouchableOpacity 
      style={[styles.filterButton, filter === filterType && styles.activeFilterButton]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[styles.filterText, filter === filterType && styles.activeFilterText]}>
        {label} {count !== undefined && `(${count})`}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <SectionTitle>Maritime Alerts</SectionTitle>
      
      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Total: {stats.total} | Unread: {stats.unread} | Demo: {stats.bySource.demo || 0} | Real: {stats.bySource.real || 0}
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', stats.total)}
        {renderFilterButton('unread', 'Unread', stats.unread)}
        {renderFilterButton('demo', 'Demo', (stats.bySource.demo || 0) + (stats.bySource.boundary_system || 0))}
        {renderFilterButton('real', 'Real', stats.bySource.real)}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button 
          title="Mark All Read" 
          variant="ghost" 
          onPress={markAllAsRead}
          style={styles.actionButton}
        />
        <Button 
          title="Clear All" 
          variant="ghost" 
          onPress={clearAllAlerts}
          style={styles.actionButton}
        />
      </View>
      
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No alerts to display</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'demo' ? 'Trigger alerts from the Judge Demo panel to see them here' : 
               filter === 'real' ? 'Real alerts will appear here in production mode' :
               'No alerts found'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadAlerts} />
        }
        contentContainerStyle={alerts.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#FFFFFF" },
  title: { fontSize: 16, fontWeight: "700", color: theme.fg },
  meta: { color: "#475569", marginTop: 4 },
  
  // New styles for enhanced alerts screen
  statsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: theme.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeFilterText: {
    color: 'white',
  },
  
  actionContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  
  alertCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
  },
  unreadCard: {
    borderLeftColor: theme.primary,
    backgroundColor: '#fefefe',
  },
  
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIcon: {
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  
  alertMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  alertMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  
  markReadButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  markReadText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
})
