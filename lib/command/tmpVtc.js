const truckersMpApi = require('../api/truckersMpApi');

module.exports = async (ctx, cfg, session, vtcid) => {
  if (!vtcid || isNaN(vtcid)) {
    return `请输入正确的VTC编号`;
  }

  let vtcInfo = await truckersMpApi.vtcInfo(ctx.http, vtcid);
  if (vtcInfo.error) {
    return '查询VTC信息失败，请重试';
  }

  let message = '';
  message += `<img src="${vtcInfo.data.logo}"/>\n`;
  message += '🆔VTC编号: ' + vtcInfo.data.id;
  message += '\n📑VTC名称: ' + vtcInfo.data.name;
  message += '\n👤VTC创始人 ' + vtcInfo.data.owner_id;
  message += '\n👤VTC创始人名称 ' + vtcInfo.data.owner_username;
  message += '\n📅VTC创建日期: ' + vtcInfo.data.created + ' (UTC)';
  message += '\n👥VTC人数: ' + vtcInfo.data.members_count;
  message += '\n🎮VTC前缀: ' + vtcInfo.data.tag;
  message += '\n💼VTC主页: ' + vtcInfo.data.website;
  return message;
};
