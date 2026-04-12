class CacheService {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 60000;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }

    set(key, data, ttl = this.defaultTTL) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl
        });
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
}

const globalCache = new CacheService();

module.exports = {
    CacheService,
    globalCache,
    CACHE_KEYS: {
        SERVERS: 'tmp_servers',
        VERSION: 'tmp_version',
        PLAYER_INFO: 'tmp_player_',
        VTC_INFO: 'tmp_vtc_',
        TRAFFIC: 'tmp_traffic_',
        ONLINE: 'tmp_online_',
        ACTIVITY: 'tmp_activity',
        STEAM_PRICE: 'steam_price_'
    },
    CACHE_TTL: {
        SERVERS: 45000,
        VERSION: 300000,
        PLAYER_INFO: 20000,
        VTC_INFO: 120000,
        TRAFFIC: 25000,
        ONLINE: 15000,
        ACTIVITY: 60000,
        STEAM_PRICE: 300000
    }
};
