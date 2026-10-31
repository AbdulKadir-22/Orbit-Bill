const { isEligible, calcDiscountAmount } = require('../../src/utils/discountEligibility');
const { roundMoney, calcLine } = require('../../src/utils/pricing');

describe('Pricing & Discount Eligibility Pure Logic Tests', () => {
  describe('roundMoney', () => {
    test('accurately rounds monetary amounts to 2 decimal places', () => {
      expect(roundMoney(10.005)).toBe(10.01);
      expect(roundMoney(10.004)).toBe(10);
      expect(roundMoney(1234.5678)).toBe(1234.57);
      expect(roundMoney(0)).toBe(0);
    });
  });

  describe('calcLine', () => {
    test('computes line total with standard tax rate and unit price', () => {
      // 2 items @ 1000 each = 2000 subtotal, 18% tax = 360 tax, 2360 total
      const result = calcLine({ unitPrice: 1000, quantity: 2, taxRate: 18 });
      expect(result.subtotal).toBe(2000);
      expect(result.taxAmount).toBe(360);
      expect(result.lineTotal).toBe(2360);
    });

    test('handles zero tax rate correctly', () => {
      const result = calcLine({ unitPrice: 500, quantity: 3, taxRate: 0 });
      expect(result.subtotal).toBe(1500);
      expect(result.taxAmount).toBe(0);
      expect(result.lineTotal).toBe(1500);
    });
  });

  describe('isEligible', () => {
    const activeDiscount = {
      isActive: true,
      appliesTo: 'subscription',
      minPurchase: 1000,
      minQuantity: 2,
      usageLimit: 10,
      usedCount: 2,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    };

    test('returns true when all threshold and date requirements are satisfied', () => {
      const eligible = isEligible(activeDiscount, {
        subtotal: 1500,
        quantity: 3,
        now: new Date('2026-06-01'),
      });
      expect(eligible).toBe(true);
    });

    test('returns false when invoice subtotal is below minPurchase', () => {
      const eligible = isEligible(activeDiscount, {
        subtotal: 800,
        quantity: 5,
        now: new Date('2026-06-01'),
      });
      expect(eligible).toBe(false);
    });

    test('returns false when discount usage limit has been reached', () => {
      const maxedDiscount = { ...activeDiscount, usedCount: 10 };
      const eligible = isEligible(maxedDiscount, {
        subtotal: 2000,
        quantity: 5,
        now: new Date('2026-06-01'),
      });
      expect(eligible).toBe(false);
    });
  });

  describe('calcDiscountAmount', () => {
    test('computes percentage discount and caps at subtotal', () => {
      const discount = { type: 'percentage', value: 20 };
      const amount = calcDiscountAmount(discount, 1000);
      expect(amount).toBe(200);
    });

    test('caps fixed discount so it never exceeds subtotal', () => {
      const discount = { type: 'fixed', value: 500 };
      const amount = calcDiscountAmount(discount, 300);
      expect(amount).toBe(300);
    });
  });
});
