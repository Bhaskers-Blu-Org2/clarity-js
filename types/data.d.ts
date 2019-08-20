import { IDecodedMetric } from "./metric";

export type Token = (string | number | number[] | string[]);
export type DecodedToken = (any | any[]);

export const enum Event {
    Metadata,
    Discover,
    Mutation,
    Mouse,
    Touch,
    Keyboard,
    Selection,
    Resize,
    Scroll,
    Document,
    Visibility,
    Network,
    Performance,
    ScriptError,
    ImageError
}

export const enum Flush {
    Schedule,
    Force,
    None
}

export interface IEventQueue {
    one: Token[][];
    two: Token[][];
}

export interface IPayload {
    e: Token[];
    m: Token[];
    a: Token[][];
    b: Token[][];
}

export interface IDecodedPayload {
    envelope: IEnvelope;
    metrics: IDecodedMetric;
    events: IDecodedEvent[];
}

export interface IDecodedEvent {
    time: number;
    event: Event;
    data: any;
}

export interface IEnvelope {
    sequence: number;
    version: string;
    pageId: string;
    userId: string;
    projectId: string;
}

export interface IMetadata extends IEnvelope {
    url: string;
    title: string;
    referrer: string;
}