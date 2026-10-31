import {
  Home,
  Map,
  CalendarDays,
  Cake,
  Calculator,
  CreditCard,
  Camera,
  UserRound,
  Image,
  Globe,
  Landmark,
  Users,
  RefreshCw,
  MessageCircle,
  Package,
  Mail,
  type LucideIcon,
} from "lucide-react"

export const MENU_ICONS: Record<string, LucideIcon> = {
  home: Home,
  map: Map,
  calendar: CalendarDays,
  cake: Cake,
  calculator: Calculator,
  "credit-card": CreditCard,
  camera: Camera,
  "user-octagon": UserRound,
  image: Image,
  earth: Globe,
  bank: Landmark,
  group: Users,
  refresh1: RefreshCw,
  chat: MessageCircle,
  box: Package,
  email: Mail,
}

export function menuIcon(key: string): LucideIcon {
  return MENU_ICONS[key] ?? Globe
}
