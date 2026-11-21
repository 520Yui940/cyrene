/**
 * categories.js — 分类元数据
 *
 * 数组顺序 = 页面上的展示顺序（原站是靠数据里首次出现的顺序隐式决定的，容易踩坑）。
 * name 必须与 sites.js 的 category 完全一致；icon 用于分类标题前的图标。
 */
export const categories = [
    { name: "常用网站", icon: "fas fa-compass" }, // 5 个站点
    { name: "AI工具", icon: "fas fa-wand-magic-sparkles" }, // 12 个站点
    { name: "学习资源", icon: "fas fa-book-open" }, // 9 个站点
    { name: "工具类", icon: "fas fa-screwdriver-wrench" }, // 19 个站点
    { name: "游戏相关", icon: "fas fa-gamepad" }, // 13 个站点
    { name: "网盘存储", icon: "fas fa-cloud" }, // 5 个站点
    { name: "邮箱服务", icon: "fas fa-envelope" }, // 4 个站点
    { name: "开发者工具", icon: "fas fa-code" }, // 7 个站点
    { name: "其他资源", icon: "fas fa-shapes" }, // 14 个站点
];

/** 允许出现的分类名集合，数据校验用 */
export const categoryNames = new Set(categories.map((item) => item.name));
