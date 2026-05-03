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
  DrawerCloseButton,
} from "@/components/ui/drawer";
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
  Trash2
} from "lucide-react-native";
import { Pressable, ScrollView } from "react-native";
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

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    const [setsRes, modsRes] = await Promise.all([
      supabase.from('modifier_sets').select('*, modifiers(*)').order('created_at', { ascending: false }),
      supabase.from('modifiers').select('*, modifier_sets(name)').order('name'),
    ]);
    if (setsRes.data) setModifierSets(setsRes.data);
    if (modsRes.data) setAllModifiers(modsRes.data);
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
    }
    // Refresh
    const { data } = await supabase.from('modifiers').select('*').eq('modifier_set_id', editingSet.id).order('created_at');
    if (data) setCurrentSetModifiers(data);
    await fetchAll();
  };

  if (viewMode === "edit-set") {
    const isNew = !editingSet;

    return (
      <VStack className="flex-1 w-full bg-slate-50/50 -m-4 md:-m-8 p-4 md:p-8">
        <ScrollView className="flex-1">
          <VStack space="xl" className="max-w-[1000px] w-full mx-auto pb-12">
            
            {/* Header */}
            <HStack className="items-center justify-between mb-4">
              <HStack space="md" className="items-center">
                <Pressable onPress={closeEditSet} className="p-2 rounded-full hover:bg-slate-200 mr-2">
                  <Icon as={X} size="xl" color="#0f172a" />
                </Pressable>
                <Heading size="xl" className="text-slate-900 font-bold">
                  {isNew ? "Criar conjunto de modificações" : "Editar conjunto de modificações"}
                </Heading>
              </HStack>
              <Button 
                action="primary" 
                className="rounded-xl px-6 bg-slate-950"
                onPress={handleSaveSet}
              >
                <ButtonText className="text-white font-bold">
                  Salvar conjunto de modificações
                </ButtonText>
              </Button>
            </HStack>

            {/* Set Name Input */}
            <VStack space="xs">
              <Text className="text-sm font-semibold text-slate-500">Nome do conjunto de modificações</Text>
              <Input className="rounded-xl border-slate-200 bg-white h-12">
                <InputField 
                  placeholder="" 
                  value={setName}
                  onChangeText={setSetName}
                />
              </Input>
            </VStack>

            {/* Modifiers List Section */}
            <VStack space="md" className="mt-4">
              <HStack className="justify-between items-end">
                <VStack space="xs">
                  <Heading size="md" className="text-slate-900 font-bold">Modificações</Heading>
                  <Text className="text-sm text-slate-500">Estas modificações serão exibidas nesta ordem no checkout:</Text>
                </VStack>
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onPress={() => setIsAddModifierToSetDrawerOpen(true)}
                >
                  <ButtonIcon as={Plus} size="sm" className="mr-2" color="#0f172a" />
                  <ButtonText className="font-bold text-slate-900 text-sm underline">Adicionar modificação ao conjunto</ButtonText>
                </Button>
              </HStack>

              <Box className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {currentSetModifiers.length === 0 ? (
                  <HStack className="p-5 items-center justify-center">
                    <Text className="text-slate-400">Nenhuma modificação adicionada.</Text>
                  </HStack>
                ) : (
                  currentSetModifiers.map((mod: any, index: number) => (
                    <HStack key={mod.id || index} className="p-5 items-center border-b border-slate-100 last:border-0 hover:bg-slate-50/50 justify-between">
                      <HStack space="lg" className="items-center">
                        <Icon as={GripVertical} size="md" color="#cbd5e1" />
                        <VStack>
                          <Text className="text-slate-900 font-medium text-base">{mod.name}</Text>
                          <Text className="text-slate-500 text-sm">R$ {mod.price?.toString().replace('.', ',') || '0'}</Text>
                        </VStack>
                      </HStack>
                      <Icon as={ChevronRight} size="sm" color="#94a3b8" />
                    </HStack>
                  ))
                )}
              </Box>
            </VStack>

            {/* Selection Rules Section */}
            <VStack space="md" className="mt-4">
              <VStack space="xs">
                <Heading size="md" className="text-slate-900 font-bold">Regras de seleção</Heading>
                <Text className="text-sm text-slate-500">Defina o número de modificações que os clientes podem escolher.</Text>
              </VStack>

              <Box className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-2">
                <HStack className="p-6 border-b border-slate-100 items-start justify-between">
                  <HStack>
                    <Checkbox 
                      value="min" 
                      size="md" 
                      className="mt-1 mr-4" 
                      isChecked={minChecked}
                      onChange={(val) => setMinChecked(val)}
                    >
                      <CheckboxIndicator>
                        <CheckboxIcon as={Check} />
                      </CheckboxIndicator>
                    </Checkbox>
                    <VStack>
                      <Text className="text-slate-900 font-medium text-base">Mínimo exigido</Text>
                      <Text className="text-slate-500 text-sm">Quantas modificações o cliente deve escolher?</Text>
                    </VStack>
                  </HStack>
                  {minChecked && (
                    <HStack space="md" className="items-center">
                      <Pressable className="p-2" onPress={() => setMinCount(Math.max(1, minCount - 1))}>
                        <Icon as={Minus} size="sm" color="#94a3b8" />
                      </Pressable>
                      <Text className="text-slate-900 font-bold w-4 text-center">{minCount}</Text>
                      <Pressable className="p-2" onPress={() => setMinCount(minCount + 1)}>
                        <Icon as={Plus} size="sm" color="#94a3b8" />
                      </Pressable>
                    </HStack>
                  )}
                </HStack>
                <HStack className="p-6 items-start justify-between">
                  <HStack>
                    <Checkbox 
                      value="max" 
                      size="md" 
                      className="mt-1 mr-4" 
                      isChecked={maxChecked}
                      onChange={(val) => setMaxChecked(val)}
                    >
                      <CheckboxIndicator>
                        <CheckboxIcon as={Check} />
                      </CheckboxIndicator>
                    </Checkbox>
                    <VStack>
                      <Text className="text-slate-900 font-medium text-base">Máximo permitido</Text>
                      <Text className="text-slate-500 text-sm">Quantas modificações o cliente pode escolher?</Text>
                    </VStack>
                  </HStack>
                  {maxChecked && (
                    <HStack space="md" className="items-center">
                      <Pressable className="p-2" onPress={() => setMaxCount(Math.max(1, maxCount - 1))}>
                        <Icon as={Minus} size="sm" color="#94a3b8" />
                      </Pressable>
                      <Text className="text-slate-900 font-bold w-4 text-center">{maxCount}</Text>
                      <Pressable className="p-2" onPress={() => setMaxCount(maxCount + 1)}>
                        <Icon as={Plus} size="sm" color="#94a3b8" />
                      </Pressable>
                    </HStack>
                  )}
                </HStack>
              </Box>

              <HStack className="justify-between items-center py-2 px-2">
                <Text className={`${(minChecked || maxChecked) ? 'text-slate-400' : 'text-slate-600'} font-medium`}>
                  Permitir que os clientes escolham a mesma modificação mais de uma vez
                </Text>
                <Switch 
                  size="sm" 
                  value={allowDuplicates}
                  onValueChange={setAllowDuplicates}
                  isDisabled={minChecked || maxChecked} 
                />
              </HStack>
            </VStack>

            {!isNew && (
              <HStack space="xs" className="mt-8 items-center">
                <Icon as={Trash2} size="sm" color="#ef4444" />
                <Button variant="link" className="p-0" onPress={handleDeleteSet}>
                  <ButtonText className="text-red-500 font-bold underline">Excluir conjunto de modificações</ButtonText>
                </Button>
              </HStack>
            )}

          </VStack>
        </ScrollView>

        {/* Drawer: Add Modifiers to Set */}
        <Drawer
          isOpen={isAddModifierToSetDrawerOpen}
          onClose={() => setIsAddModifierToSetDrawerOpen(false)}
          size="sm"
          anchor="right"
        >
          <DrawerBackdrop />
          <DrawerContent className="w-[450px] p-0 shadow-2xl">
            <DrawerHeader className="p-6 border-b border-slate-50 flex-row justify-between items-center">
              <Heading size="md" className="text-slate-900 font-bold">
                Adicionar modificação ao conju...
              </Heading>
              <DrawerCloseButton>
                <Icon as={X} size="md" color="#0f172a" />
              </DrawerCloseButton>
            </DrawerHeader>
            <DrawerBody className="p-6">
              <Button action="primary" className="rounded-xl bg-slate-950 h-12 mb-8 w-full" onPress={openCreateDrawer}>
                <ButtonText className="font-bold text-base">Criar nova modificação</ButtonText>
              </Button>

              <HStack className="items-center mb-8">
                <Box className="flex-1 h-[1px] bg-slate-200" />
                <Text className="px-4 text-slate-400 text-xs font-bold uppercase">ou</Text>
                <Box className="flex-1 h-[1px] bg-slate-200" />
              </HStack>

              <Text className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">
                Adicionar modificações existentes
              </Text>

              <Input className="w-full rounded-xl border-slate-200 bg-white h-12 mb-4">
                <InputSlot className="pl-3">
                  <InputIcon as={Search} size="sm" color="#94a3b8" />
                </InputSlot>
                <InputField placeholder="Pesquisar" className="text-sm" />
              </Input>

              <VStack>
                {allModifiers.filter(m => m.modifier_set_id !== editingSet?.id).length === 0 ? (
                  <Text className="text-slate-400 text-center py-4">Nenhuma modificação existente disponível.</Text>
                ) : (
                  allModifiers.filter(m => m.modifier_set_id !== editingSet?.id).map((mod) => (
                    <Pressable 
                      key={mod.id} 
                      className="flex-row items-center justify-between py-4 border-b border-slate-100 active:bg-slate-50"
                    >
                      <VStack>
                        <Text className="text-slate-900 font-medium text-base">{mod.name}</Text>
                        <Text className="text-slate-500 text-sm">R$ {mod.price?.toString().replace('.', ',') || '0'}</Text>
                      </VStack>
                    </Pressable>
                  ))
                )}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        
        {/* Drawer for creating a new modifier inside the set context */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          size="sm"
          anchor="right"
        >
          <DrawerBackdrop />
          <DrawerContent className="w-[400px] p-0 shadow-2xl">
            <DrawerHeader className="p-6 border-b border-slate-50 flex-row justify-between items-center">
              <Heading size="md" className="text-slate-900 font-bold">
                Criar uma modificação
              </Heading>
              <DrawerCloseButton>
                <Icon as={X} size="md" color="#0f172a" />
              </DrawerCloseButton>
            </DrawerHeader>
            <DrawerBody className="p-8">
              <VStack space="xl">
                <VStack space="xs">
                  <Text className="text-sm text-slate-700">Nome da modificação</Text>
                  <Input className="rounded-xl border-slate-200 h-12">
                    <InputField placeholder="ex.: shoyo" value={modName} onChangeText={setModName} />
                  </Input>
                </VStack>

                <VStack space="xs">
                  <Text className="text-sm text-slate-700">Valor</Text>
                  <Input className="rounded-xl border-slate-200 h-12">
                    <InputSlot className="pl-3 pr-2">
                      <Text className="text-slate-400">R$</Text>
                    </InputSlot>
                    <InputField placeholder="0" keyboardType="numeric" value={modPrice} onChangeText={setModPrice} />
                  </Input>
                  <Text className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Isso será adicionado ao preço do item e a mesma taxa de imposto será usada
                  </Text>
                </VStack>

                <VStack space="md" className="mt-4">
                  <Button 
                    action="primary" 
                    className="rounded-xl h-12 bg-slate-950"
                    onPress={handleCreateModifierInSet}
                  >
                    <ButtonText className="text-white font-bold">Salvar</ButtonText>
                  </Button>
                </VStack>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </VStack>
    );
  }

  // Main Render View
  return (
    <VStack space="xl" className="flex-1 max-w-[1200px] w-full mx-auto">
      {/* Header */}
      <Heading size="xl" className="text-slate-900 font-bold mb-2">Modificações</Heading>

      {/* Tabs */}
      <HStack className="border-b border-slate-200">
        <Pressable
          onPress={() => setActiveTab("sets")}
          className={`px-4 py-3 border-b-2 ${
            activeTab === "sets" ? "border-slate-900" : "border-transparent"
          }`}
        >
          <Text className={`font-semibold ${activeTab === "sets" ? "text-slate-900" : "text-slate-500"}`}>
            Conjuntos de modificações
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("all")}
          className={`px-4 py-3 border-b-2 ${
            activeTab === "all" ? "border-slate-900" : "border-transparent"
          }`}
        >
          <Text className={`font-semibold ${activeTab === "all" ? "text-slate-900" : "text-slate-500"}`}>
            Todas as modificações
          </Text>
        </Pressable>
      </HStack>

      <ScrollView className="flex-1 mt-4">
        {activeTab === "sets" ? (
          <VStack space="xl">
            <Text className="text-slate-600 leading-relaxed max-w-[1000px]">
              Se você vende itens com extras como recheios, coberturas ou molhos, você pode criar conjuntos de modificações e depois adicioná-los aos itens na hora do pagamento.
            </Text>

            <Box className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mt-2">
              <Table className="w-full">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="px-6 py-5">
                      <Text className="font-bold text-slate-500 text-sm">Conjunto de modificações</Text>
                    </TableHead>
                    <TableHead className="px-6 py-5">
                      <Text className="font-bold text-slate-500 text-sm">Modificações neste conjunto</Text>
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right w-64">
                      <Button action="primary" className="rounded-xl bg-slate-950 px-4 h-10 ml-auto" onPress={openCreateSet}>
                        <ButtonIcon as={Plus} size="sm" className="mr-2" />
                        <ButtonText className="font-bold text-sm">Criar conjunto de modificações</ButtonText>
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableData className="px-6 py-6"><Text className="text-slate-500">Carregando...</Text></TableData>
                      <TableData /><TableData />
                    </TableRow>
                  ) : modifierSets.length === 0 ? (
                    <TableRow>
                      <TableData className="px-6 py-6"><Text className="text-slate-500">Nenhum conjunto encontrado.</Text></TableData>
                      <TableData /><TableData />
                    </TableRow>
                  ) : (
                    modifierSets.map((set) => (
                      <TableRow key={set.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <TableData className="px-6 py-6">
                          <Text className="text-slate-900 font-medium">{set.name}</Text>
                        </TableData>
                        <TableData className="px-6 py-6">
                          <Text className="text-slate-600 leading-relaxed">
                            {set.modifiers?.map((m: any) => m.name).join(" · ") || "-"}
                          </Text>
                        </TableData>
                        <TableData className="px-6 py-6 text-right">
                          <Pressable 
                            className="p-2 rounded-lg hover:bg-slate-100 self-end ml-auto"
                            onPress={() => openEditSet(set)}
                          >
                            <Icon as={Pencil} size="sm" color="#0f172a" />
                          </Pressable>
                        </TableData>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
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

              <Button action="primary" className="rounded-xl bg-slate-950 px-6 h-11" onPress={openCreateDrawer}>
                <ButtonIcon as={Plus} size="sm" className="mr-2" />
                <ButtonText className="font-bold text-sm">Criar uma modificação</ButtonText>
              </Button>
            </HStack>

            <Box className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mt-4">
              <Table className="w-full">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="px-6 py-5">
                      <HStack space="xs" className="items-center">
                        <ChevronDown size={14} color="#0f172a" />
                        <Text className="font-bold text-slate-900 text-sm">Nome da modificação</Text>
                      </HStack>
                    </TableHead>
                    <TableHead className="px-6 py-5">
                      <Text className="font-bold text-slate-500 text-sm">Valor</Text>
                    </TableHead>
                    <TableHead className="px-6 py-5 text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableData className="px-6 py-5"><Text className="text-slate-500">Carregando...</Text></TableData>
                      <TableData /><TableData />
                    </TableRow>
                  ) : allModifiers.length === 0 ? (
                    <TableRow>
                      <TableData className="px-6 py-5"><Text className="text-slate-500">Nenhuma modificação encontrada.</Text></TableData>
                      <TableData /><TableData />
                    </TableRow>
                  ) : (
                    allModifiers.map((mod) => (
                      <TableRow key={mod.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <TableData className="px-6 py-5">
                          <Text className="text-slate-900 font-medium pl-5">{mod.name}</Text>
                        </TableData>
                        <TableData className="px-6 py-5">
                          <Text className="text-slate-600">R$ {mod.price?.toString().replace('.', ',') || '0'}</Text>
                        </TableData>
                        <TableData className="px-6 py-5 text-right">
                          <Pressable 
                            className="p-2 rounded-lg hover:bg-slate-100 self-end ml-auto"
                            onPress={() => openEditDrawer(mod)}
                          >
                            <Icon as={Pencil} size="sm" color="#94a3b8" />
                          </Pressable>
                        </TableData>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </VStack>
        )}
      </ScrollView>

      {/* Modifier Drawer (Create/Edit) */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        size="sm"
        anchor="right"
      >
        <DrawerBackdrop />
        <DrawerContent className="w-[400px] p-0 shadow-2xl">
          <DrawerHeader className="p-6 border-b border-slate-50 flex-row justify-between items-center">
            <Heading size="md" className="text-slate-900 font-bold">
              {editingModifier ? "Editar modificação" : "Criar uma modificação"}
            </Heading>
            <DrawerCloseButton>
              <Icon as={X} size="md" color="#0f172a" />
            </DrawerCloseButton>
          </DrawerHeader>
          <DrawerBody className="p-8">
            <VStack space="xl">
              <VStack space="xs">
                <Text className="text-sm text-slate-700">Nome da modificação</Text>
                <Input className="rounded-xl border-slate-200 h-12">
                  <InputField 
                    placeholder="ex.: shoyo" 
                    value={modName}
                    onChangeText={setModName}
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text className="text-sm text-slate-700">Valor</Text>
                <Input className="rounded-xl border-slate-200 h-12">
                  <InputSlot className="pl-3 pr-2">
                    <Text className="text-slate-400">R$</Text>
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

              <VStack space="md" className="mt-4">
                <Button 
                  action="primary" 
                  className="rounded-xl h-12 bg-slate-950"
                  onPress={handleSaveModifier}
                >
                  <ButtonText className="text-white font-bold">
                    Salvar
                  </ButtonText>
                </Button>

                {editingModifier && (
                  <Button 
                    variant="outline"
                    className="rounded-xl h-12 border-slate-200"
                    onPress={handleDeleteModifier}
                  >
                    <ButtonText className="text-red-500 font-bold">Excluir</ButtonText>
                  </Button>
                )}
              </VStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </VStack>
  );
}