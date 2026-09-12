import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Tüm para alanları kuruş cinsinden tamsayı olarak saklanır (1.599,21 TL => 159921).

const id = () => integer("id").primaryKey().generatedByDefaultAsIdentity();

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  phone: text("phone"),
  role: text("role", { enum: ["admin", "customer"] })
    .notNull()
    .default("customer"),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // token'ın sha256 özeti
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const categories = pgTable(
  "categories",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    parentId: integer("parent_id").references(
      (): AnyPgColumn => categories.id,
      { onDelete: "set null" },
    ),
    sortOrder: integer("sort_order").notNull().default(0),
    showInMenu: boolean("show_in_menu").notNull().default(true),
    highlight: boolean("highlight").notNull().default(false),
    description: text("description").notNull().default(""),
  },
  (t) => [index("categories_parent_idx").on(t.parentId)],
);

export const products = pgTable(
  "products",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    code: text("code").notNull().default(""),
    description: text("description").notNull().default(""),
    price: integer("price").notNull(),
    comparePrice: integer("compare_price"),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    isNew: boolean("is_new").notNull().default(false),
    isTrend: boolean("is_trend").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_created_idx").on(t.createdAt),
  ],
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.categoryId] }),
    index("product_categories_category_idx").on(t.categoryId),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: id(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: id(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    stock: integer("stock").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_variants_product_idx").on(t.productId)],
);

export const ORDER_STATUSES = [
  "pending",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export const PAYMENT_METHODS = ["bank_transfer", "cash_on_delivery"] as const;
export const PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const orders = pgTable(
  "orders",
  {
    id: id(),
    // Eşzamanlı siparişlerde çakışmasın diye numarayı veritabanı üretir (100001, 100002...).
    orderNo: integer("order_no")
      .notNull()
      .unique()
      .generatedByDefaultAsIdentity({ startWith: 100001 }),
    token: text("token").notNull().unique(),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    address: text("address").notNull(),
    note: text("note").notNull().default(""),
    status: text("status", { enum: ORDER_STATUSES })
      .notNull()
      .default("pending"),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }).notNull(),
    paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES })
      .notNull()
      .default("pending"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shippingFee: integer("shipping_fee").notNull().default(0),
    paymentFee: integer("payment_fee").notNull().default(0),
    total: integer("total").notNull(),
    cargoCompany: text("cargo_company").notNull().default(""),
    trackingNo: text("tracking_no").notNull().default(""),
    adminNote: text("admin_note").notNull().default(""),
    stockRestored: boolean("stock_restored").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_email_idx").on(t.email),
    index("orders_user_idx").on(t.userId),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: integer("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    code: text("code").notNull().default(""),
    size: text("size").notNull(),
    imageUrl: text("image_url").notNull().default(""),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const BANNER_PLACEMENTS = ["hero", "wide", "category"] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export const banners = pgTable("banners", {
  id: id(),
  placement: text("placement", { enum: BANNER_PLACEMENTS }).notNull(),
  title: text("title").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  buttonText: text("button_text").notNull().default(""),
  link: text("link").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  mobileImageUrl: text("mobile_image_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    isApproved: boolean("is_approved").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);

export const PAGE_GROUPS = ["kurumsal", "musteri", "none"] as const;
export type PageGroup = (typeof PAGE_GROUPS)[number];

export const pages = pgTable("pages", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  footerGroup: text("footer_group", { enum: PAGE_GROUPS })
    .notNull()
    .default("kurumsal"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const subscribers = pgTable("subscribers", {
  id: id(),
  email: text("email").notNull().unique(),
  createdAt: createdAt(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const productsRelations = relations(products, ({ many, one }) => ({
  images: many(productImages),
  variants: many(productVariants),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  categoryLinks: many(productCategories),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  }),
);

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));
