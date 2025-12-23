declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}

export interface ConversionEventParams {
  event_category: string;
  event_label: string;
  skill_id?: string;
  user_authenticated?: boolean;
  value?: number;
  [key: string]: string | boolean | number | undefined;
}

export const trackEvent = (eventName: string, params: ConversionEventParams): void => {
  if (typeof window !== 'undefined' && window.gtag !== undefined) {
    window.gtag('event', eventName, params);
  }

  console.debug('[Analytics]', eventName, params);
};

export const trackSkillView = (skillId: string, isAuthenticated: boolean): void => {
  trackEvent('view_skill', {
    event_category: 'engagement',
    event_label: isAuthenticated ? 'authenticated' : 'unauthenticated',
    skill_id: skillId,
    user_authenticated: isAuthenticated,
  });
};

export const trackSkillSearch = (_searchTerm: string, isAuthenticated: boolean): void => {
  trackEvent('search_skills', {
    event_category: 'engagement',
    event_label: isAuthenticated ? 'authenticated' : 'unauthenticated',
    user_authenticated: isAuthenticated,
  });
};

export const trackRegistrationClick = (source: string): void => {
  trackEvent('registration_click', {
    event_category: 'conversion',
    event_label: source,
    value: 1,
  });
};

export const trackMatchRequestClick = (skillId: string, isAuthenticated: boolean): void => {
  trackEvent('match_request_click', {
    event_category: 'conversion',
    event_label: isAuthenticated ? 'authenticated' : 'unauthenticated',
    skill_id: skillId,
    user_authenticated: isAuthenticated,
  });
};

export const trackCTAClick = (ctaType: string, source: string): void => {
  trackEvent('cta_click', {
    event_category: 'conversion',
    event_label: `${ctaType}_${source}`,
  });
};
