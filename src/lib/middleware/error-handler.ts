/**
 * Error Handler Middleware
 * Converts service Result errors to HTTP responses
 */

import { NextResponse } from 'next/server';
import { AppError } from '@/lib/core/errors';
import { logger } from '@/lib/core/logger';

export function handleServiceError(error: Error | AppError): NextResponse {
  // Log the error
  logger.error('API error', error);

  // Handle AppError types
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

export function handleServiceResult<T>(
  result: { success: boolean; value?: T; error?: Error },
  successStatus: number = 200
): NextResponse {
  if (result.success && result.value !== undefined) {
    return NextResponse.json(result.value, { status: successStatus });
  }

  if (result.error) {
    return handleServiceError(result.error);
  }

  return NextResponse.json(
    { error: 'Unknown error occurred' },
    { status: 500 }
  );
}
