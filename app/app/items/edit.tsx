import React, { useState, useEffect } from "react";
import { pickImageFromLibrary, uploadItemImage, deleteItemImage } from "@/utils/image-picker";
import { CameraCapture } from "@/components/camera-capture";
import { Image as RNImage } from "react-native";
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
  Layers,
  Settings2,
  Plus,
  X,
  ChevronDown,
  ChevronLeft,
  Image as ImageIcon,
  Camera,
  ImagePlus,
  Trash2,
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
import { Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
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
    <VStack space="xs" className={className}><Text className="text-xs font-bold text-slate-500">{label}</Text><Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-slate-200 h-11 px-3 bg-white"
      ><Text className={selectedLabel ? "text-slate-900 text-sm" : "text-slate-400 text-sm"}>{selectedLabel || placeholder}</Text><ChevronDown size={16} color="#94a3b8" /></Pressable><Actionsheet isOpen={isOpen} onClose={() => setIsOpen(false)}><ActionsheetBackdrop /><ActionsheetContent className="max-h-[70%]"><ActionsheetDragIndicatorWrapper><ActionsheetDragIndicator /></ActionsheetDragIndicatorWrapper><ActionsheetScrollView className="w-full">{sections.map((section, sIdx) => (
              <React.Fragment key={sIdx}>{section.title && (
                  <ActionsheetSectionHeaderText>{section.title}</ActionsheetSectionHeaderText>
                )}{section.items.map((item) => (
                  <ActionsheetItem
                    key={item.value}
                    onPress={() =>{
                      onSelect(item.value);
                      setIsOpen(false);
                    }}
                  ><ActionsheetItemText
                      className={selectedValue === item.value ? "font-bold text-slate-900" : ""}
                    >{item.label}</ActionsheetItemText></ActionsheetItem>
                ))}</React.Fragment>
            ))}</ActionsheetScrollView></ActionsheetContent></Actionsheet></VStack>
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
export default function EditItem() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

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

  // Image state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Option Sets & Modifier Sets
  const [availableOptionSets, setAvailableOptionSets] = useState<any[]>([]);
  const [availableModifierSets, setAvailableModifierSets] = useState<any[]>([]);
  const [selectedOptionSetIds, setSelectedOptionSetIds] = useState<string[]>([]);
  const [selectedModifierSetIds, setSelectedModifierSetIds] = useState<string[]>([]);

  useEffect(() =>{
    if (id) {
      fetchItem();
      fetchLinkedSets();
    }
    fetchCategories();
    fetchOptionSets();
    fetchModifierSets();
  }, [id]);

  const fetchOptionSets = async () =>{
    const { data } = await supabase
      .from('option_sets')
      .select('id, name, options(id, name)')
      .order('name');
    if (data) setAvailableOptionSets(data);
  };

  const fetchModifierSets = async () =>{
    const { data } = await supabase
      .from('modifier_sets')
      .select('id, name, modifiers(id, name, price)')
      .order('name');
    if (data) setAvailableModifierSets(data);
  };

  const fetchLinkedSets = async () =>{
    const [optRes, modRes] = await Promise.all([
      supabase.from('item_option_sets').select('option_set_id').eq('item_id', id),
      supabase.from('item_modifier_sets').select('modifier_set_id').eq('item_id', id),
    ]);
    if (optRes.data) setSelectedOptionSetIds(optRes.data.map((r: any) => r.option_set_id));
    if (modRes.data) setSelectedModifierSetIds(modRes.data.map((r: any) => r.modifier_set_id));
  };

  const fetchItem = async () =>{
    const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
    if (data) {
      setName(data.name || "");
      setPrice(data.price !== null ? data.price.toString().replace('.', ',') : "");
      setSku(data.sku || "");
      setBarcode(data.barcode || "");
      setDescription(data.description || "");
      setSelectedCategory(data.category_id || "");
      setSelectedUnit(data.unit || "cada");
      if (data.image_url) {
        setImageUri(data.image_url);
        setImageUrl(data.image_url);
      }
    } else if (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível carregar o item.");
      router.canGoBack() ? router.back() : router.replace("/app/inventory");
    }
  };

  const fetchCategories = async () =>{
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

  const handleSaveCategory = async () =>{
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

  const handleOpenCamera = () =>{
    setShowImagePicker(false);
    setTimeout(() => setShowCamera(true), 300);
  };

  const handleCameraCapture = async (uri: string) =>{
    setShowCamera(false);
    setImageUri(uri);
    setIsUploadingImage(true);

    const url = await uploadItemImage(uri);
    setIsUploadingImage(false);

    if (url) {
      setImageUrl(url);
    } else {
      setImageUri(imageUrl);
    }
  };

  const handlePickFromLibrary = async () =>{
    setShowImagePicker(false);
    const asset = await pickImageFromLibrary();
    if (!asset) return;

    setImageUri(asset.uri);
    setIsUploadingImage(true);

    const url = await uploadItemImage(asset.uri, asset.mimeType);
    setIsUploadingImage(false);

    if (url) {
      setImageUrl(url);
    } else {
      setImageUri(imageUrl);
    }
  };

  const handleRemoveImage = async () =>{
    if (imageUrl) {
      await deleteItemImage(imageUrl);
    }
    setImageUri(null);
    setImageUrl(null);
  };

  const handleSave = async (addAnother = false) =>{
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
      image_url: imageUrl || null,
    };

    const { error } = await supabase.from('items').update(payload).eq('id', id);

    if (!error) {
      // Sync option set links: delete old, insert new
      await supabase.from('item_option_sets').delete().eq('item_id', id);
      if (selectedOptionSetIds.length > 0) {
        await supabase.from('item_option_sets').insert(
          selectedOptionSetIds.map(osId => ({ item_id: id as string, option_set_id: osId }))
        );
      }

      // Sync modifier set links: delete old, insert new
      await supabase.from('item_modifier_sets').delete().eq('item_id', id);
      if (selectedModifierSetIds.length > 0) {
        await supabase.from('item_modifier_sets').insert(
          selectedModifierSetIds.map(msId => ({ item_id: id as string, modifier_set_id: msId }))
        );
      }
    }

    setIsSaving(false);

    if (error) {
      console.error(error);
      Alert.alert("Erro ao salvar", error.message);
    } else {
      router.canGoBack() ? router.back() : router.replace("/app/inventory");
    }
  };

  if (showCamera) {
    return (
      <CameraCapture
        isVisible={true}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <VStack style={{ flex: 1, backgroundColor: '#f8fafc' }}>{/* Sticky Header */}<HStack className="items-center justify-between px-4 py-3 bg-white border-b border-slate-100"><Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/app/inventory")} className="p-2 rounded-full active:bg-slate-50"><Icon as={X} size="xl" color="#0f172a" /></Pressable><Heading size="lg" className="text-slate-900 font-bold">Editar item</Heading><Box className="w-10" />{/* Spacer to center title */}</HStack><ScrollView className="flex-1" contentContainerStyle={{ alignItems: 'center' }}><VStack space="xl" style={{ maxWidth: 500, width: '100%', paddingBottom: 100, paddingTop: 20 }} className="px-4">{/* Image Section */}<Box className="items-center mb-4"><Pressable
              className="w-32 h-32 bg-slate-100 rounded-[32px] items-center justify-center relative border border-slate-200 shadow-sm overflow-hidden"
              onPress={() => imageUri ? undefined : setShowImagePicker(true)}
            >{imageUri ? (
                <><RNImage
                    source={{ uri: imageUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />{isUploadingImage && (
                    <Box className="absolute inset-0 bg-black/40 items-center justify-center"><ActivityIndicator color="white" size="small" /></Box>
                  )}{/* Remove image button */}<Pressable
                    className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full shadow-lg"
                    onPress={handleRemoveImage}
                  ><Icon as={Trash2} size="xs" color="white" /></Pressable></>
              ) : (
                <><Icon as={ImageIcon} size="xl" color="#94a3b8" /><Box className="absolute bottom-2 right-2 bg-slate-900 p-2 rounded-xl border-2 border-white shadow-lg"><Icon as={Plus} size="sm" color="white" /></Box></>
              )}</Pressable>{imageUri && !isUploadingImage && (
              <Pressable onPress={() => setShowImagePicker(true)} className="mt-2"><Text className="text-sm text-slate-500 underline">Trocar imagem</Text></Pressable>
            )}</Box>{/* Image Picker Actionsheet */}<Actionsheet isOpen={showImagePicker} onClose={() => setShowImagePicker(false)}><ActionsheetBackdrop /><ActionsheetContent><ActionsheetDragIndicatorWrapper><ActionsheetDragIndicator /></ActionsheetDragIndicatorWrapper><ActionsheetItem onPress={handleOpenCamera}><HStack space="md" className="items-center"><Box className="bg-slate-100 p-2 rounded-xl"><Icon as={Camera} size="sm" color="#0f172a" /></Box><VStack><ActionsheetItemText className="font-semibold text-slate-900">Tirar foto</ActionsheetItemText><Text className="text-xs text-slate-500">Use a câmera do seu dispositivo</Text></VStack></HStack></ActionsheetItem><ActionsheetItem onPress={handlePickFromLibrary}><HStack space="md" className="items-center"><Box className="bg-slate-100 p-2 rounded-xl"><Icon as={ImagePlus} size="sm" color="#0f172a" /></Box><VStack><ActionsheetItemText className="font-semibold text-slate-900">Escolher da galeria</ActionsheetItemText><Text className="text-xs text-slate-500">Selecione uma imagem existente</Text></VStack></HStack></ActionsheetItem></ActionsheetContent></Actionsheet>{/* Section: Nome */}<Box className="bg-white p-6 rounded-[32px] border border-slate-200"><VStack space="md"><Heading size="xs" className="text-slate-900 font-bold text-lg">Nome</Heading><Input className="rounded-xl border-slate-200 h-14 bg-white"><InputField
                  placeholder=""
                  value={name}
                  onChangeText={setName}
                  className="text-base"
                /></Input></VStack></Box>{/* Section: Preços */}<Box className="bg-white p-6 rounded-[32px] border border-slate-200"><VStack space="lg"><Heading size="xs" className="text-slate-900 font-bold text-lg">Preços</Heading><ActionsheetPicker
                label="Tipo de preço"
                placeholder="Selecione"
                sections={priceTypeSections}
                selectedValue={selectedPriceType}
                onSelect={setSelectedPriceType}
              /><ActionsheetPicker
                label="Unidade"
                placeholder="Cada"
                sections={unitSections}
                selectedValue={selectedUnit}
                onSelect={setSelectedUnit}
              /><VStack space="xs"><Text className="text-sm font-bold text-slate-700">Valor</Text><Input className="rounded-xl border-slate-200 h-14 bg-white px-3"><InputField
                    placeholder="0"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={(text) =>{
                      // Allow only numbers and one decimal separator (comma or dot)
                      const cleaned = text.replace(/[^0-9.,]/g, '');
                      // Ensure only one dot/comma
                      const parts = cleaned.split(/[.,]/);
                      if (parts.length > 2) return;
                      setPrice(cleaned);
                    }}
                    className="flex-1 text-base"
                  /><InputSlot pointerEvents="none" style={{ flexShrink: 0 }}><Text className="text-slate-400 text-xs" style={{ whiteSpace: 'nowrap' } as any}>
                      R$/{(() =>{
                        const item = unitSections.flatMap(s => s.items).find(i => i.value === selectedUnit);
                        if (!item) return selectedUnit;
                        const match = item.label.match(/\((.*)\)/);
                        return match ? match[1] : item.label.toLowerCase();
                      })()}</Text></InputSlot></Input></VStack></VStack></Box>{/* Section: Categoria e cor */}<Box className="bg-white p-6 rounded-[32px] border border-slate-200"><VStack space="lg"><VStack space="xs"><Heading size="xs" className="text-slate-900 font-bold text-lg">Categoria e cor</Heading><Text className="text-sm text-slate-500 leading-relaxed">Agrupe itens similares com uma categoria ou cor.</Text></VStack><ActionsheetPicker
                label="Categoria existente"
                placeholder="Selecione uma categoria"
                sections={categorySections}
                selectedValue={selectedCategory}
                onSelect={setSelectedCategory}
              /><Pressable className="flex-row items-center py-2" onPress={() => setShowAddCategoryModal(true)}><Box className="bg-slate-950 rounded-full p-1 mr-2"><Icon as={Plus} size="xs" color="white" /></Box><Text className="text-sm font-bold text-slate-900 underline">Nova categoria</Text></Pressable><VStack space="sm" className="pt-2"><Text className="text-sm font-bold text-slate-700">Selecione uma cor para organizar seus produtos:</Text><HStack space="md" className="flex-wrap pt-2">{colors.map((color) =>{
                    const isSelected = selectedColor === color;
                    return (
                      <Pressable
                        key={color}
                        onPress={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full items-center justify-center border-2 ${isSelected ? "border-slate-300" : "border-transparent"}`}
                      ><Box
                          className="w-8 h-8 rounded-full border border-slate-100 items-center justify-center"
                          style={{ backgroundColor: color }}
                        >{isSelected && (
                            <Icon
                              as={Check}
                              size="xs"
                              color={color === "#000000" || color === "#991b1b" || color === "#2563eb" ? "white" : "#94a3b8"}
                            />
                          )}</Box></Pressable>
                    );
                  })}</HStack></VStack></VStack></Box>{/* Section: Estoque */}<Box className="bg-white p-6 rounded-[32px] border border-slate-200"><VStack space="lg"><Heading size="xs" className="text-slate-900 font-bold text-lg">Estoque</Heading><VStack space="xs"><Text className="text-sm font-bold text-slate-700">SKU</Text><Input className="rounded-xl border-slate-200 h-14 bg-white"><InputField
                    placeholder="ex.: ABC-123"
                    value={sku}
                    onChangeText={setSku}
                    className="text-base"
                  /></Input></VStack><VStack space="xs"><Text className="text-sm font-bold text-slate-700">Código de barras</Text><Input className="rounded-xl border-slate-200 h-14 bg-white"><InputField
                    placeholder="EAN, UPC, GTIN etc."
                    value={barcode}
                    onChangeText={setBarcode}
                    className="text-base"
                  /></Input></VStack><HStack className="justify-between items-center pt-2"><Text className="text-sm font-medium text-slate-700">Monitorar estoque</Text><Switch
                  size="sm"
                  value={monitorStock}
                  onValueChange={setMonitorStock}
                  trackColor={{ false: "#e2e8f0", true: "#0f172a" }}
                /></HStack></VStack></Box>{/* Section: Variações (Option Sets) */}<Box className="bg-white p-6 rounded-[32px] border border-slate-200"><VStack space="md"><HStack className="items-center" space="sm"><Icon as={Layers} size="sm" color="#0f172a" /><Heading size="xs" className="text-slate-900 font-bold text-lg">Variações</Heading></HStack><Text className="text-sm text-slate-500 leading-relaxed">
                Selecione conjuntos de opções para este item. O cliente deverá escolher uma opção de cada conjunto.
              </Text>{availableOptionSets.length === 0 ? (
                <Box className="p-4 border border-dashed border-slate-200 rounded-2xl items-center"><Text className="text-slate-400 text-sm text-center">Nenhum conjunto de opções disponível.</Text><Pressable className="mt-2" onPress={() => router.push('/app/options')}><Text className="text-sm font-bold text-slate-900 underline">Criar conjuntos de opções</Text></Pressable></Box>
              ) : (
                <VStack space="sm">{availableOptionSets.map((os: any) =>{
                    const isSelected = selectedOptionSetIds.includes(os.id);
                    return (
                      <Pressable
                        key={os.id}
                        onPress={() =>{
                          setSelectedOptionSetIds(prev =>
                            isSelected
                              ? prev.filter(id => id !== os.id)
                              : [...prev, os.id]
                          );
                        }}
                        className={`flex-row items-center p-4 rounded-2xl border-2 ${
                          isSelected
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-100 bg-white"
                        }`}
                      ><Box
                          className={`w-5 h-5 rounded-md border-2 items-center justify-center mr-3 ${
                            isSelected
                              ? "bg-slate-900 border-slate-900"
                              : "border-slate-300"
                          }`}
                        >{isSelected && <Icon as={Check} size="2xs" color="white" />}</Box><VStack className="flex-1"><Text className="text-slate-900 font-semibold text-sm">{os.name}</Text><Text className="text-slate-400 text-xs" numberOfLines={1}>{os.options?.map((o: any) => o.name).join(" · ") || "Sem opções"}</Text></VStack></Pressable>
                    );
                  })}<Pressable className="flex-row items-center pt-1" onPress={() => router.push('/app/options')}><Box className="bg-slate-950 rounded-full p-1 mr-2"><Icon as={Plus} size="xs" color="white" /></Box><Text className="text-sm font-bold text-slate-900 underline">Gerenciar conjuntos de opções</Text></Pressable></VStack>
              )}</VStack></Box>{/* Section: Modificações (Modifier Sets) */}<Box className="bg-white p-6 rounded-[32px] border border-slate-200"><VStack space="md"><HStack className="items-center" space="sm"><Icon as={Settings2} size="sm" color="#0f172a" /><Heading size="xs" className="text-slate-900 font-bold text-lg">Modificações</Heading></HStack><Text className="text-sm text-slate-500 leading-relaxed">
                Selecione conjuntos de modificações para este item. Clientes poderão adicionar extras ao pedido.
              </Text>{availableModifierSets.length === 0 ? (
                <Box className="p-4 border border-dashed border-slate-200 rounded-2xl items-center"><Text className="text-slate-400 text-sm text-center">Nenhum conjunto de modificações disponível.</Text><Pressable className="mt-2" onPress={() => router.push('/app/modifiers')}><Text className="text-sm font-bold text-slate-900 underline">Criar conjuntos de modificações</Text></Pressable></Box>
              ) : (
                <VStack space="sm">{availableModifierSets.map((ms: any) =>{
                    const isSelected = selectedModifierSetIds.includes(ms.id);
                    return (
                      <Pressable
                        key={ms.id}
                        onPress={() =>{
                          setSelectedModifierSetIds(prev =>
                            isSelected
                              ? prev.filter(id => id !== ms.id)
                              : [...prev, ms.id]
                          );
                        }}
                        className={`flex-row items-center p-4 rounded-2xl border-2 ${
                          isSelected
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-100 bg-white"
                        }`}
                      ><Box
                          className={`w-5 h-5 rounded-md border-2 items-center justify-center mr-3 ${
                            isSelected
                              ? "bg-slate-900 border-slate-900"
                              : "border-slate-300"
                          }`}
                        >{isSelected && <Icon as={Check} size="2xs" color="white" />}</Box><VStack className="flex-1"><Text className="text-slate-900 font-semibold text-sm">{ms.name}</Text><Text className="text-slate-400 text-xs" numberOfLines={1}>{ms.modifiers?.map((m: any) => m.name).join(" · ") || "Sem modificações"}</Text></VStack></Pressable>
                    );
                  })}<Pressable className="flex-row items-center pt-1" onPress={() => router.push('/app/modifiers')}><Box className="bg-slate-950 rounded-full p-1 mr-2"><Icon as={Plus} size="xs" color="white" /></Box><Text className="text-sm font-bold text-slate-900 underline">Gerenciar conjuntos de modificações</Text></Pressable></VStack>
              )}</VStack></Box>{/* Section: Descrição */}<Box className="bg-white p-6 rounded-[32px] border border-slate-200"><VStack space="md"><Heading size="xs" className="text-slate-900 font-bold text-lg">Descrição do item</Heading><Text className="text-sm text-slate-500">A descrição vai aparecer nas faturas e na Loja Online.</Text><VStack space="xs"><Textarea className="rounded-2xl border-slate-200 h-32 bg-white"><TextareaInput
                    placeholder="ex.: origem, material, dimensões"
                    className="text-base"
                    value={description}
                    onChangeText={setDescription}
                  /></Textarea><Text className="text-right text-[10px] text-slate-400 mt-1">Caracteres restantes: {1000 - description.length}</Text></VStack></VStack></Box></VStack></ScrollView>{/* Bottom Save Bar */}<Box className="px-4 py-4 border-t border-slate-100 bg-white" style={{ alignItems: 'center' }}><Box style={{ maxWidth: 500, width: '100%' }}><Button action="primary" className="rounded-2xl bg-slate-950 h-14 w-full shadow-lg" disabled={isSaving} onPress={() => handleSave(false)}><ButtonText className="font-bold text-lg mr-2">{isSaving ? "Salvando..." : "Salvar"}</ButtonText></Button></Box></Box>{/* Add Category Modal */}<Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        size="md"
      ><ModalBackdrop /><ModalContent className="rounded-[32px] p-8 border-0 shadow-2xl"><ModalHeader className="mb-6"><Heading size="lg" className="text-slate-900">
              Adicionar categoria
            </Heading><ModalCloseButton><Icon as={X} size="md" color="#64748b" /></ModalCloseButton></ModalHeader><ModalBody className="mb-8"><VStack space="xs"><Text className="text-sm font-bold text-slate-700 mb-1">Nome da categoria</Text><Input className="rounded-2xl border-slate-200 h-14 bg-slate-50/50"><InputField
                  placeholder="Ex: Bebidas, Sobremesas..."
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                /></Input><Text className="text-[10px] text-slate-400 mt-1 italic">Caracteres restantes: {Math.max(0, 30 - newCategoryName.length)}</Text></VStack></ModalBody><ModalFooter className="gap-3"><Button
              variant="outline"
              action="secondary"
              className="rounded-xl border-slate-200 px-6 h-12"
              onPress={() => setShowAddCategoryModal(false)}
            ><ButtonText className="text-slate-700 font-bold">Cancelar</ButtonText></Button><Button
              action="primary"
              className="rounded-xl bg-slate-950 px-8 h-12"
              onPress={handleSaveCategory}
            ><ButtonText className="font-bold">Salvar</ButtonText></Button></ModalFooter></ModalContent></Modal></VStack>
  );
}