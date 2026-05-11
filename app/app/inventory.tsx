import React, { useState, useEffect } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetScrollView,
} from "@/components/ui/actionsheet";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@/components/ui/modal";
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
} from "@/components/ui/checkbox";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Search,
  Image as ImageIcon,
  Pencil,
  X,
  Check,
  Plus,
  Minus,
} from "lucide-react-native";
import { Pressable, ScrollView, Alert, ActivityIndicator, Image } from "react-native";
import { supabase } from "@/utils/supabase";

// ── Filter Dropdown Component ──────────────────────────────────────────
function FilterDropdown({
  label,
  options,
  isMulti = false,
  isOpen,
  onOpenChange,
  selected,
  setSelected,
}: {
  label: string;
  options: { label: string; value: string }[];
  isMulti?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const hasSelection = selected.size > 0;

  const toggleOption = (optValue: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(optValue)) next.delete(optValue);
      else next.add(optValue);
      return next;
    });
  };

  return (
    <VStack className="w-full">
      <Pressable
        onPress={() => onOpenChange(true)}
        className="flex-row justify-between items-center px-4 h-11 rounded-xl border border-slate-200 bg-white"
      >
        <Text className="text-slate-700 text-sm">
          {label}
        </Text>
        <ChevronDown size={16} color="#64748b" />
      </Pressable>

      <Actionsheet isOpen={isOpen} onClose={() => onOpenChange(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="max-h-[70%]">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetScrollView className="w-full">
            {options.map((opt) => (
              <ActionsheetItem
                key={opt.value}
                onPress={() => {
                  if (isMulti) {
                    toggleOption(opt.value);
                  } else {
                    setSelected(new Set([opt.value]));
                    onOpenChange(false);
                  }
                }}
              >
                <ActionsheetItemText
                  className={selected.has(opt.value) ? "font-bold text-primary-700" : ""}
                >
                  {opt.label}
                </ActionsheetItemText>
              </ActionsheetItem>
            ))}

            {isMulti && (
              <VStack space="xs" className="px-4 py-4 border-t border-slate-100 mt-2">
                <Button
                  action="primary"
                  className="rounded-xl bg-slate-900"
                  onPress={() => onOpenChange(false)}
                >
                  <ButtonText className="font-bold text-sm">Aplicar</ButtonText>
                </Button>
                <Button
                  variant="link"
                  onPress={() => {
                    setSelected(new Set());
                    onOpenChange(false);
                  }}
                >
                  <ButtonText className="text-primary-600 font-bold text-sm">Limpar</ButtonText>
                </Button>
              </VStack>
            )}
          </ActionsheetScrollView>
        </ActionsheetContent>
      </Actionsheet>
    </VStack>
  );
}

// ── Manage Stock Modal ──────────────────────────────────────────────────
function ManageStockModal({
  isOpen,
  onClose,
  item,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSave: (updatedItem: any) => Promise<void>;
}) {
  const [quantityInput, setQuantityInput] = useState("");
  const [lowStock, setLowStock] = useState("");
  const [sku, setSku] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantityInput(item.quantity?.toString() || "0");
      setLowStock(item.low_stock_threshold?.toString() || "0");
      setSku(item.sku || "");
    }
  }, [item]);

  if (!item) return null;

  // Evaluate a simple math expression with + and - (e.g. "40+5-2" → 43)
  const evaluateExpression = (expr: string): number => {
    const trimmed = expr.trim();
    if (!trimmed) return item.quantity || 0;
    // Split by + and - while keeping the operators
    const tokens = trimmed.match(/[+-]?\d+/g);
    if (!tokens) return item.quantity || 0;
    let result = 0;
    for (const token of tokens) {
      result += parseInt(token, 10) || 0;
    }
    return result;
  };

  const handleAppendOperator = (op: "+" | "-") => {
    const trimmed = quantityInput.trim();
    // Don't append if already ends with an operator
    if (trimmed.endsWith("+") || trimmed.endsWith("-")) return;
    setQuantityInput(trimmed + op);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const newQuantity = evaluateExpression(quantityInput);
    const newLowStock = parseInt(lowStock, 10) || 0;

    await onSave({
      id: item.id,
      quantity: newQuantity,
      low_stock_threshold: newLowStock,
      sku: sku.trim() || null,
      track_inventory: true,
    });
    
    setIsSaving(false);
    onClose();
  };

  // Live preview of result
  const hasOperator = /[+-]/.test(quantityInput.slice(1));
  const resolvedQty = evaluateExpression(quantityInput);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent className="rounded-[24px] p-6">
        <ModalHeader className="mb-4">
          <Heading size="lg" className="text-slate-950 font-bold">Editar {item.name}</Heading>
          <ModalCloseButton onPress={onClose}>
            <Icon as={X} size="md" color="#0f172a" />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="xl">
            <VStack space="xs">
              <Text className="text-sm text-slate-900">Quantidade</Text>
              <HStack space="sm">
                <Input className="flex-1 rounded-xl border-slate-950 border-2 h-12">
                  <InputField 
                    value={quantityInput} 
                    onChangeText={setQuantityInput} 
                    keyboardType="numbers-and-punctuation"
                  />
                </Input>
                <Pressable 
                  onPress={() => handleAppendOperator("+")} 
                  className="w-12 h-12 rounded-xl border border-slate-300 items-center justify-center bg-white active:bg-slate-50"
                >
                  <Icon as={Plus} size="sm" color="#0f172a" />
                </Pressable>
                <Pressable 
                  onPress={() => handleAppendOperator("-")} 
                  className="w-12 h-12 rounded-xl border border-slate-300 items-center justify-center bg-white active:bg-slate-50"
                >
                  <Icon as={Minus} size="sm" color="#0f172a" />
                </Pressable>
              </HStack>
              {hasOperator && (
                <Text className="text-xs text-slate-500 mt-1">
                  {quantityInput.trim()} = {resolvedQty}
                </Text>
              )}
            </VStack>

            <VStack space="xs">
              <Text className="text-sm text-slate-900">Estoque baixo</Text>
              <Input className="rounded-xl border-slate-300 h-12">
                <InputField 
                  value={lowStock} 
                  onChangeText={setLowStock}
                  keyboardType="numeric"
                />
              </Input>
              <Text className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                Quando a quantidade de itens disponíveis chegar a este nível, o item será exibido como "Estoque baixo"
              </Text>
            </VStack>

            <VStack space="xs">
              <Text className="text-sm text-slate-900">SKU</Text>
              <Input className="rounded-xl border-slate-300 h-12">
                <InputField 
                  placeholder="ex.: ABC-123" 
                  value={sku} 
                  onChangeText={setSku}
                />
              </Input>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter className="mt-8 flex-col gap-3 pb-2">
          <Button action="primary" className="rounded-xl bg-[#111827] h-12 w-full" onPress={handleSave} isDisabled={isSaving}>
            <ButtonText className="font-bold text-base">{isSaving ? "Salvando..." : "Salvar"}</ButtonText>
          </Button>
          <Button variant="outline" action="secondary" className="rounded-xl border-slate-300 h-12 w-full" onPress={onClose} isDisabled={isSaving}>
            <ButtonText className="text-[#111827] font-bold text-base">Cancelar</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Enable Tracking Modal ───────────────────────────────────────────────
function EnableTrackingModal({
  isOpen,
  onClose,
  item,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onConfirm: () => void;
}) {
  if (!item) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent className="rounded-[24px] p-6 pb-8">
        <Heading size="xl" className="text-slate-950 font-bold mb-4 leading-tight">
          Monitorar quantidade de {item.name}?
        </Heading>
        <Text className="text-slate-800 text-[15px] mb-6 leading-relaxed">
          Use o estoque para monitorar a quantidade desse item e das variações.
        </Text>
        <VStack space="sm">
          <Button action="primary" className="rounded-xl bg-[#111827] h-12 w-full" onPress={onConfirm}>
            <ButtonText className="font-bold text-base">Sim</ButtonText>
          </Button>
          <Button variant="outline" action="secondary" className="rounded-xl border-slate-300 h-12 w-full" onPress={onClose}>
            <ButtonText className="text-[#111827] font-bold text-base">Não</ButtonText>
          </Button>
        </VStack>
      </ModalContent>
    </Modal>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

const filterOptions = [
  { label: "Estoque baixo", value: "low_stock" },
  { label: "Esgotado", value: "out_of_stock" },
  { label: "Monitorado", value: "tracked" },
  { label: "Não monitorado", value: "untracked" },
];

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<{label: string, value: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());

  const [editingItem, setEditingItem] = useState<any>(null);
  const [promptEnableItem, setPromptEnableItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('items').select('*, categories(name)').order('name'),
        supabase.from('categories').select('id, name').order('name')
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (catsRes.error) throw catsRes.error;

      setItems(itemsRes.data || []);
      setCategories((catsRes.data || []).map(c => ({ label: c.name, value: c.id })));
    } catch (err: any) {
      console.error(err);
      Alert.alert("Erro", "Falha ao carregar estoque.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (updatedData: any) => {
    const { id, ...payload } = updatedData;
    const { error } = await supabase.from('items').update(payload).eq('id', id);
    if (error) {
      console.error(error);
      Alert.alert("Erro ao salvar", error.message);
    } else {
      setItems(prev => prev.map(it => it.id === id ? { ...it, ...payload } : it));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredItems = items.filter(item => {
    // 1. Text Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = item.name?.toLowerCase().includes(query);
      const descMatch = item.description?.toLowerCase().includes(query);
      const skuMatch = item.sku?.toLowerCase().includes(query);
      if (!nameMatch && !descMatch && !skuMatch) return false;
    }

    // 2. Category Filter
    if (selectedCategories.size > 0) {
      if (!item.category_id || !selectedCategories.has(item.category_id)) {
        return false;
      }
    }

    // 3. Status Filters (Estoque baixo, Esgotado, Monitorado, Não monitorado)
    if (selectedFilters.size > 0) {
      let matchesFilter = false;
      
      if (selectedFilters.has("tracked") && item.track_inventory) matchesFilter = true;
      if (selectedFilters.has("untracked") && !item.track_inventory) matchesFilter = true;
      if (selectedFilters.has("out_of_stock") && item.track_inventory && item.quantity <= 0) matchesFilter = true;
      if (selectedFilters.has("low_stock") && item.track_inventory && item.quantity > 0 && item.quantity <= (item.low_stock_threshold || 0)) matchesFilter = true;
      
      if (!matchesFilter) return false;
    }

    return true;
  });

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.id)));
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50/50" contentContainerStyle={{ padding: 16, paddingTop: 24 }}>
      <VStack space="lg" className="max-w-[800px] mx-auto w-full pb-20">
        {/* Header */}
        <Heading size="xl" className="text-slate-950 font-bold mb-1">Estoque</Heading>

        {/* Filters */}
        <VStack space="sm">
          <Input className="rounded-xl border-slate-200 h-11 bg-white">
            <InputSlot className="pl-4">
              <InputIcon as={Search} size="sm" color="#64748b" />
            </InputSlot>
            <InputField
              placeholder="Pesquisar por nome do item"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="text-sm"
            />
          </Input>
          
          <FilterDropdown
            label={selectedCategories.size > 0 ? `${selectedCategories.size} categoria(s) selecionada(s)` : "Categoria"}
            options={categories}
            isMulti
            isOpen={openMenu === "categoria"}
            onOpenChange={(open) => setOpenMenu(open ? "categoria" : null)}
            selected={selectedCategories}
            setSelected={setSelectedCategories}
          />
          <FilterDropdown
            label={selectedFilters.size > 0 ? `${selectedFilters.size} filtro(s) selecionado(s)` : "Filtrar por"}
            options={filterOptions}
            isMulti
            isOpen={openMenu === "filtrar"}
            onOpenChange={(open) => setOpenMenu(open ? "filtrar" : null)}
            selected={selectedFilters}
            setSelected={setSelectedFilters}
          />
        </VStack>

        {/* List */}
        <Box className="bg-white rounded-2xl border border-slate-200 overflow-hidden w-full mt-2">
          {isLoading ? (
            <Box className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#0f172a" />
            </Box>
          ) : filteredItems.length === 0 ? (
            <Box className="items-center justify-center py-20">
              <Text className="text-slate-500">Nenhum item encontrado.</Text>
            </Box>
          ) : (
            <VStack>
              {filteredItems.map((item, index) => {
                const isLast = index === filteredItems.length - 1;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      if (item.track_inventory) {
                        setEditingItem(item);
                      } else {
                        setPromptEnableItem(item);
                      }
                    }}
                    className={`flex-row justify-between items-center px-4 py-4 ${
                      !isLast ? 'border-b border-slate-100' : ''
                    } active:bg-slate-50`}
                  >
                    <Text className="text-slate-900 font-medium text-base">{item.name}</Text>
                    <HStack space="md" className="items-center">
                      {item.track_inventory ? (
                        <Box className={`px-2.5 py-1 rounded-full items-center justify-center min-w-[32px] ${
                          item.quantity <= 0 ? "bg-red-500" : 
                          item.quantity <= (item.low_stock_threshold || 0) ? "bg-orange-500" : "bg-primary-500"
                        }`}>
                          <Text className="text-white text-xs font-bold">{item.quantity}</Text>
                        </Box>
                      ) : null}
                      <Icon as={item.track_inventory ? ChevronRight : ArrowUpRight} size="sm" color="#0f172a" />
                    </HStack>
                  </Pressable>
                );
              })}
            </VStack>
          )}
        </Box>
      </VStack>

      <ManageStockModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleUpdateItem}
      />

      <EnableTrackingModal
        isOpen={!!promptEnableItem}
        onClose={() => setPromptEnableItem(null)}
        item={promptEnableItem}
        onConfirm={() => {
          if (promptEnableItem) {
            handleUpdateItem({ id: promptEnableItem.id, track_inventory: true });
          }
          setPromptEnableItem(null);
        }}
      />
    </ScrollView>
  );
}