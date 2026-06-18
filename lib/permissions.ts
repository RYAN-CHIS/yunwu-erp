/**
 * 允物 Brand OS — 权限系统
 *
 * 权限分为三层：
 * 1. 角色默认权限（role-based）
 * 2. 用户自定义权限覆盖（存储在 users.permissions JSON 字段）
 * 3. admin 角色拥有所有权限（不可降级）
 */

export interface UserPermissions {
  canDeleteProducts: boolean;
  canAddMaterials: boolean;
  canEditMaterials: boolean;
  canDeleteMaterials: boolean;
  canEditPrices: boolean;
  canViewMaterialPrices: boolean;
  canManageUsers: boolean;
  canImportData: boolean;
  canEditBom: boolean;
  canManageInventory: boolean;
}

/** 所有权限 key 列表 */
export const ALL_PERMISSIONS: (keyof UserPermissions)[] = [
  "canDeleteProducts",
  "canAddMaterials",
  "canEditMaterials",
  "canDeleteMaterials",
  "canEditPrices",
  "canViewMaterialPrices",
  "canManageUsers",
  "canImportData",
  "canEditBom",
  "canManageInventory",
];

/** 权限中文标签 */
export const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  canDeleteProducts: "删除商品",
  canAddMaterials: "添加原材料",
  canEditMaterials: "编辑原材料",
  canDeleteMaterials: "删除原材料",
  canEditPrices: "修改价格",
  canViewMaterialPrices: "查看原材料价格",
  canManageUsers: "管理用户",
  canImportData: "导入数据",
  canEditBom: "编辑 BOM",
  canManageInventory: "管理库存",
};

/** 权限分组 */
export const PERMISSION_GROUPS: { name: string; keys: (keyof UserPermissions)[] }[] = [
  {
    name: "商品管理",
    keys: ["canDeleteProducts"],
  },
  {
    name: "原材料管理",
    keys: ["canAddMaterials", "canEditMaterials", "canDeleteMaterials"],
  },
  {
    name: "价格与成本",
    keys: ["canEditPrices", "canViewMaterialPrices"],
  },
  {
    name: "库存管理",
    keys: ["canManageInventory"],
  },
  {
    name: "生产管理",
    keys: ["canEditBom"],
  },
  {
    name: "系统管理",
    keys: ["canManageUsers", "canImportData"],
  },
];

/** 角色默认权限 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    canDeleteProducts: true,
    canAddMaterials: true,
    canEditMaterials: true,
    canDeleteMaterials: true,
    canEditPrices: true,
    canViewMaterialPrices: true,
    canManageUsers: true,
    canImportData: true,
    canEditBom: true,
    canManageInventory: true,
  },
  staff: {
    canDeleteProducts: false,
    canAddMaterials: true,
    canEditMaterials: true,
    canDeleteMaterials: false,
    canEditPrices: false,
    canViewMaterialPrices: true,
    canManageUsers: false,
    canImportData: false,
    canEditBom: true,
    canManageInventory: true,
  },
  viewer: {
    canDeleteProducts: false,
    canAddMaterials: false,
    canEditMaterials: false,
    canDeleteMaterials: false,
    canEditPrices: false,
    canViewMaterialPrices: false,
    canManageUsers: false,
    canImportData: false,
    canEditBom: false,
    canManageInventory: false,
  },
};

/**
 * 获取用户的有效权限（合并角色默认 + 自定义覆盖）
 */
export function getUserPermissions(
  role: string,
  customPermissionsJson?: string | null
): UserPermissions {
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.viewer;

  // admin 角色权限不可降级
  if (role === "admin") return { ...defaults };

  if (!customPermissionsJson) return { ...defaults };

  try {
    const custom = JSON.parse(customPermissionsJson);
    const merged = { ...defaults };
    for (const key of ALL_PERMISSIONS) {
      if (typeof custom[key] === "boolean") {
        merged[key] = custom[key];
      }
    }
    return merged;
  } catch {
    return { ...defaults };
  }
}

/**
 * 检查用户是否拥有某项权限
 */
export function hasPermission(
  role: string,
  permission: keyof UserPermissions,
  customPermissionsJson?: string | null
): boolean {
  if (role === "admin") return true;

  const perms = getUserPermissions(role, customPermissionsJson);
  return perms[permission] === true;
}
