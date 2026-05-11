import React, { useState, useEffect } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Checkbox, CheckboxIndicator, CheckboxIcon } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableData
} from "@/components/ui/table";
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@/components/ui/drawer";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import {
  Search,
  Pencil,
  Plus,
  X,
  ChevronDown,
  GripVertical,
  ChevronRight,
  Check,
  Minus,
  Trash2,
  Settings2,
  MoreVertical
} from "lucide-react-native";
import { EmptyState } from "@/components/empty-state";
import { Pressable, ScrollView } from "react-native";
import {
  Menu,
  MenuItem,
  MenuItemLabel,
} from "@/components/ui/menu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";

export default function Modifiers() {
  const [activeTab, setActiveTab] = useState<"sets" | "all">("sets");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "edit-set">("list");
  const [editingSet, setEditingSet] = useState<any>(null);
  const [isAddModifierToSetDrawerOpen, setIsAddModifierToSetDrawerOpen] = useState(false);

  // Selection Rules State
  const [minChecked, setMinChecked] = useState(false);
  const [minCount, setMinCount] = useState(1);
  const [maxChecked, setMaxChecked] = useState(false);
  const [maxCount, setMaxCount] = useState(1);
  const [allowDuplicates, setAllowDuplicates] = useState(false);

  // Modifier Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingModifier, setEditingModifier] = useState<any>(null);
  const [modName, setModName] = useState("");
  const [modPrice, setModPrice] = useState("");

  // Set edit form state
  const [setName, setSetName] = useState("");

  // Data from Supabase
  const [modifierSets, setModifierSets] = useState<any[]>([]);
  const [allModifiers, setAllModifiers] = useState<any[]>([]);
  const [currentSetModifiers, setCurrentSetModifiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cachedSets = await AsyncStorage.getItem('@store_modifier_sets');
        if (cachedSets) setModifierSets(JSON.parse(cachedSets));
        const cachedMods = await AsyncStorage.getItem('@store_all_modifiers');
        if (cachedMods) setAllModifiers(JSON.parse(cachedMods));
      } catch (e) {}
      fetchAll();
    };
    loadCache();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    const [setsRes, modsRes] = await Promise.all([
      supabase.from('modifier_sets').select('*, modifiers(*)').order('created_at', { ascending: false }),
      supabase.from('modifiers').select('*, modifier_sets(name)').order('name'),
    ]);
    if (setsRes.data) {
      setModifierSets(setsRes.data);
      AsyncStorage.setItem('@store_modifier_sets', JSON.stringify(setsRes.data)).catch(() => {});
    }
    if (modsRes.data) {
      setAllModifiers(modsRes.data);
      AsyncStorage.setItem('@store_all_modifiers', JSON.stringify(modsRes.data)).catch(() => {});
    }
    setIsLoading(false);
  };

  const openCreateDrawer = () => {
    setEditingModifier(null);
    setModName("");
    setModPrice("");
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (mod: any) => {
    setEditingModifier(mod);
    setModName(mod.name);
    setModPrice(mod.price?.toString().replace('.', ',') || "0");
    setIsDrawerOpen(true);
  };

  const openCreateSet = () => {
    setEditingSet(null);
    setSetName("");
    setCurrentSetModifiers([]);
    setMinChecked(false); setMinCount(1);
    setMaxChecked(false); setMaxCount(1);
    setAllowDuplicates(false);
    setViewMode("edit-set");
  };

  const openEditSet = (set: any) => {
    setEditingSet(set);
    setSetName(set.name);
    setCurrentSetModifiers(set.modifiers || []);
    setMinChecked((set.min_selections || 0) > 0);
    setMinCount(set.min_selections || 1);
    setMaxChecked((set.max_selections || 0) > 0 && set.max_selections < 999);
    setMaxCount(set.max_selections || 1);
    setAllowDuplicates(set.allow_duplicates || false);
    setViewMode("edit-set");
  };

  const closeEditSet = () => { setEditingSet(null); setViewMode("list"); };

  const handleSaveModifier = async () => {
    if (!modName.trim()) return;
    const parsedPrice = parseFloat(modPrice.replace(',', '.')) || 0;
    if (editingModifier) {
      await supabase.from('modifiers').update({ name: modName.trim(), price: parsedPrice }).eq('id', editingModifier.id);
    } else {
      // Creating standalone modifier requires a set — handled separately in set context
    }
    setIsDrawerOpen(false);
    await fetchAll();
  };

  const handleDeleteModifier = async () => {
    if (!editingModifier) return;
    await supabase.from('modifiers').delete().eq('id', editingModifier.id);
    setIsDrawerOpen(false);
    await fetchAll();
  };

  const handleSaveSet = async () => {
    if (!setName.trim()) return;
    const payload = {
      name: setName.trim(),
      min_selections: minChecked ? minCount : 0,
      max_selections: maxChecked ? maxCount : 999,
      allow_duplicates: allowDuplicates,
    };
    if (editingSet) {
      await supabase.from('modifier_sets').update(payload).eq('id', editingSet.id);
    } else {
      const { data } = await supabase.from('modifier_sets').insert([payload]).select();
      if (data) setEditingSet(data[0]);
    }
    await fetchAll();
    closeEditSet();
  };

  const handleDeleteSet = async () => {
    if (!editingSet) return;
    await supabase.from('modifiers').delete().eq('modifier_set_id', editingSet.id);
    await supabase.from('modifier_sets').delete().eq('id', editingSet.id);
    await fetchAll();
    closeEditSet();
  };

  const handleCreateModifierInSet = async () => {
    if (!modName.trim()) return;
    const setId = editingSet?.id;
    if (!setId) return;
    const parsedPrice = parseFloat(modPrice.replace(',', '.')) || 0;
    await supabase.from('modifiers').insert([{ name: modName.trim(), price: parsedPrice, modifier_set_id: setId }]);
    // Refresh the current set modifiers
    const { data } = await supabase.from('modifiers').select('*').eq('modifier_set_id', setId).order('created_at');
    if (data) setCurrentSetModifiers(data);
    setIsDrawerOpen(false);
    await fetchAll();
  };

  const toggleModifierInSet = async (mod: any) => {
    if (!editingSet?.id) return;
    const isInSet = currentSetModifiers.some(m => m.id === mod.id);
    if (isInSet) {
      // remove from set by deleting
      await supabase.from('modifiers').delete().eq('id', mod.id);
    } else {
      // add to set
      await supabase.from('modifiers').insert([{ 
        name: mod.name, 
        price: mod.price, 
        modifier_set_id: editingSet.id 
      }]);
    }
    // Refresh
    const { data } = await supabase.from('modifiers').select('*').eq('modifier_set_id', editingSet.id).order('created_at');
    if (data) setCurrentSetModifiers(data);
    await fetchAll();
  };



  // Main Render View
  return (
    <VStack space="xl" className="flex-1 max-w-[1200px] w-full mx-auto">
      {/* Header */}
      <Heading size="xl" className="text-slate-900 font-bold mb-2">Modificações</Heading>

      {/* Tabs */}
      <Box className="border-b border-slate-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack>
            <Pressable
              onPress={() => setActiveTab("sets")}
              className={`px-4 py-3 border-b-2 ${
                activeTab === "sets" ? "border-slate-900" : "border-transparent"
              }`}
            >
              <Text className={`font-semibold whitespace-nowrap ${activeTab === "sets" ? "text-slate-900" : "text-slate-500"}`}>
                Conjuntos
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("all")}
              className={`px-4 py-3 border-b-2 ${
                activeTab === "all" ? "border-slate-900" : "border-transparent"
              }`}
            >
              <Text className={`font-semibold whitespace-nowrap ${activeTab === "all" ? "text-slate-900" : "text-slate-500"}`}>
                Todas
              </Text>
            </Pressable>
          </HStack>
        </ScrollView>
      </Box>

      <ScrollView className="flex-1 mt-4">
        {activeTab === "sets" ? (
          <VStack space="xl">
            <Text className="text-slate-600 leading-relaxed max-w-[1000px]">
              Se você vende itens com extras como recheios, coberturas ou molhos, você pode criar conjuntos de modificações e depois adicioná-los aos itens na hora do pagamento.
            </Text>

            {/* Modifier Sets List */}
            <VStack className="mt-2 pb-24">
              {isLoading ? (
                Array.from({ length: modifierSets.length > 0 ? modifierSets.length : 1 }).map((_, index) => (
                  <VStack key={index} space="xs" className="p-4 border-b border-slate-50 justify-center">
                    <SkeletonText _lines={1} className="w-32 h-4" />
                    <SkeletonText _lines={1} className="w-48 h-3 mt-1" />
                  </VStack>
                ))
              ) : modifierSets.length === 0 ? (
                <EmptyState icon={Settings2} message="Nenhum conjunto encontrado." />
              ) : (
                modifierSets.map((set) => (
                  <Pressable 
                    key={set.id} 
                    className="p-4 border-b border-slate-50 flex-row items-center justify-between"
                    onPress={() => openEditSet(set)}
                  >
                    <VStack space="xs" className="flex-1 pr-4">
                      <Text className="text-slate-900 font-semibold text-lg">{set.name}</Text>
                      <Text className="text-slate-500 text-sm leading-relaxed">
                        {set.modifiers?.map((m: any) => m.name).join(" · ") || "-"}
                      </Text>
                    </VStack>
                    <Icon as={ChevronRight} size="sm" color="#94a3b8" />
                  </Pressable>
                ))
              )}
            </VStack>


          </VStack>
        ) : (
          <VStack space="xl">
            <Text className="text-slate-600 leading-relaxed max-w-[1000px]">
              Confira todas as suas modificações. Você pode criar novas ou editar as já existentes. Todas as modificações devem estar em um conjunto de modificações.
            </Text>

            <HStack className="justify-between items-center mt-2">
              <Input className="w-80 rounded-xl border-slate-200 bg-white h-11">
                <InputSlot className="pl-3">
                  <InputIcon as={Search} size="sm" color="#94a3b8" />
                </InputSlot>
                <InputField 
                  placeholder="Pesquisar" 
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="text-sm" 
                />
              </Input>

              <Button action="primary" className="rounded-xl bg-slate-950 px-6 h-11 hidden md:flex" onPress={openCreateDrawer}>
                <ButtonIcon as={Plus} size="sm" className="mr-2" />
                <ButtonText className="font-bold text-sm">Criar uma modificação</ButtonText>
              </Button>
            </HStack>

            {/* All Modifiers List */}
            <VStack className="mt-4 pb-24">
              {isLoading ? (
                Array.from({ length: allModifiers.length > 0 ? allModifiers.length : 1 }).map((_, index) => (
                  <VStack key={index} space="xs" className="p-4 border-b border-slate-50 justify-center">
                    <SkeletonText _lines={1} className="w-32 h-4" />
                    <SkeletonText _lines={1} className="w-16 h-3 mt-1" />
                  </VStack>
                ))
              ) : allModifiers.length === 0 ? (
                <EmptyState icon={Settings2} message="Nenhuma modificação encontrada." />
              ) : (
                allModifiers.map((mod) => (
                  <Pressable 
                    key={mod.id} 
                    className="p-4 border-b border-slate-50 flex-row items-center justify-between"
                    onPress={() => openEditDrawer(mod)}
                  >
                    <VStack space="xs" className="flex-1">
                      <Text className="text-slate-900 font-semibold text-lg">{mod.name}</Text>
                      <Text className="text-slate-500 text-sm">R$ {mod.price?.toFixed(2).replace('.', ',') || '0,00'}</Text>
                    </VStack>
                    <Icon as={ChevronRight} size="sm" color="#94a3b8" />
                  </Pressable>
                ))
              )}
            </VStack>


          </VStack>
        )}
      </ScrollView>

      {/* Drawer: Modifier Set Edit/Create */}
      <Drawer
        isOpen={viewMode === "edit-set"}
        onClose={closeEditSet}
        size="full"
        anchor="right"
      >
        <DrawerBackdrop />
        <DrawerContent className="w-full md:w-[500px] p-0 shadow-2xl">
          <DrawerHeader className="p-6 border-b-0 flex-row justify-between items-center">
            <Heading size="lg" className="text-slate-900 font-bold flex-1 text-center ml-8">
              {editingSet ? "Editar conjunto" : "Novo conjunto"}
            </Heading>
            <Pressable onPress={closeEditSet} className="p-2">
              <Icon as={X} size="lg" color="#0f172a" />
            </Pressable>
          </DrawerHeader>
          <DrawerBody className="p-0">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              <VStack space="2xl" className="p-6">
                {/* Set Name Input */}
                <VStack space="sm">
                  <Text className="text-base text-slate-800">Nome do conjunto</Text>
                  <Input className="rounded-xl border-slate-200 h-14 bg-white">
                    <InputField 
                      placeholder="ex.: molho" 
                      value={setName}
                      onChangeText={setSetName}
                    />
                  </Input>
                </VStack>

                {/* Modifiers List Section */}
                <VStack space="md" className="mt-2">
                  <HStack className="justify-between items-center">
                    <Heading size="sm" className="text-slate-900 font-bold text-xl">Modificações</Heading>
                    <Pressable onPress={() => setIsAddModifierToSetDrawerOpen(true)}>
                      <HStack space="xs" className="items-center">
                        <Icon as={Plus} size="sm" color="#0f172a" />
                        <Text className="font-bold text-slate-900 text-sm underline">Adicionar</Text>
                      </HStack>
                    </Pressable>
                  </HStack>

                  <VStack space="sm">
                    {currentSetModifiers.length === 0 ? (
                      <Box className="p-8 border border-dashed border-slate-200 rounded-2xl items-center">
                        <Text className="text-slate-400 text-sm text-center">Nenhuma modificação adicionada.</Text>
                      </Box>
                    ) : (
                      currentSetModifiers.map((mod: any, index: number) => (
                        <Pressable key={mod.id || index} onPress={() => openEditDrawer(mod)}>
                          <HStack className="p-4 bg-white rounded-2xl border border-slate-100 items-center justify-between shadow-sm">
                            <HStack space="md" className="items-center">
                              <Icon as={GripVertical} size="md" color="#cbd5e1" />
                              <VStack>
                                <Text className="text-slate-900 font-semibold text-base">{mod.name}</Text>
                                <Text className="text-slate-500 text-sm">R$ {mod.price?.toFixed(2).replace('.', ',')}</Text>
                              </VStack>
                            </HStack>
                            <Icon as={ChevronRight} size="sm" color="#94a3b8" />
                          </HStack>
                        </Pressable>
                      ))
                    )}
                  </VStack>
                </VStack>

                {/* Selection Rules Section */}
                <VStack space="md" className="mt-4">
                  <Heading size="sm" className="text-slate-900 font-bold text-xl">Regras de seleção</Heading>
                  
                  <Box className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <HStack className="p-5 border-b border-slate-50 items-center justify-between">
                      <VStack className="flex-1 pr-4">
                        <Text className="text-slate-900 font-semibold text-base">Mínimo exigido</Text>
                        <Text className="text-slate-500 text-xs leading-relaxed">Quantas modificações o cliente deve escolher?</Text>
                      </VStack>
                      <HStack space="md" className="items-center">
                        <Checkbox 
                          value="min" 
                          size="md" 
                          isChecked={minChecked}
                          onChange={(val) => setMinChecked(val)}
                        >
                          <CheckboxIndicator>
                            <CheckboxIcon as={Check} />
                          </CheckboxIndicator>
                        </Checkbox>
                        {minChecked && (
                          <HStack space="sm" className="items-center ml-2 bg-slate-50 rounded-lg p-1">
                            <Pressable className="p-1" onPress={() => setMinCount(Math.max(1, minCount - 1))}>
                              <Icon as={Minus} size="xs" color="#64748b" />
                            </Pressable>
                            <Text className="text-slate-900 font-bold w-6 text-center">{minCount}</Text>
                            <Pressable className="p-1" onPress={() => setMinCount(minCount + 1)}>
                              <Icon as={Plus} size="xs" color="#64748b" />
                            </Pressable>
                          </HStack>
                        )}
                      </HStack>
                    </HStack>

                    <HStack className="p-5 items-center justify-between">
                      <VStack className="flex-1 pr-4">
                        <Text className="text-slate-900 font-semibold text-base">Máximo permitido</Text>
                        <Text className="text-slate-500 text-xs leading-relaxed">Quantas modificações o cliente pode escolher?</Text>
                      </VStack>
                      <HStack space="md" className="items-center">
                        <Checkbox 
                          value="max" 
                          size="md" 
                          isChecked={maxChecked}
                          onChange={(val) => setMaxChecked(val)}
                        >
                          <CheckboxIndicator>
                            <CheckboxIcon as={Check} />
                          </CheckboxIndicator>
                        </Checkbox>
                        {maxChecked && (
                          <HStack space="sm" className="items-center ml-2 bg-slate-50 rounded-lg p-1">
                            <Pressable className="p-1" onPress={() => setMaxCount(Math.max(1, maxCount - 1))}>
                              <Icon as={Minus} size="xs" color="#64748b" />
                            </Pressable>
                            <Text className="text-slate-900 font-bold w-6 text-center">{maxCount}</Text>
                            <Pressable className="p-1" onPress={() => setMaxCount(maxCount + 1)}>
                              <Icon as={Plus} size="xs" color="#64748b" />
                            </Pressable>
                          </HStack>
                        )}
                      </HStack>
                    </HStack>
                  </Box>

                  <HStack className="justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mt-2">
                    <VStack className="flex-1 pr-4">
                      <Text className="text-slate-900 font-semibold text-base">Permitir duplicatas</Text>
                      <Text className="text-slate-500 text-xs leading-relaxed">Clientes podem escolher a mesma modificação várias vezes</Text>
                    </VStack>
                    <Switch 
                      size="sm" 
                      value={allowDuplicates}
                      onValueChange={setAllowDuplicates}
                      isDisabled={minChecked || maxChecked} 
                    />
                  </HStack>
                </VStack>

                {/* Footer Actions */}
                <VStack space="md" className="mt-8 mb-12">
                  <Button action="primary" className="rounded-xl bg-slate-950 h-14 w-full" onPress={handleSaveSet}>
                    <ButtonText className="font-bold text-white text-lg">Salvar conjunto</ButtonText>
                  </Button>
                  
                  {editingSet && (
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-slate-300 h-14 w-full mt-2"
                      onPress={handleDeleteSet}
                    >
                      <ButtonText className="text-red-500 font-bold text-base">Excluir conjunto</ButtonText>
                    </Button>
                  )}
                </VStack>
              </VStack>
            </ScrollView>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Drawer: Add Modifiers to Set Selection */}
      <Drawer
        isOpen={isAddModifierToSetDrawerOpen}
        onClose={() => setIsAddModifierToSetDrawerOpen(false)}
        size="full"
        anchor="right"
      >
        <DrawerBackdrop />
        <DrawerContent className="w-full md:w-[450px] p-0 shadow-2xl">
          <DrawerHeader className="p-6 border-b-0 flex-row justify-between items-center">
            <Heading size="lg" className="text-slate-900 font-bold flex-1 text-center ml-8">
              Adicionar modificação
            </Heading>
            <Pressable onPress={() => setIsAddModifierToSetDrawerOpen(false)} className="p-2">
              <Icon as={X} size="lg" color="#0f172a" />
            </Pressable>
          </DrawerHeader>
          <DrawerBody className="p-6">
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space="xl">
                <Button action="primary" className="rounded-xl bg-slate-950 h-14 w-full" onPress={openCreateDrawer}>
                  <ButtonText className="font-bold text-white text-lg">Criar nova modificação</ButtonText>
                </Button>

                <HStack className="items-center py-4">
                  <Box className="flex-1 h-[1px] bg-slate-100" />
                  <Text className="px-4 text-slate-400 text-xs font-bold uppercase">ou use existentes</Text>
                  <Box className="flex-1 h-[1px] bg-slate-100" />
                </HStack>

                <Input className="w-full rounded-xl border-slate-200 bg-white h-12 mb-2">
                  <InputSlot className="pl-3">
                    <InputIcon as={Search} size="sm" color="#94a3b8" />
                  </InputSlot>
                  <InputField placeholder="Pesquisar modificações..." className="text-sm" />
                </Input>

                <VStack space="sm">
                  {allModifiers.filter(m => m.modifier_set_id !== editingSet?.id).length === 0 ? (
                    <EmptyState icon={Settings2} message="Nenhuma modificação disponível." className="py-8" />
                  ) : (
                    allModifiers.filter(m => m.modifier_set_id !== editingSet?.id).map((mod) => (
                      <Pressable 
                        key={mod.id} 
                        className="flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 active:bg-slate-50 shadow-sm"
                        onPress={() => toggleModifierInSet(mod)}
                      >
                        <VStack className="flex-1">
                          <Text className="text-slate-900 font-semibold text-base">{mod.name}</Text>
                          <Text className="text-slate-500 text-sm">R$ {mod.price?.toFixed(2).replace('.', ',')}</Text>
                        </VStack>
                        <Box className="w-6 h-6 rounded-full border border-slate-200 items-center justify-center">
                           <Icon as={Plus} size="xs" color="#94a3b8" />
                        </Box>
                      </Pressable>
                    ))
                  )}
                </VStack>
              </VStack>
            </ScrollView>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Drawer: Modifier Create/Edit (reuse from above) */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        size="full"
        anchor="right"
      >
        <DrawerBackdrop />
        <DrawerContent className="w-full md:w-[450px] p-0 shadow-2xl">
          <DrawerHeader className="p-6 border-b-0 flex-row justify-between items-center">
            <Heading size="lg" className="text-slate-900 font-bold flex-1 text-center ml-8">
              {editingModifier ? "Editar modificação" : "Nova modificação"}
            </Heading>
            <Pressable onPress={() => setIsDrawerOpen(false)} className="p-2">
              <Icon as={X} size="lg" color="#0f172a" />
            </Pressable>
          </DrawerHeader>
          <DrawerBody className="p-6">
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space="2xl">
                <VStack space="sm">
                  <Text className="text-base text-slate-800">Nome da modificação</Text>
                  <Input className="rounded-xl border-slate-200 h-14 bg-white">
                    <InputField 
                      placeholder="ex.: shoyo" 
                      value={modName}
                      onChangeText={setModName}
                    />
                  </Input>
                </VStack>

                <VStack space="sm">
                  <Text className="text-base text-slate-800">Valor</Text>
                  <Input className="rounded-xl border-slate-200 h-14 bg-white">
                    <InputSlot className="pl-4 pr-2">
                      <Text className="text-slate-400 font-medium">R$</Text>
                    </InputSlot>
                    <InputField 
                      placeholder="0" 
                      value={modPrice}
                      onChangeText={setModPrice}
                      keyboardType="numeric"
                    />
                  </Input>
                  <Text className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Isso será adicionado ao preço do item e a mesma taxa de imposto será usada
                  </Text>
                </VStack>

                <VStack space="md" className="mt-8 mb-12">
                  <Button 
                    action="primary" 
                    className="rounded-xl bg-slate-950 h-14 w-full"
                    onPress={handleSaveModifier}
                  >
                    <ButtonText className="font-bold text-white text-lg">Salvar</ButtonText>
                  </Button>

                  {editingModifier && (
                    <Button 
                      variant="outline"
                      className="rounded-xl border-slate-300 h-14 w-full mt-2"
                      onPress={handleDeleteModifier}
                    >
                      <ButtonText className="text-red-500 font-bold text-base">Excluir modificação</ButtonText>
                    </Button>
                  )}
                </VStack>
              </VStack>
            </ScrollView>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Mobile Sticky Bottom Action Bar */}
      <Box className="md:hidden absolute bottom-4 left-0 right-0 flex-row items-center px-4 bg-transparent pointer-events-box-none z-50">
        {activeTab === "sets" ? (
          <Button action="primary" className="rounded-xl bg-slate-950 flex-1 h-12 shadow-sm pointer-events-auto" onPress={openCreateSet}>
            <ButtonText className="font-bold text-sm text-white">Criar conjunto de modificações</ButtonText>
          </Button>
        ) : (
          <Button action="primary" className="rounded-xl bg-slate-950 flex-1 h-12 shadow-sm pointer-events-auto" onPress={openCreateDrawer}>
            <ButtonText className="font-bold text-sm text-white">Criar uma modificação</ButtonText>
          </Button>
        )}
      </Box>
    </VStack>
  );
}