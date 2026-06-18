-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "series" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "works" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "series_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DESIGNING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "works_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "works_assets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "work_id" INTEGER NOT NULL,
    "story" TEXT,
    "design_concept" TEXT,
    "thumbnail" TEXT,
    "gallery" TEXT,
    "video_url" TEXT,
    "quote" TEXT,
    "launch_date" DATETIME,
    CONSTRAINT "works_assets_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "work_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DESIGNING',
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "products_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_skus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DESIGNING',
    "specification" TEXT DEFAULT '',
    "size" TEXT DEFAULT '',
    "price" REAL NOT NULL DEFAULT 0,
    "finished_stock" INTEGER NOT NULL DEFAULT 0,
    "markup_ratio" REAL DEFAULT 1.0,
    "rarity_level" INTEGER DEFAULT 1,
    "story_factor" REAL DEFAULT 1.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "product_skus_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_costs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sku_id" INTEGER NOT NULL,
    "material_cost" REAL NOT NULL DEFAULT 0,
    "labor_cost" REAL NOT NULL DEFAULT 0,
    "total_cost" REAL NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "product_costs_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "product_skus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "materialType" TEXT NOT NULL DEFAULT 'OTHER',
    "specification" TEXT DEFAULT '',
    "inventoryUnit" TEXT NOT NULL DEFAULT '颗',
    "remaining" REAL NOT NULL DEFAULT 0,
    "unitCost" REAL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "shape" TEXT DEFAULT '',
    "beads_per_strand" INTEGER DEFAULT 0,
    "weight_per_strand" REAL DEFAULT 0,
    "default_purchase_unit" TEXT DEFAULT '个',
    "default_conversion_rate" REAL DEFAULT 1,
    "supplier" TEXT NOT NULL DEFAULT '',
    "remark" TEXT DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "purchase_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "materialId" INTEGER NOT NULL,
    "purchase_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplier" TEXT,
    "purchaseUnit" TEXT NOT NULL,
    "conversionRate" REAL NOT NULL,
    "purchaseQuantity" REAL NOT NULL,
    "purchase_unit_price" REAL,
    "purchasePrice" REAL NOT NULL,
    "inventory_quantity" REAL NOT NULL,
    "unitCost" REAL,
    "remark" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_records_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "raw_materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "materialId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "beforeQty" REAL NOT NULL,
    "afterQty" REAL NOT NULL,
    "related_doc" TEXT,
    "remark" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_transactions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "raw_materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bom" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sku_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL,
    "line_cost" REAL,
    "material_code_snapshot" TEXT NOT NULL,
    "material_name_snapshot" TEXT NOT NULL,
    CONSTRAINT "bom_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "product_skus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bom_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "raw_materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "series_code_key" ON "series"("code");

-- CreateIndex
CREATE UNIQUE INDEX "works_code_key" ON "works"("code");

-- CreateIndex
CREATE UNIQUE INDEX "works_assets_work_id_key" ON "works_assets"("work_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "product_skus_code_key" ON "product_skus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "product_costs_sku_id_key" ON "product_costs"("sku_id");

-- CreateIndex
CREATE UNIQUE INDEX "raw_materials_code_key" ON "raw_materials"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bom_sku_id_material_id_key" ON "bom"("sku_id", "material_id");
