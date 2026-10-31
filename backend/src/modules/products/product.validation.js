const { z } = require('zod');

const variantSchema = z.object({
  name: z.string({ required_error: 'Variant name is required' }).trim().min(1, 'Variant name cannot be empty'),
  priceDelta: z.number({ required_error: 'Variant priceDelta is required' }).default(0),
  sku: z.string({ required_error: 'SKU is required' }).trim().min(1, 'SKU cannot be empty'),
  isActive: z.boolean().default(true),
});

const createProductValidation = {
  body: z.object({
    name: z.string({ required_error: 'Product name is required' }).trim().min(1, 'Product name cannot be empty'),
    type: z.enum(['service', 'goods', 'software', 'addon'], {
      errorMap: () => ({ message: 'Product type must be one of: service, goods, software, addon' }),
    }),
    salesPrice: z.number({ required_error: 'Sales price is required' }).min(0, 'Sales price must be ≥ 0'),
    costPrice: z.number().min(0, 'Cost price must be ≥ 0').default(0),
    notes: z.string().trim().optional().default(''),
    variants: z.array(variantSchema).default([]),
    isActive: z.boolean().default(true),
  }).superRefine((data, ctx) => {
    // 1. Check unique variant names and unique SKUs within the product
    const variantNames = new Set();
    const variantSkus = new Set();

    data.variants.forEach((v, index) => {
      const lowerName = v.name.toLowerCase();
      const lowerSku = v.sku.toLowerCase();

      if (variantNames.has(lowerName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants', index, 'name'],
          message: `Duplicate variant name '${v.name}' in product`,
        });
      }
      variantNames.add(lowerName);

      if (variantSkus.has(lowerSku)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants', index, 'sku'],
          message: `Duplicate variant SKU '${v.sku}' in product`,
        });
      }
      variantSkus.add(lowerSku);

      // 2. salesPrice + priceDelta must never go below 0
      if (data.salesPrice + v.priceDelta < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants', index, 'priceDelta'],
          message: `salesPrice + priceDelta (${data.salesPrice} + ${v.priceDelta} = ${data.salesPrice + v.priceDelta}) cannot be below 0`,
        });
      }
    });
  }),
};

const updateProductValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
  }),
  body: z.object({
    name: z.string().trim().min(1, 'Product name cannot be empty').optional(),
    type: z.enum(['service', 'goods', 'software', 'addon']).optional(),
    salesPrice: z.number().min(0, 'Sales price must be ≥ 0').optional(),
    costPrice: z.number().min(0, 'Cost price must be ≥ 0').optional(),
    notes: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  }),
};

const updateProductStatusValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
  }),
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive status is required' }),
  }),
};

const listProductsValidation = {
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(500).default(10),
    search: z.string().optional(),
    type: z.enum(['service', 'goods', 'software', 'addon']).optional(),
    isActive: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

const productIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
  }),
};

const addVariantValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
  }),
  body: variantSchema,
};

const updateVariantValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    variantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid variant ID format'),
  }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    priceDelta: z.number().optional(),
    sku: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for variant update',
  }),
};

const variantIdParamValidation = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    variantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid variant ID format'),
  }),
};

module.exports = {
  createProductValidation,
  updateProductValidation,
  updateProductStatusValidation,
  listProductsValidation,
  productIdParamValidation,
  addVariantValidation,
  updateVariantValidation,
  variantIdParamValidation,
};
