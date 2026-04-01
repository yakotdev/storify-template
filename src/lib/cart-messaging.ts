import type { Product } from '../constants';

function normalizeProductId(product: { id?: unknown }): string | null {
  if (product?.id == null) return null;
  const id = String(product.id).trim();
  if (!id || id === 'undefined' || id === 'null') return null;
  return id;
}

/** Minimal product snapshot for the parent storefront when `products.find` misses (e.g. theme loaded via SDK). */
export function buildStorifyAddToCartMessage(
  product: Product & { quantity?: number },
  explicitQuantity?: number,
): {
  type: 'STORIFY_ADD_TO_CART';
  productId: string;
  quantity: number;
  product: Record<string, unknown>;
  suppressHostCartOpen?: boolean;
} | null {
  const id = normalizeProductId(product);
  if (!id) return null;

  const fromProduct =
    typeof product.quantity === 'number' && !Number.isNaN(product.quantity) ? product.quantity : undefined;
  const quantity = Math.max(1, explicitQuantity ?? fromProduct ?? 1);
  const image = product.image || '';
  const images =
    Array.isArray(product.images) && product.images.length > 0 ? product.images : image ? [image] : [];

  return {
    type: 'STORIFY_ADD_TO_CART' as const,
    productId: id,
    quantity,
    suppressHostCartOpen: true,
    product: {
      id,
      name: String(product.name ?? ''),
      price: Number(product.price) || 0,
      image,
      category: typeof product.category === 'string' ? product.category : '',
      description: typeof product.description === 'string' ? product.description : '',
      images,
      status: (product as { status?: string }).status || 'Active',
      stock: typeof (product as { stock?: number }).stock === 'number' ? (product as { stock: number }).stock : 0,
      compareAtPrice: (product as { compareAtPrice?: number }).compareAtPrice,
      sku: (product as { sku?: string }).sku,
      hasVariants: (product as { hasVariants?: boolean }).hasVariants,
      variants: (product as { variants?: unknown[] }).variants,
      options: (product as { options?: unknown[] }).options,
    },
  };
}
