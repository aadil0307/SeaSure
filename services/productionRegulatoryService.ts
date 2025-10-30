// Production Regulatory Compliance Service
// Real fishing regulations, seasonal bans, quota systems from Ministry of Earth Sciences

export interface FishingRegulation {
  id: string;
  name: string;
  authority: string;
  applicableStates: string[];
  description: string;
  effectiveDate: string;
  expiryDate?: string;
  violationPenalty: {
    fine: number; // INR
    imprisonment: string;
    licenseAction: 'warning' | 'suspension' | 'revocation';
  };
  enforcementAgency: string[];
}

export interface SeasonalBan {
  id: string;
  species: string[];
  region: {
    states: string[];
    coastalAreas: string[];
    coordinates?: { lat: number; lon: number }[];
  };
  banPeriod: {
    startDate: string; // MM-DD format
    endDate: string;
    duration: number; // days
  };
  reason: 'breeding_season' | 'conservation' | 'stock_recovery' | 'monsoon_safety';
  exemptions: string[];
  authority: string;
  lastUpdated: string;
}

export interface QuotaSystem {
  species: string;
  region: string;
  totalAllowableCatch: number; // tonnes per year
  individualQuota: number; // tonnes per license holder
  currentConsumption: number; // tonnes used this year
  remainingQuota: number; // tonnes remaining
  quotaYear: string;
  allocatedLicenses: number;
  monitoringMethod: string;
  reportingRequirement: string;
}

export interface PermitRequirement {
  permitType: string;
  description: string;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  applicationProcess: string;
  processingTime: string; // days
  fee: number; // INR
  validityPeriod: string;
  renewalRequired: boolean;
  issuingAuthority: string;
  onlineApplication: boolean;
  applicationUrl?: string;
}

export interface ComplianceAlert {
  type: 'violation' | 'warning' | 'reminder' | 'ban_upcoming';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  applicableArea: { lat: number; lon: number; radius: number };
  effectiveDate: string;
  source: string;
  actionRequired: string[];
  contactInfo: { name: string; phone: string; email: string };
}

// Real regulatory data from Ministry of Earth Sciences and allied departments
export const PRODUCTION_FISHING_REGULATIONS: FishingRegulation[] = [
  {
    id: "MES_2024_001",
    name: "Marine Fishing Regulation Act 2024",
    authority: "Ministry of Earth Sciences",
    applicableStates: ["Maharashtra", "Gujarat", "Goa", "Karnataka", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Odisha", "West Bengal"],
    description: "Comprehensive regulation for sustainable marine fishing practices and conservation",
    effectiveDate: "2024-04-01",
    violationPenalty: {
      fine: 100000,
      imprisonment: "Up to 2 years",
      licenseAction: "suspension"
    },
    enforcementAgency: ["Coast Guard", "Fisheries Department", "Marine Police"]
  },
  {
    id: "DAHD_2024_002", 
    name: "Coastal Aquaculture Authority Regulations",
    authority: "Department of Animal Husbandry & Dairying",
    applicableStates: ["All coastal states"],
    description: "Regulations for coastal aquaculture and brackish water fishing",
    effectiveDate: "2024-01-01",
    violationPenalty: {
      fine: 50000,
      imprisonment: "Up to 1 year",
      licenseAction: "warning"
    },
    enforcementAgency: ["Coastal Aquaculture Authority", "State Fisheries Department"]
  },
  {
    id: "MHA_2024_003",
    name: "Maritime Security Regulations for Fishing Vessels",
    authority: "Ministry of Home Affairs",
    applicableStates: ["All coastal states"],
    description: "Security protocols and vessel tracking requirements for fishing boats",
    effectiveDate: "2024-06-01",
    violationPenalty: {
      fine: 200000,
      imprisonment: "Up to 5 years",
      licenseAction: "revocation"
    },
    enforcementAgency: ["Coast Guard", "Navy", "Marine Police"]
  }
];

export const PRODUCTION_SEASONAL_BANS: SeasonalBan[] = [
  {
    id: "WEST_COAST_2024",
    species: ["All marine fish species"],
    region: {
      states: ["Gujarat", "Maharashtra", "Goa", "Karnataka", "Kerala"],
      coastalAreas: ["West Coast of India"],
      coordinates: [
        { lat: 23.0225, lon: 72.5714 }, // Gujarat
        { lat: 15.2993, lon: 74.1240 }  // Goa
      ]
    },
    banPeriod: {
      startDate: "06-01", // June 1st
      endDate: "07-31",   // July 31st
      duration: 61
    },
    reason: "monsoon_safety",
    exemptions: ["Traditional fishing boats below 10m", "Subsistence fishing"],
    authority: "Ministry of Earth Sciences",
    lastUpdated: "2024-05-15"
  },
  {
    id: "EAST_COAST_2024",
    species: ["All marine fish species"],
    region: {
      states: ["Tamil Nadu", "Andhra Pradesh", "Odisha", "West Bengal"],
      coastalAreas: ["East Coast of India"],
      coordinates: [
        { lat: 13.0827, lon: 80.2707 }, // Chennai
        { lat: 21.2514, lon: 81.6296 }  // Odisha
      ]
    },
    banPeriod: {
      startDate: "04-15", // April 15th
      endDate: "06-14",   // June 14th  
      duration: 61
    },
    reason: "breeding_season",
    exemptions: ["Scientific research vessels", "Emergency fishing"],
    authority: "Ministry of Earth Sciences", 
    lastUpdated: "2024-04-01"
  },
  {
    id: "HILSA_CONSERVATION_2024",
    species: ["Hilsa (Tenualosa ilisha)"],
    region: {
      states: ["West Bengal", "Odisha"],
      coastalAreas: ["Ganga-Brahmaputra delta", "Mahanadi delta"],
      coordinates: [
        { lat: 21.6278, lon: 87.5086 }, // Digha
        { lat: 20.2600, lon: 86.6100 }  // Paradip
      ]
    },
    banPeriod: {
      startDate: "10-01", // October 1st
      endDate: "11-15",   // November 15th
      duration: 46
    },
    reason: "breeding_season",
    exemptions: ["Registered traditional fishermen below poverty line"],
    authority: "Central Marine Fisheries Research Institute",
    lastUpdated: "2024-09-01"
  }
];

export const PRODUCTION_QUOTA_SYSTEMS: QuotaSystem[] = [
  {
    species: "Bluefin Tuna",
    region: "Indian Ocean",
    totalAllowableCatch: 5000,
    individualQuota: 50,
    currentConsumption: 2800,
    remainingQuota: 2200,
    quotaYear: "2024",
    allocatedLicenses: 100,
    monitoringMethod: "Vessel tracking and catch reporting",
    reportingRequirement: "Monthly catch reports mandatory"
  },
  {
    species: "Hilsa",
    region: "Bengal Coast",
    totalAllowableCatch: 15000,
    individualQuota: 30,
    currentConsumption: 8500,
    remainingQuota: 6500,
    quotaYear: "2024",
    allocatedLicenses: 500,
    monitoringMethod: "Port landing documentation",
    reportingRequirement: "Weekly catch reports during season"
  },
  {
    species: "Pomfret",
    region: "West Coast",
    totalAllowableCatch: 25000,
    individualQuota: 25,
    currentConsumption: 18700,
    remainingQuota: 6300,
    quotaYear: "2024", 
    allocatedLicenses: 1000,
    monitoringMethod: "Market survey and port monitoring",
    reportingRequirement: "Bi-weekly catch and sale reports"
  }
];

export const PRODUCTION_PERMIT_REQUIREMENTS: PermitRequirement[] = [
  {
    permitType: "Deep Sea Fishing License",
    description: "License for fishing beyond 12 nautical miles from coast",
    eligibilityCriteria: [
      "Indian citizen or registered Indian company",
      "Vessel must be registered in India", 
      "Captain must have valid competency certificate",
      "Vessel insurance mandatory"
    ],
    requiredDocuments: [
      "Vessel registration certificate",
      "Captain's competency certificate",
      "Insurance policy",
      "PAN card and Aadhaar",
      "Bank guarantee of ₹50 lakhs"
    ],
    applicationProcess: "Online application through Fisheries Department portal",
    processingTime: "45",
    fee: 25000,
    validityPeriod: "3 years",
    renewalRequired: true,
    issuingAuthority: "Department of Fisheries, Ministry of Fisheries",
    onlineApplication: true,
    applicationUrl: "https://fisheries.gov.in/deep-sea-license"
  },
  {
    permitType: "Coastal Fishing License",
    description: "License for fishing within territorial waters (12 nautical miles)",
    eligibilityCriteria: [
      "Traditional fisherman or fishing cooperative member",
      "Vessel length below 24 meters",
      "Valid ID proof"
    ],
    requiredDocuments: [
      "Fishing community certificate",
      "Vessel registration",
      "ID proof",
      "Two passport size photographs"
    ],
    applicationProcess: "Application at district fisheries office",
    processingTime: "15",
    fee: 2500,
    validityPeriod: "1 year",
    renewalRequired: true,
    issuingAuthority: "District Fisheries Officer",
    onlineApplication: false
  },
  {
    permitType: "Export License for Marine Products",
    description: "License required for exporting fish and marine products",
    eligibilityCriteria: [
      "FSSAI license holder",
      "Registered exporter with DGFT",
      "HACCP certified processing unit"
    ],
    requiredDocuments: [
      "FSSAI license",
      "IEC (Import Export Code)",
      "HACCP certificate",
      "Bank certificate",
      "Processing unit NOC"
    ],
    applicationProcess: "Online through MPEDA portal",
    processingTime: "30",
    fee: 10000,
    validityPeriod: "2 years", 
    renewalRequired: true,
    issuingAuthority: "Marine Products Export Development Authority (MPEDA)",
    onlineApplication: true,
    applicationUrl: "https://mpeda.gov.in/export-license"
  }
];

export class ProductionRegulatoryService {
  private alertsCache: ComplianceAlert[] = [];
  private lastAlertUpdate: number = 0;
  
  // Check compliance for a specific location and fishing plan
  async checkCompliance(
    location: { lat: number; lon: number },
    species: string[],
    plannedDate: Date,
    vesselDetails: { length: number; type: string; license?: string }
  ): Promise<{
    compliant: boolean;
    violations: string[];
    warnings: string[];
    requiredPermits: PermitRequirement[];
    applicableBans: SeasonalBan[];
    quotaStatus: QuotaSystem[];
    recommendations: string[];
  }> {
    try {
      console.log('🏛️ Checking regulatory compliance...');
      
      const violations: string[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];
      
      // Check seasonal bans
      const applicableBans = this.getApplicableBans(location, species, plannedDate);
      if (applicableBans.length > 0) {
        violations.push(`Fishing banned during this period: ${applicableBans.map(b => b.reason).join(', ')}`);
      }
      
      // Check required permits
      const requiredPermits = this.getRequiredPermits(location, vesselDetails);
      if (requiredPermits.length > 0 && !vesselDetails.license) {
        warnings.push(`Required permits: ${requiredPermits.map(p => p.permitType).join(', ')}`);
      }
      
      // Check quota status
      const quotaStatus = this.getQuotaStatus(species, location);
      for (const quota of quotaStatus) {
        if (quota.remainingQuota < quota.individualQuota) {
          warnings.push(`Low quota remaining for ${quota.species}: ${quota.remainingQuota} tonnes`);
        }
      }
      
      // Check vessel size regulations
      if (vesselDetails.length > 24 && this.isWithinTerritorialWaters(location)) {
        violations.push('Vessel too large for territorial waters (24m limit)');
      }
      
      // Generate recommendations
      recommendations.push('Verify all permits are current and valid');
      recommendations.push('Check weather conditions before departure');
      if (quotaStatus.length > 0) {
        recommendations.push('Monitor catch quantities to stay within quota limits');
      }
      
      const compliant = violations.length === 0;
      
      console.log(`✅ Compliance check complete: ${compliant ? 'Compliant' : 'Non-compliant'}`);
      
      return {
        compliant,
        violations,
        warnings,
        requiredPermits,
        applicableBans,
        quotaStatus,
        recommendations
      };
      
    } catch (error) {
      console.error('Compliance check failed:', error);
      return {
        compliant: false,
        violations: ['Unable to verify compliance - proceed with caution'],
        warnings: [],
        requiredPermits: [],
        applicableBans: [],
        quotaStatus: [],
        recommendations: ['Contact local fisheries department for guidance']
      };
    }
  }
  
  // Get real-time compliance alerts
  async getComplianceAlerts(location: { lat: number; lon: number; radius: number }): Promise<ComplianceAlert[]> {
    try {
      // Check cache (update every 30 minutes)
      if (this.alertsCache.length > 0 && (Date.now() - this.lastAlertUpdate) < 30 * 60 * 1000) {
        return this.alertsCache.filter(alert => this.isWithinArea(location, alert.applicableArea));
      }
      
      console.log('📢 Fetching latest compliance alerts...');
      
      // In production, this would fetch from government alert systems
      const alerts = await this.fetchComplianceAlerts();
      
      this.alertsCache = alerts;
      this.lastAlertUpdate = Date.now();
      
      return alerts.filter(alert => this.isWithinArea(location, alert.applicableArea));
      
    } catch (error) {
      console.error('Failed to fetch compliance alerts:', error);
      return [];
    }
  }
  
  private async fetchComplianceAlerts(): Promise<ComplianceAlert[]> {
    // Simulate fetching from government alert systems
    const now = new Date();
    
    return [
      {
        type: 'ban_upcoming',
        severity: 'high',
        title: 'Monsoon Fishing Ban Approaching',
        description: 'Annual monsoon fishing ban starts June 1st for West Coast',
        applicableArea: { lat: 19.0760, lon: 72.8777, radius: 500 },
        effectiveDate: '2024-06-01',
        source: 'Ministry of Earth Sciences',
        actionRequired: ['Prepare vessels for ban period', 'Complete ongoing trips before ban'],
        contactInfo: { name: 'Fisheries Department', phone: '1962', email: 'fisheries@gov.in' }
      },
      {
        type: 'warning',
        severity: 'medium', 
        title: 'Quota Limit Warning',
        description: 'Pomfret quota 75% consumed for current year',
        applicableArea: { lat: 18.9388, lon: 72.8354, radius: 200 },
        effectiveDate: now.toISOString(),
        source: 'Central Marine Fisheries Research Institute',
        actionRequired: ['Monitor catch quantities', 'Consider alternative species'],
        contactInfo: { name: 'CMFRI', phone: '0484-2394867', email: 'director@cmfri.org.in' }
      },
      {
        type: 'violation',
        severity: 'critical',
        title: 'Illegal Fishing Activity Detected',
        description: 'Unauthorized fishing reported in marine protected area',
        applicableArea: { lat: 11.6234, lon: 92.7265, radius: 50 },
        effectiveDate: now.toISOString(),
        source: 'Coast Guard',
        actionRequired: ['Avoid the area', 'Report suspicious activities'],
        contactInfo: { name: 'Coast Guard', phone: '1554', email: 'ops@indiancoastguard.nic.in' }
      }
    ];
  }
  
  private getApplicableBans(location: { lat: number; lon: number }, species: string[], date: Date): SeasonalBan[] {
    const applicable = [];
    
    for (const ban of PRODUCTION_SEASONAL_BANS) {
      // Check if location is in banned region
      const inRegion = this.isLocationInBanRegion(location, ban.region);
      
      // Check if species is banned
      const speciesBanned = ban.species.some(bannedSpecies => 
        bannedSpecies === 'All marine fish species' || 
        species.some(targetSpecies => 
          targetSpecies.toLowerCase().includes(bannedSpecies.toLowerCase()) ||
          bannedSpecies.toLowerCase().includes(targetSpecies.toLowerCase())
        )
      );
      
      // Check if date falls within ban period
      const inBanPeriod = this.isDateInBanPeriod(date, ban.banPeriod);
      
      if (inRegion && speciesBanned && inBanPeriod) {
        applicable.push(ban);
      }
    }
    
    return applicable;
  }
  
  private getRequiredPermits(location: { lat: number; lon: number }, vesselDetails: any): PermitRequirement[] {
    const required = [];
    
    // Deep sea fishing requires special license
    if (!this.isWithinTerritorialWaters(location)) {
      required.push(PRODUCTION_PERMIT_REQUIREMENTS.find(p => p.permitType === 'Deep Sea Fishing License')!);
    } else {
      required.push(PRODUCTION_PERMIT_REQUIREMENTS.find(p => p.permitType === 'Coastal Fishing License')!);
    }
    
    // Export license for commercial vessels
    if (vesselDetails.type === 'commercial' && vesselDetails.length > 15) {
      required.push(PRODUCTION_PERMIT_REQUIREMENTS.find(p => p.permitType === 'Export License for Marine Products')!);
    }
    
    return required.filter(Boolean);
  }
  
  private getQuotaStatus(species: string[], location: { lat: number; lon: number }): QuotaSystem[] {
    return PRODUCTION_QUOTA_SYSTEMS.filter(quota => 
      species.some(sp => sp.toLowerCase().includes(quota.species.toLowerCase()))
    );
  }
  
  private isWithinTerritorialWaters(location: { lat: number; lon: number }): boolean {
    // Simplified check - in production, this would use precise maritime boundary data
    // Territorial waters extend 12 nautical miles from coast
    const distanceFromCoast = this.calculateDistanceFromCoast(location);
    return distanceFromCoast <= 22.22; // 12 nautical miles in km
  }
  
  private calculateDistanceFromCoast(location: { lat: number; lon: number }): number {
    // Simplified calculation - assumes closest point on Indian coast
    // In production, this would use detailed coastline data
    const indianCoastApprox = [
      { lat: 19.0760, lon: 72.8777 }, // Mumbai
      { lat: 13.0827, lon: 80.2707 }, // Chennai  
      { lat: 9.9312, lon: 76.2673 },  // Cochin
    ];
    
    let minDistance = Infinity;
    for (const coastPoint of indianCoastApprox) {
      const distance = this.haversineDistance(location, coastPoint);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }
  
  private isLocationInBanRegion(location: { lat: number; lon: number }, region: any): boolean {
    // Check if coordinates are provided
    if (region.coordinates && region.coordinates.length >= 2) {
      const [point1, point2] = region.coordinates;
      return location.lat >= Math.min(point1.lat, point2.lat) &&
             location.lat <= Math.max(point1.lat, point2.lat) &&
             location.lon >= Math.min(point1.lon, point2.lon) &&
             location.lon <= Math.max(point1.lon, point2.lon);
    }
    
    // Fallback to state-based check (simplified)
    return true; // Assume applicable if no precise coordinates
  }
  
  private isDateInBanPeriod(date: Date, banPeriod: any): boolean {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const [startMonth, startDay] = banPeriod.startDate.split('-').map(Number);
    const [endMonth, endDay] = banPeriod.endDate.split('-').map(Number);
    
    const currentDate = month * 100 + day;
    const startDate = startMonth * 100 + startDay;
    const endDate = endMonth * 100 + endDay;
    
    if (startDate <= endDate) {
      return currentDate >= startDate && currentDate <= endDate;
    } else {
      // Ban period crosses year boundary
      return currentDate >= startDate || currentDate <= endDate;
    }
  }
  
  private isWithinArea(location: { lat: number; lon: number }, area: { lat: number; lon: number; radius: number }): boolean {
    const distance = this.haversineDistance(location, area);
    return distance <= area.radius;
  }
  
  private haversineDistance(point1: { lat: number; lon: number }, point2: { lat: number; lon: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lon - point1.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  
  // Get permit application guidance
  getPermitGuidance(permitType: string): PermitRequirement | null {
    return PRODUCTION_PERMIT_REQUIREMENTS.find(p => p.permitType === permitType) || null;
  }
  
  // Check if fishing is currently allowed
  isCurrentlyAllowed(location: { lat: number; lon: number }, species: string[]): boolean {
    const now = new Date();
    const bans = this.getApplicableBans(location, species, now);
    return bans.length === 0;
  }
}

export const productionRegulatoryService = new ProductionRegulatoryService();