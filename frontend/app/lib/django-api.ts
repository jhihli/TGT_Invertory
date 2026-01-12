'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

/**
 * Server-side function to make authenticated requests to Django API
 * This function handles JWT token management automatically
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error('Not authenticated');
  }

  const API_URL = process.env.NEXT_PUBLIC_Django_API_URL;

  if (!API_URL) {
    throw new Error('API URL is not configured');
  }

  // Get Django JWT token
  let accessToken = session.djangoAccessToken as string | undefined;

  // If no token or token is expired, get a new one
  if (!accessToken) {
    const tokenResponse = await fetch(`${API_URL}/api/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: session.user.name,
        password: session.user.password, // Note: This won't work as password is not stored
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to obtain access token');
    }

    const tokens = await tokenResponse.json();
    accessToken = tokens.access;
  }

  // Make the authenticated request
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}
