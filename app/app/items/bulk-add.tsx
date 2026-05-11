import React, { useState, useEffect } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField, InputSlot } from "@/components/ui/input";
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
  ActionsheetSectionHeaderText,
} from "@/components/ui/actionsheet";
import { ArrowLeft, ChevronDown, Plus, Image as ImageIcon, Trash2, Camera, ImagePlus } from "lucide-react-native";
import { Pressable, ScrollView, Alert, ActivityIndicator, Image as RNImage } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/utils/supabase";
import { pickImageFromLibrary, uploadItemImage, deleteItemImage } from "@/utils/image-picker";
import { CameraCapture } from "@/components/camera-capture";

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
    .flatMap((s) => s.items)
    .find((i) => i.value === selectedValue)?.label;

  return (
    <VStack space="xs" className={className}>
      <Text className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</Text>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-slate-200 h-14 px-4 bg-white w-full"
      >
        <Text className={selectedLabel ? "text-slate-900 text-sm" : "text-slate-400 text-sm"}>
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={18} color="#94a3b8" />
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

type ItemRow = {
  id: string;
  name: string;
  barcode: string;
  price: string;
  imageUri: string | null;
  imageUrl: string | null;
  isUploading: boolean;
};

export default function BulkAddItems() {
  const router = useRouter();

  const [categoriesList, setCategoriesList] = useState<{ label: string; value: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [items, setItems] = useState<ItemRow[]>([
    { id: Date.now().toString(), name: "", barcode: "", price: "", imageUri: null, imageUrl: null, isUploading: false }
  ]);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(items[0].id);

  // Image Picking State
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pickingImageForId, setPickingImageForId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("id, name");
    if (data) {
      setCategoriesList(data.map((c) => ({ label: c.name, value: c.id })));
    } else if (error) {
      console.error(error);
    }
  };

  const categorySections: PickerSection[] = [{ title: null, items: categoriesList }];

  const handleAddItemRow = () => {
    if (focusedItemId) {
      const current = items.find((i) => i.id === focusedItemId);
      if (current && (!current.name.trim() || !current.price.trim())) {
        Alert.alert("Atenção", "Preencha o nome e o preço do item atual antes de adicionar outro.");
        return;
      }
    }
    const newId = Date.now().toString() + Math.random();
    setItems([
      ...items,
      { id: newId, name: "", barcode: "", price: "", imageUri: null, imageUrl: null, isUploading: false }
    ]);
    setFocusedItemId(newId);
  };

  const handleRemoveItemRow = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    if (focusedItemId === id) {
      setFocusedItemId(newItems.length > 0 ? newItems[newItems.length - 1].id : null);
    }
  };

  const updateItemRow = (id: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // --- Image Upload Logic ---
  const handleOpenCamera = () => {
    setShowImagePicker(false);
    setTimeout(() => {
      setShowCamera(true);
    }, 500);
  };

  const handleCameraCapture = async (uri: string) => {
    setShowCamera(false);
    const targetId = pickingImageForId;
    if (!targetId) return;

    updateItemRow(targetId, "imageUri", uri);
    updateItemRow(targetId, "isUploading", true);

    const url = await uploadItemImage(uri);

    updateItemRow(targetId, "isUploading", false);
    if (url) {
      updateItemRow(targetId, "imageUrl", url);
    } else {
      updateItemRow(targetId, "imageUri", null);
    }
    setPickingImageForId(null);
  };

  const handlePickFromLibrary = async () => {
    setShowImagePicker(false);
    const targetId = pickingImageForId;
    const asset = await pickImageFromLibrary();
    if (!asset || !targetId) return;

    updateItemRow(targetId, "imageUri", asset.uri);
    updateItemRow(targetId, "isUploading", true);

    const url = await uploadItemImage(asset.uri, asset.mimeType);

    updateItemRow(targetId, "isUploading", false);
    if (url) {
      updateItemRow(targetId, "imageUrl", url);
    } else {
      updateItemRow(targetId, "imageUri", null);
    }
    setPickingImageForId(null);
  };

  const handleRemoveImage = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (item?.imageUrl) {
      await deleteItemImage(item.imageUrl);
    }
    updateItemRow(id, "imageUri", null);
    updateItemRow(id, "imageUrl", null);
  };

  // --- Save Logic ---
  const isFormValid = selectedCategory !== "" && items.length > 0 && items.every((i) => i.name.trim() !== "" && i.price.trim() !== "");

  const handleSave = async () => {
    if (!isFormValid) {
      Alert.alert("Atenção", "Preencha a categoria e certifique-se de que todos os itens têm nome e preço.");
      return;
    }

    setIsSaving(true);

    const payload = items.map((item) => {
      let parsedPrice = parseFloat(item.price.replace(",", "."));
      if (isNaN(parsedPrice)) parsedPrice = 0;

      return {
        name: item.name.trim(),
        category_id: selectedCategory || null,
        barcode: item.barcode.trim() || null,
        price: parsedPrice,
        image_url: item.imageUrl || null,
        unit: "Cada", // Default for bulk add
      };
    });

    const { error } = await supabase.from("items").insert(payload);

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
    <Box className="flex-1 bg-white">
      {/* Header */}
      <HStack className="h-16 items-center px-4 bg-white border-b border-slate-100">
        <Pressable 
          onPress={() => router.canGoBack() ? router.back() : router.replace("/app/inventory")} 
          className="p-2 -ml-2 rounded-full active:bg-slate-50"
        >
          <ArrowLeft size={22} color="#0f172a" />
        </Pressable>
        <Heading size="md" className="ml-2 text-slate-900 font-bold">
          Adicionar itens em massa
        </Heading>
      </HStack>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="xl" className="max-w-[800px] mx-auto w-full">
          
          <Text className="text-slate-600 text-sm leading-relaxed">
            Adicione novos itens em segundos inserindo informações básicas em massa.
          </Text>

          <Box>
            <ActionsheetPicker
              label="Categoria"
              placeholder="Selecione uma categoria"
              sections={categorySections}
              selectedValue={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </Box>

          <VStack space="lg" className="mt-2">
            {items.map((item, index) => {
              const isFocused = focusedItemId === item.id;

              if (!isFocused) {
                return (
                  <Pressable 
                    key={item.id} 
                    onPress={() => setFocusedItemId(item.id)}
                    className="flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-200"
                  >
                    <HStack space="md" className="items-center flex-1">
                      <Box className="w-12 h-12 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 overflow-hidden">
                        {item.imageUri ? (
                          <RNImage source={{ uri: item.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                          <Icon as={ImageIcon} size="md" color="#cbd5e1" />
                        )}
                      </Box>
                      <VStack>
                        <Text className="text-sm font-bold text-slate-900">{item.name || "Sem nome"}</Text>
                        <Text className="text-xs text-slate-500">
                          {item.price ? `R$ ${item.price}` : "R$ 0,00"}
                        </Text>
                      </VStack>
                    </HStack>
                    <Pressable onPress={() => handleRemoveItemRow(item.id)} className="p-2">
                      <Trash2 size={20} color="#0f172a" />
                    </Pressable>
                  </Pressable>
                );
              }

              return (
                <Box key={item.id} className="relative bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  {items.length > 1 && (
                    <Box className="absolute right-2 top-2 z-10 p-2">
                      <Pressable onPress={() => handleRemoveItemRow(item.id)}>
                        <Trash2 size={20} color="#ef4444" />
                      </Pressable>
                    </Box>
                  )}
                  
                  <VStack space="lg">
                    {/* Image Picker */}
                    <Box className="items-center mb-2">
                      <Pressable 
                        className="w-16 h-16 bg-slate-50 rounded-2xl items-center justify-center relative border border-slate-200 border-dashed overflow-hidden"
                        onPress={() => {
                          if (item.imageUri) return;
                          setPickingImageForId(item.id);
                          setShowImagePicker(true);
                        }}
                      >
                        {item.imageUri ? (
                          <>
                            <RNImage source={{ uri: item.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                            {item.isUploading && (
                              <Box className="absolute inset-0 bg-black/40 items-center justify-center">
                                <ActivityIndicator color="white" size="small" />
                              </Box>
                            )}
                            <Pressable 
                              className="absolute top-1 right-1 bg-red-500 p-1 rounded-full shadow-lg"
                              onPress={() => handleRemoveImage(item.id)}
                            >
                              <Icon as={Trash2} size="xs" color="white" />
                            </Pressable>
                          </>
                        ) : (
                          <>
                            <Icon as={ImageIcon} size="xl" color="#cbd5e1" />
                            <Box className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                              <Icon as={Plus} size="sm" color="#0f172a" />
                            </Box>
                          </>
                        )}
                      </Pressable>
                    </Box>

                    <Input className="rounded-2xl border-slate-200 h-14 bg-white px-4">
                      <InputField 
                        placeholder="ex.: Camiseta" 
                        value={item.name}
                        onChangeText={(val) => updateItemRow(item.id, "name", val)}
                        className="text-sm"
                      />
                    </Input>

                    <Input className="rounded-2xl border-slate-200 h-14 bg-white px-4">
                      <InputSlot className="mr-2">
                        <Text className="text-slate-400 text-sm font-semibold">R$</Text>
                      </InputSlot>
                      <InputField 
                        placeholder="0,00" 
                        keyboardType="numeric" 
                        value={item.price}
                        onChangeText={(val) => updateItemRow(item.id, "price", val)}
                        className="text-sm"
                      />
                    </Input>

                    <Input className="rounded-2xl border-slate-200 h-14 bg-white px-4">
                      <InputField 
                        placeholder="EAN, UPC ou GTIN" 
                        value={item.barcode}
                        onChangeText={(val) => updateItemRow(item.id, "barcode", val)}
                        className="text-sm"
                      />
                    </Input>
                  </VStack>
                </Box>
              );
            })}
          </VStack>
        </VStack>
      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <Box className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 pb-8">
        <HStack className="justify-between items-center">
          <Button 
            variant="link" 
            onPress={handleAddItemRow}
            className="px-0 active:opacity-70"
          >
            <Text className="text-slate-500 font-bold text-base">Adicionar item</Text>
          </Button>

          <Button 
            onPress={handleSave}
            isDisabled={!isFormValid || isSaving}
            className={`rounded-xl h-12 px-8 ${isFormValid ? "bg-[#111827]" : "bg-slate-300"}`}
          >
            <ButtonText className="font-bold text-sm">{isSaving ? "Salvando..." : "Salvar"}</ButtonText>
          </Button>
        </HStack>
      </Box>

      {/* Shared Image Picker Actionsheet */}
      <Actionsheet isOpen={showImagePicker} onClose={() => setShowImagePicker(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetItem onPress={handleOpenCamera}>
            <HStack space="md" className="items-center">
              <Box className="bg-slate-100 p-2 rounded-xl">
                <Icon as={Camera} size="sm" color="#0f172a" />
              </Box>
              <VStack>
                <ActionsheetItemText className="font-semibold text-slate-900">Tirar foto</ActionsheetItemText>
                <Text className="text-xs text-slate-500">Use a câmera do seu dispositivo</Text>
              </VStack>
            </HStack>
          </ActionsheetItem>
          <ActionsheetItem onPress={handlePickFromLibrary}>
            <HStack space="md" className="items-center">
              <Box className="bg-slate-100 p-2 rounded-xl">
                <Icon as={ImagePlus} size="sm" color="#0f172a" />
              </Box>
              <VStack>
                <ActionsheetItemText className="font-semibold text-slate-900">Escolher da galeria</ActionsheetItemText>
                <Text className="text-xs text-slate-500">Selecione uma imagem existente</Text>
              </VStack>
            </HStack>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>

    </Box>
  );
}
