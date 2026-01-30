import { ObjectId } from "mongodb";
import { 
  Apple, 
  Fuel, 
  Route, 
  PlusCircle, 
  HelpCircle, 
  ShoppingCart,
  Cookie,
  PiggyBank,
  TrendingUp,
  Car,
  Film,
  Receipt,
  Heart,
  Home,
  Briefcase,
  Coffee,
  Book,
  Gift,
  Plane,
  Train,
  Bus,
  Bike,
  Utensils,
  Pizza,
  Wine,
  Smartphone,
  Laptop,
  Gamepad2,
  Dumbbell,
  Shirt,
  Baby,
  Dog,
  Cat,
  Wrench,
  Music,
  Camera,
  Sparkles,
  Zap,
  Wallet,
  CreditCard,
  Banknote,
  ShoppingBag,
  Package,
  Paintbrush,
  Scissors,
  Hammer,
  Lightbulb,
  Leaf,
  TreePine,
  Flower2,
  Droplet,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Star,
  LucideIcon 
} from "lucide-react";

export interface User {
  _id?: ObjectId;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
}

export interface Account {
  _id?: ObjectId;
  userId: ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

export interface Session {
  _id?: ObjectId;
  sessionToken: string;
  userId: ObjectId;
  expires: Date;
}

export interface Expense {
  _id?: ObjectId;
  userId: string;
  date: Date;
  amount: number;
  category: string;
  description?: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  _id?: ObjectId;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface Budget {
  _id?: ObjectId;
  userId: string;
  categoryId: string;
  month: string; // Format: YYYY-MM
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_CATEGORIES = [
  { name: "Grocery", icon: "ShoppingCart", color: "#10b981", isDefault: true },
  { name: "Snacks", icon: "Cookie", color: "#f59e0b", isDefault: true },
  { name: "Fruits", icon: "Apple", color: "#fbbf24", isDefault: true },
  { name: "Savings", icon: "PiggyBank", color: "#8b5cf6", isDefault: true },
  { name: "Investments", icon: "TrendingUp", color: "#3b82f6", isDefault: true },
  { name: "Transport", icon: "Car", color: "#06b6d4", isDefault: true },
  { name: "Car Petrol", icon: "Fuel", color: "#f97316", isDefault: true },
  { name: "Car Toll", icon: "Route", color: "#14b8a6", isDefault: true },
  { name: "Entertainment", icon: "Film", color: "#ec4899", isDefault: true },
  { name: "Bills", icon: "Receipt", color: "#ef4444", isDefault: true },
  { name: "Health", icon: "Heart", color: "#22c55e", isDefault: true },
  { name: "Other", icon: "PlusCircle", color: "#6b7280", isDefault: true },
];

// Icon mapping utility
export const iconMap: Record<string, LucideIcon> = {
  Apple,
  Fuel,
  Route,
  PlusCircle,
  ShoppingCart,
  Cookie,
  PiggyBank,
  TrendingUp,
  Car,
  Film,
  Receipt,
  Heart,
  Home,
  Briefcase,
  Coffee,
  Book,
  Gift,
  Plane,
  Train,
  Bus,
  Bike,
  Utensils,
  Pizza,
  Wine,
  Smartphone,
  Laptop,
  Gamepad2,
  Dumbbell,
  Shirt,
  Baby,
  Dog,
  Cat,
  Wrench,
  Music,
  Camera,
  Sparkles,
  Zap,
  Wallet,
  CreditCard,
  Banknote,
  ShoppingBag,
  Package,
  Paintbrush,
  Scissors,
  Hammer,
  Lightbulb,
  Leaf,
  TreePine,
  Flower2,
  Droplet,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Star,
  HelpCircle,
};

// Available icons for user selection when creating custom categories
export const availableIcons = [
  { name: "ShoppingCart", component: ShoppingCart },
  { name: "Cookie", component: Cookie },
  { name: "Apple", component: Apple },
  { name: "Pizza", component: Pizza },
  { name: "Coffee", component: Coffee },
  { name: "Wine", component: Wine },
  { name: "Utensils", component: Utensils },
  { name: "ShoppingBag", component: ShoppingBag },
  { name: "Package", component: Package },
  { name: "Home", component: Home },
  { name: "Car", component: Car },
  { name: "Fuel", component: Fuel },
  { name: "Route", component: Route },
  { name: "Bike", component: Bike },
  { name: "Bus", component: Bus },
  { name: "Train", component: Train },
  { name: "Plane", component: Plane },
  { name: "Wallet", component: Wallet },
  { name: "CreditCard", component: CreditCard },
  { name: "Banknote", component: Banknote },
  { name: "PiggyBank", component: PiggyBank },
  { name: "TrendingUp", component: TrendingUp },
  { name: "Receipt", component: Receipt },
  { name: "Film", component: Film },
  { name: "Music", component: Music },
  { name: "Gamepad2", component: Gamepad2 },
  { name: "Camera", component: Camera },
  { name: "Heart", component: Heart },
  { name: "Dumbbell", component: Dumbbell },
  { name: "Briefcase", component: Briefcase },
  { name: "Book", component: Book },
  { name: "Laptop", component: Laptop },
  { name: "Smartphone", component: Smartphone },
  { name: "Gift", component: Gift },
  { name: "Shirt", component: Shirt },
  { name: "Baby", component: Baby },
  { name: "Dog", component: Dog },
  { name: "Cat", component: Cat },
  { name: "Wrench", component: Wrench },
  { name: "Hammer", component: Hammer },
  { name: "Scissors", component: Scissors },
  { name: "Paintbrush", component: Paintbrush },
  { name: "Lightbulb", component: Lightbulb },
  { name: "Sparkles", component: Sparkles },
  { name: "Zap", component: Zap },
  { name: "Leaf", component: Leaf },
  { name: "TreePine", component: TreePine },
  { name: "Flower2", component: Flower2 },
  { name: "Droplet", component: Droplet },
  { name: "Flame", component: Flame },
  { name: "Snowflake", component: Snowflake },
  { name: "Sun", component: Sun },
  { name: "Moon", component: Moon },
  { name: "Star", component: Star },
  { name: "PlusCircle", component: PlusCircle },
];

// Helper function to get icon component from icon name string
export function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || HelpCircle;
}
