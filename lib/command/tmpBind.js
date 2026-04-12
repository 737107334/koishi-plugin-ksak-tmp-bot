const guildBind = require('../database/guildBind');
const truckersMpApi = require("../api/truckersMpApi");
const evmOpenApi = require('../api/evmOpenApi');

module.exports = {
    async bind(ctx, cfg, session, tmpId) {
        if (!tmpId || isNaN(tmpId)) {
            return `请输入正确的玩家ID编号`;
        }
        let playerInfo = await evmOpenApi.playerInfo(ctx.http, tmpId);
        if (playerInfo.error) {
            return '绑定失败 (查询玩家信息失败)';
        }
        guildBind.saveOrUpdate(ctx.database, session.platform, session.userId, playerInfo.data.tmpId);
        return `绑定成功 ( ${playerInfo.data.name} )玩家可发送查询指令获得TMP信息`;
    },
    async unbind(ctx, session) {
        const result = await guildBind.remove(ctx.database, session.platform, session.userId);
        if (result) {
            return '解绑成功,感谢您使用本机器人,祝您游戏愉快！';
        }
        return '解绑失败 (未找到绑定信息)';
    }
};
