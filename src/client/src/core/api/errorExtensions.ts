export class ApiError extends Error {
  constructor(
    public readonly success: boolean,
    public readonly statusCode: number,
    public readonly errors: string[],
    public readonly errorCode?: string,
    public readonly traceId?: string,
    public readonly timestamp?: string
  ) {
    super(errors[0] ?? 'API Error');
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(
    message = 'Network error occurred',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends Error {
  constructor(
    message = 'Request timeout',
    public readonly timeout = 0
  ) {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class AbortError extends Error {
  constructor(message = 'Request aborted') {
    super(message);
    this.name = 'AbortError';
    Object.setPrototypeOf(this, AbortError.prototype);
  }
}
