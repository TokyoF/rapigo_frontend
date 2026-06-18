"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Restaurant,
  MenuItem,
  Cart,
  Order,
  getRestaurants,
  getMenu,
  createCart,
  addItem,
  applyCoupon,
  checkout,
} from "./lib/api";

const CHIPS = ["Todos", "Pizza", "Sushi", "Burgers"];

export default function Home() {
  const [filterText, setFilterText] = useState("");
  const [activeChip, setActiveChip] = useState("Todos");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [errorRestaurants, setErrorRestaurants] = useState<string | null>(null);

  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  const [cartId, setCartId] = useState<number | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const loadRestaurants = useCallback(async (cuisine?: string) => {
    setLoadingRestaurants(true);
    setErrorRestaurants(null);
    try {
      const data = await getRestaurants(cuisine || undefined);
      setRestaurants(data);
    } catch {
      setErrorRestaurants("No se pudo conectar al servidor.");
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const handleFilterInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilterText(val);
    setActiveChip("");
    // Pasar texto crudo — bug RG-207 visible: minúscula → sin resultados
    loadRestaurants(val || undefined);
  };

  const handleChip = (chip: string) => {
    setActiveChip(chip);
    setFilterText("");
    loadRestaurants(chip === "Todos" ? undefined : chip);
  };

  const handleSelectRestaurant = async (r: Restaurant) => {
    setSelectedRestaurant(r);
    setMenu([]);
    setOrder(null);
    setLoadingMenu(true);
    try {
      const items = await getMenu(r.id);
      setMenu(items);
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleAddItem = async (item: MenuItem) => {
    try {
      let id = cartId;
      if (id === null) {
        const newCart = await createCart();
        id = newCart.id;
        setCartId(id);
      }
      const updatedCart = await addItem(id, item.id, 1);
      setCart(updatedCart);
    } catch {
      // silenciar error de red en UI
    }
  };

  const handleApplyCoupon = async () => {
    if (!cartId || !couponInput.trim()) return;
    setCouponError(null);
    try {
      const updatedCart = await applyCoupon(cartId, couponInput.trim());
      setCart(updatedCart);
      setCouponInput("");
    } catch {
      setCouponError("No se pudo aplicar el cupón.");
    }
  };

  const handleCheckout = async () => {
    if (!cartId) return;
    setCheckoutLoading(true);
    try {
      const o = await checkout(cartId);
      setOrder(o);
      setCart(null);
      setCartId(null);
    } catch {
      // silenciar
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E2E8F0] font-sans">
      {/* Header */}
      <header className="bg-[#111A2E] border-b border-[#1A2540] px-6 py-4 flex items-center gap-3">
        <span className="text-2xl font-bold text-[#60A5FA]">RapiGo</span>
        <span className="text-[#94A3B8] text-lg">· Delivery</span>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Filtro */}
          <div className="bg-[#111A2E] rounded-xl p-5 flex flex-col gap-3">
            <label className="text-sm text-[#94A3B8] font-medium uppercase tracking-wide">
              Buscar restaurantes
            </label>
            <input
              type="text"
              value={filterText}
              onChange={handleFilterInput}
              placeholder="Filtrar por cocina..."
              className="w-full bg-[#0B1220] border border-[#1A2540] rounded-lg px-4 py-2 text-[#E2E8F0] placeholder-[#94A3B8] focus:outline-none focus:border-[#60A5FA] transition"
            />
            <div className="flex gap-2 flex-wrap">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChip(chip)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    activeChip === chip
                      ? "bg-[#60A5FA] text-[#0B1220]"
                      : "bg-[#1A2540] text-[#94A3B8] hover:bg-[#60A5FA]/20 hover:text-[#60A5FA]"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#94A3B8]">
              Escribe en minúscula para ver bug RG-207 (ej: &ldquo;pizza&rdquo; → sin resultados)
            </p>
          </div>

          {/* Lista de restaurantes */}
          <div>
            {loadingRestaurants && (
              <p className="text-[#94A3B8] text-sm">Cargando restaurantes…</p>
            )}
            {errorRestaurants && (
              <p className="text-[#FB7185] text-sm">{errorRestaurants}</p>
            )}
            {!loadingRestaurants && !errorRestaurants && restaurants.length === 0 && (
              <div className="bg-[#111A2E] rounded-xl p-8 text-center">
                <p className="text-[#94A3B8] text-lg">No hay restaurantes</p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Bug RG-207: el filtro es sensible a mayúsculas
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRestaurant(r)}
                  className={`bg-[#111A2E] rounded-xl overflow-hidden text-left hover:ring-2 hover:ring-[#60A5FA] transition ${
                    selectedRestaurant?.id === r.id
                      ? "ring-2 ring-[#60A5FA]"
                      : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.imageUrl}
                    alt={r.name}
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-4">
                    <p className="font-semibold text-[#E2E8F0]">{r.name}</p>
                    <p className="text-sm text-[#94A3B8]">{r.cuisine}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Menú del restaurante seleccionado */}
          {selectedRestaurant && (
            <div className="bg-[#111A2E] rounded-xl p-5">
              <h2 className="text-lg font-semibold text-[#60A5FA] mb-4">
                Menú — {selectedRestaurant.name}
              </h2>
              {loadingMenu && (
                <p className="text-[#94A3B8] text-sm">Cargando menú…</p>
              )}
              {!loadingMenu && menu.length === 0 && (
                <p className="text-[#94A3B8] text-sm">Sin ítems.</p>
              )}
              <div className="flex flex-col gap-3">
                {menu.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-[#0B1220] rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-[#E2E8F0]">{item.name}</p>
                      <p className="text-sm text-[#34D399] font-mono">
                        S/ {item.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddItem(item)}
                      className="bg-[#60A5FA] text-[#0B1220] font-semibold px-4 py-1.5 rounded-lg hover:bg-[#93C5FD] transition text-sm"
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — Carrito */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#111A2E] rounded-xl p-5 sticky top-4">
            <h2 className="text-lg font-semibold text-[#60A5FA] mb-4">
              🛒 Carrito
            </h2>

            {!cart || cart.items.length === 0 ? (
              <p className="text-[#94A3B8] text-sm">Tu carrito está vacío.</p>
            ) : (
              <>
                {/* Ítems */}
                <div className="flex flex-col gap-2 mb-4">
                  {cart.items.map((ci, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm bg-[#0B1220] rounded-lg px-3 py-2"
                    >
                      <span className="text-[#E2E8F0]">
                        {ci.name} × {ci.qty}
                      </span>
                      <span className="text-[#34D399] font-mono">
                        S/ {(ci.price * ci.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Resumen */}
                <div className="border-t border-[#1A2540] pt-3 flex flex-col gap-1 text-sm font-mono mb-4">
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Subtotal</span>
                    <span>S/ {cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#FBBF24]">
                    <span>Descuento</span>
                    <span>- S/ {cart.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Envío</span>
                    <span>S/ {cart.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div
                    className={`flex justify-between font-bold text-base border-t border-[#1A2540] pt-2 mt-1 ${
                      cart.total < 0 ? "text-[#FB7185]" : "text-[#E2E8F0]"
                    }`}
                  >
                    <span>Total</span>
                    <span>S/ {cart.total.toFixed(2)}</span>
                  </div>
                  {cart.total < 0 && (
                    <p className="text-xs text-[#FB7185]">
                      Bug RG-204: total negativo por cupones acumulados
                    </p>
                  )}
                  {cart.appliedCoupons.length > 0 && (
                    <p className="text-xs text-[#FBBF24]">
                      Cupones: {cart.appliedCoupons.join(", ")}
                    </p>
                  )}
                </div>

                {/* Cupón */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Código cupón (DELI10)"
                    className="flex-1 bg-[#0B1220] border border-[#1A2540] rounded-lg px-3 py-2 text-sm text-[#E2E8F0] placeholder-[#94A3B8] focus:outline-none focus:border-[#FBBF24] transition"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-[#FBBF24] text-[#0B1220] font-semibold px-3 py-2 rounded-lg hover:bg-[#FCD34D] transition text-sm"
                  >
                    Aplicar
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-[#FB7185] mb-3">{couponError}</p>
                )}
                <p className="text-xs text-[#94A3B8] mb-4">
                  Aplica DELI10 varias veces para ver bug RG-204
                </p>

                {/* Checkout */}
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-[#34D399] text-[#0B1220] font-bold py-3 rounded-lg hover:bg-[#6EE7B7] transition disabled:opacity-50"
                >
                  {checkoutLoading ? "Procesando…" : "Checkout"}
                </button>
              </>
            )}

            {/* Resultado del checkout */}
            {order && (
              <div className="mt-4 bg-[#0B1220] rounded-lg p-4 border border-[#34D399]">
                <p className="text-[#34D399] font-semibold mb-2">
                  ¡Pedido #{order.id} confirmado!
                </p>
                <div className="text-sm font-mono flex flex-col gap-1">
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Subtotal</span>
                    <span>S/ {order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#FBBF24]">
                    <span>Descuento</span>
                    <span>- S/ {order.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Envío</span>
                    <span>S/ {order.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#E2E8F0] border-t border-[#1A2540] pt-2 mt-1">
                    <span>Total cobrado</span>
                    <span>S/ {order.total.toFixed(2)}</span>
                  </div>
                  {order.total !== order.subtotal - order.discount + order.deliveryFee && (
                    <p className="text-xs text-[#FB7185] mt-1">
                      Bug RG-205: el envío (S/ {order.deliveryFee.toFixed(2)}) no se sumó al total
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
