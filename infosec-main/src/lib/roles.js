// The three roles this system supports.
// Admin    - full access to every page and every action
// Employee - manages the item catalog, stock counts, and customer orders
// User     - browses the catalog and places orders
export const ROLES = {
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
  USER: "User",
};

export const ALL_ROLES = [ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.USER];

export const ROLE_INFO = {
  [ROLES.ADMIN]: "Full access: catalog, customer orders, suppliers, reports, and user management.",
  [ROLES.EMPLOYEE]: "Adds items, records stock counts, and fulfills customer orders.",
  [ROLES.USER]: "Browses the catalog and places orders.",
};

export const ROLE_TONE = {
  [ROLES.ADMIN]: "violet",
  [ROLES.EMPLOYEE]: "sky",
  [ROLES.USER]: "slate",
};

export const ROLE_DESCRIPTION = {
  [ROLES.ADMIN]: "Can open every page, manage users, and change settings.",
  [ROLES.EMPLOYEE]: "Can add and edit items, update stock counts, and process customer orders.",
  [ROLES.USER]: "Can browse available items and place an order.",
};

export function isAdmin(role) {
  return role === ROLES.ADMIN;
}

export function isStaff(role) {
  return role === ROLES.ADMIN || role === ROLES.EMPLOYEE;
}

export function canManageUsers(role) {
  return role === ROLES.ADMIN;
}

export function canManageItems(role) {
  return isStaff(role);
}

export function canPlaceOrders(role) {
  return role === ROLES.ADMIN || role === ROLES.USER;
}

export function homePathFor(role) {
  return role === ROLES.USER ? "/shop" : "/";
}
