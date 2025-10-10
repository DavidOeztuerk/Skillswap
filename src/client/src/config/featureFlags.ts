export const FEATURES = {
  appointments: {
    enableCompletion: true,
    enableRating: true,
    enableStatistics: false,
    enableReminders: false,
    enableAvailability: false,
  },
  matchmaking: {
    enableCounterOffers: true,
  },
};

export type FeatureConfig = typeof FEATURES;
