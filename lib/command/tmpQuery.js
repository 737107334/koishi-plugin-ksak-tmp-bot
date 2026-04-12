const dayjs = require('dayjs');
const dayjsRelativeTime = require('dayjs/plugin/relativeTime');
const dayjsLocaleZhCn = require('dayjs/locale/zh-cn');
const guildBind = require('../database/guildBind');
const truckyAppApi = require('../api/truckyAppApi');
const evmOpenApi = require('../api/evmOpenApi');
const baiduTranslate = require('../util/baiduTranslate');
dayjs.extend(dayjsRelativeTime);
dayjs.locale(dayjsLocaleZhCn);

/**
 * 格式化游戏时间（分钟 -> 小时，保留1位小数）
 */
function formatPlaytime(minutes) {
    if (!minutes || minutes <= 0 || isNaN(minutes)) return null;
    const hours = (minutes / 60).toFixed(1);  // 保留1位小数
    return `${hours}小时`;
}

/**
 * tmp用户组
 */
const userGroup = {
    'Player': 'TMP玩家',
    'Retired Legend': 'TMP退役玩家',
    'Game Developer': 'TMP游戏开发者',
    'Retired Team Member': 'TMP退休团队成员',
    'Add-On Team': 'TMP附加组件团队',
    'Game Moderator': 'TMP游戏管理员'
};

/**
 * 查询玩家信息
 */
module.exports = async (ctx, cfg, session, tmpId) => {
    if (tmpId && isNaN(tmpId)) {
        return `请输入玩家ID编号或先进行绑定后再查询`;
    }
    if (!tmpId) {
        let guildBindData = await guildBind.get(ctx.database, session.platform, session.userId);
        if (!guildBindData) {
            return `请输入玩家ID编号或先进行绑定后再查询`;
        }
        tmpId = guildBindData.tmp_id;
    }
    
    let playerInfo = await evmOpenApi.playerInfo(ctx.http, tmpId);
    if (playerInfo.error && playerInfo.code === 10001) {
        return '该玩家ID错误或玩家不存在';
    }
    else if (playerInfo.error) {
        return '查询失败，请稍联系作者反馈异常';
    }
    
    // 查询Steam游戏时间
    let steamPlaytime = { ets2: 0, ats: 0 };
    let steamTimeStatus = '';
    
    try {
        const steamApiKey = cfg.steamApiKey;
        const steamId = playerInfo.data.steamId;
        
        ctx.logger.info(`[Steam查询] API Key: ${steamApiKey ? '已配置' : '未配置'}, Steam ID: ${steamId}`);
        
        if (!steamApiKey) {
            steamTimeStatus = '未配置Steam API Key';
        } else if (!steamId) {
            steamTimeStatus = '未获取到Steam ID';
        } else {
            const steamUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${steamId}&format=json`;
            
            const steamResponse = await ctx.http.get(steamUrl, { timeout: 15000 });
            
            if (!steamResponse.response) {
                steamTimeStatus = 'Steam API响应异常';
            } else if (!steamResponse.response.games || steamResponse.response.games.length === 0) {
                steamTimeStatus = '资料私密或未购买游戏';
            } else {
                const games = steamResponse.response.games;
                const ets2Game = games.find(g => g.appid === 227300);
                const atsGame = games.find(g => g.appid === 270880);
                
                steamPlaytime.ets2 = ets2Game?.playtime_forever || 0;
                steamPlaytime.ats = atsGame?.playtime_forever || 0;
                
                ctx.logger.info(`[Steam查询] ETS2: ${steamPlaytime.ets2}分钟, ATS: ${steamPlaytime.ats}分钟`);
                
                if (!ets2Game && !atsGame) {
                    steamTimeStatus = '未购买欧卡2/美卡';
                }
            }
        }
    } catch (e) {
        ctx.logger.error('[Steam查询] 异常:', e);
        steamTimeStatus = '查询失败';
    }
    
    let playerMapInfo = await truckyAppApi.online(ctx.http, tmpId);
    
    const steamId = playerInfo.data.steamId;
    const vtcId = playerInfo.data.vtcId;
    const isJoinVtc = playerInfo.data.isJoinVtc;
    const queryVtcEnable = cfg.queryVtcEnable;
    const queryEts2PlaytimeEnable = cfg.queryEts2PlaytimeEnable;
    const queryAtsPlaytimeEnable = cfg.queryAtsPlaytimeEnable;
    
    let message = '';
    if (cfg.queryShowAvatarEnable) {
        message += `<img src="${playerInfo.data.avatarUrl}"/>\n`;
    }
    message += '🤖阿K传媒:TruckersMP';
    message += '\n🆔TMP编号: ' + playerInfo.data.tmpId;
    message += '\n👥TMP名称: ' + playerInfo.data.name;
    message += '\n🎮SteamID: ' + playerInfo.data.steamId;
    
    // ✅ 修改：分开显示欧卡和美卡时长（保留小数点）
    const ets2Formatted = formatPlaytime(steamPlaytime.ets2);
    
    if (ets2Formatted) {
        message += '\n⏰欧卡运行时间: ' + ets2Formatted;
    }
    
    let registerDate = dayjs(playerInfo.data.registerTime);
    message += '\n📑注册日期: ' + registerDate.format('YYYY年MM月DD日') + ` ${dayjs().diff(registerDate, 'day')}天`;
    message += '\n🚂所属分组: ' + (userGroup[playerInfo.data.groupName] || playerInfo.data.groupName);
    
    if (queryVtcEnable && isJoinVtc) {
        message += '\n🚚车队信息: ' + playerInfo.data.vtcName;
        message += '\n🚚车队vtcID : ' + (vtcId || '未知');
        message += '\n🚚车队职位: ' + playerInfo.data.vtcRole;
    }
    
    message += '\n🚫是否封禁: ' + (playerInfo.data.isBan ? '是 ' : '否 ');
    if (playerInfo.data.isBan) {
        message += '\n🚫解封日期: ';
        if (playerInfo.data.banHide) {
            message += '隐藏';
        }
        else {
            if (!playerInfo.data.banUntil) {
                message += '永久封禁';
            }
            else {
                message += dayjs(playerInfo.data.banUntil).format('YYYY年MM月DD日\n🚫解封时间：HH:mm (欧洲时间)');
            }
            message += "\n🚫封禁原因: " + (playerInfo.data.banReasonZh || playerInfo.data.banReason);
        }
    }
    message += '\n🚫封禁次数: ' + (playerInfo.data.banCount || 0);
    
    if (playerInfo.data.mileage) {
        let mileage = playerInfo.data.mileage;
        let mileageUnit = '米';
        if (mileage > 1000) {
            mileage = (mileage / 1000).toFixed(1);
            mileageUnit = '公里';
        }
        message += '\n🚩历史里程: ' + mileage + mileageUnit;
    }
    if (playerInfo.data.todayMileage) {
        let todayMileage = playerInfo.data.todayMileage;
        let mileageUnit = '米';
        if (todayMileage > 1000) {
            todayMileage = (todayMileage / 1000).toFixed(1);
            mileageUnit = '公里';
        }
        message += '\n🚩今日里程: ' + todayMileage + mileageUnit;
    }
    
    if (playerMapInfo && !playerMapInfo.error) {
        message += '\n🌎在线状态: ' + (playerMapInfo.data.online ? `在线🟢 \n🌎在线服务器: (${playerMapInfo.data.serverDetails.name})` : '离线⚫');
        if (playerMapInfo.data.online) {
            message += '\n📍在线国家: ';
            message += await baiduTranslate(ctx, cfg, playerMapInfo.data.location.poi.country);
            message += '  ';
            message += '\n📍在线城市: ';
            message += await baiduTranslate(ctx, cfg, playerMapInfo.data.location.poi.realName);
        }
        else if (playerInfo.data.lastOnlineTime) {
            message += '\n🌎上次在线: ' + dayjs(playerInfo.data.lastOnlineTime).fromNow(false);
        }
    }
    
    message += '\n💎玩家是否赞助商：';
    if (playerInfo.data.isSponsor) {
        message += '是 ';
    }
    else {
        message += '否 ';
    }
    message += '\n💰当前赞助金额: ';
    if (playerInfo.data.sponsorAmount == 'null') {
        message += '0$美元';
    }
    else {
        message += playerInfo.data.sponsorAmount / 100 + ' $美元';
    }
    message += '\n💰历史赞助金额: ';
    if (playerInfo.data.sponsorCumulativeAmount == 'null') {
        message += '0 $美元';
    }
    else {
        message += playerInfo.data.sponsorCumulativeAmount / 100 + ' $美元';
    }
    
    return message;
};
