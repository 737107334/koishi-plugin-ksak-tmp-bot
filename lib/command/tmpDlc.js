const { resolve } = require('path');
const { segment } = require('koishi');
const common = require('../util/common');

const ETS2_APP_ID = 227300;
const ATS_APP_ID = 270880;

const RECOMMENDED_ETS2_DLCS = [
    { id: 229580, name: 'Going East!', priority: 1, desc: '东欧地图扩展' },
    { id: 261920, name: 'Scandinavia', priority: 1, desc: '斯堪的纳维亚地图扩展' },
    { id: 375850, name: 'Vive la France!', priority: 1, desc: '法国地图扩展' },
    { id: 506060, name: 'Italia', priority: 1, desc: '意大利地图扩展' },
    { id: 730440, name: 'Beyond the Baltic Sea', priority: 1, desc: '波罗的海地图扩展' },
    { id: 843880, name: 'Road to the Black Sea', priority: 2, desc: '黑海地图扩展' },
    { id: 1089940, name: 'Iberia', priority: 2, desc: '伊比利亚地图扩展' },
    { id: 1298940, name: 'Heart of Russia', priority: 2, desc: '俄罗斯心脏地图扩展' },
    { id: 2397310, name: 'West Balkans', priority: 2, desc: '西巴尔干地图扩展' },
    { id: 227310, name: 'Paint Jobs Pack', priority: 3, desc: '涂装包' },
    { id: 227320, name: 'Cabin Accessories', priority: 3, desc: '驾驶室配件' },
    { id: 227330, name: 'Mighty Griffin Tuning Pack', priority: 3, desc: '格里芬改装包' },
    { id: 227340, name: 'Heavy Cargo Pack', priority: 2, desc: '重型货物包' },
    { id: 227350, name: 'Falcon Tuning Pack', priority: 3, desc: '猎鹰改装包' },
    { id: 258520, name: 'Scania R & Streamline', priority: 2, desc: '斯堪尼亚R系列' },
    { id: 258530, name: 'Volvo FH Classic', priority: 2, desc: '沃尔沃FH经典版' },
    { id: 302391, name: 'Schwarzmüller Trailer Pack', priority: 2, desc: '施瓦茨米勒拖车包' },
    { id: 544201, name: 'Feldbinder Trailer Pack', priority: 3, desc: '费尔德宾德拖车包' },
    { id: 544202, name: 'Kögel Trailer Pack', priority: 3, desc: '科格尔拖车包' },
    { id: 742490, name: 'Volvo Construction Equipment', priority: 3, desc: '沃尔沃工程设备' },
    { id: 742491, name: 'Michelin Fan Pack', priority: 3, desc: '米其林粉丝包' },
    { id: 742492, name: 'HS-Schoch Tuning Pack', priority: 3, desc: 'HS-Schoch改装包' },
    { id: 742493, name: 'Goodyear Tires Pack', priority: 3, desc: '固特异轮胎包' },
    { id: 953530, name: 'Daf Tuning Pack', priority: 3, desc: 'DAF改装包' },
    { id: 953531, name: 'Man Tuning Pack', priority: 3, desc: 'MAN改装包' },
    { id: 953532, name: 'Scania Tuning Pack', priority: 3, desc: '斯堪尼亚改装包' },
    { id: 953533, name: 'Volvo Tuning Pack', priority: 3, desc: '沃尔沃改装包' },
    { id: 1044940, name: 'Renault Tuning Pack', priority: 3, desc: '雷诺改装包' },
    { id: 1044941, name: 'Iveco Tuning Pack', priority: 3, desc: '依维柯改装包' },
    { id: 1044942, name: 'Mercedes-Benz Tuning Pack', priority: 3, desc: '奔驰改装包' },
    { id: 1180950, name: 'Schwarzmüller Trailers', priority: 3, desc: '施瓦茨米勒拖车' },
    { id: 1180951, name: 'Window Flags', priority: 3, desc: '窗户旗帜' },
    { id: 1280210, name: 'Daf XG/XG+', priority: 2, desc: 'DAF XG/XG+卡车' },
    { id: 1280211, name: 'Renault T Tuning Pack', priority: 3, desc: '雷诺T改装包' },
    { id: 1280212, name: 'Window Banners', priority: 3, desc: '窗户横幅' },
    { id: 1411180, name: 'Porsche Design Tuning Pack', priority: 3, desc: '保时捷设计改装包' },
    { id: 1411181, name: 'Krone Trailer Pack', priority: 2, desc: '克朗拖车包' },
    { id: 1578650, name: 'Feldbinder Trailer Pack', priority: 3, desc: '费尔德宾德拖车包' },
    { id: 1578651, name: 'Ekeri Trailer Pack', priority: 3, desc: '埃克里拖车包' },
    { id: 1937720, name: 'Austria Tuning Pack', priority: 3, desc: '奥地利改装包' },
    { id: 1937721, name: 'Lode King Trailer Pack', priority: 3, desc: '洛德国王拖车包' },
    { id: 1937722, name: 'JCS Trailer Pack', priority: 3, desc: 'JCS拖车包' },
    { id: 2201790, name: 'JCB Equipment Pack', priority: 3, desc: 'JCB设备包' },
    { id: 2201791, name: 'Renault Trucks E-Tech T', priority: 2, desc: '雷诺电动卡车' },
    { id: 2201792, name: 'Scania S BEV', priority: 2, desc: '斯堪尼亚电动卡车' },
];

const RECOMMENDED_ATS_DLCS = [
    { id: 270940, name: 'Nevada', priority: 1, desc: '内华达州（免费）' },
    { id: 270950, name: 'Arizona', priority: 1, desc: '亚利桑那州（免费）' },
    { id: 284930, name: 'New Mexico', priority: 1, desc: '新墨西哥州' },
    { id: 324950, name: 'Oregon', priority: 1, desc: '俄勒冈州' },
    { id: 474340, name: 'Washington', priority: 1, desc: '华盛顿州' },
    { id: 532610, name: 'Utah', priority: 1, desc: '犹他州' },
    { id: 656360, name: 'Colorado', priority: 1, desc: '科罗拉多州' },
    { id: 843870, name: 'Wyoming', priority: 2, desc: '怀俄明州' },
    { id: 1089950, name: 'Montana', priority: 2, desc: '蒙大拿州' },
    { id: 1298930, name: 'Texas', priority: 2, desc: '德克萨斯州' },
    { id: 1872740, name: 'Oklahoma', priority: 2, desc: '俄克拉荷马州' },
    { id: 2133890, name: 'Kansas', priority: 2, desc: '堪萨斯州' },
    { id: 2401930, name: 'Nebraska', priority: 2, desc: '内布拉斯加州' },
    { id: 2616880, name: 'Arkansas', priority: 2, desc: '阿肯色州' },
    { id: 2737180, name: 'Missouri', priority: 2, desc: '密苏里州' },
    { id: 270960, name: 'Peterbilt 579', priority: 2, desc: '彼得比尔特579' },
    { id: 270970, name: 'Kenworth T680', priority: 2, desc: '肯沃斯T680' },
    { id: 270980, name: 'Paint Jobs Pack', priority: 3, desc: '涂装包' },
    { id: 270990, name: 'Cabin Accessories', priority: 3, desc: '驾驶室配件' },
    { id: 271010, name: 'Mighty Griffin Tuning Pack', priority: 3, desc: '格里芬改装包' },
    { id: 271020, name: 'Heavy Cargo Pack', priority: 2, desc: '重型货物包' },
    { id: 271030, name: 'Stealth Paint Jobs Pack', priority: 3, desc: '隐形涂装包' },
    { id: 271040, name: 'Ice Cold Paint Jobs Pack', priority: 3, desc: '冰冷涂装包' },
    { id: 271050, name: 'Prehistoric Paint Jobs Pack', priority: 3, desc: '史前涂装包' },
    { id: 271060, name: 'Patriot Paint Jobs Pack', priority: 3, desc: '爱国者涂装包' },
    { id: 271070, name: 'Valentine Paint Jobs Pack', priority: 3, desc: '情人节涂装包' },
    { id: 271080, name: 'Force of Nature', priority: 3, desc: '自然之力涂装包' },
    { id: 271090, name: 'American Hero Paint Jobs Pack', priority: 3, desc: '美国英雄涂装包' },
    { id: 271100, name: 'Halloween Paint Jobs Pack', priority: 3, desc: '万圣节涂装包' },
    { id: 271110, name: 'Thanksgiving Paint Jobs Pack', priority: 3, desc: '感恩节涂装包' },
    { id: 271120, name: 'Christmas Paint Jobs Pack', priority: 3, desc: '圣诞节涂装包' },
    { id: 271130, name: 'Dragon Truck Design Pack', priority: 3, desc: '龙卡车设计包' },
    { id: 271140, name: 'Falcon Tuning Pack', priority: 3, desc: '猎鹰改装包' },
    { id: 271150, name: 'Volvo Construction Equipment', priority: 3, desc: '沃尔沃工程设备' },
    { id: 271160, name: 'Schwarzmüller Trailer Pack', priority: 2, desc: '施瓦茨米勒拖车包' },
    { id: 271170, name: 'Michelin Fan Pack', priority: 3, desc: '米其林粉丝包' },
    { id: 271180, name: 'HS-Schoch Tuning Pack', priority: 3, desc: 'HS-Schoch改装包' },
    { id: 271190, name: 'Goodyear Tires Pack', priority: 3, desc: '固特异轮胎包' },
    { id: 742500, name: 'Kenworth W900', priority: 2, desc: '肯沃斯W900' },
    { id: 742501, name: 'Peterbilt 389', priority: 2, desc: '彼得比尔特389' },
    { id: 953540, name: 'Peterbilt Tuning Pack', priority: 3, desc: '彼得比尔特改装包' },
    { id: 953541, name: 'Kenworth Tuning Pack', priority: 3, desc: '肯沃斯改装包' },
    { id: 1044950, name: 'International LoneStar', priority: 2, desc: '万国LoneStar卡车' },
    { id: 1044951, name: 'Window Flags', priority: 3, desc: '窗户旗帜' },
    { id: 1180960, name: 'Schwarzmüller Trailers', priority: 3, desc: '施瓦茨米勒拖车' },
    { id: 1180961, name: 'Window Banners', priority: 3, desc: '窗户横幅' },
    { id: 1280220, name: 'Mack Anthem', priority: 2, desc: '马克Anthem卡车' },
    { id: 1280221, name: 'Western Star 49X', priority: 2, desc: '西星49X卡车' },
    { id: 1411190, name: 'Porsche Design Tuning Pack', priority: 3, desc: '保时捷设计改装包' },
    { id: 1411191, name: 'Krone Trailer Pack', priority: 2, desc: '克朗拖车包' },
    { id: 1578660, name: 'Freightliner Cascadia', priority: 2, desc: '福莱纳Cascadia卡车' },
    { id: 1937730, name: 'International LT', priority: 2, desc: '万国LT卡车' },
    { id: 2201800, name: 'JCB Equipment Pack', priority: 3, desc: 'JCB设备包' },
];

module.exports = async (ctx, session, gameType) => {
    if (!ctx.puppeteer) {
        return '未启用 Puppeteer 功能';
    }

    const appId = gameType === 'ats' ? ATS_APP_ID : ETS2_APP_ID;
    const gameName = gameType === 'ats' ? '美卡 (ATS)' : '欧卡2 (ETS2)';
    const recommendedDlcs = gameType === 'ats' ? RECOMMENDED_ATS_DLCS : RECOMMENDED_ETS2_DLCS;

    const dlcPrices = await fetchDlcPrices(ctx, recommendedDlcs);

    let page;
    try {
        page = await ctx.puppeteer.page();
        await page.setViewport({ width: 800, height: 1500 });
        await page.goto(`file:///${resolve(__dirname, '../resource/dlc-recommend.html')}`);
        await page.evaluate(`setData(${JSON.stringify({
            gameName,
            dlcs: dlcPrices
        })})`);
        await page.waitForNetworkIdle();
        await common.sleep(500);

        const container = await page.$("#dlc-container");
        if (!container) {
            return '查询DLC信息失败';
        }

        return segment.image(await container.screenshot({
            encoding: "binary"
        }), "image/jpg");
    } catch (error) {
        ctx.logger('tmpDlc').error('生成DLC图片失败:', error);
        return '查询DLC信息失败，请稍后重试';
    } finally {
        if (page) {
            await page.close();
        }
    }
};

async function fetchDlcPrices(ctx, dlcs) {
    const results = [];
    const batchSize = 5;

    for (let i = 0; i < dlcs.length; i += batchSize) {
        const batch = dlcs.slice(i, i + batchSize);
        const promises = batch.map(dlc => fetchSingleDlcPrice(ctx, dlc));
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
}

async function fetchSingleDlcPrice(ctx, dlc) {
    try {
        const url = `https://store.steampowered.com/api/appdetails?appids=${dlc.id}&cc=cn`;
        const response = await ctx.http.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        const appData = response[dlc.id.toString()];
        const result = {
            id: dlc.id,
            name: dlc.name,
            desc: dlc.desc,
            priority: dlc.priority,
            price: '免费',
            discount: 0,
            originalPrice: 0,
            finalPrice: 0,
            isFree: true
        };

        if (appData?.success && appData.data) {
            const data = appData.data;
            result.name = data.name || dlc.name;
            result.isFree = data.is_free;

            if (data.is_free) {
                result.price = '免费';
            } else if (data.price_overview) {
                const priceData = data.price_overview;
                result.discount = priceData.discount_percent || 0;
                result.originalPrice = priceData.initial;
                result.finalPrice = priceData.final;
                result.price = priceData.final_formatted || `¥${(priceData.final / 100).toFixed(2)}`;
            }
        }

        return result;
    } catch (error) {
        ctx.logger('tmpDlc').warn(`获取DLC价格失败: ${dlc.name}`, error.message);
        return {
            id: dlc.id,
            name: dlc.name,
            desc: dlc.desc,
            priority: dlc.priority,
            price: '获取失败',
            discount: 0,
            originalPrice: 0,
            finalPrice: 0,
            isFree: false
        };
    }
}
