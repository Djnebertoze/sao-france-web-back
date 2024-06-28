export class ShopProductDto {
    name?: string;
    description?: string;
    price?: number;
    isRealMoney?: boolean;
    imageUrl?: string;
    categorieId?: string;
    stripeLink?: string;
    active: boolean;
    descriptionDetails?: string;
    // Only if categorieId == points
    pointsToGive?: number;
    // Only if categorieId == grades
    roleToGive?: string;
    cosmeticToGive?: string;
    bonusShopPoints?: number;
}