const { globalCache, CACHE_KEYS, CACHE_TTL } = require('../util/cacheService');

const APIS = [
    'https://da.vtcm.link',
    'https://api.114512.xyz/truckersmp'
];

const PROXY_API = 'https://api.codetabs.com/v1/proxy/?quest=';

async function fetchWithFallback(http, endpoint, timeout = 10000) {
    let lastError = null;
    
    for (const baseUrl of APIS) {
        try {
            const result = await http.get(`${baseUrl}${endpoint}`, {
                timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            if (result && (result.code === 200 || result.data)) {
                return result;
            }
        } catch (e) {
            lastError = e;
            continue;
        }
    }
    
    try {
        const primaryUrl = `${APIS[0]}${endpoint}`;
        const result = await http.get(`${PROXY_API}${encodeURIComponent(primaryUrl)}`, { timeout: 15000 });
        if (result && (result.code === 200 || result.data)) {
            return result;
        }
    } catch (e) {
        lastError = e;
    }
    
    throw lastError || new Error('All APIs failed');
}

module.exports = {
    async serverList(http) {
        const cacheKey = CACHE_KEYS.SERVERS + '_list';
        const cached = globalCache.get(cacheKey);
        if (cached) return cached;

        try {
            const result = await fetchWithFallback(http, '/server/list');
            let data = {
                error: result.code !== 200
            };
            if (!data.error) {
                data.data = result.data;
            }
            globalCache.set(cacheKey, data, CACHE_TTL.SERVERS);
            return data;
        } catch {
            return { error: true };
        }
    },

    async mapPlayerList(http, serverId, ax, ay, bx, by) {
        const cacheKey = `map_players_${serverId}_${Math.floor(ax/1000)}_${Math.floor(ay/1000)}`;
        const cached = globalCache.get(cacheKey);
        if (cached) return cached;

        try {
            const result = await fetchWithFallback(http, `/map/playerList?aAxisX=${ax}&aAxisY=${ay}&bAxisX=${bx}&bAxisY=${by}&serverId=${serverId}`);
            let data = {
                error: result.code !== 200
            };
            if (!data.error) {
                data.data = result.data;
            }
            globalCache.set(cacheKey, data, 10000);
            return data;
        } catch {
            return { error: true };
        }
    },

    async playerInfo(http, tmpId) {
        const cacheKey = CACHE_KEYS.PLAYER_INFO + 'evm_' + tmpId;
        const cached = globalCache.get(cacheKey);
        if (cached) return cached;

        try {
            const result = await fetchWithFallback(http, `/player/info?tmpId=${tmpId}`);
            let data = {
                code: result.code,
                error: result.code !== 200
            };
            if (!data.error) {
                data.data = result.data;
            }
            globalCache.set(cacheKey, data, CACHE_TTL.PLAYER_INFO);
            return data;
        } catch (e) {
            return { error: true, code: 10002, message: e.message };
        }
    },

    async dlcList(http, type) {
        const cacheKey = `dlc_list_${type}`;
        const cached = globalCache.get(cacheKey);
        if (cached) return cached;

        try {
            const result = await fetchWithFallback(http, `/dlc/list?type=${type}`);
            let data = {
                error: result.code !== 200
            };
            if (!data.error) {
                data.data = result.data;
            }
            globalCache.set(cacheKey, data, 300000);
            return data;
        } catch {
            return { error: true };
        }
    },

    async mileageRankingList(http, rankingType, tmpId) {
        const cacheKey = `mileage_ranking_${rankingType}_${tmpId || 'all'}`;
        const cached = globalCache.get(cacheKey);
        if (cached) return cached;

        try {
            const result = await fetchWithFallback(http, `/statistics/mileageRankingList?rankingType=${rankingType}&tmpId=${tmpId || ''}&rankingCount=10`);
            let data = {
                error: result.code !== 200
            };
            if (!data.error) {
                data.data = result.data;
            }
            globalCache.set(cacheKey, data, 60000);
            return data;
        } catch {
            return { error: true };
        }
    },

    async mapPlayerHistory(http, tmpId, serverId, startTime, endTime) {
        try {
            const result = await fetchWithFallback(http, `/map/playerHistory?tmpId=${tmpId || ''}&serverId=${serverId || ''}&startTime=${startTime || ''}&endTime=${endTime || ''}`);
            let data = {
                error: result.code !== 200
            };
            if (!data.error) {
                data.data = result.data;
            }
            return data;
        } catch {
            return { error: true };
        }
    }
};
