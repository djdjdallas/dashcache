// Error types for DashCache application
export const ERROR_TYPES = {
  // Upload errors
  UPLOAD_FILE_TOO_LARGE: 'UPLOAD_FILE_TOO_LARGE',
  UPLOAD_UNSUPPORTED_FORMAT: 'UPLOAD_UNSUPPORTED_FORMAT',
  UPLOAD_NETWORK_ERROR: 'UPLOAD_NETWORK_ERROR',
  UPLOAD_TIMEOUT: 'UPLOAD_TIMEOUT',
  
  // Video processing errors
  VIDEO_PROCESSING_FAILED: 'VIDEO_PROCESSING_FAILED',
  VIDEO_ENCODING_FAILED: 'VIDEO_ENCODING_FAILED',
  VIDEO_CORRUPTION: 'VIDEO_CORRUPTION',
  
  // Anonymization errors
  ANONYMIZATION_FAILED: 'ANONYMIZATION_FAILED',
  ANONYMIZATION_TIMEOUT: 'ANONYMIZATION_TIMEOUT',
  ANONYMIZATION_QUOTA_EXCEEDED: 'ANONYMIZATION_QUOTA_EXCEEDED',
  
  // Database errors
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_CONSTRAINT_VIOLATION: 'DATABASE_CONSTRAINT_VIOLATION',
  DATABASE_TIMEOUT: 'DATABASE_TIMEOUT',
  
  // Authentication errors
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  
  // External service errors
  MUX_API_ERROR: 'MUX_API_ERROR',
  SIGHTENGINE_API_ERROR: 'SIGHTENGINE_API_ERROR',
  STRIPE_API_ERROR: 'STRIPE_API_ERROR',
  
  // Business logic errors
  INSUFFICIENT_EARNINGS: 'INSUFFICIENT_EARNINGS',
  SCENARIO_VALIDATION_FAILED: 'SCENARIO_VALIDATION_FAILED',
  PAYOUT_LIMIT_EXCEEDED: 'PAYOUT_LIMIT_EXCEEDED',
  
  // Generic errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE'
}

// Custom error class for DashCache
export class DashCacheError extends Error {
  constructor(type, message, details = {}, statusCode = 500) {
    super(message)
    this.name = 'DashCacheError'
    this.type = type
    this.details = details
    this.statusCode = statusCode
    this.timestamp = new Date().toISOString()
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DashCacheError)
    }
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

// Error messages for user-facing display
export const ERROR_MESSAGES = {
  [ERROR_TYPES.UPLOAD_FILE_TOO_LARGE]: 'File size is too large. Maximum allowed size is 500MB.',
  [ERROR_TYPES.UPLOAD_UNSUPPORTED_FORMAT]: 'Unsupported file format. Please upload MP4, MOV, AVI, or MKV files.',
  [ERROR_TYPES.UPLOAD_NETWORK_ERROR]: 'Network error during upload. Please check your connection and try again.',
  [ERROR_TYPES.UPLOAD_TIMEOUT]: 'Upload timed out. Please try again with a smaller file or better connection.',
  
  [ERROR_TYPES.VIDEO_PROCESSING_FAILED]: 'Video processing failed. Our team has been notified.',
  [ERROR_TYPES.VIDEO_ENCODING_FAILED]: 'Video encoding failed. Please ensure your video file is not corrupted.',
  [ERROR_TYPES.VIDEO_CORRUPTION]: 'Video file appears to be corrupted. Please try uploading a different file.',
  
  [ERROR_TYPES.ANONYMIZATION_FAILED]: 'Video anonymization failed. Please try again later.',
  [ERROR_TYPES.ANONYMIZATION_TIMEOUT]: 'Video anonymization is taking longer than expected. You will be notified when complete.',
  [ERROR_TYPES.ANONYMIZATION_QUOTA_EXCEEDED]: 'Daily anonymization quota exceeded. Please try again tomorrow.',
  
  [ERROR_TYPES.AUTH_INVALID_TOKEN]: 'Your session has expired. Please sign in again.',
  [ERROR_TYPES.AUTH_INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
  [ERROR_TYPES.AUTH_USER_NOT_FOUND]: 'User account not found. Please sign in again.',
  
  [ERROR_TYPES.MUX_API_ERROR]: 'Video service temporarily unavailable. Please try again later.',
  [ERROR_TYPES.SIGHTENGINE_API_ERROR]: 'Content analysis service temporarily unavailable.',
  [ERROR_TYPES.STRIPE_API_ERROR]: 'Payment service temporarily unavailable. Please try again later.',
  
  [ERROR_TYPES.INSUFFICIENT_EARNINGS]: 'Insufficient earnings for payout. Minimum payout is $10.',
  [ERROR_TYPES.SCENARIO_VALIDATION_FAILED]: 'Video scenario validation failed. Please contact support.',
  [ERROR_TYPES.PAYOUT_LIMIT_EXCEEDED]: 'Daily payout limit exceeded. Please try again tomorrow.',
  
  [ERROR_TYPES.VALIDATION_ERROR]: 'Invalid input data. Please check your information and try again.',
  [ERROR_TYPES.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Our team has been notified.',
  [ERROR_TYPES.EXTERNAL_SERVICE_UNAVAILABLE]: 'External service temporarily unavailable. Please try again later.'
}

// Error handler for API routes
export function handleApiError(error, context = {}) {
  console.error('API Error:', {
    error: error.toJSON ? error.toJSON() : error,
    context,
    timestamp: new Date().toISOString()
  })

  // Log to external service in production
  if (process.env.NODE_ENV === 'production') {
    // You can integrate with services like Sentry, LogRocket, etc.
    // logToExternalService(error, context)
  }

  // Return appropriate response
  if (error instanceof DashCacheError) {
    return {
      error: {
        type: error.type,
        message: ERROR_MESSAGES[error.type] || error.message,
        details: error.details,
        requestId: context.requestId || generateRequestId()
      },
      status: error.statusCode
    }
  }

  // Handle known error types
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return {
      error: {
        type: ERROR_TYPES.EXTERNAL_SERVICE_UNAVAILABLE,
        message: ERROR_MESSAGES[ERROR_TYPES.EXTERNAL_SERVICE_UNAVAILABLE],
        requestId: context.requestId || generateRequestId()
      },
      status: 503
    }
  }

  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return {
      error: {
        type: ERROR_TYPES.UPLOAD_TIMEOUT,
        message: ERROR_MESSAGES[ERROR_TYPES.UPLOAD_TIMEOUT],
        requestId: context.requestId || generateRequestId()
      },
      status: 408
    }
  }

  // Generic server error
  return {
    error: {
      type: ERROR_TYPES.INTERNAL_SERVER_ERROR,
      message: ERROR_MESSAGES[ERROR_TYPES.INTERNAL_SERVER_ERROR],
      requestId: context.requestId || generateRequestId()
    },
    status: 500
  }
}

// Validation helpers
export function validateUploadFile(file, maxSizeBytes = 524288000) {
  const errors = []

  if (!file) {
    errors.push(new DashCacheError(
      ERROR_TYPES.VALIDATION_ERROR,
      'No file provided',
      { field: 'file' },
      400
    ))
    return errors
  }

  // Check file size
  if (file.size > maxSizeBytes) {
    errors.push(new DashCacheError(
      ERROR_TYPES.UPLOAD_FILE_TOO_LARGE,
      `File size ${file.size} exceeds maximum ${maxSizeBytes}`,
      { 
        actualSize: file.size, 
        maxSize: maxSizeBytes,
        filename: file.name 
      },
      413
    ))
  }

  // Check file type
  const supportedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
  if (!supportedTypes.includes(file.type)) {
    errors.push(new DashCacheError(
      ERROR_TYPES.UPLOAD_UNSUPPORTED_FORMAT,
      `Unsupported file type: ${file.type}`,
      { 
        actualType: file.type, 
        supportedTypes,
        filename: file.name 
      },
      415
    ))
  }

  // Check filename extension
  const supportedExtensions = ['.mp4', '.mov', '.avi', '.mkv']
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!supportedExtensions.includes(fileExtension)) {
    errors.push(new DashCacheError(
      ERROR_TYPES.UPLOAD_UNSUPPORTED_FORMAT,
      `Unsupported file extension: ${fileExtension}`,
      { 
        actualExtension: fileExtension, 
        supportedExtensions,
        filename: file.name 
      },
      415
    ))
  }

  return errors
}

export function validateDriverId(driverId) {
  if (!driverId || typeof driverId !== 'string') {
    throw new DashCacheError(
      ERROR_TYPES.VALIDATION_ERROR,
      'Driver ID is required and must be a string',
      { field: 'driverId', value: driverId },
      400
    )
  }

  // UUID validation (assuming Supabase UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(driverId)) {
    throw new DashCacheError(
      ERROR_TYPES.VALIDATION_ERROR,
      'Invalid driver ID format',
      { field: 'driverId', value: driverId },
      400
    )
  }

  return true
}

export function validateEarningsAmount(amount) {
  const numAmount = parseFloat(amount)
  
  if (isNaN(numAmount) || numAmount < 0) {
    throw new DashCacheError(
      ERROR_TYPES.VALIDATION_ERROR,
      'Amount must be a positive number',
      { field: 'amount', value: amount },
      400
    )
  }

  if (numAmount > 1000) {
    throw new DashCacheError(
      ERROR_TYPES.VALIDATION_ERROR,
      'Amount cannot exceed $1000 per transaction',
      { field: 'amount', value: amount, maxAmount: 1000 },
      400
    )
  }

  return numAmount
}

// Retry mechanism for external service calls
export async function withRetry(operation, maxRetries = 3, baseDelay = 1000) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Rate limiting helper
export function createRateLimiter(windowMs = 60000, maxRequests = 100) {
  const requests = new Map()

  return function rateLimiter(identifier) {
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean old entries
    for (const [key, timestamps] of requests) {
      requests.set(key, timestamps.filter(time => time > windowStart))
      if (requests.get(key).length === 0) {
        requests.delete(key)
      }
    }

    // Check current identifier
    const userRequests = requests.get(identifier) || []
    
    if (userRequests.length >= maxRequests) {
      throw new DashCacheError(
        ERROR_TYPES.VALIDATION_ERROR,
        'Rate limit exceeded',
        { 
          identifier, 
          limit: maxRequests, 
          window: windowMs,
          resetTime: userRequests[0] + windowMs 
        },
        429
      )
    }

    // Add current request
    userRequests.push(now)
    requests.set(identifier, userRequests)

    return true
  }
}

// Generate unique request ID for tracking
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Webhook signature verification
export function verifyWebhookSignature(payload, signature, secret) {
  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
    
    const providedSignature = signature.replace('sha256=', '')
    
    if (expectedSignature !== providedSignature) {
      throw new DashCacheError(
        ERROR_TYPES.AUTH_INVALID_TOKEN,
        'Invalid webhook signature',
        { expectedLength: expectedSignature.length, providedLength: providedSignature.length },
        401
      )
    }

    return true
  } catch (error) {
    throw new DashCacheError(
      ERROR_TYPES.AUTH_INVALID_TOKEN,
      'Webhook signature verification failed',
      { originalError: error.message },
      401
    )
  }
}