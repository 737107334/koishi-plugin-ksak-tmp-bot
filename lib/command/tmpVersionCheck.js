const koishi_1 = require('koishi');

class VersionCheckService {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.cfg = config;
        this.currentVersion = null;
        this.timers = [];
    }

    start() {
        this.setupVersionCheck();
        this.ctx.on('dispose', () => this.cleanup());
    }

    setupVersionCheck() {
        this.ctx.logger.info('[ksak-tmp] 设置TMP版本检查服务');
        this.checkVersion();

        const checkInterval = this.cfg.checkInterval * 60 * 1000;
        const intervalTimer = setInterval(async () => {
            await this.checkVersion();
        }, checkInterval);
        this.timers.push(intervalTimer);
    }

    async checkVersion() {
        try {
            const apiUrl = 'https://api.truckersmp.com/v2/version';
            const response = await this.ctx.http.get(apiUrl, { timeout: 10000 });

            if (response && response.name) {
                const versionInfo = {
                    name: response.name,
                    time: this.convertToUTC8(response.time),
                    supported_game_version: response.supported_game_version,
                    supported_ats_game_version: response.supported_ats_game_version
                };

                this.ctx.logger.info(`[ksak-tmp] 获取到TMP版本信息: ${versionInfo.name}`);

                if (this.currentVersion && this.currentVersion.name !== versionInfo.name) {
                    this.ctx.logger.info(`[ksak-tmp] 检测到版本更新: ${this.currentVersion.name} -> ${versionInfo.name}`);
                    await this.sendVersionUpdateNotification(this.currentVersion, versionInfo);
                }

                this.currentVersion = versionInfo;
            }
        } catch (error) {
            this.ctx.logger.error('[ksak-tmp] 检查TMP版本失败:', error.message);
        }
    }

    convertToUTC8(utcTimeString) {
        try {
            const utcDate = new Date(utcTimeString);
            const utc8Date = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
            const year = utc8Date.getFullYear();
            const month = String(utc8Date.getMonth() + 1).padStart(2, '0');
            const day = String(utc8Date.getDate()).padStart(2, '0');
            const hours = String(utc8Date.getHours()).padStart(2, '0');
            const minutes = String(utc8Date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (error) {
            return utcTimeString;
        }
    }

    async sendVersionUpdateNotification(oldVersion, newVersion) {
        const message = `📢 TruckersMP版本更新通知

旧版本: ${oldVersion.name}
新版本: ${newVersion.name}

更新时间: ${newVersion.time}（UTC+8）
欧卡支持版本: ${newVersion.supported_game_version}
美卡支持版本: ${newVersion.supported_ats_game_version}`;

        for (const groupId of this.cfg.groups) {
            try {
                const bots = this.ctx.bots.filter(bot => bot.platform === 'onebot');
                for (const bot of bots) {
                    await bot.sendMessage(groupId, message);
                    this.ctx.logger.info(`[ksak-tmp] 已发送版本更新通知到群组 ${groupId}`);
                    break;
                }
            } catch (error) {
                this.ctx.logger.error(`[ksak-tmp] 发送版本更新通知到群组 ${groupId} 失败:`, error.message);
            }
        }
    }

    cleanup() {
        this.timers.forEach((timer) => {
            clearInterval(timer);
        });
        this.timers.length = 0;
    }
}

module.exports = { VersionCheckService };
