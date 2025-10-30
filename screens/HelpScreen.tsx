import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnhancedCard, ModernButton, ProfessionalBadge } from '../components/modernUI';
import { theme } from '../theme/colors';

interface HelpSection {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  content: HelpItem[];
}

interface HelpItem {
  question: string;
  answer: string;
  type: 'tip' | 'warning' | 'info';
}

const helpSections: HelpSection[] = [
  {
    id: 'map',
    title: 'Smart Map Features',
    icon: 'map',
    content: [
      {
        question: 'How do I use the different map modes?',
        answer: 'Tap the mode buttons at the top: Zones (blue) shows fishing areas, Predictions (green) displays AI fish forecasts, and Boundaries (red) shows legal limits.',
        type: 'tip'
      },
      {
        question: 'What do the colored zones mean?',
        answer: 'Green zones indicate high fish activity probability, yellow shows moderate activity, and red zones suggest low activity or restricted areas.',
        type: 'info'
      },
      {
        question: 'How accurate are the AI predictions?',
        answer: 'Our AI combines weather, tides, historical data, and community reports. Accuracy improves over time as more fishermen share their catches.',
        type: 'info'
      }
    ]
  },
  {
    id: 'trips',
    title: 'Trip Planning',
    icon: 'navigate',
    content: [
      {
        question: 'How does AI Smart Planning work?',
        answer: 'Our AI analyzes current weather, fish predictions, fuel costs, and optimal routes to suggest the best fishing trip for your conditions.',
        type: 'tip'
      },
      {
        question: 'Can I modify AI-generated trip plans?',
        answer: 'Yes! AI plans are starting points. You can add waypoints, change routes, or create completely manual trips using the "Manual Trip" option.',
        type: 'info'
      },
      {
        question: 'What factors affect trip recommendations?',
        answer: 'Weather conditions, fish predictions, fuel efficiency, distance from shore, maritime boundaries, and historical success rates.',
        type: 'info'
      }
    ]
  },
  {
    id: 'weather',
    title: 'Weather & Safety',
    icon: 'cloud',
    content: [
      {
        question: 'What do fishing condition ratings mean?',
        answer: 'Excellent: Perfect conditions. Good: Safe with precautions. Poor: Challenging, stay near shore. Dangerous: Return immediately!',
        type: 'warning'
      },
      {
        question: 'When should I avoid going out?',
        answer: 'Never fish during "Dangerous" conditions. High waves (>2m), strong winds (>25 km/h), or severe weather warnings require immediate return to shore.',
        type: 'warning'
      },
      {
        question: 'How often is weather data updated?',
        answer: 'Weather data updates every 30 minutes. Marine conditions can change rapidly - always check before departure and monitor while fishing.',
        type: 'tip'
      }
    ]
  },
  {
    id: 'safety',
    title: 'Safety & Legal',
    icon: 'shield-checkmark',
    content: [
      {
        question: 'What are maritime boundaries?',
        answer: 'Red zones show restricted areas like naval bases, shipping lanes, or protected marine areas where fishing is prohibited or regulated.',
        type: 'warning'
      },
      {
        question: 'How do I stay legally compliant?',
        answer: 'Enable boundary alerts, respect fishing quotas, follow seasonal restrictions, and maintain proper licenses. Laws vary by location.',
        type: 'warning'
      },
      {
        question: 'What should I do in an emergency?',
        answer: 'Contact coast guard immediately, share your location using the app, signal with flares or radio, and follow emergency protocols.',
        type: 'warning'
      }
    ]
  },
  {
    id: 'tips',
    title: 'Pro Fishing Tips',
    icon: 'fish',
    content: [
      {
        question: 'Best times to fish according to SeaSure?',
        answer: 'Early morning (dawn) and late evening (dusk) typically show highest activity. Check AI predictions for specific time recommendations.',
        type: 'tip'
      },
      {
        question: 'How to improve catch accuracy data?',
        answer: 'Log your catches, note species and weights, rate fishing spots, and share community reports. This improves AI predictions for everyone.',
        type: 'tip'
      },
      {
        question: 'What equipment works best with SeaSure data?',
        answer: 'Fish finders, GPS units, and depth sounders complement our data. Use sonar data alongside AI predictions for best results.',
        type: 'tip'
      }
    ]
  }
];

export default function HelpScreen() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getBadgeVariant = (type: HelpItem['type']) => {
    switch (type) {
      case 'warning': return 'danger';
      case 'tip': return 'success';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getItemIcon = (type: HelpItem['type']) => {
    switch (type) {
      case 'warning': return 'warning';
      case 'tip': return 'bulb';
      case 'info': return 'information-circle';
      default: return 'help-circle';
    }
  };

  const filteredSections = selectedTab === 'all' 
    ? helpSections 
    : helpSections.filter(section => section.id === selectedTab);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Tips</Text>
        <Text style={styles.headerSubtitle}>Master SeaSure for better fishing</Text>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]} 
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        {helpSections.map(section => (
          <TouchableOpacity 
            key={section.id}
            style={[styles.tab, selectedTab === section.id && styles.activeTab]} 
            onPress={() => setSelectedTab(section.id)}
          >
            <Ionicons name={section.icon} size={16} color={selectedTab === section.id ? theme.primary : theme.muted} />
            <Text style={[styles.tabText, selectedTab === section.id && styles.activeTabText]}>{section.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Help Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredSections.map(section => (
          <EnhancedCard key={section.id} style={styles.sectionCard}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => toggleSection(section.id)}
            >
              <View style={styles.sectionTitleContainer}>
                <Ionicons name={section.icon} size={24} color={theme.primary} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Ionicons 
                name={expandedSections.includes(section.id) ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.muted} 
              />
            </TouchableOpacity>

            {expandedSections.includes(section.id) && (
              <View style={styles.sectionContent}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.helpItem}>
                    <View style={styles.questionContainer}>
                      <Ionicons name={getItemIcon(item.type)} size={16} color={theme.primary} />
                      <Text style={styles.question}>{item.question}</Text>
                      <ProfessionalBadge variant={getBadgeVariant(item.type)} label={item.type} />
                    </View>
                    <Text style={styles.answer}>{item.answer}</Text>
                  </View>
                ))}
              </View>
            )}
          </EnhancedCard>
        ))}

        {/* Contact Support */}
        <EnhancedCard style={styles.supportCard}>
          <View style={styles.supportHeader}>
            <Ionicons name="headset" size={24} color={theme.primary} />
            <Text style={styles.supportTitle}>Need More Help?</Text>
          </View>
          <Text style={styles.supportText}>
            Can't find what you're looking for? Our fishing community and support team are here to help.
          </Text>
          <View style={styles.supportButtons}>
            <ModernButton
              title="Community Forum"
              icon="people"
              variant="secondary"
              style={styles.supportButton}
            />
            <ModernButton
              title="Contact Support"
              icon="mail"
              style={styles.supportButton}
            />
          </View>
        </EnhancedCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.fg,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.muted,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.card,
    gap: 6,
  },
  activeTab: {
    backgroundColor: theme.primary + '20',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.muted,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionCard: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.fg,
  },
  sectionContent: {
    borderTopWidth: 1,
    borderTopColor: theme.card,
    paddingTop: 16,
    gap: 16,
  },
  helpItem: {
    gap: 8,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.fg,
    flex: 1,
  },
  answer: {
    fontSize: 14,
    color: theme.muted,
    lineHeight: 20,
    marginLeft: 24,
  },
  supportCard: {
    marginBottom: 32,
    alignItems: 'center',
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.fg,
  },
  supportText: {
    fontSize: 16,
    color: theme.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  supportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  supportButton: {
    flex: 1,
  },
});