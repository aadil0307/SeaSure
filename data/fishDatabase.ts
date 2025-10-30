// Mumbai Maritime Fish Species Database
export interface FishSpecies {
  id: string;
  name: string;
  scientificName: string;
  localName?: string;
  description: string;
  habitat: string;
  minSize?: number; // cm
  maxCatch?: number; // per day
  season?: string;
  protected?: boolean;
  marketValue?: number; // ₹ per kg
  image?: string;
}

const MUMBAI_FISH_SPECIES: FishSpecies[] = [
  {
    id: 'pomfret_white',
    name: 'White Pomfret',
    scientificName: 'Pampus argenteus',
    localName: 'Paplet',
    description: 'Premium white fish, highly valued in Mumbai markets. Flat body with silver coloration.',
    habitat: 'Coastal waters, 20-100m depth',
    minSize: 15, // cm
    maxCatch: 10,
    season: 'September to March',
    marketValue: 800,
    protected: false
  },
  {
    id: 'mackerel',
    name: 'Indian Mackerel',
    scientificName: 'Rastrelliger kanagurta',
    localName: 'Bangda',
    description: 'Most common fish in Mumbai. Streamlined body with distinctive wavy lines.',
    habitat: 'Surface waters, schooling fish',
    minSize: 10,
    maxCatch: 50,
    season: 'Year round',
    marketValue: 200,
    protected: false
  },
  {
    id: 'sardine',
    name: 'Oil Sardine',
    scientificName: 'Sardinella longiceps',
    localName: 'Tarli',
    description: 'Small schooling fish, important for local fishermen. High oil content.',
    habitat: 'Coastal surface waters',
    minSize: 8,
    maxCatch: 100,
    season: 'June to February',
    marketValue: 150,
    protected: false
  },
  {
    id: 'kingfish',
    name: 'King Mackerel',
    scientificName: 'Scomberomorus commerson',
    localName: 'Surmai',
    description: 'Large predatory fish, premium catch. Elongated body with sharp teeth.',
    habitat: 'Open waters, 10-200m depth',
    minSize: 35,
    maxCatch: 5,
    season: 'October to March',
    marketValue: 600,
    protected: false
  },
  {
    id: 'bombay_duck',
    name: 'Bombay Duck',
    scientificName: 'Harpadon nehereus',
    localName: 'Bombil',
    description: 'Iconic Mumbai fish, actually a lizardfish. Translucent body.',
    habitat: 'Muddy coastal waters',
    minSize: 12,
    maxCatch: 30,
    season: 'June to October',
    marketValue: 300,
    protected: false
  },
  {
    id: 'ribbon_fish',
    name: 'Ribbon Fish',
    scientificName: 'Trichiurus lepturus',
    localName: 'Ghalti',
    description: 'Long, ribbon-like silvery fish. No pelvic fins.',
    habitat: 'Continental shelf waters',
    minSize: 20,
    maxCatch: 20,
    season: 'September to March',
    marketValue: 250,
    protected: false
  },
  {
    id: 'croaker',
    name: 'Croaker',
    scientificName: 'Johnius belangerii',
    localName: 'Dhoma',
    description: 'Makes croaking sound when caught. Silvery with yellow fins.',
    habitat: 'Estuarine and coastal waters',
    minSize: 15,
    maxCatch: 15,
    season: 'October to March',
    marketValue: 350,
    protected: false
  },
  {
    id: 'shark_baby',
    name: 'Baby Shark',
    scientificName: 'Carcharhinus limbatus',
    localName: 'Mori',
    description: 'Young sharks, protected species. Should be released immediately.',
    habitat: 'Coastal waters',
    minSize: 0, // Protected - no minimum
    maxCatch: 0,
    season: 'Not allowed',
    marketValue: 0,
    protected: true
  },
  {
    id: 'ray',
    name: 'Stingray',
    scientificName: 'Dasyatis zugei',
    localName: 'Sankush',
    description: 'Flat cartilaginous fish with venomous tail. Handle with extreme care.',
    habitat: 'Sandy and muddy bottoms',
    minSize: 20,
    maxCatch: 3,
    season: 'Year round',
    marketValue: 200,
    protected: false
  },
  {
    id: 'tuna_skipjack',
    name: 'Skipjack Tuna',
    scientificName: 'Katsuwonus pelamis',
    localName: 'Chura',
    description: 'Fast-swimming tuna with distinctive stripes on belly.',
    habitat: 'Open ocean, surface waters',
    minSize: 25,
    maxCatch: 8,
    season: 'November to April',
    marketValue: 450,
    protected: false
  },
  {
    id: 'sole_fish',
    name: 'Sole Fish',
    scientificName: 'Cynoglossus macrostomus',
    localName: 'Repti',
    description: 'Flatfish with both eyes on one side. Bottom dweller.',
    habitat: 'Sandy and muddy sea floor',
    minSize: 12,
    maxCatch: 12,
    season: 'September to February',
    marketValue: 400,
    protected: false
  },
  {
    id: 'anchovy',
    name: 'White Anchovy',
    scientificName: 'Anchovia clupeoides',
    localName: 'Mandeli',
    description: 'Small silvery fish, often used for fish meal or dried.',
    habitat: 'Coastal surface waters',
    minSize: 5,
    maxCatch: 200,
    season: 'August to January',
    marketValue: 100,
    protected: false
  }
];

class FishDatabase {
  private species: FishSpecies[] = MUMBAI_FISH_SPECIES;

  getAllSpecies(): FishSpecies[] {
    return this.species;
  }

  getSpeciesById(id: string): FishSpecies | undefined {
    return this.species.find(fish => fish.id === id);
  }

  getSpeciesByName(name: string): FishSpecies | undefined {
    return this.species.find(fish => 
      fish.name.toLowerCase() === name.toLowerCase() ||
      fish.localName?.toLowerCase() === name.toLowerCase()
    );
  }

  searchSpecies(query: string): FishSpecies[] {
    const q = query.toLowerCase();
    return this.species.filter(fish =>
      fish.name.toLowerCase().includes(q) ||
      fish.localName?.toLowerCase().includes(q) ||
      fish.scientificName.toLowerCase().includes(q) ||
      fish.description.toLowerCase().includes(q)
    );
  }

  getProtectedSpecies(): FishSpecies[] {
    return this.species.filter(fish => fish.protected);
  }

  getSpeciesBySeason(month: number): FishSpecies[] {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentMonth = monthNames[month - 1];
    
    return this.species.filter(fish => {
      if (fish.season === 'Year round' || fish.season === 'Not allowed') {
        return fish.season === 'Year round';
      }
      
      return fish.season?.includes(currentMonth) || false;
    });
  }

  getCatchRegulations(speciesId: string): {
    allowed: boolean;
    minSize: number | null;
    maxCatch: number | null;
    warnings: string[];
  } {
    const fish = this.getSpeciesById(speciesId);
    
    if (!fish) {
      return {
        allowed: false,
        minSize: null,
        maxCatch: null,
        warnings: ['Unknown species - release immediately']
      };
    }

    const warnings: string[] = [];
    
    if (fish.protected) {
      warnings.push('⚠️ PROTECTED SPECIES - Release immediately');
      warnings.push('Keeping this fish is illegal and subject to heavy penalties');
    }
    
    if (fish.minSize && fish.minSize > 0) {
      warnings.push(`Minimum size: ${fish.minSize} cm`);
    }
    
    if (fish.maxCatch && fish.maxCatch > 0) {
      warnings.push(`Maximum catch: ${fish.maxCatch} per day`);
    }
    
    if (fish.season && fish.season !== 'Year round') {
      warnings.push(`Best season: ${fish.season}`);
    }

    return {
      allowed: !fish.protected,
      minSize: fish.minSize || null,
      maxCatch: fish.maxCatch || null,
      warnings
    };
  }

  getMarketInfo(speciesId: string): {
    value: number;
    demand: 'High' | 'Medium' | 'Low';
    description: string;
  } {
    const fish = this.getSpeciesById(speciesId);
    
    if (!fish || !fish.marketValue) {
      return {
        value: 0,
        demand: 'Low',
        description: 'No market data available'
      };
    }

    let demand: 'High' | 'Medium' | 'Low' = 'Low';
    let description = '';

    if (fish.marketValue >= 500) {
      demand = 'High';
      description = 'Premium fish with high market demand';
    } else if (fish.marketValue >= 200) {
      demand = 'Medium';
      description = 'Good market value, steady demand';
    } else {
      demand = 'Low';
      description = 'Basic market fish, consistent supply';
    }

    return {
      value: fish.marketValue,
      demand,
      description
    };
  }
}

export const fishDatabase = new FishDatabase();
export { MUMBAI_FISH_SPECIES };