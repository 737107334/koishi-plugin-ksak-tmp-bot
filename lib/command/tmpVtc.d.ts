export interface VTCInfo {
    id: number;
    name: string;
    logo: string;
    owner_id: number;
    owner_username: string;
    created: string;
    members_count: number;
    tag: string;
    website: string;
}

export default function tmpVtc(ctx: any, cfg: any, session: any, vtcid: string): Promise<string>;
