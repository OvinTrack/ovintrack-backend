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


export interface FullTraccarUser extends TraccarUser
{
    phone: string;
    readonly: boolean;
    administrator: boolean;
    map: string;
    latitude: number;
    longitude: number;
    zoom: number;
    password: string;
    coordinateFormat: string;
    disabled: boolean;
    expirationTime: string;
    deviceLimit: number;
    userLimit: number;
    deviceReadonly: boolean;
    limitCommands: boolean;
    fixedEmail: boolean;
    poiLayer: string;
    attributes: {};
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
