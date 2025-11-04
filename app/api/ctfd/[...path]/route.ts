import { NextRequest, NextResponse } from 'next/server';

// This route only works in development mode
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API Proxy Route for CTFd (Development Mode Only)
 * 
 * This route acts as a proxy between the frontend and CTFd API to avoid CORS issues
 * during local development. It forwards all requests to the CTFd instance.
 * 
 * Note: This route is automatically removed during production builds. For production  
 * deployments, ensure CORS is configured on your CTFd instance.
 * 
 * Usage: /api/ctfd/<path>?ctfd_url=<url>
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const searchParams = request.nextUrl.searchParams;
    const ctfdUrl = searchParams.get('ctfd_url');
    
    if (!ctfdUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing ctfd_url parameter' },
        { status: 400 }
      );
    }

    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Remove ctfd_url from search params before forwarding
    const forwardParams = new URLSearchParams(searchParams);
    forwardParams.delete('ctfd_url');
    const queryString = forwardParams.toString();
    
    // Construct the target URL
    const targetPath = path.join('/');
    const targetUrl = `${ctfdUrl}/api/v1/${targetPath}${queryString ? `?${queryString}` : ''}`;

    console.log(`[API Proxy] Forwarding GET request to: ${targetUrl}`);

    // Forward the request to CTFd
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    });

    // Get the response data with error handling
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('[API Proxy] Failed to parse JSON response:', jsonError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON response from CTFd' },
        { status: 502 }
      );
    }

    // Return the response with appropriate status
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal proxy error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const searchParams = request.nextUrl.searchParams;
    const ctfdUrl = searchParams.get('ctfd_url');
    
    if (!ctfdUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing ctfd_url parameter' },
        { status: 400 }
      );
    }

    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.text();

    // Remove ctfd_url from search params before forwarding
    const forwardParams = new URLSearchParams(searchParams);
    forwardParams.delete('ctfd_url');
    const queryString = forwardParams.toString();
    
    // Construct the target URL
    const targetPath = path.join('/');
    const targetUrl = `${ctfdUrl}/api/v1/${targetPath}${queryString ? `?${queryString}` : ''}`;

    console.log(`[API Proxy] Forwarding POST request to: ${targetUrl}`);

    // Forward the request to CTFd
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: body,
      cache: 'no-cache',
    });

    // Get the response data with error handling
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('[API Proxy] Failed to parse JSON response:', jsonError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON response from CTFd' },
        { status: 502 }
      );
    }

    // Return the response with appropriate status
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal proxy error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
