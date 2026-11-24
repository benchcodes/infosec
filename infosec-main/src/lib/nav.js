import {
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { ROLES } from "./roles";

const { ADMIN, EMPLOYEE, USER } = ROLES;

// `roles` limits an item to the listed roles. Omitting it shows the item to everyone.
export const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, roles: [ADMIN, EMPLOYEE] },
    ],
  },
  {
    label: "Shop",
    items: [
      { to: "/shop", label: "Silog Menu", icon: Store, roles: [USER, ADMIN] },
      { to: "/my-orders", label: "My orders", icon: ClipboardList, roles: [USER, ADMIN] },
    ],
  },
  {
    label: "Inventory",
    items: [
      { to: "/products", label: "Meal Menu", icon: Package, roles: [ADMIN, EMPLOYEE] },
      { to: "/movements", label: "Stock movements", icon: ArrowLeftRight, roles: [ADMIN, EMPLOYEE] },
      { to: "/order-queue", label: "Meal orders", icon: ShoppingBag, roles: [ADMIN, EMPLOYEE] },
      { to: "/orders", label: "Supply orders", icon: ShoppingCart, roles: [ADMIN, EMPLOYEE] },
      { to: "/suppliers", label: "Suppliers", icon: Truck, roles: [ADMIN] },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/reports", label: "Reports", icon: BarChart3, roles: [ADMIN] }],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Users & roles", icon: ShieldCheck, roles: [ADMIN] },
      { to: "/settings", label: "Settings", icon: Settings, roles: [ADMIN] },
    ],
  },
];

export function navForRole(role) {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

export const PAGE_TITLES = {
  "/": "Dashboard",
  "/shop": "Silog Menu",
  "/my-orders": "My orders",
  "/products": "Items",
  "/movements": "Stock movements",
  "/order-queue": "Customer orders",
  "/orders": "Purchase orders",
  "/suppliers": "Suppliers",
  "/reports": "Reports",
  "/users": "Users & roles",
  "/settings": "Settings",
};
