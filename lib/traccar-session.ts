import { cookies } from 'next/headers';

import type { TraccarUser } from '@/lib/traccar-types';

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

async function toTraccarRequestError(response: Response, fallbackMessage: string): Promise<TraccarRequestError>
{
    const contentType = response.headers.get('content-type') ?? '';
    let details: unknown;

    try
    {
        if (contentType.includes('application/json'))
        {
            details = await response.json();
        }
        else
        {
            const text = await response.text();
            details = text || undefined;
        }
    }
    catch
    {
        details = undefined;
    }

    return new TraccarRequestError(response.status, fallbackMessage, details);
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
