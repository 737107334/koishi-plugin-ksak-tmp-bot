declare function _exports(ctx: any, cfg: any, session: any, tmpId: any): Promise<segment | "渲染异常，请重试" | "未启用 puppeteer 服务" | "请输入正确的玩家编号，或绑定玩家编号" | "查询玩家信息失败，请重试" | "查询玩家位置信息失败，请重试" | "玩家离线">;
export = _exports;
import { segment } from "@koishijs/core";
