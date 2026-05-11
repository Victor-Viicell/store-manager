import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/utils/supabase";
import { useCart } from "@/context/cart";
import type { SelectedOption, SelectedModifier } from "@/context/cart";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Package,
  Check,
  ShoppingCart,
  ChevronDown,
  Settings2,
  Layers,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Types ───────────────────────────────────────────────────────────────
type OptionItem = { id: string; name: string };
type OptionSetFull = {
  id: string;
  name: string;
  options: OptionItem[];
};

type ModifierItem = { id: string; name: string; price: number };
type ModifierSetFull = {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  allow_duplicates: boolean;
  modifiers: ModifierItem[];
};

type ItemDetail = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  sku: string | null;
  category_id: string | null;
  track_inventory: boolean;
  quantity: number | null;
  categories: { name: string }[] | null;
};

const formatPrice = (price: number) =>
  price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ── OptionSetSelector ───────────────────────────────────────────────────
const OptionSetSelector = ({
  optionSet,
  selectedId,
  onSelect,
}: {
  optionSet: OptionSetFull;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
}) => (
  <VStack space="sm">
    <HStack className="items-center" space="xs">
      <Icon as={Layers} size="xs" color="#64748b" />
      <Text className="text-sm font-bold text-slate-700">{optionSet.name}</Text>
      <Text className="text-xs text-red-400 font-semibold">*obrigatório</Text>
    </HStack>
    <HStack space="sm" className="flex-wrap">
      {optionSet.options.map((opt) => {
        const active = selectedId === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            className={`px-4 py-2.5 rounded-xl border-2 mb-1 ${
              active
                ? "border-slate-900 bg-slate-900"
                : "border-slate-200 bg-white active:border-slate-400"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                active ? "text-white" : "text-slate-700"
              }`}
            >
              {opt.name}
            </Text>
          </Pressable>
        );
      })}
    </HStack>
  </VStack>
);

// ── ModifierSetSelector ─────────────────────────────────────────────────
const ModifierSetSelector = ({
  modSet,
  selectedIds,
  onToggle,
}: {
  modSet: ModifierSetFull;
  selectedIds: string[];
  onToggle: (modifierId: string) => void;
}) => {
  const isRequired = modSet.min_selections > 0;
  const hasMax = modSet.max_selections < 999;

  let subtitle = "";
  if (isRequired && hasMax) {
    subtitle =
      modSet.min_selections === modSet.max_selections
        ? `Escolha ${modSet.min_selections}`
        : `Escolha de ${modSet.min_selections} a ${modSet.max_selections}`;
  } else if (isRequired) {
    subtitle = `Mínimo ${modSet.min_selections}`;
  } else if (hasMax) {
    subtitle = `Máximo ${modSet.max_selections}`;
  } else {
    subtitle = "Opcional";
  }

  return (
    <VStack space="sm">
      <HStack className="items-center justify-between">
        <HStack className="items-center" space="xs">
          <Icon as={Settings2} size="xs" color="#64748b" />
          <Text className="text-sm font-bold text-slate-700">
            {modSet.name}
          </Text>
        </HStack>
        <Text
          className={`text-xs font-semibold ${
            isRequired ? "text-red-400" : "text-slate-400"
          }`}
        >
          {subtitle}
        </Text>
      </HStack>

      <VStack space="xs">
        {modSet.modifiers.map((mod) => {
          const active = selectedIds.includes(mod.id);
          return (
            <Pressable
              key={mod.id}
              onPress={() => onToggle(mod.id)}
              className={`flex-row items-center justify-between px-4 py-3 rounded-xl border-2 ${
                active
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-100 bg-white active:border-slate-300"
              }`}
            >
              <HStack className="items-center" space="md">
                <Box
                  className={`w-5 h-5 rounded-md border-2 items-center justify-center ${
                    active
                      ? "bg-slate-900 border-slate-900"
                      : "border-slate-300"
                  }`}
                >
                  {active && <Check size={12} color="white" strokeWidth={3} />}
                </Box>
                <Text
                  className={`text-sm font-semibold ${
                    active ? "text-slate-900" : "text-slate-600"
                  }`}
                >
                  {mod.name}
                </Text>
              </HStack>
              {mod.price > 0 && (
                <Text className="text-xs font-bold text-slate-500">
                  + {formatPrice(mod.price)}
                </Text>
              )}
            </Pressable>
          );
        })}
      </VStack>
    </VStack>
  );
};

// ── Main Component ──────────────────────────────────────────────────────
export default function ItemDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cart = useCart();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Options & Modifiers
  const [optionSets, setOptionSets] = useState<OptionSetFull[]>([]);
  const [modifierSets, setModifierSets] = useState<ModifierSetFull[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, string[]>
  >({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (id) fetchItem(id);
  }, [id]);

  const fetchItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      // Fetch item details
      const { data, error } = await supabase
        .from("items")
        .select(
          "id, name, price, description, image_url, sku, category_id, track_inventory, quantity, categories(name)"
        )
        .eq("id", itemId)
        .single();

      if (error) throw error;
      setItem(data as ItemDetail);

      // Fetch option sets linked to this item
      const { data: optLinks } = await supabase
        .from("item_option_sets")
        .select("option_set_id")
        .eq("item_id", itemId);

      if (optLinks && optLinks.length > 0) {
        const optSetIds = optLinks.map((l: any) => l.option_set_id);
        const { data: optSetsData } = await supabase
          .from("option_sets")
          .select("id, name, options(id, name)")
          .in("id", optSetIds);

        if (optSetsData) {
          setOptionSets(optSetsData as OptionSetFull[]);
        }
      } else {
        setOptionSets([]);
      }

      // Fetch modifier sets linked to this item
      const { data: modLinks } = await supabase
        .from("item_modifier_sets")
        .select("modifier_set_id")
        .eq("item_id", itemId);

      if (modLinks && modLinks.length > 0) {
        const modSetIds = modLinks.map((l: any) => l.modifier_set_id);
        const { data: modSetsData } = await supabase
          .from("modifier_sets")
          .select(
            "id, name, min_selections, max_selections, allow_duplicates, modifiers(id, name, price)"
          )
          .in("id", modSetIds);

        if (modSetsData) {
          setModifierSets(modSetsData as ModifierSetFull[]);
        }
      } else {
        setModifierSets([]);
      }
    } catch (err) {
      console.error("Failed to fetch item:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Option selection ────────────────────────────────────────────────
  const handleSelectOption = (setId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [setId]: optionId }));
    setValidationErrors([]);
  };

  // ── Modifier toggle ─────────────────────────────────────────────────
  const handleToggleModifier = (setId: string, modifierId: string) => {
    const modSet = modifierSets.find((ms) => ms.id === setId);
    if (!modSet) return;

    setSelectedModifiers((prev) => {
      const current = prev[setId] || [];
      const isSelected = current.includes(modifierId);

      let updated: string[];
      if (isSelected) {
        updated = current.filter((id) => id !== modifierId);
      } else {
        // Check max
        if (
          modSet.max_selections < 999 &&
          current.length >= modSet.max_selections
        ) {
          return prev; // Already at max
        }
        updated = [...current, modifierId];
      }

      return { ...prev, [setId]: updated };
    });
    setValidationErrors([]);
  };

  // ── Validation ──────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: string[] = [];

    // Check all option sets have a selection
    for (const os of optionSets) {
      if (!selectedOptions[os.id]) {
        errors.push(`Selecione uma opção de "${os.name}"`);
      }
    }

    // Check modifier minimums
    for (const ms of modifierSets) {
      const count = (selectedModifiers[ms.id] || []).length;
      if (ms.min_selections > 0 && count < ms.min_selections) {
        errors.push(
          `Selecione pelo menos ${ms.min_selections} modificação(ões) de "${ms.name}"`
        );
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // ── Add to cart ─────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!item) return;
    if (!validate()) return;

    // Build selected options array
    const optArr: SelectedOption[] = optionSets
      .filter((os) => selectedOptions[os.id])
      .map((os) => {
        const opt = os.options.find((o) => o.id === selectedOptions[os.id])!;
        return {
          option_set_id: os.id,
          option_set_name: os.name,
          option_id: opt.id,
          option_name: opt.name,
        };
      });

    // Build selected modifiers array
    const modArr: SelectedModifier[] = modifierSets.flatMap((ms) => {
      const ids = selectedModifiers[ms.id] || [];
      return ids.map((mid) => {
        const mod = ms.modifiers.find((m) => m.id === mid)!;
        return {
          modifier_set_id: ms.id,
          modifier_set_name: ms.name,
          modifier_id: mod.id,
          modifier_name: mod.name,
          modifier_price: mod.price,
        };
      });
    });

    cart.addItem(
      {
        item_id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        selectedOptions: optArr,
        selectedModifiers: modArr,
      },
      qty
    );

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // ── Compute total with modifiers ────────────────────────────────────
  const modifiersExtra = modifierSets.reduce((sum, ms) => {
    const ids = selectedModifiers[ms.id] || [];
    return (
      sum +
      ids.reduce((s, mid) => {
        const mod = ms.modifiers.find((m) => m.id === mid);
        return s + (mod?.price || 0);
      }, 0)
    );
  }, 0);
  const unitPrice = (item?.price || 0) + modifiersExtra;

  const isOutOfStock =
    item?.track_inventory && (item?.quantity ?? 0) <= 0;

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
      </Box>
    );
  }

  if (!item) {
    return (
      <Box className="flex-1 items-center justify-center bg-white">
        <Package size={48} color="#cbd5e1" />
        <Text className="text-slate-400 mt-4">Produto não encontrado.</Text>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/web/store")} className="mt-4">
          <Text className="text-primary-600 font-semibold">Voltar</Text>
        </Pressable>
      </Box>
    );
  }

  const hasSelections = optionSets.length > 0 || modifierSets.length > 0;

  return (
    <Box className="flex-1 bg-white">
      {/* Top Bar */}
      <HStack className="justify-between items-center px-4 py-3 bg-white border-b border-slate-100">
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace("/web/store")}
          className="p-2 rounded-full active:bg-slate-50"
        >
          <ArrowLeft size={22} color="#0f172a" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/web/cart")}
          className="p-2 relative active:opacity-60"
        >
          <ShoppingBag size={22} color="#0f172a" />
          {cart.totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-primary-600 px-1.5 py-0 min-w-[20px] items-center justify-center rounded-full border-2 border-white">
              <BadgeText className="text-[10px] text-white font-bold">
                {cart.totalItems}
              </BadgeText>
            </Badge>
          )}
        </Pressable>
      </HStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <Box
          className="bg-slate-50 items-center justify-center overflow-hidden"
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85, maxHeight: 480 }}
        >
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Package size={64} color="#cbd5e1" strokeWidth={1} />
          )}
        </Box>

        {/* Product Info */}
        <VStack className="px-5 pt-5 pb-6" space="md">
          {/* Category badge */}
          {item.categories?.[0]?.name && (
            <Badge className="bg-slate-100 self-start rounded-lg px-3 py-1">
              <BadgeText className="text-slate-600 text-xs font-semibold">
                {item.categories[0].name}
              </BadgeText>
            </Badge>
          )}

          {/* Name */}
          <Heading size="xl" className="text-slate-950 font-bold leading-tight">
            {item.name}
          </Heading>

          {/* Price */}
          <Text className="text-2xl font-bold text-slate-900">
            {formatPrice(item.price)}
          </Text>

          {/* SKU */}
          {item.sku && (
            <Text className="text-xs text-slate-400">SKU: {item.sku}</Text>
          )}

          {/* Stock status */}
          {item.track_inventory && (
            <HStack className="items-center" space="xs">
              <Box
                className={`w-2 h-2 rounded-full ${
                  (item.quantity ?? 0) > 0 ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <Text
                className={`text-xs font-semibold ${
                  (item.quantity ?? 0) > 0
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {(item.quantity ?? 0) > 0
                  ? `Em estoque (${item.quantity})`
                  : "Esgotado"}
              </Text>
            </HStack>
          )}

          <Divider className="bg-slate-100 my-2" />

          {/* Description */}
          {item.description ? (
            <VStack space="xs">
              <Text className="text-sm font-bold text-slate-700">
                Descrição
              </Text>
              <Text className="text-sm text-slate-600 leading-relaxed">
                {item.description}
              </Text>
            </VStack>
          ) : (
            <Text className="text-sm text-slate-400 italic">
              Sem descrição disponível.
            </Text>
          )}

          {/* ── Option Sets ───────────────────────────────────────── */}
          {optionSets.length > 0 && (
            <>
              <Divider className="bg-slate-100 my-2" />
              <VStack space="lg">
                {optionSets.map((os) => (
                  <OptionSetSelector
                    key={os.id}
                    optionSet={os}
                    selectedId={selectedOptions[os.id] || null}
                    onSelect={(optId) => handleSelectOption(os.id, optId)}
                  />
                ))}
              </VStack>
            </>
          )}

          {/* ── Modifier Sets ─────────────────────────────────────── */}
          {modifierSets.length > 0 && (
            <>
              <Divider className="bg-slate-100 my-2" />
              <VStack space="lg">
                {modifierSets.map((ms) => (
                  <ModifierSetSelector
                    key={ms.id}
                    modSet={ms}
                    selectedIds={selectedModifiers[ms.id] || []}
                    onToggle={(modId) => handleToggleModifier(ms.id, modId)}
                  />
                ))}
              </VStack>
            </>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <VStack space="xs" className="mt-2">
              {validationErrors.map((err, i) => (
                <Text key={i} className="text-xs text-red-500 font-semibold">
                  • {err}
                </Text>
              ))}
            </VStack>
          )}
        </VStack>
      </ScrollView>

      {/* Bottom Add-to-Cart Bar */}
      <Box className="px-5 py-4 border-t border-slate-100 bg-white">
        {/* Show total breakdown if modifiers add price */}
        {modifiersExtra > 0 && (
          <HStack className="justify-between items-center mb-3">
            <Text className="text-xs text-slate-500">
              {formatPrice(item.price)} + {formatPrice(modifiersExtra)} extras
            </Text>
            <Text className="text-sm font-bold text-slate-900">
              {formatPrice(unitPrice)}/un.
            </Text>
          </HStack>
        )}

        <HStack className="items-center justify-between" space="md">
          {/* Quantity Selector */}
          <HStack
            className="items-center border border-slate-200 rounded-xl overflow-hidden"
          >
            <Pressable
              onPress={() => setQty(Math.max(1, qty - 1))}
              className="w-11 h-11 items-center justify-center active:bg-slate-50"
            >
              <Minus size={16} color="#0f172a" />
            </Pressable>
            <Box className="w-11 h-11 items-center justify-center border-l border-r border-slate-200">
              <Text className="text-base font-bold text-slate-900">
                {qty}
              </Text>
            </Box>
            <Pressable
              onPress={() => setQty(qty + 1)}
              className="w-11 h-11 items-center justify-center active:bg-slate-50"
            >
              <Plus size={16} color="#0f172a" />
            </Pressable>
          </HStack>

          {/* Add to Cart Button */}
          <Button
            onPress={handleAddToCart}
            isDisabled={!!isOutOfStock}
            className={`flex-1 h-12 rounded-xl ${
              addedToCart
                ? "bg-green-600"
                : isOutOfStock
                ? "bg-slate-300"
                : "bg-[#111827]"
            }`}
          >
            <ButtonIcon
              as={addedToCart ? Check : ShoppingCart}
              className="mr-2 text-white"
            />
            <ButtonText className="font-bold text-base">
              {addedToCart
                ? "Adicionado!"
                : isOutOfStock
                ? "Esgotado"
                : `Adicionar · ${formatPrice(unitPrice * qty)}`}
            </ButtonText>
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}