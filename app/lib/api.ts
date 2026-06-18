const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  imageUrl: string;
}

export interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  price: number;
}

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  qty: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  appliedCoupons: string[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

export interface Order {
  id: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: string;
}

// BUG RG-207: texto pasado tal cual (sin normalizar) para que la búsqueda
// falle si el usuario escribe en minúscula.
export async function getRestaurants(cuisine?: string): Promise<Restaurant[]> {
  const url = cuisine
    ? `${API}/api/restaurants?cuisine=${encodeURIComponent(cuisine)}`
    : `${API}/api/restaurants`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener restaurantes");
  return res.json();
}

export async function getMenu(restaurantId: number): Promise<MenuItem[]> {
  const res = await fetch(`${API}/api/restaurants/${restaurantId}/menu`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al obtener menú");
  return res.json();
}

export async function createCart(): Promise<Cart> {
  const res = await fetch(`${API}/api/cart`, { method: "POST" });
  if (!res.ok) throw new Error("Error al crear carrito");
  return res.json();
}

export async function getCart(id: number): Promise<Cart> {
  const res = await fetch(`${API}/api/cart/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener carrito");
  return res.json();
}

export async function addItem(
  cartId: number,
  menuItemId: number,
  qty: number
): Promise<Cart> {
  const res = await fetch(`${API}/api/cart/${cartId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menuItemId, qty }),
  });
  if (!res.ok) throw new Error("Error al agregar ítem");
  return res.json();
}

export async function applyCoupon(
  cartId: number,
  code: string
): Promise<Cart> {
  const res = await fetch(`${API}/api/cart/${cartId}/coupon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error("Error al aplicar cupón");
  return res.json();
}

export async function checkout(cartId: number): Promise<Order> {
  const res = await fetch(`${API}/api/cart/${cartId}/checkout`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Error al hacer checkout");
  return res.json();
}
