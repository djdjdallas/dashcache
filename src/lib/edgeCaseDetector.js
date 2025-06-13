export class EdgeCaseDetector {
  constructor() {
    this.edgeCasePatterns = {
      // Rare weather
      heavySnow: ['snow', 'blizzard', 'whiteout'],
      heavyRain: ['downpour', 'flooding', 'hydroplaning'],
      fog: ['dense fog', 'low visibility', 'mist'],
      
      // Complex scenarios
      emergencyVehicles: ['ambulance', 'fire truck', 'police', 'siren'],
      construction: ['construction zone', 'road work', 'detour'],
      accidents: ['collision', 'accident', 'crash', 'emergency'],
      
      // Unusual behavior
      jaywalking: ['pedestrian crossing', 'unexpected', 'middle of road'],
      animals: ['deer', 'dog', 'animal crossing'],
      roadRage: ['aggressive driving', 'confrontation'],
      
      // Rare traffic situations
      wrongWay: ['wrong way', 'opposite direction'],
      breakdown: ['stalled vehicle', 'hazard lights'],
      parade: ['parade', 'protest', 'large gathering']
    };
  }
  
  async detectEdgeCases(annotations, gptAnalysis) {
    const detectedEdgeCases = [];
    
    // Check annotation labels against patterns
    for (const [category, patterns] of Object.entries(this.edgeCasePatterns)) {
      const found = this.searchPatterns(annotations, patterns);
      if (found.length > 0) {
        detectedEdgeCases.push({
          category,
          type: this.mapCategoryToType(category),
          confidence: found[0].confidence,
          timestamp: found[0].timestamp,
          value: this.calculateEdgeCaseValue(category)
        });
      }
    }
    
    // Parse GPT-4 analysis for edge cases
    const gptEdgeCases = this.parseGPTEdgeCases(gptAnalysis);
    
    return this.mergeAndRankEdgeCases(detectedEdgeCases, gptEdgeCases);
  }
  
  searchPatterns(annotations, patterns) {
    const matches = [];
    
    annotations.forEach(annotation => {
      patterns.forEach(pattern => {
        if (annotation.name && annotation.name.toLowerCase().includes(pattern.toLowerCase())) {
          matches.push({
            confidence: annotation.confidence,
            timestamp: annotation.timestamp || 0
          });
        }
      });
    });
    
    return matches;
  }
  
  mapCategoryToType(category) {
    const typeMap = {
      emergencyVehicles: 'emergency_vehicle_interaction',
      accidents: 'major_accident',
      wrongWay: 'wrong_way_driver',
      heavySnow: 'extreme_weather',
      construction: 'construction_zone_complex',
      animals: 'animal_collision_near_miss',
      jaywalking: 'unusual_pedestrian_behavior',
      roadRage: 'road_rage_incident',
      breakdown: 'vehicle_breakdown'
    };
    return typeMap[category] || 'standard_edge_case';
  }
  
  calculateEdgeCaseValue(category) {
    const valueMap = {
      emergencyVehicles: 9,
      accidents: 10,
      wrongWay: 10,
      heavySnow: 8,
      construction: 7,
      animals: 8,
      jaywalking: 7,
      roadRage: 8,
      breakdown: 6
    };
    return valueMap[category] || 5;
  }
  
  parseGPTEdgeCases(gptAnalysis) {
    // Parse GPT responses for edge case ratings
    const edgeCases = [];
    
    gptAnalysis.forEach(analysis => {
      const ratingMatch = analysis.analysis.match(/rate[d]?\s*:?\s*(\d+)/i);
      if (ratingMatch && parseInt(ratingMatch[1]) >= 7) {
        edgeCases.push({
          type: 'gpt_identified_edge_case',
          confidence: parseInt(ratingMatch[1]) / 10,
          timestamp: analysis.timestamp,
          value: parseInt(ratingMatch[1])
        });
      }
    });
    
    return edgeCases;
  }
  
  mergeAndRankEdgeCases(detected, gptCases) {
    const merged = [...detected, ...gptCases];
    
    // Remove duplicates and sort by value
    const unique = merged.reduce((acc, current) => {
      const existing = acc.find(item => 
        Math.abs(item.timestamp - current.timestamp) < 5
      );
      
      if (!existing || current.value > existing.value) {
        return [...acc.filter(item => item !== existing), current];
      }
      
      return acc;
    }, []);
    
    return unique.sort((a, b) => b.value - a.value);
  }
}