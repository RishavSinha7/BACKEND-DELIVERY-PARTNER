const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
};

const pricingRules = {
  'two-wheeler': {
    baseFare: 30,
    perKm: 8,
    perMinute: 2,
    minimumFare: 50,
    maximumFare: 500,
    surgeMultiplier: 1.0
  },
  'truck': {
    baseFare: 150,
    perKm: 25,
    perMinute: 5,
    minimumFare: 300,
    maximumFare: 2000,
    surgeMultiplier: 1.0,
    loadingCharges: 100
  },
  'intercity': {
    baseFare: 500,
    perKm: 15,
    perDay: 1000,
    driverAllowance: 500,
    minimumFare: 1500,
    tollCharges: 'actual',
    fuelCharges: 'included'
  },
  'packers-movers': {
    baseFare: 1000,
    perKm: 20,
    perHour: 200,
    laborCharges: 300,
    materialCharges: 'actual',
    minimumFare: 2000,
    packingCharges: 500
  }
};

const calculateEstimate = (serviceType, pickupCoords, dropCoords, options = {}) => {
  try {
    const distance = calculateDistance(
      pickupCoords.latitude,
      pickupCoords.longitude,
      dropCoords.latitude,
      dropCoords.longitude
    );

    const pricing = pricingRules[serviceType];
    if (!pricing) {
      throw new Error('Invalid service type');
    }

    let totalFare = pricing.baseFare;
    let breakdown = {
      baseFare: pricing.baseFare,
      distanceCharges: 0,
      timeCharges: 0,
      additionalCharges: 0,
      taxes: 0,
      total: 0
    };

    // Distance charges
    breakdown.distanceCharges = distance * pricing.perKm;
    totalFare += breakdown.distanceCharges;

    // Service-specific calculations
    switch (serviceType) {
      case 'two-wheeler':
        const estimatedTime = distance / 20 * 60; // Assuming 20 km/h average speed
        breakdown.timeCharges = estimatedTime * pricing.perMinute;
        totalFare += breakdown.timeCharges;
        break;

      case 'truck':
        if (options.loadingRequired) {
          breakdown.additionalCharges += pricing.loadingCharges;
          totalFare += pricing.loadingCharges;
        }
        break;

      case 'intercity':
        const days = Math.ceil(distance / 500); // Assuming 500km per day
        breakdown.additionalCharges = days * pricing.driverAllowance;
        totalFare += breakdown.additionalCharges;
        break;

      case 'packers-movers':
        breakdown.additionalCharges = pricing.laborCharges + pricing.packingCharges;
        totalFare += breakdown.additionalCharges;
        
        if (options.hours) {
          const hourlyCharges = options.hours * pricing.perHour;
          breakdown.additionalCharges += hourlyCharges;
          totalFare += hourlyCharges;
        }
        break;
    }

    // Apply surge pricing if applicable
    if (options.surgeMultiplier && options.surgeMultiplier > 1) {
      totalFare *= options.surgeMultiplier;
      breakdown.surgeMultiplier = options.surgeMultiplier;
    }

    // Apply minimum fare
    if (totalFare < pricing.minimumFare) {
      totalFare = pricing.minimumFare;
    }

    // Apply maximum fare if specified
    if (pricing.maximumFare && totalFare > pricing.maximumFare) {
      totalFare = pricing.maximumFare;
    }

    // Calculate taxes (18% GST)
    breakdown.taxes = totalFare * 0.18;
    breakdown.total = totalFare + breakdown.taxes;

    return {
      success: true,
      estimate: {
        serviceType,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        estimatedTime: getEstimatedTime(serviceType, distance),
        pricing: breakdown,
        validUntil: new Date(Date.now() + 15 * 60 * 1000) // Valid for 15 minutes
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

const getEstimatedTime = (serviceType, distance) => {
  const speeds = {
    'two-wheeler': 25, // km/h
    'truck': 40,
    'intercity': 60,
    'packers-movers': 30
  };

  const speed = speeds[serviceType] || 30;
  const timeInHours = distance / speed;
  const timeInMinutes = Math.ceil(timeInHours * 60);

  return {
    minutes: timeInMinutes,
    hours: Math.floor(timeInMinutes / 60),
    display: formatTime(timeInMinutes)
  };
};

const formatTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

const calculateSurgeMultiplier = (serviceType, currentTime, demandLevel = 'normal') => {
  const surgeRules = {
    'normal': 1.0,
    'high': 1.5,
    'very_high': 2.0,
    'peak': 2.5
  };

  const hour = currentTime.getHours();
  let baseSurge = surgeRules[demandLevel] || 1.0;

  // Peak hours surge (8-10 AM, 6-9 PM)
  if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 21)) {
    baseSurge *= 1.3;
  }

  // Late night surge (11 PM - 5 AM)
  if (hour >= 23 || hour <= 5) {
    baseSurge *= 1.2;
  }

  return Math.round(baseSurge * 100) / 100; // Round to 2 decimal places
};

module.exports = {
  calculateEstimate,
  calculateDistance,
  calculateSurgeMultiplier,
  pricingRules
};
