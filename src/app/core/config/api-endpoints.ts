const BO_PORTAL_PREFIX = '/bo-portal';

const withBoPortal = (path = ''): string => `${BO_PORTAL_PREFIX}${path}`;

export const API_ENDPOINTS = {
  auth: {
    login: withBoPortal('/auth/login'),
    logout: withBoPortal('/auth/logout'),
    refresh: withBoPortal('/auth/refresh'),
    me: withBoPortal('/auth/me'),
    publicKey: withBoPortal('/auth/public-key'),
  },
  audit: {
    root: withBoPortal('/audit'),
    verifyHash: (auditId: number | string) => withBoPortal(`/audit/${auditId}/hash/verify`),
    actionFunctions: withBoPortal('/audit/action-functions'),
  },
  authz: {
    roles: withBoPortal('/authz/roles'),
    resources: withBoPortal('/authz/resources'),
    rolePermissions: (roleId: string) => withBoPortal(`/authz/roles/${roleId}/permissions`),
  },
  branches: {
    root: withBoPortal('/branches'),
    withCheckinRules: withBoPortal('/branches/with-checkin-rules'),
    byId: (id: string) => withBoPortal(`/branches/${id}`),
  },
  allowedIpRanges: {
    root: withBoPortal('/allowed-ip-ranges'),
    byId: (id: string) => withBoPortal(`/allowed-ip-ranges/${id}`),
  },
  attendanceLocations: {
    root: withBoPortal('/attendance-locations'),
    byId: (id: string) => withBoPortal(`/attendance-locations/${id}`),
  },
  systemConfig: {
    general: withBoPortal('/system-config'),
    security: withBoPortal('/security-config'),
    composite: withBoPortal('/system-configurations'),
    compositeSystem: withBoPortal('/system-configurations/system'),
    compositeSecurity: withBoPortal('/system-configurations/security'),
  },
  notifications: {
    root: withBoPortal('/notification-bell'),
    byId: (id: number) => withBoPortal(`/notification-bell/${id}`),
    sendNow: (id: number) => withBoPortal(`/notification-bell/${id}/send-now`),
  },
  permissionMatrix: {
    root: '/permission-matrix',
  },
  portalMenus: {
    root: withBoPortal('/menus'),
    byId: (id: number) => withBoPortal(`/menus/${id}`),
  },
  orgChart: {
    root: withBoPortal('/orgchart'),
    search: withBoPortal('/orgchart/users'),
    byId: (userId: string | number) => withBoPortal(`/orgchart/users/${userId}`),
    subordinates: (userId: string | number) => withBoPortal(`/orgchart/users/${userId}/subordinates`),
    path: (userId: string | number) => withBoPortal(`/orgchart/users/${userId}/path`),
  },
  templates: {
    root: withBoPortal('/templates'),
    summary: withBoPortal('/templates/summary'),
    channels: (code: string) => withBoPortal(`/templates/${code}/channels`),
    definitionByCode: (code: string) => withBoPortal(`/templates/${code}/definition`),
    definitionRoot: withBoPortal('/templates/definition'),
    definitionDelete: (code: string) => withBoPortal(`/templates/definition/${code}`),
    history: (code: string) => withBoPortal(`/templates/${code}/history`),
    restore: (code: string) => withBoPortal(`/templates/${code}/restore`),
    byId: (id: string) => withBoPortal(`/templates/${id}`),
  },
  upload: {
    root: withBoPortal('/common/upload'),
  },
  users: {
    root: withBoPortal('/users'),
    search: withBoPortal('/users/search'),
    meta: withBoPortal('/users/meta'),
    byId: (userId: string | number) => withBoPortal(`/users/${userId}`),
    approve: (userId: string | number) => withBoPortal(`/users/${userId}/approve`),
    reject: (userId: string | number) => withBoPortal(`/users/${userId}/reject`),
    suspend: (userId: string | number) => withBoPortal(`/users/${userId}/suspend`),
    reactivate: (userId: string | number) => withBoPortal(`/users/${userId}/reactivate`),
    lock: (userId: string | number) => withBoPortal(`/users/${userId}/lock`),
    unlock: (userId: string | number) => withBoPortal(`/users/${userId}/unlock`),
    resetPassword: (userId: string | number) => withBoPortal(`/users/${userId}/reset-password`),
    resendActivation: (userId: string | number) => withBoPortal(`/users/${userId}/resend-activation`),
    profile: (userId: string | number) => withBoPortal(`/users/${userId}/profile`),
    mentor: (userId: string | number, mentorId: number) => withBoPortal(`/users/${userId}/mentor/${mentorId}`),
    role: (userId: string | number) => withBoPortal(`/users/${userId}/role`),
    activate: (userId: string | number) => withBoPortal(`/users/${userId}/activate`),
    deactivate: (userId: string | number) => withBoPortal(`/users/${userId}/deactivate`),
    restore: (userId: string | number) => withBoPortal(`/users/${userId}/restore`),
    organization: (userId: string | number) => withBoPortal(`/users/${userId}/organization`),
    activityHistory: (userId: string | number) => withBoPortal(`/users/${userId}/activity-history`),
    loginHistory: (userId: string | number) => withBoPortal(`/users/${userId}/login-history`),
  },
} as const;
