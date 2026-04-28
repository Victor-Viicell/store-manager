import { ScrollView, Dimensions } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Divider } from "@/components/ui/divider";
import { Pressable } from "react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import {
  ShoppingBag,
  Shirt,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Users,
  Bell,
} from "lucide-react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.52;

// --- StatCard ---
const StatCard = ({ icon: IconComponent, title, value, delta, color }: any) => (
  <Box className="flex-1 bg-white p-4 rounded-2xl border border-slate-100">
    <HStack className="justify-between items-center mb-3">
      <Box className={`p-2 rounded-xl ${color}`}>
        <IconComponent size={18} color="white" />
      </Box>
      <Box className="bg-green-50 px-2 py-0.5 rounded-lg">
        <Text className="text-green-600 text-xs font-semibold">{delta}</Text>
      </Box>
    </HStack>
    <Text className="text-slate-400 text-xs font-medium mb-0.5">{title}</Text>
    <Heading size="lg" className="text-slate-800">{value}</Heading>
  </Box>
);

// --- ActivityItem ---
const ActivityItem = ({ order, time, amount, last }: any) => (
  <>
    <HStack className="items-center justify-between py-3">
      <HStack space="md" className="items-center">
        <Box className="w-9 h-9 rounded-xl bg-cyan-50 items-center justify-center border border-cyan-100">
          <ShoppingBag size={16} color="#0891b2" />
        </Box>
        <VStack>
          <Text className="text-slate-800 font-semibold text-sm">Pedido #{order}</Text>
          <Text className="text-slate-400 text-xs">{time}</Text>
        </VStack>
      </HStack>
      <VStack className="items-end">
        <Text className="font-semibold text-slate-800 text-sm">{amount}</Text>
        <Text className="text-green-500 text-xs font-semibold">Pago</Text>
      </VStack>
    </HStack>
    {!last && <Divider className="bg-slate-100" />}
  </>
);

// --- ItemCard (grid) ---
type ItemCardProps = {
  name: string;
  collection: string;
  price: number;
  category: string;
  onPress?: () => void;
};

const ItemCard = ({ name, collection, price, category, onPress }: ItemCardProps) => {
  const formattedPrice = price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-hidden active:opacity-80"
    >
      <Box className="bg-slate-50 h-36 items-center justify-center border-b border-slate-100">
        <Shirt size={36} color="#cbd5e1" strokeWidth={1.5} />
      </Box>
      <VStack className="p-3" space="xs">
        <Text className="text-slate-800 font-bold text-sm leading-tight" numberOfLines={1}>{name}</Text>
        <Text className="text-slate-400 text-xs font-medium" numberOfLines={1}>{collection}</Text>
        <HStack className="items-center justify-between mt-1">
          <Text className="text-slate-900 font-bold text-sm">{formattedPrice}</Text>
          <Badge className="bg-slate-100 rounded-lg px-2 py-0.5">
            <BadgeText className="text-slate-500 text-xs font-semibold">{category}</BadgeText>
          </Badge>
        </HStack>
      </VStack>
    </Pressable>
  );
};

// --- HighlightCard (carrossel) ---
const HighlightCard = ({ name, collection, price, category, onPress }: ItemCardProps) => {
  const formattedPrice = price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <Pressable
      onPress={onPress}
      style={{ width: CARD_WIDTH }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden active:opacity-80 mr-3"
    >
      <Box
        className="bg-slate-50 items-center justify-center border-b border-slate-100"
        style={{ height: CARD_WIDTH }}
      >
        <Shirt size={44} color="#cbd5e1" strokeWidth={1.5} />
      </Box>
      <VStack className="p-3" space="xs">
        <Text className="text-slate-800 font-bold text-sm leading-tight" numberOfLines={1}>{name}</Text>
        <Text className="text-slate-400 text-xs font-medium" numberOfLines={1}>{collection}</Text>
        <HStack className="items-center justify-between mt-1">
          <Text className="text-slate-900 font-bold text-sm">{formattedPrice}</Text>
          <Badge className="bg-slate-100 rounded-lg px-2 py-0.5">
            <BadgeText className="text-slate-500 text-xs font-semibold">{category}</BadgeText>
          </Badge>
        </HStack>
      </VStack>
    </Pressable>
  );
};

// --- Data ---
const activities = [
  { order: "2031", time: "2 min atrás", amount: "R$ 45,00" },
  { order: "2032", time: "8 min atrás", amount: "R$ 120,00" },
  { order: "2033", time: "15 min atrás", amount: "R$ 33,50" },
];

const highlights = [
  { id: "1", name: "Camiseta Oversized", collection: "Urban Fit · Street 2026", price: 129.90, category: "Adulto" },
  { id: "2", name: "Calça Cargo", collection: "Urban Fit · Street 2026", price: 249.90, category: "Adulto" },
  { id: "3", name: "Moletom Basic", collection: "Essentials · Winter 2026", price: 189.90, category: "Unissex" },
  { id: "4", name: "Tênis Runner", collection: "Active · Sport 2026", price: 399.90, category: "Adulto" },
];

const items = [
  { id: "5", name: "Boné Trucker", collection: "Acessórios · Summer 2026", price: 89.90, category: "Adulto" },
  { id: "6", name: "Meia Cano Alto", collection: "Essentials · Basics", price: 39.90, category: "Unissex" },
  { id: "7", name: "Jaqueta Jeans", collection: "Urban Fit · Street 2026", price: 319.90, category: "Adulto" },
  { id: "8", name: "Shorts Tactel", collection: "Active · Sport 2026", price: 99.90, category: "Adulto" },
];

// --- Screen ---
export default function Dashboard() {
  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <VStack space="lg" className="pb-8">
        {/* Destaques — Carrossel */}
        <VStack space="sm">
          <HStack className="justify-between items-center px-4">
            <Heading size="sm" className="text-slate-800">Destaques</Heading>
            <Pressable className="flex-row items-center gap-1 active:opacity-60">
              <Text className="text-cyan-600 text-xs font-semibold">Ver todos</Text>
              <ArrowRight size={12} color="#0891b2" />
            </Pressable>
          </HStack>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
          >
            {highlights.map((item) => (
              <HighlightCard key={item.id} {...item} />
            ))}
          </ScrollView>
        </VStack>

        {/* Todos os Produtos — Grid */}
        <VStack space="sm" className="px-4">
          <HStack className="justify-between items-center">
            <Heading size="sm" className="text-slate-800">Todos os Produtos</Heading>
            <Pressable className="flex-row items-center gap-1 active:opacity-60">
              <Text className="text-cyan-600 text-xs font-semibold">Ver todos</Text>
              <ArrowRight size={12} color="#0891b2" />
            </Pressable>
          </HStack>
          <HStack space="sm">
            <ItemCard {...items[0]} />
            <ItemCard {...items[1]} />
          </HStack>
          <HStack space="sm">
            <ItemCard {...items[2]} />
            <ItemCard {...items[3]} />
          </HStack>
        </VStack>

      </VStack>
    </ScrollView>
  );
}