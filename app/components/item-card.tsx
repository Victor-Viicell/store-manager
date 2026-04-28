import { Pressable } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Shirt } from "lucide-react-native";

type ItemCardProps = {
  name: string;
  collection: string;
  price: number;
  category: string;
  imageUrl?: string;
  onPress?: () => void;
};

export const ItemCard = ({
  name,
  collection,
  price,
  category,
  onPress,
}: ItemCardProps) => {
  const formattedPrice = price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-hidden active:opacity-80"
    >
      {/* Image Area */}
      <Box className="bg-slate-50 h-40 items-center justify-center border-b border-slate-100">
        <Shirt size={40} color="#cbd5e1" strokeWidth={1.5} />
      </Box>

      {/* Info Area */}
      <VStack className="p-3" space="xs">
        <Text className="text-slate-800 font-bold text-sm leading-tight" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-slate-400 text-xs font-medium" numberOfLines={1}>
          {collection}
        </Text>

        <HStack className="items-center justify-between mt-1">
          <Text className="text-slate-900 font-bold text-sm">
            {formattedPrice}
          </Text>
          <Badge className="bg-slate-100 rounded-lg px-2 py-0.5">
            <BadgeText className="text-slate-500 text-xs font-semibold">
              {category}
            </BadgeText>
          </Badge>
        </HStack>
      </VStack>
    </Pressable>
  );
};
