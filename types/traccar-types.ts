export interface TraccarDevice
{
    id: number;
    name: string;
    uniqueId: string;
}

export interface TraccarPosition
{
    id: number;
    deviceId: number;
    latitude: number;
    longitude: number;
    time: string;
    fixTime?: string;
}

export interface TraccarUser
{
    id: number;
    name: string;
    email: string;
}

export interface ApiError
{
    message?: string;
}

export interface Ovin
{
    device: TraccarDevice;
    position: TraccarPosition;
}