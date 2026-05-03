import React, { useState, useEffect } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetScrollView,
  ActionsheetSectionHeaderText,
} from "@/components/ui/actionsheet";
import {
  Menu,
  MenuItem,
  MenuItemLabel,
} from "@/components/ui/menu";
import { 
  Modal, 
  ModalBackdrop, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  ModalCloseButton
} from "@/components/ui/modal";
import {
  Plus,
  X,
  ChevronDown,
  ChevronLeft,
  Image as ImageIcon,
  Keyboard,
  Barcode,
  Info,
  Check,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Eraser,
  Type
} from "lucide-react-native";
import { Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Badge, BadgeText } from "@/components/ui/badge";
import { supabase } from "@/utils/supabase";

// ── Reusable Actionsheet-based Picker ──────────────────────────────────
type PickerSection = {
  title: string | null;
  items: { label: string; value: string }[];
};

function ActionsheetPicker({
  label,
  placeholder,
  sections,
  selectedValue,
  onSelect,
  className = "",
}: {
  label: string;
  placeholder: string;
  sections: PickerSection[];
  selectedValue: string;
  onSelect: (value: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = sections
    .flatMap(s => s.items)
    .find(i => i.value === selectedValue)?.label;

  return (
    <VStack space="xs" className={className}>
      <Text className="text-xs font-bold text-slate-500">{label}</Text>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-slate-200 h-11 px-3 bg-white"
      >
        <Text className={selectedLabel ? "text-slate-900 text-sm" : "text-slate-400 text-sm"}>
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={16} color="#94a3b8" />
      </Pressable>
      <Actionsheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="max-h-[70%]">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetScrollView className="w-full">
            {sections.map((section, sIdx) => (
              <React.Fragment key={sIdx}>
                {section.title && (
                  <ActionsheetSectionHeaderText>{section.title}</ActionsheetSectionHeaderText>
                )}
                {section.items.map((item) => (
                  <ActionsheetItem
                    key={item.value}
                    onPress={() => {
                      onSelect(item.value);
                      setIsOpen(false);
                    }}
                  >
                    <ActionsheetItemText
                      className={selectedValue === item.value ? "font-bold text-slate-900" : ""}
                    >
                      {item.label}
                    </ActionsheetItemText>
                  </ActionsheetItem>
                ))}
              </React.Fragment>
            ))}
          </ActionsheetScrollView>
        </ActionsheetContent>
      </Actionsheet>
    </VStack>
  );
}

// ── Data ────────────────────────────────────────────────────────────────

const priceTypeSections: PickerSection[] = [
  { title: null, items: [
    { label: "Fixo - Defina um preço no catálogo", value: "fixo" },
    { label: "Variável - Insira um preço no checkout", value: "variavel" },
  ]},
];

const unitSections: PickerSection[] = [
  { title: null, items: [{ label: "Cada", value: "cada" }] },
  { title: "Peso", items: [
    { label: "Grama (g)", value: "g" },
    { label: "Quilograma (kg)", value: "kg" },
  ]},
];

const colors = [
  "#f1f5f9", "#ef4444", "#991b1b", "#fca5a5", "#f97316", "#86efac", "#eab308", "#16a34a", "#22d3ee", "#2563eb", "#a855f7", "#cbd5e1", "#000000"
];

// ── Component ──────────────────────────────────────────────────────────
export default function CreateItem() {
  const router = useRouter();
  
  // State for form fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<{label: string, value: string}[]>([]);
  
  const [selectedUnit, setSelectedUnit] = useState("Cada");
  const [selectedPriceType, setSelectedPriceType] = useState("fixo");
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const [addCostPrice, setAddCostPrice] = useState(false);
  const [differentPickupPrices, setDifferentPickupPrices] = useState(false);
  const [monitorStock, setMonitorStock] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('id, name');
    if (data) {
      setCategoriesList(data.map(c => ({ label: c.name, value: c.id })));
    } else if (error) {
      console.error(error);
    }
  };

  const categorySections: PickerSection[] = [
    { title: null, items: categoriesList }
  ];

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: newCategoryName.trim() }])
      .select();
      
    if (data) {
      setCategoriesList([{ label: data[0].name, value: data[0].id }, ...categoriesList]);
      setSelectedCategory(data[0].id);
      setShowAddCategoryModal(false);
      setNewCategoryName("");
    }
  };

  const handleSave = async (addAnother = false) => {
    if (!name.trim()) {
      Alert.alert("Erro", "O nome do item é obrigatório.");
      return;
    }
    
    let parsedPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(parsedPrice)) parsedPrice = 0;

    setIsSaving(true);

    const payload = {
      name: name.trim(),
      category_id: selectedCategory || null,
      price: parsedPrice,
      unit: selectedUnit,
      sku: sku.trim() || null,
      barcode: barcode.trim() || null,
      description: description.trim() || null,
      // For now we don't have a color column in items table, but it can be added later or we can ignore it.
      // Ignoring color for now to match current DB schema, or you could add it to DB.
    };

    const { error } = await supabase.from('items').insert([payload]);

    setIsSaving(false);

    if (error) {
      console.error(error);
      Alert.alert("Erro ao salvar", error.message);
    } else {
      if (addAnother) {
        setName("");
        setPrice("");
        setSku("");
        setBarcode("");
        setDescription("");
      } else {
        router.back();
      }
    }
  };

  return (
    <VStack className="flex-1 bg-slate-50/50">
      {/* Header */}
      <HStack className="justify-between items-center px-8 py-4 bg-white border-b border-slate-100">
        <HStack space="md" className="items-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-50">
            <X size={20} color="#0f172a" />
          </Pressable>
          <Heading size="md" className="text-slate-900 font-bold">Adicionar item</Heading>
        </HStack>
        
        <Menu
          offset={5}
          placement="bottom right"
          trigger={({ ...triggerProps }) => (
            <Button {...triggerProps} action="primary" className="rounded-xl px-6 bg-slate-950 h-10" disabled={isSaving}>
              <ButtonText className="font-bold mr-2 text-sm">{isSaving ? "Salvando..." : "Salvar"}</ButtonText>
              <ButtonIcon as={ChevronDown} size="xs" />
            </Button>
          )}
        >
          <MenuItem key="save-close" textValue="Salvar e fechar" onPress={() => handleSave(false)}>
            <MenuItemLabel size="sm">Salvar e fechar</MenuItemLabel>
          </MenuItem>
          <MenuItem key="save-add" textValue="Salvar e adicionar outro" onPress={() => handleSave(true)}>
            <MenuItemLabel size="sm">Salvar e adicionar outro</MenuItemLabel>
          </MenuItem>
        </Menu>
      </HStack>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <VStack space="md" className="max-w-[800px] mx-auto w-full pb-20">

          {/* Top Row: Image & Name */}
          <Box className="bg-white p-6 rounded-[20px] border border-slate-200">
            <HStack space="lg" className="items-start">
              <Pressable 
                className="w-20 h-20 bg-slate-100 rounded-2xl items-center justify-center relative border border-slate-100"
                onPress={() => Alert.alert("Imagem", "O upload de imagens será implementado em breve.")}
              >
                <Icon as={ImageIcon} size="lg" color="#94a3b8" />
                <Box className="absolute -bottom-1 -right-1 bg-slate-900 p-1 rounded-lg border-2 border-white">
                  <Icon as={Plus} size="xs" color="white" />
                </Box>
              </Pressable>
              
              <VStack space="xs" className="flex-1">
                <Text className="text-xs font-bold text-slate-900">Nome</Text>
                <HStack space="sm" className="items-center">
                  <Input className="flex-1 rounded-xl border-slate-200 h-11 bg-white">
                    <InputField 
                      placeholder="" 
                      value={name}
                      onChangeText={setName}
                    />
                  </Input>
                  <Button variant="outline" action="secondary" className="rounded-xl border-slate-200 w-11 h-11 p-0" onPress={() => Alert.alert("Scanner", "A câmera para ler código de barras será implementada em breve.")}>
                    <ButtonIcon as={Barcode} size="sm" color="#0f172a" />
                  </Button>
                </HStack>
              </VStack>
            </HStack>
          </Box>

          {/* Section: Preços */}
          <Box className="bg-white p-6 rounded-[20px] border border-slate-200">
            <VStack space="lg">
              <Heading size="xs" className="text-slate-900 font-bold">Preços</Heading>
              
              <HStack space="md">
                <ActionsheetPicker
                  label="Tipo de preço"
                  placeholder="Selecione"
                  sections={priceTypeSections}
                  selectedValue={selectedPriceType}
                  onSelect={setSelectedPriceType}
                  className="flex-1"
                />
                <ActionsheetPicker
                  label="Unidade"
                  placeholder="Cada"
                  sections={unitSections}
                  selectedValue={selectedUnit}
                  onSelect={setSelectedUnit}
                  className="flex-1"
                />
              </HStack>

              <VStack space="xs">
                <Text className="text-xs font-bold text-slate-500">Valor</Text>
                <Input className="rounded-xl border-slate-200 h-11 bg-white max-w-[300px]">
                  <InputSlot className="pl-3 pr-2">
                    <Text className="text-slate-400 text-sm">R$</Text>
                  </InputSlot>
                  <InputField 
                    placeholder="0,00" 
                    keyboardType="numeric" 
                    value={price}
                    onChangeText={setPrice}
                  />
                </Input>
              </VStack>

              <VStack space="sm">
                <HStack className="justify-between items-center">
                  <HStack space="sm" className="items-center">
                    <Switch 
                      size="sm" 
                      value={addCostPrice} 
                      onValueChange={setAddCostPrice}
                      trackColor={{ false: "#e2e8f0", true: "#0f172a" }}
                    />
                    <HStack space="xs" className="items-center">
                      <Text className="text-sm font-medium text-slate-700">Adicionar preço de custo</Text>
                      <Badge action="muted" className="bg-slate-900 px-1.5 py-0 rounded-md">
                        <BadgeText className="text-[10px] text-white italic font-black">Plus</BadgeText>
                      </Badge>
                    </HStack>
                  </HStack>
                </HStack>

                <HStack className="justify-between items-center">
                  <HStack space="sm" className="items-center">
                    <Switch 
                      size="sm" 
                      value={differentPickupPrices} 
                      onValueChange={setDifferentPickupPrices}
                      trackColor={{ false: "#e2e8f0", true: "#0f172a" }}
                    />
                    <Text className="text-sm font-medium text-slate-700">Definir preços diferentes para retirada</Text>
                  </HStack>
                </HStack>
              </VStack>
            </VStack>
          </Box>

          {/* Section: Categoria e cor */}
          <Box className="bg-white p-6 rounded-[20px] border border-slate-200">
            <VStack space="lg">
              <VStack space="xs">
                <Heading size="xs" className="text-slate-900 font-bold">Categoria e cor</Heading>
                <Text className="text-xs text-slate-500">Agrupe itens similares com uma categoria ou cor.</Text>
              </VStack>

              <ActionsheetPicker
                label="Categoria existente"
                placeholder="Selecione uma categoria"
                sections={categorySections}
                selectedValue={selectedCategory}
                onSelect={setSelectedCategory}
              />

              <Pressable className="flex-row items-center" onPress={() => setShowAddCategoryModal(true)}>
                <Icon as={Plus} size="xs" color="#0f172a" className="mr-2" />
                <Text className="text-sm font-bold text-slate-900 underline">Nova categoria</Text>
              </Pressable>

              <VStack space="sm">
                <Text className="text-xs font-bold text-slate-500">Selecione uma cor para organizar seus produtos:</Text>
                <HStack space="sm" className="flex-wrap">
                  {colors.map((color) => (
                    <Pressable 
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full items-center justify-center border-2 ${selectedColor === color ? "border-slate-300" : "border-transparent"}`}
                    >
                      <Box 
                        className="w-6 h-6 rounded-full border border-slate-100" 
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && color === "#000000" && <Icon as={Check} size="xs" color="white" className="m-auto" />}
                        {selectedColor === color && color !== "#000000" && color !== "#f1f5f9" && <Icon as={Check} size="xs" color="white" className="m-auto" />}
                        {selectedColor === color && color === "#f1f5f9" && <Icon as={Check} size="xs" color="#94a3b8" className="m-auto" />}
                      </Box>
                    </Pressable>
                  ))}
                </HStack>
              </VStack>
            </VStack>
          </Box>

          {/* Section: Estoque */}
          <Box className="bg-white p-6 rounded-[20px] border border-slate-200">
            <VStack space="lg">
              <Heading size="xs" className="text-slate-900 font-bold">Estoque</Heading>
              
              <HStack space="md">
                <VStack space="xs" className="flex-1">
                  <Text className="text-xs font-bold text-slate-500">SKU</Text>
                  <Input className="rounded-xl border-slate-200 h-11 bg-white">
                    <InputField 
                      placeholder="ex.: ABC-123" 
                      value={sku}
                      onChangeText={setSku}
                    />
                  </Input>
                </VStack>
                <VStack space="xs" className="flex-1">
                  <Text className="text-xs font-bold text-slate-500">Código de barras</Text>
                  <Input className="rounded-xl border-slate-200 h-11 bg-white">
                    <InputField 
                      placeholder="EAN, UPC, GTIN etc." 
                      value={barcode}
                      onChangeText={setBarcode}
                    />
                  </Input>
                </VStack>
              </HStack>

              <HStack space="sm" className="items-center">
                <Switch 
                  size="sm" 
                  value={monitorStock} 
                  onValueChange={setMonitorStock}
                  trackColor={{ false: "#e2e8f0", true: "#0f172a" }}
                />
                <Text className="text-sm font-medium text-slate-700">Monitorar estoque</Text>
              </HStack>
            </VStack>
          </Box>

          {/* Section: Variações */}
          <Box className="bg-white p-6 rounded-[20px] border border-slate-200">
            <VStack space="md">
              <VStack space="xs">
                <Heading size="xs" className="text-slate-900 font-bold">Variações</Heading>
                <Text className="text-xs text-slate-500 leading-relaxed">
                  Use variações para oferecer versões diferentes de um item, por exemplo, cores, tamanhos etc.
                </Text>
              </VStack>
              
              <Pressable className="flex-row items-center" onPress={() => router.push('/app/options')}>
                <Text className="text-sm font-bold text-slate-900 underline mr-1">Adicionar variação</Text>
                <ChevronDown size={14} color="#0f172a" />
              </Pressable>
            </VStack>
          </Box>

          {/* Section: Modificações */}
          <Box className="bg-white p-6 rounded-[20px] border border-slate-200">
            <VStack space="md">
              <VStack space="xs">
                <Heading size="xs" className="text-slate-900 font-bold">Modificações</Heading>
                <Text className="text-xs text-slate-500 leading-relaxed">
                  Se você vende itens com extras como recheios, coberturas ou molhos, você pode criar conjuntos de modificações e depois adicioná-los aos itens na hora do pagamento.
                </Text>
              </VStack>
              
              <Pressable className="flex-row items-center" onPress={() => router.push('/app/modifiers')}>
                <Icon as={Plus} size="xs" color="#0f172a" className="mr-2" />
                <Text className="text-sm font-bold text-slate-900 underline">Adicionar conjunto de modificações</Text>
              </Pressable>
            </VStack>
          </Box>

          {/* Section: Descrição do item */}
          <Box className="bg-white p-6 rounded-[20px] border border-slate-200">
            <VStack space="lg">
              <VStack space="xs">
                <Heading size="xs" className="text-slate-900 font-bold">Descrição do item</Heading>
                <Text className="text-xs text-slate-500">A descrição vai aparecer nas faturas e na Loja Online.</Text>
              </VStack>

              <VStack space="xs">
                <Text className="text-xs font-bold text-slate-500">Descrição</Text>
                <Box className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {/* Toolbar Placeholder */}
                  <HStack className="p-3 border-b border-slate-100 bg-slate-50/50" space="md">
                    <HStack space="xs" className="items-center border-r border-slate-200 pr-2">
                       <Text className="text-xs font-bold text-slate-700 mr-1">Normal</Text>
                       <ChevronDown size={14} color="#64748b" />
                    </HStack>
                    <Icon as={Bold} size="xs" color="#64748b" />
                    <Icon as={Italic} size="xs" color="#64748b" />
                    <Icon as={Underline} size="xs" color="#64748b" />
                    <Icon as={Strikethrough} size="xs" color="#64748b" />
                    <Box className="w-px h-4 bg-slate-200" />
                    <Icon as={List} size="xs" color="#64748b" />
                    <Icon as={ListOrdered} size="xs" color="#64748b" />
                    <Box className="w-px h-4 bg-slate-200" />
                    <Icon as={Link} size="xs" color="#64748b" />
                    <Icon as={Eraser} size="xs" color="#64748b" />
                  </HStack>
                  
                  <Textarea className="border-0 h-32 p-4">
                    <TextareaInput 
                      placeholder="ex.: origem, material, dimensões" 
                      className="text-sm" 
                      value={description}
                      onChangeText={setDescription}
                    />
                  </Textarea>
                </Box>
                <Text className="text-[10px] text-slate-400 mt-1">Caracteres restantes: {1000 - description.length}</Text>
              </VStack>
            </VStack>
          </Box>

        </VStack>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        size="md"
      >
        <ModalBackdrop />
        <ModalContent className="rounded-[32px] p-8 border-0 shadow-2xl">
          <ModalHeader className="mb-6">
            <Heading size="lg" className="text-slate-900">
              Adicionar categoria
            </Heading>
            <ModalCloseButton>
               <Icon as={X} size="md" color="#64748b" />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody className="mb-8">
            <VStack space="xs">
              <Text className="text-sm font-bold text-slate-700 mb-1">Nome da categoria</Text>
              <Input className="rounded-2xl border-slate-200 h-14 bg-slate-50/50">
                <InputField 
                  placeholder="Ex: Bebidas, Sobremesas..." 
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
              </Input>
              <Text className="text-[10px] text-slate-400 mt-1 italic">Caracteres restantes: {Math.max(0, 30 - newCategoryName.length)}</Text>
            </VStack>
          </ModalBody>
          <ModalFooter className="gap-3">
            <Button 
              variant="outline" 
              action="secondary" 
              className="rounded-xl border-slate-200 px-6"
              onPress={() => setShowAddCategoryModal(false)}
            >
              <ButtonText className="text-slate-700 font-bold">Cancelar</ButtonText>
            </Button>
            <Button 
              action="primary" 
              className="rounded-xl bg-slate-950 px-8"
              onPress={handleSaveCategory}
            >
              <ButtonText className="font-bold">Salvar</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}