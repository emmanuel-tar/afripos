import { Product, RawMaterial } from '../types';
import { LOW_STOCK_THRESHOLD_MULTIPLIER, SCARCITY_PREMIUM } from '../constants';

export const getProductProductionMetrics = (product: Partial<Product>, materials: RawMaterial[]) => {
    if (!product.ingredients || product.ingredients.length === 0) {
        // If no ingredients, check direct stock if applicable, otherwise assume available
        // Assuming products without ingredients are directly stocked items or infinite
        // If stock property exists we use it
        const isUnavailable = product.stock !== undefined && product.stock <= 0;
        return {
            totalCost: product.costPrice || 0,
            status: isUnavailable ? 'UNAVAILABLE' : 'AVAILABLE' as const,
            scarcityPricing: false,
            hasZeroStockIngredient: isUnavailable
        };
    }

    let totalCost = 0;
    let isUnavailable = false;
    let isScarce = false;
    let hasZeroStockIngredient = false;

    product.ingredients.forEach(ingredient => {
        const material = materials.find(m => m.id === ingredient.materialId);

        if (!material || material.quantity < ingredient.amount) {
            isUnavailable = true;
        }

        if (material && material.quantity === 0) {
            hasZeroStockIngredient = true;
        }

        if (material) {
            let ingredientCost = material.costPerUnit * ingredient.amount;
            if (material.quantity < ingredient.amount * (LOW_STOCK_THRESHOLD_MULTIPLIER || 5)) {
                isScarce = true;
                ingredientCost *= (SCARCITY_PREMIUM || 1.25);
            }
            totalCost += ingredientCost;
        }
    });

    return {
        totalCost,
        status: isUnavailable ? 'UNAVAILABLE' : (isScarce ? 'LOW_STOCK' : 'AVAILABLE') as any,
        scarcityPricing: isScarce,
        hasZeroStockIngredient
    };
};
