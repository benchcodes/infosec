import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ToastProvider from "./components/ui/ToastProvider";
import DataProvider from "./lib/store";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Movements from "./pages/Movements";
import NotFound from "./pages/NotFound";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="movements" element={<Movements />} />
              <Route path="orders" element={<Orders />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ToastProvider>
      </DataProvider>
    </BrowserRouter>
  );
}
