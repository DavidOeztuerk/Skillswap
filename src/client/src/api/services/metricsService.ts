import { SYSTEM_ENDPOINTS } from '../../config/endpoints';
import { apiClient } from '../apiClient';

/**
 * Service for retrieving system metrics
 */
const metricsService = {
  /**
   * Fetch metrics for a specific backend service
   */
  async getMetrics<T = Record<string, unknown>>(service: string): Promise<T> {
    if (!service.trim()) throw new Error('Service name is required');
    return apiClient.getAndExtract<T>(SYSTEM_ENDPOINTS.METRICS(service));
  },
};

export default metricsService;
