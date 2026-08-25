// API base URL — use relative path so it works both locally (Vite proxy) and in production
export const API_BASE = '/api';


// Dropdown option lists
export const ARCHITECTURES = ['VCS', 'ICI', 'INFO'];
export const IVI_MODULES = ['VIP', 'CLEA', 'UVAN', 'GlobalA'];
export const COMM_MODULES = ['ICM', 'VCP'];
export const FUNCTION_CATEGORIES = [
  '蓝键功能', '白键功能', '红键功能', 'WiFi', '车机屏', 'TASK', '手机APP-iOS', '手机APP-Android'
];
export const CATEGORIES = ['车辆服务', '手机应用'];
export const CASE_TYPES = ['simple', 'timing', 'query'];

// Default fallback cases (shown before DB data loads)
export const INITIAL_CASES = [
  { id: 1, category: '车辆服务', functionCategory: '蓝键功能', function: 'ODD车载导航', content: '接收成功', type: 'Simple', expected: '' },
  { id: 2, category: '车辆服务', functionCategory: '蓝键功能', function: 'ODD车载导航', content: '目的地在地图显示正确', type: 'Simple', expected: '' },
  { id: 3, category: '车辆服务', functionCategory: '蓝键功能', function: 'ODD车载导航', content: '目的地信息显示正确', type: 'Simple', expected: '' },
  { id: 120, category: '手机应用', functionCategory: '手机APP-iOS', function: '查询流量包', content: '流量包显示正常', type: 'Simple', expected: '我的-套餐版块-影音娱乐流量-当前套餐/购买更多流量' },
  { id: 121, category: '手机应用', functionCategory: '手机APP-iOS', function: '查询流量包', content: '添加截图', type: 'Simple', expected: '' },
  { id: 122, category: '手机应用', functionCategory: '手机APP-Android', function: '登录手机应用', content: '登录成功', type: 'Simple', expected: '打开安吉星手机app，输入正确的用户名和密码，点击登录' },
  { id: 127, category: '手机应用', functionCategory: '手机APP-Android', function: '刷新车况 (点火)', content: '刷新成功', type: 'query', expected: '车辆点火后，点击On-中间车况信息-下拉屏幕刷新车况（下拉后松手，不要短时间内频繁下拉刷新），刷新成功后比对车机仪表盘和app数值' },
  { id: 128, category: '手机应用', functionCategory: '手机APP-Android', function: '刷新车况 (点火)', content: '公里数显示正确', type: 'Simple', expected: '' },
  { id: 139, category: '手机应用', functionCategory: '手机APP-Android', function: '车门上锁', content: '上锁成功', type: 'timing', expected: '车辆熄火，开关车门后，点击On-车门上锁' },
  { id: 140, category: '手机应用', functionCategory: '手机APP-Android', function: '车门上锁', content: '手机应用反馈正常', type: 'Simple', expected: '' },
  { id: 150, category: '小程序', functionCategory: '登录小程序', function: '登录小程序', content: '登录成功', type: 'Simple', expected: '微信小程序中登录成功' }
];
