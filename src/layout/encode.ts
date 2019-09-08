import {Event, Token} from "@clarity-types/data";
import {INodeData} from "@clarity-types/layout";
import {Metric} from "@clarity-types/metric";
import mask from "@src/core/mask";
import * as task from "@src/core/task";
import time from "@src/core/time";
import hash from "@src/data/hash";
import {check} from "@src/data/token";
import { queue } from "@src/data/upload";
import * as metric from "@src/metric";
import * as boxmodel from "./boxmodel";
import {doc} from "./document";
import * as dom from "./dom";

export default async function(type: Event): Promise<void> {
    let tokens: Token[] = [time(), type];
    let timer = type === Event.Discover ? Metric.DiscoverTime : Metric.MutationTime;
    switch (type) {
        case Event.Document:
            let d = doc;
            tokens.push(d.width);
            tokens.push(d.height);
            metric.measure(Metric.DocumentWidth, d.width);
            metric.measure(Metric.DocumentHeight, d.height);
            queue(tokens);
            break;
        case Event.BoxModel:
            let bm = boxmodel.updates();
            for (let value of bm) {
                tokens.push(value.id);
                tokens.push(value.box);
            }
            queue(tokens);
            break;
        case Event.Checksum:
            let selectors = dom.selectors();
            let reference = 0;
            for (let value of selectors) {
                if (task.longtask(timer)) { await task.idle(timer); }
                let checksum = hash(value.selector);
                let pointer = tokens.indexOf(checksum);
                tokens.push(value.id - reference);
                tokens.push(pointer >= 0 ? [pointer] : checksum);
                reference = value.id;
            }
            queue(tokens);
            break;
        case Event.Discover:
        case Event.Mutation:
            let values = dom.updates();
            for (let value of values) {
                if (task.longtask(timer)) { await task.idle(timer); }
                let metadata = [];
                let data: INodeData = value.data;
                let keys = ["tag", "path", "attributes", "value"];
                for (let key of keys) {
                    if (data[key]) {
                        switch (key) {
                            case "tag":
                                metric.counter(Metric.Nodes);
                                tokens.push(value.id);
                                if (value.parent) { tokens.push(value.parent); }
                                if (value.next) { tokens.push(value.next); }
                                metadata.push(data[key]);
                                break;
                            case "path":
                                metadata.push(`${value.data.path}>`);
                                break;
                            case "attributes":
                                for (let attr in data[key]) {
                                    if (data[key][attr] !== undefined) {
                                        metadata.push(attribute(value.metadata.masked, attr, data[key][attr]));
                                    }
                                }
                                break;
                            case "value":
                                let parent = dom.getNode(value.parent);
                                let parentTag = dom.get(parent) ? dom.get(parent).data.tag : null;
                                let tag = value.data.tag === "STYLE" ? value.data.tag : parentTag;
                                metadata.push(text(value.metadata.masked, tag, data[key]));
                                break;
                        }
                    }
                }

                // Add metadata
                metadata = meta(metadata);
                for (let token of metadata) {
                    let index: number = typeof token === "string" ? tokens.indexOf(token) : -1;
                    tokens.push(index >= 0 && token.length > index.toString().length ? [index] : token);
                }
            }
            queue(tokens);
            break;
        }
}

function meta(metadata: string[]): string[] | string[][] {
    let value = JSON.stringify(metadata);
    let hashed = hash(value);
    return check(hashed) && hashed.length < value.length ? [[hashed]] : metadata;
}

function attribute(masked: boolean, key: string, value: string): string {
    switch (key) {
        case "src":
        case "srcset":
        case "title":
        case "alt":
            return `${key}=${masked ? "" : value}`;
        case "value":
        case "placeholder":
            return `${key}=${masked ? mask(value) : value}`;
        default:
            return `${key}=${value}`;
    }
}

function text(masked: boolean, tag: string, value: string): string {
    switch (tag) {
        case "STYLE":
        case "TITLE":
            return value;
        default:
            return masked ? mask(value) : value;
    }
}
