import { useCallback, useEffect, useMemo, useState } from "react";
import { DataContext } from "./data-context";
import { seedState } from "./seed";

const STORAGE_KEY = "stockpilot.state.v1";

function loadState() {
  if (typeof window === "undefined") return seedState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.products) || !Array.isArray(parsed?.suppliers)) return seedState;
    return { ...seedState, ...parsed };
  } catch {
    return seedState;
  }
}

function uid(prefix) {
  const random = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(16).slice(2, 10);
  return `${prefix}_${random}`;
}

const DEFAULT_SESSION = {
  name: "Maria Santos",
  email: "maria.santos@ctinassl.ph",
  role: "Administrator",
};

export function DataProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [session, setSession] = useState(DEFAULT_SESSION);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — the UI keeps working in memory */
    }
  }, [state]);

  const log = useCallback(
    (action, detail) => ({
      id: uid("a"),
      actor: session.name,
      action,
      detail,
      at: new Date().toISOString(),
    }),
    [session.name],
  );

  const mutate = useCallback((updater) => {
    setState((current) => updater(current));
  }, []);

  const addProduct = useCallback(
    (payload) => {
      const product = {
        ...payload,
        id: uid("p"),
        updatedAt: new Date().toISOString(),
      };
      mutate((current) => ({
        ...current,
        products: [product, ...current.products],
        audit: [log("Created product", `${product.sku} — ${product.name}`), ...current.audit].slice(0, 60),
      }));
      return product;
    },
    [log, mutate],
  );

  const updateProduct = useCallback(
    (id, patch) => {
      mutate((current) => {
        const target = current.products.find((product) => product.id === id);
        return {
          ...current,
          products: current.products.map((product) =>
            product.id === id ? { ...product, ...patch, updatedAt: new Date().toISOString() } : product,
          ),
          audit: [
            log("Updated product", target ? `${target.sku} — ${target.name}` : id),
            ...current.audit,
          ].slice(0, 60),
        };
      });
    },
    [log, mutate],
  );

  const deleteProduct = useCallback(
    (id) => {
      mutate((current) => {
        const target = current.products.find((product) => product.id === id);
        return {
          ...current,
          products: current.products.filter((product) => product.id !== id),
          movements: current.movements.filter((movement) => movement.productId !== id),
          audit: [
            log("Deleted product", target ? `${target.sku} — ${target.name}` : id),
            ...current.audit,
          ].slice(0, 60),
        };
      });
    },
    [log, mutate],
  );

  const recordMovement = useCallback(
    ({ productId, type, quantity, note }) => {
      const amount = Number(quantity) || 0;
      const movement = {
        id: uid("m"),
        productId,
        type,
        quantity: amount,
        note: note?.trim() || "No reference provided",
        user: session.name,
        at: new Date().toISOString(),
      };

      mutate((current) => {
        const target = current.products.find((product) => product.id === productId);
        const delta = type === "out" ? -Math.abs(amount) : amount;
        return {
          ...current,
          products: current.products.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  quantity: Math.max(0, product.quantity + delta),
                  updatedAt: movement.at,
                }
              : product,
          ),
          movements: [movement, ...current.movements],
          audit: [
            log(
              type === "in" ? "Received stock" : type === "out" ? "Released stock" : "Adjusted stock",
              `${target?.sku ?? productId} — ${delta > 0 ? "+" : ""}${delta} ${target?.unit ?? "units"}`,
            ),
            ...current.audit,
          ].slice(0, 60),
        };
      });

      return movement;
    },
    [log, mutate, session.name],
  );

  const addSupplier = useCallback(
    (payload) => {
      const supplier = { ...payload, id: uid("s") };
      mutate((current) => ({
        ...current,
        suppliers: [supplier, ...current.suppliers],
        audit: [log("Created supplier", supplier.name), ...current.audit].slice(0, 60),
      }));
      return supplier;
    },
    [log, mutate],
  );

  const updateSupplier = useCallback(
    (id, patch) => {
      mutate((current) => ({
        ...current,
        suppliers: current.suppliers.map((supplier) =>
          supplier.id === id ? { ...supplier, ...patch } : supplier,
        ),
        audit: [log("Updated supplier", patch.name ?? id), ...current.audit].slice(0, 60),
      }));
    },
    [log, mutate],
  );

  const deleteSupplier = useCallback(
    (id) => {
      mutate((current) => {
        const target = current.suppliers.find((supplier) => supplier.id === id);
        return {
          ...current,
          suppliers: current.suppliers.filter((supplier) => supplier.id !== id),
          audit: [
            log("Deleted supplier", target?.name ?? id),
            ...current.audit,
          ].slice(0, 60),
        };
      });
    },
    [log, mutate],
  );

  const createOrder = useCallback(
    (payload) => {
      const order = { ...payload, id: uid("o"), createdAt: new Date().toISOString() };
      mutate((current) => ({
        ...current,
        orders: [order, ...current.orders],
        audit: [log("Created purchase order", order.code), ...current.audit].slice(0, 60),
      }));
      return order;
    },
    [log, mutate],
  );

  const setOrderStatus = useCallback(
    (id, status) => {
      mutate((current) => {
        const order = current.orders.find((item) => item.id === id);
        if (!order) return current;

        const shouldReceive = status === "Received" && order.status !== "Received";
        const products = shouldReceive
          ? current.products.map((product) => {
              const line = order.items.find((item) => item.productId === product.id);
              if (!line) return product;
              return {
                ...product,
                quantity: product.quantity + line.quantity,
                updatedAt: new Date().toISOString(),
              };
            })
          : current.products;

        const receivedMovements = shouldReceive
          ? order.items.map((line) => ({
              id: uid("m"),
              productId: line.productId,
              type: "in",
              quantity: line.quantity,
              note: `Received via ${order.code}`,
              user: session.name,
              at: new Date().toISOString(),
            }))
          : [];

        return {
          ...current,
          products,
          movements: [...receivedMovements, ...current.movements],
          orders: current.orders.map((item) => (item.id === id ? { ...item, status } : item)),
          audit: [
            log("Updated purchase order", `${order.code} → ${status}`),
            ...current.audit,
          ].slice(0, 60),
        };
      });
    },
    [log, mutate, session.name],
  );

  const addUser = useCallback(
    (payload) => {
      const user = { ...payload, id: uid("u") };
      mutate((current) => ({
        ...current,
        users: [user, ...current.users],
        audit: [log("Invited user", `${user.name} (${user.role})`), ...current.audit].slice(0, 60),
      }));
      return user;
    },
    [log, mutate],
  );

  const updateUser = useCallback(
    (id, patch) => {
      mutate((current) => ({
        ...current,
        users: current.users.map((user) => (user.id === id ? { ...user, ...patch } : user)),
        audit: [log("Updated user", patch.name ?? id), ...current.audit].slice(0, 60),
      }));
    },
    [log, mutate],
  );

  const deleteUser = useCallback(
    (id) => {
      mutate((current) => {
        const target = current.users.find((user) => user.id === id);
        return {
          ...current,
          users: current.users.filter((user) => user.id !== id),
          audit: [log("Removed user", target?.name ?? id), ...current.audit].slice(0, 60),
        };
      });
    },
    [log, mutate],
  );

  const resetData = useCallback(() => {
    setState(seedState);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      session,
      setSession,
      addProduct,
      updateProduct,
      deleteProduct,
      recordMovement,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      createOrder,
      setOrderStatus,
      addUser,
      updateUser,
      deleteUser,
      resetData,
    }),
    [
      state,
      session,
      addProduct,
      updateProduct,
      deleteProduct,
      recordMovement,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      createOrder,
      setOrderStatus,
      addUser,
      updateUser,
      deleteUser,
      resetData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export default DataProvider;
