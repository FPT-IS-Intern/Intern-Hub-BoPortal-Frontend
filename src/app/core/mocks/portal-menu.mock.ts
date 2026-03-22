import { PortalMenuItem, PortalMenuRequest } from '@/models/portal-menu.model';

let nextId = 100;

const MOCK_MENUS: PortalMenuItem[] = [
  {
    id: 30,
    code: 'HOME_PAGE',
    title: 'Trang chủ',
    path: '/homePage',
    icon: 'bảo-tho-sua-ong-nuoc',
    parentId: null,
    roleCodes: [],
    sortOrder: 0,
    status: 'ACTIVE',
  },
  {
    id: 20,
    code: 'COURSE_MGMT',
    title: 'Quản lý khóa học',
    path: '/courses',
    icon: 'tính-anh-không-thích-lưng-chừng',
    parentId: null,
    roleCodes: [],
    sortOrder: 1,
    status: 'ACTIVE',
  },
  {
    id: 21,
    code: 'LESSON_MGMT',
    title: 'Quản lý bài học',
    path: '/lessons',
    icon: 'tuyển-bạn-trai-đi-chơi-20/11',
    parentId: null,
    roleCodes: [],
    sortOrder: 2,
    status: 'ACTIVE',
  },
  {
    id: 22,
    code: 'BLOCKCHAIN_MGMT',
    title: 'Quản lý blockchain',
    path: '/blockchain',
    icon: 'a',
    parentId: null,
    roleCodes: [],
    sortOrder: 3,
    status: 'ACTIVE',
  },
  {
    id: 23,
    code: 'REQUEST_MGMT',
    title: 'Quản lý phiếu yêu cầu',
    path: '/requests',
    icon: 's',
    parentId: null,
    roleCodes: [],
    sortOrder: 4,
    status: 'ACTIVE',
  },
  {
    id: 24,
    code: 'NEWS_MGMT',
    title: 'Quản lý tin tức',
    path: '/news',
    icon: 'b',
    parentId: null,
    roleCodes: [],
    sortOrder: 5,
    status: 'ACTIVE',
  },
  {
    id: 25,
    code: 'SYSTEM_SETTINGS',
    title: 'Hệ thống',
    path: '/system',
    icon: 'd',
    parentId: null,
    roleCodes: [],
    sortOrder: 6,
    status: 'ACTIVE',
  },
  {
    id: 26,
    code: 'LESSON_REVIEW',
    title: 'Đánh giá bài học',
    path: '/reviews',
    icon: 'f',
    parentId: null,
    roleCodes: [],
    sortOrder: 7,
    status: 'ACTIVE',
  },
  {
    id: 19,
    code: 'USER_MGMT',
    title: 'Quản lý người dùng',
    path: '/users',
    icon: 'bb',
    parentId: null,
    roleCodes: [],
    sortOrder: 8,
    status: 'ACTIVE',
  },
];

function buildHierarchy(menus: PortalMenuItem[]): PortalMenuItem[] {
  const map = new Map<number, PortalMenuItem>();
  menus.forEach(m => map.set(m.id, { ...m, children: [] }));

  const roots: PortalMenuItem[] = [];
  map.forEach(menu => {
    if (menu.parentId && map.has(menu.parentId)) {
      map.get(menu.parentId)!.children!.push(menu);
    } else {
      roots.push(menu);
    }
  });

  roots.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  roots.forEach(r => r.children?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
  return roots;
}

export function getMockMenus(): PortalMenuItem[] {
  return buildHierarchy([...MOCK_MENUS]);
}

export function getMockMenuById(id: number): PortalMenuItem | undefined {
  return MOCK_MENUS.find(m => m.id === id);
}

export function createMockMenu(req: PortalMenuRequest): PortalMenuItem {
  const item: PortalMenuItem = { id: nextId++, ...req };
  MOCK_MENUS.push(item);
  return item;
}

export function updateMockMenu(id: number, req: PortalMenuRequest): PortalMenuItem | undefined {
  const idx = MOCK_MENUS.findIndex(m => m.id === id);
  if (idx === -1) return undefined;
  MOCK_MENUS[idx] = { ...MOCK_MENUS[idx], ...req };
  return MOCK_MENUS[idx];
}

export function deleteMockMenu(id: number): boolean {
  const idx = MOCK_MENUS.findIndex(m => m.id === id);
  if (idx === -1) return false;
  MOCK_MENUS.splice(idx, 1);
  // Also remove children
  for (let i = MOCK_MENUS.length - 1; i >= 0; i--) {
    if (MOCK_MENUS[i].parentId === id) {
      MOCK_MENUS.splice(i, 1);
    }
  }
  return true;
}


