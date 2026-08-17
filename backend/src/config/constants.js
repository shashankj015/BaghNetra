module.exports = {
  ZONES: {
    CORE: 'CORE',
    BUFFER: 'BUFFER',
    VILLAGE_ADJACENT: 'VILLAGE_ADJACENT'
  },
  
  ROLES: {
    ADMIN: 'admin',
    FIELD_BIOLOGIST: 'biologist',
    RANGE_OFFICER: 'range_officer',
    REVIEWER: 'reviewer'
  },

  ALERT_TYPES: {
    VILLAGE_ADJACENT_RISK: 'VILLAGE_ADJACENT_RISK',
    TERRITORY_OVERLAP: 'TERRITORY_OVERLAP',
    PROLONGED_ABSENCE: 'PROLONGED_ABSENCE',
    RANGE_CENTROID_SHIFT: 'RANGE_CENTROID_SHIFT',
    FIRST_STATION_CAPTURE: 'FIRST_STATION_CAPTURE',
    BUFFER_ENCROACHMENT: 'BUFFER_ENCROACHMENT'
  },

  ALERT_LABELS: {
    VILLAGE_ADJACENT_RISK: 'Human-Wildlife Conflict Risk',
    TERRITORY_OVERLAP: 'Tiger Territory Overlap',
    PROLONGED_ABSENCE: 'No Recent Camera Detection',
    RANGE_CENTROID_SHIFT: 'Range Centroid Shift',
    FIRST_STATION_CAPTURE: 'New Station Observation',
    BUFFER_ENCROACHMENT: 'Buffer Dispersal'
  },

  ALERT_STATUS: {
    ACTIVE: 'ACTIVE',
    REVIEWED: 'REVIEWED',
    RESOLVED: 'RESOLVED'
  },

  ALERT_SEVERITY: {
    CRITICAL: 'CRITICAL',
    WARNING: 'WARNING',
    INFO: 'INFO'
  },

  THRESHOLDS: {
    CORE_CENTROID_SHIFT_KM2: 17.5,
    BUFFER_CENTROID_SHIFT_KM: 5.0,
    VILLAGE_ALERT_KM: parseFloat(process.env.VILLAGE_ALERT_KM || '2.0'),
    PROLONGED_ABSENCE_DAYS: parseInt(process.env.PROLONGED_ABSENCE_DAYS || '45', 10),
    AI_HIGH_THRESHOLD: 0.82,
    AI_LOW_THRESHOLD: 0.65,
    AI_BLANK_THRESHOLD: 0.85
  },

  PENCH_CENTER: {
    lat: 21.6950,
    lon: 79.3500
  },

  // Registered Pench fringe villages and residential settlements for conflict risk monitoring
  PENCH_VILLAGES: [
    {
      id: 'VIL-KHAWASA',
      name: 'Khawasa Village Settlement',
      latitude: 21.5950,
      longitude: 79.3510,
      zone: 'VILLAGE_ADJACENT',
      type: 'RESIDENTIAL_AGRICULTURAL',
      population: 2850
    },
    {
      id: 'VIL-TURIA',
      name: 'Turia Village & Gate Ward',
      latitude: 21.6480,
      longitude: 79.3480,
      zone: 'VILLAGE_ADJACENT',
      type: 'ECO_TOURISM_VILLAGE',
      population: 1420
    },
    {
      id: 'VIL-AWARGHANI',
      name: 'Awarghani Community Buffer',
      latitude: 21.6320,
      longitude: 79.3980,
      zone: 'VILLAGE_ADJACENT',
      type: 'AGRICULTURAL_BORDER',
      population: 960
    },
    {
      id: 'VIL-ARI',
      name: 'Ari Village Agricultural Border',
      latitude: 21.8120,
      longitude: 79.4650,
      zone: 'VILLAGE_ADJACENT',
      type: 'RURAL_OUTPOST',
      population: 1180
    },
    {
      id: 'VIL-KOHKA',
      name: 'Kohka Village Ward',
      latitude: 21.6390,
      longitude: 79.3240,
      zone: 'VILLAGE_ADJACENT',
      type: 'RESIDENTIAL_BUFFER',
      population: 1540
    },
    {
      id: 'VIL-JAMTARA',
      name: 'Jamtara Settlement',
      latitude: 21.6110,
      longitude: 79.4210,
      zone: 'BUFFER',
      type: 'CORRIDOR_VILLAGE',
      population: 830
    },
    {
      id: 'VIL-BADALPUR',
      name: 'Badalpur Residential Sector',
      latitude: 21.6020,
      longitude: 79.3800,
      zone: 'VILLAGE_ADJACENT',
      type: 'RESIDENTIAL_AGRICULTURAL',
      population: 1090
    }
  ]
};
