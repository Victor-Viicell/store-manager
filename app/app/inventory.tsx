import React, { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableData
} from "@/components/ui/table";
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
  Search,
  Image as ImageIcon,
  Pencil,
  X,
  Check,
} from "lucide-react-native";
import { Pressable, ScrollView } from "react-native";

// ── Mock Data ──────────────────────────────────────────────────────────
const initialInventoryData = [
  { id: "1", name: "Heineken", sku: "-", quantity: -3, image: true, tracked: true, lowStockThreshold: 0 },
  { id: "2", name: "Império", sku: "-", quantity: null, image: false, tracked: false, lowStockThreshold: 0 },
  { id: "3", name: "Corona", sku: "-", quantity: null, image: true, tracked: false, lowStockThreshold: 0 },
  { id: "4", name: "Cigarro", sku: "-", quantity: null, image: false, tracked: false, lowStockThreshold: 0 },
];

const categories = ["Cerveja 600ml", "Cerveja longneck", "Consumíveis"];

const filterOptions = ["Estoque baixo", "Esgotado", "Monitorado", "Não monitorado", "Menos de"];

// ── Filter Dropdown Component ──────────────────────────────────────────
function FilterDropdown({
  label,
  options,
  isMulti = false,
  isOpen,
  onOpenChange,
}: {
  label: string;
  options: string[];
  isMulti?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const hasSelection = selected.size > 0;

  const toggleOption = (opt: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  return (
    <>
      <Pressable
        onPress={() => onOpenChange(true)}
        className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${
          hasSelection || isOpen
            ? "bg-slate-900 border-slate-900"
            : "bg-white border-slate-200"
        }`}
      >
        <Text className={`text-sm font-semibold ${hasSelection || isOpen ? "text-white" : "text-slate-700"}`}>
          {label}
        </Text>
        <ChevronDown size={14} color={hasSelection || isOpen ? "#fff" : "#64748b"} />
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
                key={opt}
                onPress={() => {
                  if (isMulti) {
                    toggleOption(opt);
                  } else {
                    setSelected(new Set([opt]));
                    onOpenChange(false);
                  }
                }}
              >
                <ActionsheetItemText
                  className={selected.has(opt) ? "font-bold text-primary-700" : ""}
                >
                  {opt}
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
    </>
  );
}

// ── Manage Stock Modal ──────────────────────────────────────────────────
function ManageStockModal({
  isOpen,
  onClose,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}) {
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent className="rounded-[32px] p-8">
        <ModalHeader className="mb-6">
          <Heading size="lg" className="text-slate-900">Editar {item.name}</Heading>
          <ModalCloseButton onPress={onClose}>
            <Icon as={X} size="md" color="#64748b" />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="xl">
            <VStack space="xs">
              <Text className="text-sm font-bold text-slate-700">Quantidade</Text>
              <Input className="rounded-xl border-slate-900 border-2 h-12">
                <InputField defaultValue={item.quantity?.toString() || "0"} />
              </Input>
              <Text className="text-xs text-slate-400 mt-1">
                Dica de ouro: a gente calcula para você! Use "+" ou "-" para adicionar ou subtrair da quantidade atual.
              </Text>
            </VStack>

            <VStack space="xs">
              <Text className="text-sm font-bold text-slate-700">Estoque baixo</Text>
              <Input className="rounded-xl border-slate-200 h-12">
                <InputField defaultValue={item.lowStockThreshold?.toString() || "0"} />
              </Input>
              <Text className="text-xs text-slate-400 mt-1 leading-relaxed">
                Quando a quantidade de itens disponíveis chegar a este nível, o item será exibido como "Estoque baixo"
              </Text>
            </VStack>

            <VStack space="xs">
              <Text className="text-sm font-bold text-slate-700">SKU</Text>
              <Input className="rounded-xl border-slate-200 h-12">
                <InputField placeholder="ex.: ABC-123" defaultValue={item.sku === "-" ? "" : item.sku} />
              </Input>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter className="mt-8 border-t border-slate-50 pt-6">
          <Button variant="outline" action="secondary" className="rounded-xl border-slate-200 px-8 h-12" onPress={onClose}>
            <ButtonText className="text-slate-700 font-bold">Cancelar</ButtonText>
          </Button>
          <Button action="primary" className="rounded-xl bg-slate-950 px-12 h-12" onPress={onClose}>
            <ButtonText className="font-bold">Salvar</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === initialInventoryData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(initialInventoryData.map(i => i.id)));
    }
  };

  return (
    <VStack space="xl" className="flex-1">
      {/* Header */}
      <Heading size="xl" className="text-slate-900 font-bold">Estoque</Heading>

      {/* Filter Bar */}
      <HStack className="justify-between items-center flex-wrap gap-3">
        <HStack space="md" className="items-center">
          <FilterDropdown
            label="Categoria"
            options={categories}
            isMulti
            isOpen={openMenu === "categoria"}
            onOpenChange={(open) => setOpenMenu(open ? "categoria" : null)}
          />
          <FilterDropdown
            label="Filtrar por"
            options={filterOptions}
            isOpen={openMenu === "filtrar"}
            onOpenChange={(open) => setOpenMenu(open ? "filtrar" : null)}
          />
        </HStack>

        <Box className="w-72">
          <Input className="rounded-xl border-slate-200 h-10 bg-white">
            <InputSlot className="pl-3">
              <InputIcon as={Search} size="sm" color="#94a3b8" />
            </InputSlot>
            <InputField
              placeholder="Pesquisar por nome ou descrição"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="text-sm"
            />
          </Input>
        </Box>
      </HStack>

      {/* Table */}
      <Box className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-slate-100">
              <TableHead className="px-6 py-5 w-12">
                <Checkbox
                  value="all"
                  isChecked={selectedItems.size === initialInventoryData.length}
                  onChange={toggleSelectAll}
                >
                  <CheckboxIndicator className="rounded-md">
                    <CheckboxIcon as={Check} />
                  </CheckboxIndicator>
                </Checkbox>
              </TableHead>
              <TableHead className="px-4 py-5">
                <Text className="font-bold text-slate-900">Nome</Text>
              </TableHead>
              <TableHead className="px-8 py-5">
                <HStack space="xs" className="items-center">
                  <ChevronDown size={14} color="#64748b" />
                  <Text className="font-bold text-slate-900">SKU</Text>
                </HStack>
              </TableHead>
              <TableHead className="px-8 py-5">
                <Text className="font-bold text-slate-900">Quantidade</Text>
              </TableHead>
              <TableHead className="px-8 py-5 text-right">
                <Text className="font-bold text-slate-900">Ações</Text>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialInventoryData.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-50 last:border-0">
                <TableData className="px-6 py-5">
                  <Checkbox
                    value={item.id}
                    isChecked={selectedItems.has(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                  >
                    <CheckboxIndicator className="rounded-md">
                      <CheckboxIcon as={Check} />
                    </CheckboxIndicator>
                  </Checkbox>
                </TableData>
                <TableData className="px-4 py-5">
                  <HStack space="md" className="items-center">
                    <Box className={`w-12 h-12 rounded-xl items-center justify-center overflow-hidden border border-slate-100 ${
                      item.image ? "bg-slate-800" : "bg-slate-100"
                    }`}>
                      {!item.image && (
                        <Icon as={ImageIcon} size="sm" color="#94a3b8" />
                      )}
                    </Box>
                    <Text className="text-slate-900 font-semibold text-base">{item.name}</Text>
                  </HStack>
                </TableData>
                <TableData className="px-8 py-5">
                  <Text className="text-slate-400">{item.sku}</Text>
                </TableData>
                <TableData className="px-8 py-5">
                  {item.quantity !== null ? (
                    <Box className={`px-2 py-1 rounded-full items-center justify-center min-w-[32px] ${
                      item.quantity < 0 ? "bg-red-500" : "bg-primary-500"
                    }`}>
                      <Text className="text-white text-xs font-bold">{item.quantity}</Text>
                    </Box>
                  ) : (
                    <Text className="text-slate-400">-</Text>
                  )}
                </TableData>
                <TableData className="px-8 py-5 text-right">
                  {item.tracked ? (
                    <Pressable onPress={() => setEditingItem(item)} className="ml-auto">
                      <Icon as={Pencil} size="sm" color="#0f172a" />
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => setEditingItem(item)}>
                      <Text className="text-primary-600 font-semibold text-sm underline">
                        Habilitar rastreio
                      </Text>
                    </Pressable>
                  )}
                </TableData>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <ManageStockModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
      />
    </VStack>
  );
}