import { Context, Schema } from 'koishi';

export const name: string;
export const inject: {
    required: string[];
    optional: string[];
};

export const Config: Schema;

export declare function apply(ctx: Context, cfg: any): void;
