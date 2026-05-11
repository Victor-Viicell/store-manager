import { ScrollView, Dimensions, Image, ActivityIndicator, FlatList } from "react-native";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/utils/supabase";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ProfileDrawer } from "@/components/profile-drawer";
import {
  ShoppingBag,
  Users,
  ArrowRight,
  Package,
  Search,
} from "lucide-react-native";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { useCart } from "@/context/cart";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.52;

// ── Item Types ──────────────────────────────────────────────────────────
type StoreItem = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
  category_id: string | null;
  categories: { name: string }[] | null;
};

type Category = {
  id: string;
  name: string;
};

// ── Format helpers ──────────────────────────────────────────────────────
const formatPrice = (price: number) =>
  price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ── ItemCard (grid 2-col) ───────────────────────────────────────────────
const ItemCard = ({
  item,
  onPress,
}: {
  item: StoreItem;
  onPress?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{ width: "48%" }}
    className="bg-white rounded-2xl border border-slate-100 overflow-hidden active:opacity-80 mb-3"
  >
    <Box className="bg-slate-50 h-40 items-center justify-center border-b border-slate-100 overflow-hidden">
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <Package size={36} color="#cbd5e1" strokeWidth={1.5} />
      )}
    </Box>
    <VStack className="p-3" space="xs">
      <Text
        className="text-slate-800 font-bold text-sm leading-tight"
        numberOfLines={1}
      >
        {item.name}
      </Text>
      {item.categories?.[0]?.name && (
        <Text
          className="text-slate-400 text-xs font-medium"
          numberOfLines={1}
        >
          {item.categories[0].name}
        </Text>
      )}
      <Text className="text-slate-900 font-bold text-sm mt-0.5">
        {formatPrice(item.price)}
      </Text>
    </VStack>
  </Pressable>
);

// ── HighlightCard (carousel) ────────────────────────────────────────────
const HighlightCard = ({
  item,
  onPress,
}: {
  item: StoreItem;
  onPress?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{ width: CARD_WIDTH }}
    className="bg-white rounded-2xl border border-slate-100 overflow-hidden active:opacity-80 mr-3"
  >
    <Box
      className="bg-slate-50 items-center justify-center border-b border-slate-100 overflow-hidden"
      style={{ height: CARD_WIDTH }}
    >
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <Package size={44} color="#cbd5e1" strokeWidth={1.5} />
      )}
    </Box>
    <VStack className="p-3" space="xs">
      <Text
        className="text-slate-800 font-bold text-sm leading-tight"
        numberOfLines={1}
      >
        {item.name}
      </Text>
      {item.categories?.[0]?.name && (
        <Text
          className="text-slate-400 text-xs font-medium"
          numberOfLines={1}
        >
          {item.categories[0].name}
        </Text>
      )}
      <HStack className="items-center justify-between mt-1">
        <Text className="text-slate-900 font-bold text-sm">
          {formatPrice(item.price)}
        </Text>
      </HStack>
    </VStack>
  </Pressable>
);

// ── CategoryPill ────────────────────────────────────────────────────────
const CategoryPill = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className={`px-4 py-2 rounded-full mr-2 ${
      active
        ? "bg-slate-900"
        : "bg-white border border-slate-200"
    }`}
  >
    <Text
      className={`text-sm font-semibold ${
        active ? "text-white" : "text-slate-600"
      }`}
    >
      {label}
    </Text>
  </Pressable>
);

// ── Main Store Screen ───────────────────────────────────────────────────
export default function Store() {
  const router = useRouter();
  const [isManager, setIsManager] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const cart = useCart();

  const [items, setItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchManagerStatus = async (currentUser: any) => {
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('is_manager')
          .eq('id', currentUser.id)
          .single();
          
        setIsManager(!!data?.is_manager);
      } else {
        setIsManager(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchManagerStatus(session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchManagerStatus(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        supabase
          .from("items")
          .select("id, name, price, image_url, description, category_id, categories(name)")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name").order("name"),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (catsRes.error) throw catsRes.error;

      setItems((itemsRes.data as StoreItem[]) || []);
      setCategories((catsRes.data as Category[]) || []);
    } catch (err) {
      console.error("Failed to fetch store data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Derived data
  const filteredItems = useMemo(() => {
    let result = items;

    if (activeCategory) {
      result = result.filter((i) => i.category_id === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, activeCategory, searchQuery]);

  // First 6 items as highlights (most recent)
  const highlights = items.slice(0, 6);

  // Build a 2-col grid from the filtered list
  const gridRows: StoreItem[][] = [];
  for (let i = 0; i < filteredItems.length; i += 2) {
    gridRows.push(filteredItems.slice(i, i + 2));
  }

  const handleItemPress = (item: StoreItem) => {
    router.push(`/web/store/item?id=${item.id}`);
  };

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
      </Box>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      showsVerticalScrollIndicator={false}
    >
      {/* App Header */}
      <HStack className="justify-between items-center px-4 py-3 bg-white border-b border-slate-100">
        <HStack space="md" className="items-center">
          <Box className="bg-primary-600 p-2 rounded-xl">
            <ShoppingBag size={20} color="white" />
          </Box>
          <Heading size="md" className="text-slate-900">
            Loja Online
          </Heading>
        </HStack>
        <HStack space="md" className="items-center">
          <Pressable
            onPress={() => router.push("/web/cart")}
            className="p-2 relative active:opacity-60"
          >
            <ShoppingBag size={24} color="#0f172a" />
            {cart.totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-primary-600 px-1.5 py-0 min-w-[20px] items-center justify-center rounded-full border-2 border-white">
                <BadgeText className="text-[10px] text-white font-bold">
                  {cart.totalItems}
                </BadgeText>
              </Badge>
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              if (user) {
                setShowProfile(true);
              } else {
                router.push("/login");
              }
            }}
            className="p-2 active:opacity-60"
          >
            <Users size={24} color="#0f172a" />
          </Pressable>
        </HStack>
      </HStack>

      <ProfileDrawer
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        isManager={isManager}
      />

      <VStack space="lg" className="pb-8">
        {/* Search Bar */}
        <Box className="px-4 pt-4">
          <Input className="rounded-xl border-slate-200 h-11 bg-white">
            <InputSlot className="pl-4">
              <InputIcon as={Search} size="sm" color="#94a3b8" />
            </InputSlot>
            <InputField
              placeholder="O que você procura?"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="text-sm"
            />
          </Input>
        </Box>

        {/* Category Pills */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <CategoryPill
              label="Todos"
              active={activeCategory === null}
              onPress={() => setActiveCategory(null)}
            />
            {categories.map((cat) => (
              <CategoryPill
                key={cat.id}
                label={cat.name}
                active={activeCategory === cat.id}
                onPress={() =>
                  setActiveCategory(
                    activeCategory === cat.id ? null : cat.id
                  )
                }
              />
            ))}
          </ScrollView>
        )}

        {/* Highlights Carousel (only when no search/filter) */}
        {!searchQuery && !activeCategory && highlights.length > 0 && (
          <VStack space="sm">
            <HStack className="justify-between items-center px-4">
              <Heading size="sm" className="text-slate-800">
                Destaques
              </Heading>
            </HStack>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 4,
              }}
            >
              {highlights.map((item) => (
                <HighlightCard
                  key={item.id}
                  item={item}
                  onPress={() => handleItemPress(item)}
                />
              ))}
            </ScrollView>
          </VStack>
        )}

        {/* All Products Grid */}
        <VStack space="sm" className="px-4">
          <HStack className="justify-between items-center">
            <Heading size="sm" className="text-slate-800">
              {activeCategory
                ? categories.find((c) => c.id === activeCategory)?.name ||
                  "Produtos"
                : "Todos os Produtos"}
            </Heading>
            <Text className="text-slate-400 text-xs font-medium">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "itens"}
            </Text>
          </HStack>

          {filteredItems.length === 0 ? (
            <Box className="items-center justify-center py-16">
              <Package size={48} color="#cbd5e1" strokeWidth={1} />
              <Text className="text-slate-400 text-sm mt-4">
                Nenhum produto encontrado.
              </Text>
            </Box>
          ) : (
            gridRows.map((row, index) => (
              <HStack
                key={index}
                space="sm"
                className="justify-between"
              >
                {row.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onPress={() => handleItemPress(item)}
                  />
                ))}
                {/* Fill empty space if odd number */}
                {row.length === 1 && <Box style={{ width: "48%" }} />}
              </HStack>
            ))
          )}
        </VStack>
      </VStack>
    </ScrollView>
  );
}