import { 
  ScoreboardEntry,
  Challenge,
  SubmissionsResponse,
  ConfigResponse,
  ChallengeSolvesResponse
} from '@/types/ctfd';

interface ApiConfig {
  apiUrl: string;
  apiToken: string;
}

// Rate limit tracking
let lastRateLimitTime: number | null = null;
let rateLimitCount = 0;

/**
 * Sanitizes a URL for logging by removing query parameters and fragments
 * that might contain sensitive information.
 * 
 * @param url - The URL string to sanitize
 * @returns The sanitized URL containing only origin and pathname
 */
function sanitizeUrlForLogging(url: string): string {
  const urlObj = new URL(url);
  return urlObj.origin + urlObj.pathname;
}

/**
 * Fetches a URL with automatic retry logic and exponential backoff.
 * Handles rate limiting (429 status codes) and network errors gracefully.
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options (headers, method, etc.)
 * @param retries - Number of retry attempts remaining (default: 3)
 * @param backoff - Initial backoff delay in milliseconds (default: 300ms, doubles each retry)
 * @returns Promise resolving to the fetch Response
 * @throws Error if all retries are exhausted
 */
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = 3, 
  backoff = 300
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // If we get rate limited (429) and have retries left, retry with backoff
    if (response.status === 429 && retries > 0) {
      const sanitizedUrl = sanitizeUrlForLogging(url);
      console.warn(`Rate limited when accessing ${sanitizedUrl}. Retrying after ${backoff}ms...`);
      
      // Wait for backoff period
      await new Promise(resolve => setTimeout(resolve, backoff));
      
      // Retry with increased backoff (exponential)
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      const sanitizedUrl = sanitizeUrlForLogging(url);
      console.warn(`Error fetching ${sanitizedUrl}, retrying...`);
      
      // Wait for backoff period
      await new Promise(resolve => setTimeout(resolve, backoff));
      
      // Retry with increased backoff
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    throw error;
  }
}

async function fetchFromCTFd<T>(endpoint: string, config: ApiConfig): Promise<T> {
  // Check if we've been rate limited recently and slow down requests
  if (lastRateLimitTime && Date.now() - lastRateLimitTime < 60000) {
    // Wait longer if we've had multiple rate limits recently
    const delayTime = Math.min(1000 * Math.pow(2, rateLimitCount), 10000);
    await new Promise(resolve => setTimeout(resolve, delayTime));
  }
  
  // Construct the full URL - direct call to CTFd API
  const fullUrl = `${config.apiUrl}/api/v1${endpoint}`;
  
  const res = await fetchWithRetry(
    fullUrl,
    {
      headers: {
        'Authorization': `Token ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    },
    3, // 3 retries
    300 // Starting backoff of 300ms
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    
    // Track rate limiting
    if (res.status === 429) {
      lastRateLimitTime = Date.now();
      rateLimitCount = Math.min(rateLimitCount + 1, 5);
      
      const retryAfter = res.headers.get('Retry-After');
      const errorMessage = `Rate limit exceeded. ${retryAfter ? `Try again after ${retryAfter} seconds.` : 'Try increasing the refetch interval in Dev Tools.'}`;
      throw new Error(errorMessage);
    }
    
    throw new Error(errorData.error || `Failed to fetch ${endpoint}: ${res.statusText}`);
  }

  const json = await res.json();
  
  if (json.success === false) {
    throw new Error(json.errors?.join(', ') || 'API request failed');
  }
  
  if (rateLimitCount > 0 && (!lastRateLimitTime || Date.now() - lastRateLimitTime > 60000)) {
    rateLimitCount = Math.max(0, rateLimitCount - 1);
  }
  
  return json.data;
}

async function fetchSubmissionsFromCTFd(endpoint: string, config: ApiConfig): Promise<SubmissionsResponse> {
  // Check if we've been rate limited recently and slow down requests
  if (lastRateLimitTime && Date.now() - lastRateLimitTime < 60000) {
    // Wait longer if we've had multiple rate limits recently
    const delayTime = Math.min(1000 * Math.pow(2, rateLimitCount), 10000);
    await new Promise(resolve => setTimeout(resolve, delayTime));
  }

  // Construct the full URL - direct call to CTFd API
  const fullUrl = `${config.apiUrl}/api/v1${endpoint}`;

  const res = await fetchWithRetry(
    fullUrl,
    {
      headers: {
        'Authorization': `Token ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    },
    3, // 3 retries
    300 // Starting backoff of 300ms
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    
    // Track rate limiting
    if (res.status === 429) {
      lastRateLimitTime = Date.now();
      rateLimitCount = Math.min(rateLimitCount + 1, 5);
    }
    
    throw new Error(errorData.error || `Failed to fetch ${endpoint}: ${res.statusText}`);
  }

  const json = await res.json();
  
  if (json.success === false) {
    throw new Error(json.errors?.join(', ') || 'API request failed');
  }
  
  if (rateLimitCount > 0 && (!lastRateLimitTime || Date.now() - lastRateLimitTime > 60000)) {
    rateLimitCount = Math.max(0, rateLimitCount - 1);
  }
  
  return json;
}

// Specific API functions - these now require config to be passed
export const getScoreboard = (config: ApiConfig): Promise<{ data: Record<string, ScoreboardEntry> }> => 
  fetchFromCTFd<Record<string, ScoreboardEntry>>('/scoreboard/top/10', config).then(data => ({ data }));

export const getFullScoreboard = (config: ApiConfig): Promise<ScoreboardEntry[]> => 
  fetchFromCTFd<ScoreboardEntry[]>('/scoreboard', config);

export const getChallenges = (config: ApiConfig): Promise<Challenge[]> => 
  fetchFromCTFd('/challenges', config);

export const getChallengeById = (id: number, config: ApiConfig): Promise<Challenge> => 
  fetchFromCTFd(`/challenges/${id}`, config);

export const getSubmissions = (config: ApiConfig, params?: {
  type?: 'correct' | 'incorrect';
  per_page?: number;
  page?: number;
  challenge_id?: number;
  user_id?: number;
}): Promise<SubmissionsResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.challenge_id) searchParams.set('challenge_id', params.challenge_id.toString());
  if (params?.user_id) searchParams.set('user_id', params.user_id.toString());

  const endpoint = `/submissions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return fetchSubmissionsFromCTFd(endpoint, config);
};

export const getCtfConfig = async (key: string, config: ApiConfig): Promise<string | null> => {
  try {
    const fullUrl = `${config.apiUrl}/api/v1/configs?key=${key}`;
    
    const response = await fetchWithRetry(
      fullUrl,
      {
        headers: {
          'Authorization': `Token ${config.apiToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      },
      3, // 3 retries
      300 // Starting backoff of 300ms
    );

    if (!response.ok) {
      return null;
    }

    const json: ConfigResponse = await response.json();

    if (json.success && json.data && json.data.length > 0) {
      return json.data[0].value;
    }
    return null;
  } catch {
    return null;
  }
};

export const getCtfName = (config: ApiConfig): Promise<string | null> => 
  getCtfConfig('ctf_name', config);

export const getCtfStart = (config: ApiConfig): Promise<number | null> => 
  getCtfConfig('start', config).then(value => value ? parseInt(value, 10) : null);

export const getCtfEnd = (config: ApiConfig): Promise<number | null> => 
  getCtfConfig('end', config).then(value => value ? parseInt(value, 10) : null);

export const getChallengeSolves = async (config: ApiConfig, challengeId: number): Promise<ChallengeSolvesResponse> => {
  const fullUrl = `${config.apiUrl}/api/v1/challenges/${challengeId}/solves`;
  
  const res = await fetchWithRetry(
    fullUrl,
    {
      headers: {
        'Authorization': `Token ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    },
    3, // 3 retries
    300 // Starting backoff of 300ms
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to fetch challenge solves: ${res.statusText}`);
  }

  return res.json();
};