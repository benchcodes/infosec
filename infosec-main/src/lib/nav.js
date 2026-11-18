import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

export const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Inventory",
    items: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/movements", label: "Stock movements", icon: ArrowLeftRight },
      { to: "/orders", label: "Purchase orders", icon: ShoppingCart },
      { to: "/suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/reports", label: "Reports", icon: BarChart3 }],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Users & roles", icon: ShieldCheck },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const PAGE_TITLES = {
  "/": "Dashboard",
  "/products": "Products",
  "/movements": "Stock movements",
  "/orders": "Purchase orders",
  "/suppliers": "Suppliers",
  "/reports": "Reports",
  "/users": "Users & roles",
  "/settings": "Settings",
};
