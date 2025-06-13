export function generateScenarios(analysisResults) {
  const scenarios = [];
  
  // Define scenario templates based on market needs
  const scenarioTemplates = {
    intersection_turn: {
      requiredLabels: ['intersection', 'traffic light', 'turn signal'],
      value: 7
    },
    pedestrian_crossing: {
      requiredLabels: ['pedestrian', 'crosswalk', 'person'],
      value: 8
    },
    highway_merge: {
      requiredLabels: ['highway', 'merge', 'multiple vehicles'],
      value: 6
    },
    parking_maneuver: {
      requiredLabels: ['parking', 'reverse', 'parallel parking'],
      value: 7
    },
    weather_driving: {
      requiredLabels: ['rain', 'snow', 'fog', 'weather'],
      value: 9
    }
  };
  
  // Extract time-based segments
  const timeSegments = segmentByActivity(analysisResults.googleAnnotations);
  
  timeSegments.forEach(segment => {
    const segmentLabels = extractLabelsForSegment(segment, analysisResults);
    
    // Match against templates
    for (const [scenarioType, template] of Object.entries(scenarioTemplates)) {
      if (matchesTemplate(segmentLabels, template.requiredLabels)) {
        scenarios.push({
          type: scenarioType,
          start_time: segment.start,
          end_time: segment.end,
          confidence: calculateConfidence(segmentLabels, template),
          value_score: template.value,
          labels: segmentLabels,
          metadata: {
            weather: detectWeather(segmentLabels),
            time_of_day: detectTimeOfDay(analysisResults.gptInsights),
            traffic_density: detectTrafficDensity(segmentLabels),
            road_type: detectRoadType(segmentLabels)
          }
        });
      }
    }
    
    // Check for custom/rare scenarios from GPT analysis
    const customScenarios = extractCustomScenarios(
      segment, 
      analysisResults.gptInsights
    );
    scenarios.push(...customScenarios);
  });
  
  return scenarios;
}

function segmentByActivity(annotations) {
  // Group annotations into time segments
  const segments = [];
  let currentSegment = { start: 0, end: 30, annotations: [] };
  
  annotations.forEach(annotation => {
    if (annotation.segments) {
      annotation.segments.forEach(segment => {
        segments.push({
          start: segment.startTimeOffset,
          end: segment.endTimeOffset,
          annotations: [annotation]
        });
      });
    }
  });
  
  return segments;
}

function extractLabelsForSegment(segment, results) {
  const labels = [];
  
  // Extract from all sources
  results.googleAnnotations?.annotations?.forEach(annotation => {
    if (annotation.segments) {
      annotation.segments.forEach(seg => {
        if (seg.startTimeOffset >= segment.start && seg.endTimeOffset <= segment.end) {
          labels.push(annotation.name);
        }
      });
    }
  });
  
  return [...new Set(labels)];
}

function matchesTemplate(labels, requiredLabels) {
  const labelSet = new Set(labels.map(l => l.toLowerCase()));
  return requiredLabels.some(required => 
    labelSet.has(required.toLowerCase())
  );
}

function calculateConfidence(labels, template) {
  const matchCount = template.requiredLabels.filter(required =>
    labels.some(label => label.toLowerCase().includes(required.toLowerCase()))
  ).length;
  
  return matchCount / template.requiredLabels.length;
}

function detectWeather(labels) {
  const weatherLabels = ['rain', 'snow', 'fog', 'clear', 'cloudy'];
  return labels.find(label => 
    weatherLabels.some(weather => label.toLowerCase().includes(weather))
  ) || 'clear';
}

function detectTimeOfDay(gptInsights) {
  // Parse GPT insights for time of day
  const timePatterns = {
    night: ['night', 'dark', 'evening'],
    day: ['day', 'bright', 'afternoon', 'morning']
  };
  
  // Simplified - would parse actual GPT responses
  return 'day';
}

function detectTrafficDensity(labels) {
  const vehicleCount = labels.filter(label => 
    ['car', 'vehicle', 'truck', 'bus'].some(v => 
      label.toLowerCase().includes(v)
    )
  ).length;
  
  if (vehicleCount > 10) return 'heavy';
  if (vehicleCount > 5) return 'moderate';
  return 'light';
}

function detectRoadType(labels) {
  if (labels.some(l => l.toLowerCase().includes('highway'))) return 'highway';
  if (labels.some(l => l.toLowerCase().includes('residential'))) return 'residential';
  if (labels.some(l => l.toLowerCase().includes('parking'))) return 'parking_lot';
  return 'urban';
}

function extractCustomScenarios(segment, gptInsights) {
  // Extract custom scenarios from GPT analysis
  return [];
}