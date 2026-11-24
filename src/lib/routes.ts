// 航线数据（教程后的航线选择）
// 航司标识为风格化自绘徽章（ICAO 两字码 + 品牌色），非官方商标图。

export interface Airline {
  /** 航司名称（展示用） */
  name: string;
  /** 航司两字码 */
  code: string;
  /** 航班号（航司前缀 + 数字） */
  flightNo: string;
  /** LOGO 图路径（public/images/，白色底板承载展示） */
  logo: string;
  /** 品牌主色 */
  color: string;
  /** 品牌辅色 */
  color2: string;
}

export interface Route {
  id: string;
  name: string;
  from: string;       // 出发地
  to: string;         // 目的地
  distanceKm: number;  // 航程
  cruiseAlt: number;   // 巡航高度 ft
  cruiseIas: number;   // 巡航速度 kt
  duration: string;    // 预计时长（展示用）
  desc: string;
  airline: Airline;
  /** 航线航向（deg，出发至到达的大致航向，驾驶舱固定航向指示用） */
  courseDeg: number;
}

const AIR_CHINA: Airline = { name: '中国国际航空', code: 'CA', flightNo: 'CA1501', logo: '/images/airline-ca.jpg', color: '#c8102e', color2: '#7a0a1c' };
const CHINA_EASTERN: Airline = { name: '中国东方航空', code: 'MU', flightNo: 'MU5101', logo: '/images/airline-mu.png', color: '#1a3c8f', color2: '#0d1f4d' };
const CHINA_SOUTHERN: Airline = { name: '中国南方航空', code: 'CZ', flightNo: 'CZ3101', logo: '/images/airline-cz.jpg', color: '#0b6fb4', color2: '#084f86' };
const SICHUAN: Airline = { name: '四川航空', code: '3U', flightNo: '3U8961', logo: '/images/airline-3u.jpg', color: '#d4232a', color2: '#8f1418' };
const HAINAN: Airline = { name: '海南航空', code: 'HU', flightNo: 'HU7801', logo: '/images/airline-hu.jpg', color: '#c9a063', color2: '#8a6c3f' };

export const ROUTES: Route[] = [
  {
    id: 'PEK-SHA', name: '京沪快线', from: '北京 PEK', to: '上海 SHA',
    distanceKm: 1178, cruiseAlt: 35000, cruiseIas: 280, duration: '2h15m',
    desc: '国内最繁忙的干线，标准巡航 FL350',
    airline: { ...AIR_CHINA, flightNo: 'CA1501' }, courseDeg: 101,
  },
  {
    id: 'SHA-CAN', name: '沪广干线', from: '上海 SHA', to: '广州 CAN',
    distanceKm: 1305, cruiseAlt: 36000, cruiseIas: 280, duration: '2h25m',
    desc: '华东至华南核心干线，巡航 FL360',
    airline: { ...CHINA_SOUTHERN, flightNo: 'CZ3524' }, courseDeg: 205,
  },
  {
    id: 'CTU-CAN', name: '成广航线', from: '成都 CTU', to: '广州 CAN',
    distanceKm: 1390, cruiseAlt: 35000, cruiseIas: 275, duration: '2h30m',
    desc: '西南枢纽直飞华南，穿越云贵高原上空',
    airline: { ...SICHUAN, flightNo: '3U8961' }, courseDeg: 122,
  },
  {
    id: 'PEK-CTU', name: '京蓉航线', from: '北京 PEK', to: '成都 CTU',
    distanceKm: 1690, cruiseAlt: 36000, cruiseIas: 280, duration: '3h00m',
    desc: '华北至西南干线，飞越秦岭上空 FL360',
    airline: { ...AIR_CHINA, flightNo: 'CA4116' }, courseDeg: 229,
  },
  {
    id: 'SHA-HKG', name: '沪港航线', from: '上海 SHA', to: '香港 HKG',
    distanceKm: 1290, cruiseAlt: 35000, cruiseIas: 280, duration: '2h35m',
    desc: '长三角至粤港澳大湾区，南沿海航路 FL350',
    airline: { ...CHINA_EASTERN, flightNo: 'MU501' }, courseDeg: 203,
  },
  {
    id: 'PEK-SYD', name: '中澳跨洋', from: '北京 PEK', to: '悉尼 SYD',
    distanceKm: 8950, cruiseAlt: 38000, cruiseIas: 295, duration: '11h20m',
    desc: '南太平洋长航程，赤道南十字星航线 FL380',
    airline: { ...CHINA_EASTERN, flightNo: 'MU739' }, courseDeg: 155,
  },
  {
    id: 'CAN-LAX', name: '太平洋跨洋', from: '广州 CAN', to: '洛杉矶 LAX',
    distanceKm: 11600, cruiseAlt: 39000, cruiseIas: 300, duration: '13h40m',
    desc: '跨太平洋超长航程，高高度巡航 FL390',
    airline: { ...CHINA_SOUTHERN, flightNo: 'CZ327' }, courseDeg: 95,
  },
  {
    id: 'PVG-FRA', name: '中欧大陆', from: '上海 PVG', to: '法兰克福 FRA',
    distanceKm: 8800, cruiseAlt: 37000, cruiseIas: 295, duration: '11h50m',
    desc: '丝绸之路新航路，经中亚里海上空 FL370',
    airline: { ...HAINAN, flightNo: 'HU787' }, courseDeg: 305,
  },
  {
    id: 'PEK-LHR', name: '中英航线', from: '北京 PEK', to: '伦敦 LHR',
    distanceKm: 8200, cruiseAlt: 37000, cruiseIas: 290, duration: '10h55m',
    desc: '横贯欧亚大陆，途经西伯利亚极区边缘 FL370',
    airline: { ...AIR_CHINA, flightNo: 'CA855' }, courseDeg: 312,
  },
];
