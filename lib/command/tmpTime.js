const truckyAppApi = require('../api/truckyAppApi');

module.exports = async (ctx) => {
    let timeData = await truckyAppApi.time(ctx.http);
    if (timeData.error) {
        return '查询时间失败，请稍后重试';
    }
    
    let gameTime = timeData.data.calculated_game_time || timeData.data.game_time;
    let formattedTime = gameTime;
    
    if (timeData.data.calculated_game_time) {
        let date = new Date(timeData.data.calculated_game_time);
        formattedTime = date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }
    
    let message = '🕐 TruckersMP 游戏时间\n';
    message += '═══════════════════════════\n';
    message += `📅 游戏时间: ${formattedTime}\n`;
    message += '═══════════════════════════';
    
    return message;
};
