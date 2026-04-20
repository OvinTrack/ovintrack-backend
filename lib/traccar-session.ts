import { cookies } from 'next/headers';
import type { TraccarUser } from '@/types/traccar-types';

export const TRACCAR_SESSION_COOKIE_NAME = 'traccar_sid';

interface TraccarErrorPayload
{
    message: string;
    details?: unknown;
}

export class TraccarRequestError extends Error
{
    public readonly status: number;

    public readonly details?: unknown;

    public constructor(status: number, message: string, details?: unknown)
    {
        super(message);
        this.name = 'TraccarRequestError';
        this.status = status;
        this.details = details;
    }
}

function getTraccarBaseUrl(): string
{
    const baseUrl = process.env.TRACCAR_BASE_URL?.trim();

    if (!baseUrl)
    {
        throw new TraccarRequestError(500, 'TRACCAR_BASE_URL is not configured');
    }

    return baseUrl.replace(/\/+$/, '');
}

function getTraccarAdminCredentials(): { email: string; password: string }
{
    const email = process.env.TRACCAR_ADMIN_EMAIL?.trim();
    const password = process.env.TRACCAR_ADMIN_PASSWORD?.trim();

    if (!email || !password)
    {
        throw new TraccarRequestError(
            500,
            'TRACCAR_ADMIN_EMAIL and TRACCAR_ADMIN_PASSWORD must be configured',
        );
    }

    return { email, password };
}

function getSetCookieHeaders(headers: Headers): string[]
{
    const typedHeaders = headers as Headers & { getSetCookie?: () => string[] };

    if (typeof typedHeaders.getSetCookie === 'function')
    {
        return typedHeaders.getSetCookie();
    }

    const setCookie = headers.get('set-cookie');
    return setCookie ? [setCookie] : [];
}

function extractJSessionId(setCookieHeaders: string[]): string | null
{
    const regex = /JSESSIONID=([^;,\s]+)/i;

    for (const headerValue of setCookieHeaders)
    {
        const match = regex.exec(headerValue);

        if (match?.[1])
        {
            return `JSESSIONID=${match[1]}`;
        }
    }

    return null;
}

const ERROR_MESSAGE_KEYS = [
    'message',
    'error',
    'errorMessage',
    'error_description',
    'title',
    'detail',
    'details',
    'reason',
    'cause',
    'description',
    'errors',
    'violations',
    'fieldErrors',
] as const;

function extractMessageFromArray(details: unknown[], depth: number): string | null
{
    for (const item of details)
    {
        const nestedMessage = extractMessageFromErrorDetails(item, depth + 1);

        if (nestedMessage)
        {
            return nestedMessage;
        }
    }

    return null;
}

function extractMessageFromObject(details: Record<string, unknown>, depth: number): string | null
{
    for (const key of ERROR_MESSAGE_KEYS)
    {
        if (!(key in details))
        {
            continue;
        }

        const nestedMessage = extractMessageFromErrorDetails(details[key], depth + 1);

        if (nestedMessage)
        {
            return nestedMessage;
        }
    }

    // Fallback for unknown payload shapes: inspect all nested values.
    for (const value of Object.values(details))
    {
        const nestedMessage = extractMessageFromErrorDetails(value, depth + 1);

        if (nestedMessage)
        {
            return nestedMessage;
        }
    }

    return null;
}

function extractMessageFromErrorDetails(details: unknown, depth = 0): string | null
{
    if (depth > 4 || details == null)
    {
        return null;
    }

    if (typeof details === 'string')
    {
        return details.trim() || null;
    }

    if (Array.isArray(details))
    {
        return extractMessageFromArray(details, depth);
    }

    if (typeof details === 'object')
    {
        return extractMessageFromObject(details as Record<string, unknown>, depth);
    }

    return null;
}

async function toTraccarRequestError(response: Response, fallbackMessage: string): Promise<TraccarRequestError>
{
    const contentType = response.headers.get('content-type') ?? '';
    let details: unknown;
    let message = fallbackMessage;

    try
    {
        if (contentType.includes('application/json'))
        {
            details = await response.json();

            const detailsMessage = extractMessageFromErrorDetails(details);

            if (detailsMessage)
            {
                message = detailsMessage;
            }
        }
        else
        {
            const text = await response.text();
            details = text || undefined;

            if (text.trim())
            {
                message = text.trim();
            }
        }
    }
    catch
    {
        details = undefined;
    }

    return new TraccarRequestError(response.status, message, details);
}

export function getTraccarErrorPayload(error: unknown): { status: number; body: TraccarErrorPayload }
{
    if (error instanceof TraccarRequestError)
    {
        return {
            status: error.status,
            body: {
                message: error.message,
                details: error.details,
            },
        };
    }

    return {
        status: 500,
        body: {
            message: 'Internal server error',
        },
    };
}

export async function requireTraccarSessionCookie(): Promise<string>
{
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(TRACCAR_SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie)
    {
        throw new TraccarRequestError(401, 'Traccar session is required');
    }

    return sessionCookie;
}

export async function traccarLogin(email: string, password: string): Promise<TraccarUser | null>
{
    const response = await fetch(`${getTraccarBaseUrl()}/api/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ email, password }),
        cache: 'no-store',
    });

    if (!response.ok)
    {
        throw await toTraccarRequestError(response, 'Traccar login failed');
    }

    const jsessionid = extractJSessionId(getSetCookieHeaders(response.headers));

    if (!jsessionid)
    {
        throw new TraccarRequestError(500, 'Traccar did not return a JSESSIONID cookie');
    }

    const cookieStore = await cookies();
    cookieStore.set(TRACCAR_SESSION_COOKIE_NAME, jsessionid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    const userResponse = await fetch(`${getTraccarBaseUrl()}/api/session`, {
        headers: {
            Cookie: jsessionid,
        },
        cache: 'no-store',
    });

    if (!userResponse.ok || userResponse.status === 204)
    {
        return null;
    }

    const contentType = userResponse.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json'))
    {
        return null;
    }

    return await userResponse.json() as TraccarUser;
}

export async function traccarLogout(): Promise<void>
{
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(TRACCAR_SESSION_COOKIE_NAME)?.value;

    if (sessionCookie)
    {
        try
        {
            await fetch(`${getTraccarBaseUrl()}/api/session`, {
                method: 'DELETE',
                headers: {
                    Cookie: sessionCookie,
                },
                cache: 'no-store',
            });
        }
        catch
        {
            // Logout upstream is best-effort.
        }
    }

    cookieStore.delete(TRACCAR_SESSION_COOKIE_NAME);
}

export async function traccarFetch<T>(path: string, init?: RequestInit): Promise<T | null>
{
    const sessionCookie = await requireTraccarSessionCookie();

    const headers = new Headers(init?.headers);
    headers.set('Cookie', sessionCookie);

    const response = await fetch(`${getTraccarBaseUrl()}${path}`, {
        ...init,
        headers,
        cache: 'no-store',
    });

    if (!response.ok)
    {
        throw await toTraccarRequestError(response, `Traccar request failed (${response.status})`);
    }

    if (response.status === 204)
    {
        return null;
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json'))
    {
        const text = await response.text();
        if (!text)
        {
            return null;
        }

        throw new TraccarRequestError(
            502,
            'Traccar returned a non-JSON response',
            { contentType, text },
        );
    }

    return await response.json() as T;
}

export async function traccarAdminFetch<T>(path: string, init?: RequestInit): Promise<T | null>
{
    const { email, password } = getTraccarAdminCredentials();

    const loginResponse = await fetch(`${getTraccarBaseUrl()}/api/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ email, password }),
        cache: 'no-store',
    });

    if (!loginResponse.ok)
    {
        throw await toTraccarRequestError(loginResponse, 'Traccar admin login failed');
    }

    const adminSessionCookie = extractJSessionId(getSetCookieHeaders(loginResponse.headers));

    if (!adminSessionCookie)
    {
        throw new TraccarRequestError(500, 'Traccar did not return an admin JSESSIONID cookie');
    }

    const headers = new Headers(init?.headers);
    headers.set('Cookie', adminSessionCookie);

    const response = await fetch(`${getTraccarBaseUrl()}${path}`, {
        ...init,
        headers,
        cache: 'no-store',
    });

    if (!response.ok)
    {
        throw await toTraccarRequestError(response, `Traccar admin request failed (${response.status})`);
    }

    if (response.status === 204)
    {
        return null;
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json'))
    {
        const text = await response.text();
        if (!text)
        {
            return null;
        }

        throw new TraccarRequestError(
            502,
            'Traccar returned a non-JSON response',
            { contentType, text },
        );
    }

    return await response.json() as T;
}
