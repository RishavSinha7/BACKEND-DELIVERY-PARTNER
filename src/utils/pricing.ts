type Coordinates = { latitude: number; longitude: number };

type PricingOptions = {
  loadingRequired?: boolean;
  hours?: number;
  surgeMultiplier?: number;
};

type PricingBreakdown = {
  baseFare: number;
  distanceCharges: number;
  timeCharges: number;
  additionalCharges: number;
  taxes: number;
  total: number;
  surgeMultiplier?: number;
};

type Estimate = {
  serviceType: string;
  distance: number;
  estimatedTime: { minutes: number; hours: number; display: string };
  pricing: PricingBreakdown;
  validUntil: Date;
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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

export const calculateEstimate = (
  serviceType: string,
  pickupCoords: Coordinates,
  dropCoords: Coordinates,
  options: PricingOptions = {}
): { success: boolean; estimate?: Estimate; error?: string } => {
  try {
    const distance = calculateDistance(
      pickupCoords.latitude,
      pickupCoords.longitude,
      dropCoords.latitude,
      dropCoords.longitude
    );
    const pricing = pricingRules[serviceType as keyof typeof pricingRules];
    if (!pricing) {
      throw new Error('Invalid service type');
    }
    let totalFare = pricing.baseFare;
    let breakdown: PricingBreakdown = {
      baseFare: pricing.baseFare,
      distanceCharges: 0,
      timeCharges: 0,
      additionalCharges: 0,
      taxes: 0,
      total: 0
    };
    breakdown.distanceCharges = distance * pricing.perKm;
    totalFare += breakdown.distanceCharges;
    switch (serviceType) {
      case 'two-wheeler': {
        const estimatedTime = distance / 20 * 60;
        breakdown.timeCharges = estimatedTime * pricing.perMinute;
        totalFare += breakdown.timeCharges;
        break;
      }
      case 'truck': {
        if (options.loadingRequired) {
          breakdown.additionalCharges += pricing.loadingCharges;
          totalFare += pricing.loadingCharges;
        }
        break;
      }
      case 'intercity': {
        const days = Math.ceil(distance / 500);
        breakdown.additionalCharges = days * pricing.driverAllowance;
        totalFare += breakdown.additionalCharges;
        break;
      }
      case 'packers-movers': {
        breakdown.additionalCharges = pricing.laborCharges + pricing.packingCharges;
        totalFare += breakdown.additionalCharges;
        if (options.hours) {
          const hourlyCharges = options.hours * pricing.perHour;
          breakdown.additionalCharges += hourlyCharges;
          totalFare += hourlyCharges;
        }
        break;
      }
    }
    if (options.surgeMultiplier && options.surgeMultiplier > 1) {
      totalFare *= options.surgeMultiplier;
      breakdown.surgeMultiplier = options.surgeMultiplier;
    }
    if (totalFare < pricing.minimumFare) {
      totalFare = pricing.minimumFare;
    }
    if (pricing.maximumFare && totalFare > pricing.maximumFare) {
      totalFare = pricing.maximumFare;
    }
    breakdown.taxes = totalFare * 0.18;
    breakdown.total = totalFare + breakdown.taxes;
    return {
      success: true,
      estimate: {
        serviceType,
        distance: Math.round(distance * 100) / 100,
        estimatedTime: getEstimatedTime(serviceType, distance),
        pricing: breakdown,
        validUntil: new Date(Date.now() + 15 * 60 * 1000)
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

export const getEstimatedTime = (serviceType: string, distance: number) => {
  const speeds: Record<string, number> = {
    'two-wheeler': 25,
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

export const formatTime = (minutes: number): string => {
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

export const calculateSurgeMultiplier = (
  serviceType: string,
  currentTime: Date,
  demandLevel: string = 'normal'
): number => {
  const surgeRules: Record<string, number> = {
    'normal': 1.0,
    'high': 1.5,
    'very_high': 2.0,
    'peak': 2.5
  };
  const hour = currentTime.getHours();
  let baseSurge = surgeRules[demandLevel] || 1.0;
  if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 21)) {
    baseSurge *= 1.3;
  }
  return baseSurge;
}; 