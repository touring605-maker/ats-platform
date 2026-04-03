function featureFlag(envVar: string, defaultValue: boolean = false): boolean {
  const value = process.env[envVar];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

export const featuresConfig = {
  aiScreeningEnabled: featureFlag('FEATURE_AI_SCREENING', false),
  marketplaceIntegrationEnabled: featureFlag('FEATURE_MARKETPLACE', false),
  advancedAnalyticsEnabled: featureFlag('FEATURE_ADVANCED_ANALYTICS', false),
  bulkImportEnabled: featureFlag('FEATURE_BULK_IMPORT', false),
  eSignatureEnabled: featureFlag('FEATURE_ESIGNATURE', false),
} as const;

export type FeaturesConfig = typeof featuresConfig;
