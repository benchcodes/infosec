import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataContext } from "./data-context";
import { seedState } from "./seed";
import { changePassword, createCustomerOrder, fetchState, login, pushCollection } from "./api";
import { localLogin } from "./auth";
import { nextCode } from "./metrics";

const STORAGE_KEY = "silogexpress.state.v1";
const SESSION_KEY = "silogexpress.session.v1";
const COLLECTIONS = [
  "products",
  "suppliers",
  "movements",
  "orders",
  "customerOrders",
  "users",
  "audit",
];

function cleanState(parsed) {
  const silogProducts = Array.isArray(parsed?.products)
    ? parsed.products.filter(
        (product) =>
          typeof product?.sku === "string" &&
          (product.sku.toUpperCase().startsWith("SL-") ||
            ["Tapsilog", "Tocilog", "Longsilog", "Chicksilog", "Bangsilog"].includes(product.name)),
      )
    : [];
  const products = silogProducts.length > 0 ? silogProducts : seedState.products;
  const productIds = new Set(products.map((product) => product.id));
  const productById = new Map(products.map((product) => [product.id, product]));

  const movements = Array.isArray(parsed?.movements)
    ? parsed.movements.filter((movement) => productIds.has(movement.productId))
    : seedState.movements;
  const orders = Array.isArray(parsed?.orders)
    ? parsed.orders.map((order) => ({
        ...order,
        items: Array.isArray(order.items)
          ? order.items.filter((line) => productIds.has(line.productId))
          : [],
      })).filter((order) => !Array.isArray(order.items) || order.items.length > 0)
    : seedState.orders;
  const customerOrders = Array.isArray(parsed?.customerOrders)
    ? parsed.customerOrders.map((order) => ({
        ...order,
        items: Array.isArray(order.items)
          ? order.items
              .filter((line) => productIds.has(line.productId))
              .map((line) => ({
                ...line,
                name: productById.get(line.productId)?.name ?? line.name,
                price: productById.get(line.productId)?.price ?? line.price,
              }))
          : [],
      })).filter((order) => order.items.length > 0)
    : seedState.customerOrders;

  return {
    ...seedState,
    ...parsed,
    products,
    movements,
    orders,
    customerOrders,
  };
}

function loadState() {
  if (typeof window === "undefined") return seedState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.products) || !Array.isArray(parsed?.suppliers)) return seedState;
    return cleanState(parsed);
  } catch {
    return seedState;
  }
}

function uid(prefix) {
  const random = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(16).slice(2, 10);
  return `${prefix}_${random}`;
}

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.email && parsed?.role ? parsed : null;
  } catch {
    return null;
  }
}

export function DataProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [session, setSession] = useState(loadSession);

  useEffect(() => {
    try {
      if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* storage blocked — the session still works in memory */
    }
  }, [session]);

  // MongoDB is the source of truth when the API is reachable; localStorage stays as an offline cache.
  const [apiOnline, setApiOnline] = useState(false);
  const lastPushed = useRef(null);
  const pendingPushes = useRef(new Set());
  const failedPushes = useRef(new Map());
  const lastMutatedAt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer;

    const connectToApi = () => {
      fetchState()
        .then((remote) => {
          if (cancelled) return;
          setApiOnline(true);

          const recentlyMutated = Date.now() - lastMutatedAt.current < 3500;
          if (pendingPushes.current.size === 0 && !recentlyMutated) {
            lastPushed.current = remote;
            setState((current) => cleanState({ ...current, ...remote }));
          }
        })
        .catch(() => {
          /* API offline — keep working from the local cache and retry */
          setApiOnline(false);
        });
    };

    connectToApi();
    timer = window.setInterval(connectToApi, 3000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — the UI keeps working in memory */
    }

    if (!apiOnline || !lastPushed.current) return undefined;
    const changed = COLLECTIONS.filter((name) => state[name] !== lastPushed.current[name]);
    if (changed.length === 0) return undefined;

    const timer = setTimeout(() => {
      for (const name of changed) {
        const rows = state[name];
        pendingPushes.current.add(name);
        pushCollection(name, rows)
          .then(() => {
            pendingPushes.current.delete(name);
            failedPushes.current.delete(name);
            lastPushed.current = { ...lastPushed.current, [name]: rows };
          })
          .catch((error) => {
            console.warn(`Could not save ${name} to MongoDB:`, error.message);
            failedPushes.current.set(name, rows);
            lastPushed.current = { ...lastPushed.current, [name]: undefined };
          });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [state, apiOnline]);

  useEffect(() => {
    if (!apiOnline) return undefined;

    const timer = window.setInterval(() => {
      for (const [name, rows] of failedPushes.current.entries()) {
        pendingPushes.current.add(name);
        pushCollection(name, rows)
          .then(() => {
            failedPushes.current.delete(name);
            pendingPushes.current.delete(name);
            lastPushed.current = { ...lastPushed.current, [name]: rows };
          })
          .catch((error) => {
            console.warn(`Retry saving ${name} to MongoDB failed:`, error.message);
          });
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [apiOnline]);

  const log = useCallback(
    (action, detail) => ({
      id: uid("a"),
      actor: session?.name,
      action,
      detail,
      at: new Date().toISOString(),
    }),
    [session?.name],
  );

  const mutate = useCallback((updater) => {
    lastMutatedAt.current = Date.now();
    setState((current) => updater(current));
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      const user = await login(email, password);
      setSession(user);
      return user;
    } catch (error) {
      if (error.status) throw error;
      // Offline demo fallback only; MongoDB-backed accounts require the API.
      const demo = localLogin(email, password);
      if (demo) {
        setSession(demo);
        return demo;
      }
      throw error;
    }
  }, []);

  const updatePassword = useCallback(
    (email, currentPassword, newPassword) =>
      changePassword(email, currentPassword, newPassword),
    [],
  );

  const signOut = useCallback(() => {
    setSession(null);
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
        user: session?.name,
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
    [log, mutate, session?.name],
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
              user: session?.name,
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
    [log, mutate, session?.name],
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

  const placeOrder = useCallback(
    ({ items, note }) => {
      if (!session) throw new Error("Sign in before placing an order.");

      const lines = [];
      for (const item of items) {
        const product = state.products.find((entry) => entry.id === item.productId);
        if (!product) continue;
        const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
        if (quantity === 0) continue;
        if (quantity > product.quantity) {
          throw new Error(`Only ${product.quantity} ${product.unit} of ${product.name} left.`);
        }
        lines.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
        });
      }

      if (lines.length === 0) throw new Error("Add at least one item before placing the order.");

      const createdAt = new Date().toISOString();
      const year = new Date().getFullYear();
      const code = nextCode(
        `SO-${year}`,
        state.customerOrders.map((order) => order.code),
      );

      const order = {
        id: uid("so"),
        code,
        userId: session.email,
        userName: session?.name,
        items: lines,
        total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
        status: "Pending",
        note: note?.trim() || "",
        createdAt,
        updatedAt: createdAt,
      };

      mutate((current) => ({
        ...current,
        customerOrders: [order, ...current.customerOrders],
        products: current.products.map((product) => {
          const line = lines.find((entry) => entry.productId === product.id);
          return line
            ? {
                ...product,
                quantity: Math.max(0, product.quantity - line.quantity),
                updatedAt: createdAt,
              }
            : product;
        }),
        movements: [
          ...lines.map((line) => ({
            id: uid("m"),
            productId: line.productId,
            type: "out",
            quantity: line.quantity,
            note: `Customer order ${code}`,
            user: session?.name,
            at: createdAt,
          })),
          ...current.movements,
        ],
        audit: [
          log("Placed customer order", `${code} — ${lines.length} line(s)`),
          ...current.audit,
        ].slice(0, 60),
      }));

      // Write the order immediately instead of waiting for the collection diff.
      // This prevents a later remote refresh from replacing the new order.
      createCustomerOrder(order).catch((error) => {
        console.warn("Could not immediately save customer order:", error.message);
      });

      return order;
    },
    [log, mutate, session, state.customerOrders, state.products],
  );

  const setCustomerOrderStatus = useCallback(
    (id, status) => {
      mutate((current) => {
        const order = current.customerOrders.find((item) => item.id === id);
        if (!order || order.status === status) return current;

        const at = new Date().toISOString();
        const restoring = status === "Cancelled" && order.status !== "Cancelled";

        const products = restoring
          ? current.products.map((product) => {
              const line = order.items.find((item) => item.productId === product.id);
              return line
                ? { ...product, quantity: product.quantity + line.quantity, updatedAt: at }
                : product;
            })
          : current.products;

        const restoredMovements = restoring
          ? order.items.map((line) => ({
              id: uid("m"),
              productId: line.productId,
              type: "in",
              quantity: line.quantity,
              note: `Cancelled ${order.code}`,
              user: session?.name ?? "System",
              at,
            }))
          : [];

        return {
          ...current,
          products,
          movements: [...restoredMovements, ...current.movements],
          customerOrders: current.customerOrders.map((item) =>
            item.id === id ? { ...item, status, updatedAt: at } : item,
          ),
          audit: [
            log("Updated customer order", `${order.code} → ${status}`),
            ...current.audit,
          ].slice(0, 60),
        };
      });
    },
    [log, mutate, session],
  );

  const resetData = useCallback(() => {
    setState(seedState);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      apiOnline,
      session,
      setSession,
      signIn,
      signOut,
      updatePassword,
      addProduct,
      updateProduct,
      deleteProduct,
      recordMovement,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      createOrder,
      setOrderStatus,
      placeOrder,
      setCustomerOrderStatus,
      addUser,
      updateUser,
      deleteUser,
      resetData,
    }),
    [
      state,
      apiOnline,
      session,
      signIn,
      signOut,
      updatePassword,
      addProduct,
      updateProduct,
      deleteProduct,
      recordMovement,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      createOrder,
      setOrderStatus,
      placeOrder,
      setCustomerOrderStatus,
      addUser,
      updateUser,
      deleteUser,
      resetData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export default DataProvider;
