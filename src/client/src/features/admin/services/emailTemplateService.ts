import { apiClient } from '../../../core/api/apiClient';
import type { PagedResponse, ApiResponse } from '../../../shared/types/api/UnifiedResponse';

// Template API endpoints
const TEMPLATE_ENDPOINTS = {
  BASE: '/api/notifications/templates',
  GET_BY_ID: (id: string) => `/api/notifications/templates/${id}`,
  PREVIEW: '/api/notifications/templates/preview',
  TEST_SEND: '/api/notifications/templates/test-send',
};

// Types
export interface EmailTemplateListItem {
  id: string;
  name: string;
  language: string;
  subject: string;
  description?: string;
  isActive: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateDetail extends EmailTemplateListItem {
  htmlContent: string;
  textContent: string;
  variablesSchema?: string;
}

export interface TemplatePreviewResponse {
  subject: string;
  htmlContent: string;
  textContent: string;
  missingVariables: string[];
  isValid: boolean;
  validationErrors: string[];
}

export interface SendTestEmailResponse {
  success: boolean;
  message: string;
  recipientEmail?: string;
}

export interface CreateTemplateRequest {
  name: string;
  language: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  description?: string;
  variablesSchema?: Record<string, string>;
}

export interface UpdateTemplateRequest {
  templateId: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  description?: string;
  variablesSchema?: Record<string, string>;
}

export interface PreviewTemplateRequest {
  templateId: string;
  variables?: Record<string, string>;
}

export interface SendTestEmailRequest {
  templateId: string;
  recipientEmail: string;
  variables?: Record<string, string>;
}

export interface GetTemplatesParams {
  language?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Service for admin email template operations
 */
const emailTemplateService = {
  /**
   * Get all email templates (Admin)
   */
  async getTemplates(params?: GetTemplatesParams): Promise<PagedResponse<EmailTemplateListItem>> {
    const queryParams: Record<string, unknown> = {};
    if (params?.language) queryParams.Language = params.language;
    if (params?.isActive !== undefined) queryParams.IsActive = params.isActive;
    if (typeof params?.pageNumber === 'number' && params.pageNumber > 0) {
      queryParams.PageNumber = params.pageNumber;
    }
    if (typeof params?.pageSize === 'number' && params.pageSize > 0) {
      queryParams.PageSize = params.pageSize;
    }

    return apiClient.getPaged<EmailTemplateListItem>(TEMPLATE_ENDPOINTS.BASE, queryParams);
  },

  /**
   * Get single template by ID (Admin)
   */
  async getTemplateById(templateId: string): Promise<ApiResponse<EmailTemplateDetail>> {
    if (!templateId.trim()) throw new Error('Template-ID ist erforderlich');
    return apiClient.get<EmailTemplateDetail>(TEMPLATE_ENDPOINTS.GET_BY_ID(templateId));
  },

  /**
   * Create new email template (Admin)
   */
  async createTemplate(request: CreateTemplateRequest): Promise<ApiResponse<{ id: string }>> {
    return apiClient.post(TEMPLATE_ENDPOINTS.BASE, request);
  },

  /**
   * Update existing email template (Admin)
   */
  async updateTemplate(request: UpdateTemplateRequest): Promise<ApiResponse<void>> {
    return apiClient.put(TEMPLATE_ENDPOINTS.BASE, request);
  },

  /**
   * Preview email template with variables (Admin)
   */
  async previewTemplate(
    request: PreviewTemplateRequest
  ): Promise<ApiResponse<TemplatePreviewResponse>> {
    return apiClient.post<TemplatePreviewResponse>(TEMPLATE_ENDPOINTS.PREVIEW, request);
  },

  /**
   * Send test email (Admin)
   */
  async sendTestEmail(request: SendTestEmailRequest): Promise<ApiResponse<SendTestEmailResponse>> {
    return apiClient.post<SendTestEmailResponse>(TEMPLATE_ENDPOINTS.TEST_SEND, request);
  },
};

export default emailTemplateService;
