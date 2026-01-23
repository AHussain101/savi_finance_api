// API Response Helpers - Aarfan's responsibility
// See docs/AARFAN_BACKEND.md for implementation details

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    cached?: boolean;
    timestamp?: string;
    source: string;
  };
}

export function successResponse<T>(
  data: T,
  dataDate?: Date,
  cached = true
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      cached,
      timestamp: dataDate?.toISOString(),
      source: "FinFlux",
    },
  };

  return Response.json(response);
}

export function errorResponse(
  code: string,
  message: string,
  status = 400
): Response {
  const response: ApiResponse<never> = {
    success: false,
    error: { code, message },
    meta: { source: "FinFlux" },
  };

  return Response.json(response, { status });
}
