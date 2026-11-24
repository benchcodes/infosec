import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ToastProvider from "./components/ui/ToastProvider";
import DataProvider from "./lib/store";
import { useData } from "./lib/data-context";
import { ROLES } from "./lib/roles";
import Dashboard from "./pages/Dashboard";
import EmployeeHome from "./pages/EmployeeHome";
import Login from "./pages/Login";
import Movements from "./pages/Movements";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";
import OrderQueue from "./pages/OrderQueue";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Storefront from "./pages/Storefront";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";

// Everything behind this wrapper needs a signed-in session.
function RequireAuth({ children }) {
  const { session } = useData();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

// Pages that only some roles may open.
function AllowRoles({ roles, children }) {
  const { session } = useData();
  if (!session) return <Navigate to="/login" replace />;
  if (!roles.includes(session.role)) return <Navigate to="/" replace />;
  return children;
}

// The landing page depends on the role.
function Home() {
  const { session } = useData();
  if (session?.role === ROLES.USER) return <Navigate to="/shop" replace />;
  if (session?.role === ROLES.EMPLOYEE) return <EmployeeHome />;
  return <Dashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Home />} />

              {/* Shop: User browses and orders, Admin can see it too */}
              <Route
                path="shop"
                element={
                  <AllowRoles roles={[ROLES.USER, ROLES.ADMIN]}>
                    <Storefront />
                  </AllowRoles>
                }
              />
              <Route
                path="my-orders"
                element={
                  <AllowRoles roles={[ROLES.USER, ROLES.ADMIN]}>
                    <MyOrders />
                  </AllowRoles>
                }
              />

              {/* Employee and Admin: catalog and stock */}
              <Route
                path="products"
                element={
                  <AllowRoles roles={[ROLES.ADMIN, ROLES.EMPLOYEE]}>
                    <Products />
                  </AllowRoles>
                }
              />
              <Route
                path="movements"
                element={
                  <AllowRoles roles={[ROLES.ADMIN, ROLES.EMPLOYEE]}>
                    <Movements />
                  </AllowRoles>
                }
              />
              <Route
                path="order-queue"
                element={
                  <AllowRoles roles={[ROLES.ADMIN, ROLES.EMPLOYEE]}>
                    <OrderQueue />
                  </AllowRoles>
                }
              />
              <Route
                path="orders"
                element={
                  <AllowRoles roles={[ROLES.ADMIN, ROLES.EMPLOYEE]}>
                    <Orders />
                  </AllowRoles>
                }
              />

              {/* Admin only */}
              <Route
                path="suppliers"
                element={
                  <AllowRoles roles={[ROLES.ADMIN]}>
                    <Suppliers />
                  </AllowRoles>
                }
              />
              <Route
                path="reports"
                element={
                  <AllowRoles roles={[ROLES.ADMIN]}>
                    <Reports />
                  </AllowRoles>
                }
              />
              <Route
                path="users"
                element={
                  <AllowRoles roles={[ROLES.ADMIN]}>
                    <Users />
                  </AllowRoles>
                }
              />
              <Route
                path="settings"
                element={
                  <AllowRoles roles={[ROLES.ADMIN]}>
                    <Settings />
                  </AllowRoles>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ToastProvider>
      </DataProvider>
    </BrowserRouter>
  );
}
