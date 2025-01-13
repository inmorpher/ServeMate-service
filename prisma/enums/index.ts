// This file was generated by a custom prisma generator, do not edit manually.
export const UserRole = {
  ADMIN: "ADMIN",
  USER: "USER",
  HOST: "HOST",
  MANAGER: "MANAGER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OrderState = {
  AWAITING: "AWAITING",
  RECEIVED: "RECEIVED",
  SERVED: "SERVED",
  CANCELED: "CANCELED",
  DISPUTED: "DISPUTED",
  COMPLETED: "COMPLETED",
} as const;

export type OrderState = (typeof OrderState)[keyof typeof OrderState];

export const SpiceLevel = {
  NOT_SPICY: "NOT_SPICY",
  MILD: "MILD",
  MEDIUM: "MEDIUM",
  HOT: "HOT",
  EXTRA_HOT: "EXTRA_HOT",
} as const;

export type SpiceLevel = (typeof SpiceLevel)[keyof typeof SpiceLevel];

export const PaymentState = {
  NONE: "NONE",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
  PENDING: "PENDING",
} as const;

export type PaymentState = (typeof PaymentState)[keyof typeof PaymentState];

export const DrinkTemp = {
  COLD: "COLD",
  ROOM: "ROOM",
  HOT: "HOT",
} as const;

export type DrinkTemp = (typeof DrinkTemp)[keyof typeof DrinkTemp];

export const TableCondition = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  RESERVED: "RESERVED",
  ORDERING: "ORDERING",
  SERVING: "SERVING",
  PAYMENT: "PAYMENT",
} as const;

export type TableCondition = (typeof TableCondition)[keyof typeof TableCondition];

export const OrderAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  ADD_ITEM: "ADD_ITEM",
  REMOVE_ITEM: "REMOVE_ITEM",
  CHANGE_STATUS: "CHANGE_STATUS",
} as const;

export type OrderAction = (typeof OrderAction)[keyof typeof OrderAction];

export const PaymentMethod = {
  CASH: "CASH",
  CREDIT_CARD: "CREDIT_CARD",
  DEBIT_CARD: "DEBIT_CARD",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const Allergy = {
  NONE: "NONE",
  GLUTEN: "GLUTEN",
  DAIRY: "DAIRY",
  EGG: "EGG",
  PEANUT: "PEANUT",
  TREENUT: "TREENUT",
  FISH: "FISH",
  SHELLFISH: "SHELLFISH",
  SOY: "SOY",
  SESAME: "SESAME",
  CELERY: "CELERY",
  MUSTARD: "MUSTARD",
  LUPIN: "LUPIN",
  SULPHITES: "SULPHITES",
  MOLLUSCS: "MOLLUSCS",
} as const;

export type Allergy = (typeof Allergy)[keyof typeof Allergy];

export const FoodType = {
  APPETIZER: "APPETIZER",
  MAIN_COURSE: "MAIN_COURSE",
  DESSERT: "DESSERT",
  SIDES: "SIDES",
  SAUCE: "SAUCE",
  OTHER: "OTHER",
} as const;

export type FoodType = (typeof FoodType)[keyof typeof FoodType];

export const FoodCategory = {
  SALAD: "SALAD",
  MEAT: "MEAT",
  SOUP: "SOUP",
  FISH: "FISH",
  VEGGIES: "VEGGIES",
  OTHER: "OTHER",
  SEAFOOD: "SEAFOOD",
} as const;

export type FoodCategory = (typeof FoodCategory)[keyof typeof FoodCategory];

export const DrinkCategory = {
  BEER: "BEER",
  WINE: "WINE",
  SPIRITS: "SPIRITS",
  COFFEE: "COFFEE",
  TEA: "TEA",
  OTHER: "OTHER",
  SODA: "SODA",
  ALCOHOLIC: "ALCOHOLIC",
  NON_ALCOHOLIC: "NON_ALCOHOLIC",
} as const;

export type DrinkCategory = (typeof DrinkCategory)[keyof typeof DrinkCategory];
