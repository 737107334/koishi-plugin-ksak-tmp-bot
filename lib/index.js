"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.inject = exports.name = void 0;
exports.apply = apply;
const koishi_1 = require("koishi");
const model = require('./database/model');
const guildBind = require('./database/guildBind');
const { MileageRankingType, ServerType } = require('./util/constant');
const tmpQuery = require('./command/tmpQuery');
const tmpServer = require('./command/tmpServer');
const tmpBind = require('./command/tmpBind');
const tmpTraffic = require('./command/tmpTraffic/tmpTraffic');
const tmpPosition = require('./command/tmpPosition');
const tmpVersion = require('./command/tmpVersion');
const tmpDlcMap = require('./command/tmpDlcMap');
const tmpMileageRanking = require('./command/tmpMileageRanking');
const tmpFootprint = require('./command/tmpFootprint');
const tmpVtc = require('./command/tmpVtc');
const tmpTime = require('./command/tmpTime');
const tmpDlc = require('./command/tmpDlc');
exports.name = 'ksak-tmp';
exports.inject = {
    required: ['database'],
    optional: ['puppeteer']
};
const ETS2_APP_ID = 227300;
const ATS_APP_ID = 270880;

exports.Config = koishi_1.Schema.intersect([
    koishi_1.Schema.object({
        adInfo: koishi_1.Schema.string().default('').description('阿K传媒机器人TruckersMP查询插件 QQ作者: 737107334 欧卡交流群：681138670'),
    }).description('📢 插件介绍'),
    koishi_1.Schema.object({
        baiduTranslateEnable: koishi_1.Schema.boolean().default(false).description('启用百度翻译'),
        baiduTranslateAppId: koishi_1.Schema.string().description('百度翻译APP ID'),
        baiduTranslateKey: koishi_1.Schema.string().description('百度翻译秘钥'),
        baiduTranslateCacheEnable: koishi_1.Schema.boolean().default(false).description('启用百度翻译缓存'),
        steamApiKey: koishi_1.Schema.string().description('Steam Web API Key（用于查询欧卡2/美卡游戏时长）')
    }).description('基本配置'),
    koishi_1.Schema.object({
        queryShowAvatarEnable: koishi_1.Schema.boolean().default(false).description('查询指令展示头像，部分玩家的擦边头像可能导致封号'),
        queryVtcEnable: koishi_1.Schema.boolean().default(false).description('查询指令显示VTC车队信息'),
        queryEts2PlaytimeEnable: koishi_1.Schema.boolean().default(false).description('查询指令显示欧卡2运行时间'),
        tmpTrafficType: koishi_1.Schema.union([
            koishi_1.Schema.const(1).description('文字'),
            koishi_1.Schema.const(2).description('热力图')
        ]).default(1).description('路况信息展示方式')
    }).description('指令配置'),
    koishi_1.Schema.object({
        versionCheckEnable: koishi_1.Schema.boolean().default(false).description('启用TMP版本更新通知'),
        versionCheckInterval: koishi_1.Schema.number().default(30).min(5).description('检查间隔（分钟）'),
        versionCheckGroups: koishi_1.Schema.array(koishi_1.Schema.string()).role('table').description('接收通知的群号列表').default([])
    }).description('版本更新通知配置'),
    koishi_1.Schema.object({
        steamDiscountCheckInterval: koishi_1.Schema.number().default(60).min(5).description('Steam价格检查间隔（分钟）'),
        steamDiscountNotify: koishi_1.Schema.boolean().default(true).description('发现Steam折扣时发送通知'),
        steamDiscountGroups: koishi_1.Schema.array(koishi_1.Schema.string()).role('table').description('接收打折通知的群号列表').default([])
    }).description('Steam打折通知配置')
]);

class SteamDiscountService {
    constructor(ctx, config) {
        this.logger = ctx.logger('steam-discount');
        this.lastPrices = new Map();
        this.ctx = ctx;
        this.config = config;
        this.initDatabase();
        this.registerCommands();
        if (config.steamDiscountCheckInterval > 0) {
            this.startPriceCheck();
        }
    }

    async initDatabase() {
        this.ctx.model.extend('steam_discount_notify', {
            id: 'unsigned',
            platform: 'string',
            channelId: 'string',
            ets2Enabled: 'boolean',
            atsEnabled: 'boolean',
        }, {
            primary: 'id',
            autoInc: true,
            unique: [['platform', 'channelId']],
        });
    }

    registerCommands() {
        this.ctx.command('查询游戏价格', '查询欧卡和美卡Steam价格')
            .action(async () => await this.getPriceInfo());

        this.ctx.command('欧卡打折', '查询欧卡2 Steam打折活动')
            .action(async () => await this.getSingleGamePriceInfo('ets2'));

        this.ctx.command('steam打折管理', '管理Steam打折通知订阅')
            .alias('打折管理')
            .action(async ({ session }) => {
                if (!session) return '会话错误';
                return await this.getSubscriptionPanel(session);
            });

        this.ctx.command('欧卡打折设置', '开关欧卡打折通知')
            .alias('欧卡通知')
            .action(async ({ session }) => {
                if (!session) return '会话错误';
                return await this.toggleSubscription(session, 'ets2');
            });
    }

    async getSubscriptionPanel(session) {
        const platform = session.platform;
        const channelId = session.channelId;

        let record = await this.ctx.database.get('steam_discount_notify', {
            platform,
            channelId,
        });

        const current = record[0] || { ets2Enabled: false };

        const ets2Status = current.ets2Enabled ? '✅ 已开启' : '❌ 已关闭';

        const ets2BtnLabel = current.ets2Enabled ? '🔴 关闭欧卡通知' : '🟢 开启欧卡通知';

        return (0, koishi_1.h)('message', [
            (0, koishi_1.h)('p', '🎮 Steam打折通知订阅'),
            (0, koishi_1.h)('p', `🚛 欧卡2打折通知: ${ets2Status}`),
            (0, koishi_1.h)('p', '点击下方按钮开关：'),
            (0, koishi_1.h)('button', { type: 'action', label: ets2BtnLabel }, '欧卡打折设置'),
        ]);
    }

    async toggleSubscription(session, type) {
        const platform = session.platform;
        const channelId = session.channelId;

        let record = await this.ctx.database.get('steam_discount_notify', {
            platform,
            channelId,
        });

        const gameName = type === 'ets2' ? '欧卡2 (ETS2)' : '美卡 (ATS)';

        if (record.length === 0) {
            const newRecord = {
                id: 0,
                platform,
                channelId,
                ets2Enabled: type === 'ets2',
                atsEnabled: type === 'ats',
            };
            await this.ctx.database.create('steam_discount_notify', newRecord);
            return `${gameName} 打折通知已开启 ✅`;
        } else {
            const current = record[0];
            if (type === 'ets2') {
                current.ets2Enabled = !current.ets2Enabled;
            } else {
                current.atsEnabled = !current.atsEnabled;
            }
            await this.ctx.database.set('steam_discount_notify', current.id, {
                ets2Enabled: current.ets2Enabled,
                atsEnabled: current.atsEnabled,
            });
            const status = type === 'ets2' ? current.ets2Enabled : current.atsEnabled;
            return `${gameName} 打折通知${status ? '已开启 ✅' : '已关闭 ❌'}`;
        }
    }

    async fetchSteamPrice(appId) {
        try {
            const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=cn&filters=price_overview`;
            const response = await this.ctx.http.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });

            const appData = response[appId.toString()];
            if (!appData?.success || !appData.data?.price_overview) {
                this.logger.warn(`Steam API返回数据异常: ${appId}`, JSON.stringify(response));
                return null;
            }

            const priceData = appData.data.price_overview;
            return {
                appid: appId,
                name: appId === ETS2_APP_ID ? 'Euro Truck Simulator 2' : 'American Truck Simulator',
                price: priceData.final_formatted,
                discount: priceData.discount_percent,
                initialPrice: priceData.initial,
                finalPrice: priceData.final,
                currency: priceData.currency,
            };
        } catch (error) {
            this.logger.error(`获取Steam价格失败: ${appId}`, error.message || error);
            return null;
        }
    }

    async getPriceInfo() {
        const [ets2Price, atsPrice] = await Promise.all([
            this.fetchSteamPrice(ETS2_APP_ID),
            this.fetchSteamPrice(ATS_APP_ID),
        ]);

        if (!ets2Price && !atsPrice) {
            return `🎮 Steam游戏价格查询

⚠️ 暂时无法获取价格信息，请稍后重试。

可能原因：
1. 网络连接问题
2. Steam服务暂时不可用
请直接访问Steam商店查看价格：
🚛 欧卡2: https://store.steampowered.com/app/227300
🚚 美卡: https://store.steampowered.com/app/270880`;
        }

        const lines = ['🎮 Steam游戏价格查询\n'];

        if (ets2Price) {
            lines.push(`🚛 欧卡2 (ETS2)`);
            if (ets2Price.discount > 0) {
                lines.push(`   💰 原价: ¥${(ets2Price.initialPrice / 100).toFixed(2)}`);
                lines.push(`   🏷️ 现价: ${ets2Price.price}`);
                lines.push(`   📉 折扣: -${ets2Price.discount}%`);
            } else {
                lines.push(`   💰 价格: ${ets2Price.price}`);
                lines.push(`   📊 暂无折扣`);
            }
            lines.push('');
        }

        if (atsPrice) {
            lines.push(`🚚 美卡 (ATS)`);
            if (atsPrice.discount > 0) {
                lines.push(`   💰 原价: ¥${(atsPrice.initialPrice / 100).toFixed(2)}`);
                lines.push(`   🏷️ 现价: ${atsPrice.price}`);
                lines.push(`   📉 折扣: -${atsPrice.discount}%`);
            } else {
                lines.push(`   💰 价格: ${atsPrice.price}`);
                lines.push(`   📊 暂无折扣`);
            }
        }

        return lines.join('\n');
    }

    async getSingleGamePriceInfo(type) {
        const appId = type === 'ets2' ? ETS2_APP_ID : ATS_APP_ID;
        const gameName = type === 'ets2' ? '欧卡2 (Euro Truck Simulator 2)' : '美卡';
        const emoji = type === 'ets2' ? '🚛' : '🚚';

        const price = await this.fetchSteamPrice(appId);

        if (!price) {
            return `${emoji} ${gameName}\n获取价格信息失败，请稍后重试`;
        }

        const lines = [];
        lines.push('═══════════════════════════');

        if (price.discount > 0) {
            lines.push(`${emoji} ${gameName}`);
            lines.push('═══════════════════════════');
            lines.push('');
            lines.push('🎉 🎉 🎉 正在打折！ 🎉 🎉 🎉');
            lines.push('');
            lines.push(`💰 原价: ¥${(price.initialPrice / 100).toFixed(2)}`);
            lines.push(`🏷️ 现价: ${price.price}`);
            lines.push(`📉 折扣: -${price.discount}%`);
            lines.push('');
            lines.push('────────────────────────────');
            lines.push(`🔗 购买链接:`);
            lines.push(`https://store.steampowered.com/app/${appId}`);
        } else {
            lines.push(`${emoji} ${gameName}`);
            lines.push('═══════════════════════════');
            lines.push('');
            lines.push(`💰 当前价格: ${price.price}`);
            lines.push(`📊 暂无折扣活动`);
            lines.push('');
            lines.push('────────────────────────────');
            lines.push(`🔗 商店链接:`);
            lines.push(`https://store.steampowered.com/app/${appId}`);
        }
        lines.push('');
        lines.push('═══════════════════════════');

        return lines.join('\n');
    }

    startPriceCheck() {
        this.ctx.setInterval(async () => {
            await this.checkAndNotify();
        }, this.config.steamDiscountCheckInterval * 60 * 1000);
    }

    async checkAndNotify() {
        const [ets2Price, atsPrice] = await Promise.all([
            this.fetchSteamPrice(ETS2_APP_ID),
            this.fetchSteamPrice(ATS_APP_ID),
        ]);

        const notifications = [];

        if (ets2Price && ets2Price.discount > 0) {
            const last = this.lastPrices.get(ETS2_APP_ID);
            if (!last || last.discount !== ets2Price.discount) {
                notifications.push({ appId: ETS2_APP_ID, price: ets2Price, type: 'ets2' });
            }
            this.lastPrices.set(ETS2_APP_ID, { discount: ets2Price.discount, price: ets2Price.finalPrice });
        }

        if (atsPrice && atsPrice.discount > 0) {
            const last = this.lastPrices.get(ATS_APP_ID);
            if (!last || last.discount !== atsPrice.discount) {
                notifications.push({ appId: ATS_APP_ID, price: atsPrice, type: 'ats' });
            }
            this.lastPrices.set(ATS_APP_ID, { discount: atsPrice.discount, price: atsPrice.finalPrice });
        }

        if (notifications.length === 0) return;

        for (const notif of notifications) {
            const message = this.formatDiscountMessage(notif.price, notif.type);
            
            if (this.config.steamDiscountGroups && this.config.steamDiscountGroups.length > 0) {
                for (const groupId of this.config.steamDiscountGroups) {
                    await this.broadcastToGroup(groupId, message);
                }
            }
        }

        const subscribers = await this.ctx.database.get('steam_discount_notify', {});

        for (const sub of subscribers) {
            for (const notif of notifications) {
                if ((notif.type === 'ets2' && sub.ets2Enabled) || (notif.type === 'ats' && sub.atsEnabled)) {
                    const message = this.formatDiscountMessage(notif.price, notif.type);
                    await this.broadcast(sub.platform, sub.channelId, message);
                }
            }
        }
    }

    async broadcastToGroup(groupId, message) {
        try {
            for (const bot of this.ctx.bots) {
                try {
                    await bot.sendMessage(groupId, message);
                    this.logger.info(`已发送打折通知到群 ${groupId}`);
                    return;
                } catch (e) {
                    continue;
                }
            }
            this.logger.warn(`无法发送打折通知到群 ${groupId}，没有可用的机器人`);
        } catch (error) {
            this.logger.error(`发送打折通知到群 ${groupId} 失败`, error);
        }
    }

    formatDiscountMessage(price, type) {
        const gameName = type === 'ets2' ? '欧卡2 (ETS2)' : '美卡';
        return [
            `🎉 Steam打折通知！`,
            `🎮 ${gameName}`,
            `📉 折扣: -${price.discount}%`,
            `💰 原价: ¥${(price.initialPrice / 100).toFixed(2)}`,
            `🏷️ 现价: ${price.price}`,
            `🔗 https://store.steampowered.com/app/${price.appid}`,
        ].join('\n');
    }

    async broadcast(platform, channelId, message) {
        try {
            const bot = this.ctx.bots.find(b => b.platform === platform);
            if (bot) {
                await bot.sendMessage(channelId, message);
            }
        } catch (error) {
            this.logger.error('发送通知失败', error);
        }
    }
}

function apply(ctx, cfg) {
    model(ctx);

    ctx.command('查询 [tmpId]').action(async ({ session }, tmpId) => {
        let actualTmpId = tmpId;
        if (tmpId) {
            const atMatch = tmpId.match(/<at id="([^"]+)"/);
            if (atMatch) {
                const atUserId = atMatch[1];
                const bindData = await guildBind.get(ctx.database, session.platform, atUserId);
                if (!bindData) {
                    return '该用户未绑定TMP ID';
                }
                actualTmpId = bindData.tmp_id;
            }
        }
        return await tmpQuery(ctx, cfg, session, actualTmpId);
    });
    
    ctx.command('服务器').action(async () => await tmpServer(ctx));
    ctx.command('绑定 <tmpId>').action(async ({ session }, tmpId) => await tmpBind.bind(ctx, cfg, session, tmpId));
    ctx.command('解绑').action(async ({ session }) => await tmpBind.unbind(ctx, session));
    ctx.command('路况 <serverName>').action(async ({ session }, serverName) => await tmpTraffic(ctx, cfg, serverName));
    
    ctx.command('定位 [tmpId]').action(async ({ session }, tmpId) => {
        let actualTmpId = tmpId;
        if (tmpId) {
            const atMatch = tmpId.match(/<at id="([^"]+)"/);
            if (atMatch) {
                const atUserId = atMatch[1];
                const bindData = await guildBind.get(ctx.database, session.platform, atUserId);
                if (!bindData) {
                    return '该用户未绑定TMP ID';
                }
                actualTmpId = bindData.tmp_id;
            }
        }
        return await tmpPosition(ctx, cfg, session, actualTmpId);
    });
    ctx.command('插件版本').action(async () => await tmpVersion(ctx));
    ctx.command('插件规则').action(() => 'TruckersMP官方规则链接：\n https://truckersmp.com/knowledge-base/article/746 ');
    ctx.command('游戏时间').action(async () => await tmpTime(ctx));
    ctx.command('地图dlc').action(async ({ session }) => await tmpDlcMap(ctx, session));
    ctx.command('查询dlc <gameType>').action(async ({ session }, gameType) => await tmpDlc(ctx, session, gameType || 'ets2'));
    ctx.command('总里程排行').action(async ({ session }) => await tmpMileageRanking(ctx, session, MileageRankingType.total));
    ctx.command('今日里程排行').action(async ({ session }) => await tmpMileageRanking(ctx, session, MileageRankingType.today));
    ctx.command('足迹 <tmpId>').action(async ({ session }, tmpId) => await tmpFootprint(ctx, session, ServerType.ets, tmpId));
    ctx.command('足迹p <tmpId>').action(async ({ session }, tmpId) => await tmpFootprint(ctx, session, ServerType.promods, tmpId));
    ctx.command('查询vtc <vtcId>').action(async ({ session }, vtcId) => await tmpVtc(ctx, cfg, session, vtcId));

    if (cfg.versionCheckEnable) {
        const { VersionCheckService } = require('./command/tmpVersionCheck');
        const versionCheckConfig = {
            checkInterval: cfg.versionCheckInterval,
            groups: cfg.versionCheckGroups
        };
        const versionCheckService = new VersionCheckService(ctx, versionCheckConfig);
        versionCheckService.start();
    }

    new SteamDiscountService(ctx, cfg);
}
