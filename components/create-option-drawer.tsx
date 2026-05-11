import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { supabase } from "@/utils/supabase";
import {
  ChevronDown,
  GripVertical,
  Trash2,
  X
} from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView } from "react-native";

interface CreateOptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSetId: string) => void;
}

export function CreateOptionDrawer({ isOpen, onClose, onSuccess }: CreateOptionDrawerProps) {
  const [name, setName] = useState("");
  const [optionsList, setOptionsList] = useState<{ id?: string, name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setOptionsList([{ id: 'init-' + Date.now(), name: "" }]);
    }
  }, [isOpen]);

  const handleUpdateOption = (index: number, val: string) => {
    const newList = [...optionsList];
    newList[index].name = val;
    if (index === newList.length - 1 && val.trim() !== "") {
      newList.push({ name: "" });
    }
    setOptionsList(newList);
  };

  const handleDeleteOptionInput = (index: number) => {
    if (optionsList.length === 1) {
      setOptionsList([{ name: "" }]);
      return;
    }
    const newList = [...optionsList];
    newList.splice(index, 1);
    setOptionsList(newList);
  };

  const handleMoveOption = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0) return;
    const lastFilled = optionsList.findIndex(o => o.name.trim() === "");
    const maxTarget = lastFilled >= 0 ? lastFilled - 1 : optionsList.length - 1;
    if (toIndex > maxTarget) return;
    const newList = [...optionsList];
    [newList[fromIndex], newList[toIndex]] = [newList[toIndex], newList[fromIndex]];
    setOptionsList(newList);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const validOptions = optionsList.filter(o => o.name.trim() !== "");
    setIsSaving(true);

    try {
      const { data, error: setError } = await supabase
        .from('option_sets')
        .insert([{ name: name.trim() }])
        .select();

      if (setError || !data) throw setError;
      const setId = data[0].id;

      if (validOptions.length > 0) {
        const optionsToInsert = validOptions.map(o => ({
          option_set_id: setId,
          name: o.name.trim()
        }));
        await supabase.from('options').insert(optionsToInsert);
      }

      onSuccess(setId);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="lg" anchor="right">
      <DrawerBackdrop />
      <DrawerContent className="w-full md:w-[450px] p-0 shadow-2xl">
        <DrawerHeader className="p-6 border-b-0 flex-row justify-between items-center">
          <Heading size="lg" className="text-slate-900 font-bold flex-1 text-center ml-8">
            Adicionar conjunto de opções
          </Heading>
          <Pressable onPress={onClose} className="p-2">
            <Icon as={X} size="lg" color="#0f172a" />
          </Pressable>
        </DrawerHeader>

        <DrawerBody className="p-0">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            <VStack space="2xl" className="p-6">
              <VStack space="sm">
                <Text className="text-base text-slate-800">Nome do conjunto de opções</Text>
                <Input className="rounded-xl border-slate-200 h-14 bg-white">
                  <InputField
                    placeholder="Nome do conjunto"
                    value={name}
                    onChangeText={setName}
                  />
                </Input>
              </VStack>

              <VStack space="lg">
                <Heading size="sm" className="text-slate-900 font-bold text-xl">
                  Opções {name ? `de ${name}` : "de"}
                </Heading>
                <VStack space="sm">
                  {optionsList.map((opt, index) => {
                    const isLast = index === optionsList.length - 1;
                    const isEmpty = opt.name.trim() === "";
                    const filledCount = optionsList.filter(o => o.name.trim() !== "").length;
                    const isFilledItem = !isLast || !isEmpty;

                    return (
                      <HStack key={index} space="sm" className="items-center">
                        {isFilledItem ? (
                          <VStack className="items-center">
                            <Pressable
                              onPress={() => handleMoveOption(index, index - 1)}
                              className={`p-0.5 ${index === 0 ? 'opacity-15' : 'opacity-50'}`}
                              disabled={index === 0}
                            >
                              <Icon as={ChevronDown} size="xs" color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
                            </Pressable>
                            <Icon as={GripVertical} size="sm" color="#cbd5e1" />
                            <Pressable
                              onPress={() => handleMoveOption(index, index + 1)}
                              className={`p-0.5 ${index >= filledCount - 1 ? 'opacity-15' : 'opacity-50'}`}
                              disabled={index >= filledCount - 1}
                            >
                              <Icon as={ChevronDown} size="xs" color="#64748b" />
                            </Pressable>
                          </VStack>
                        ) : (
                          <Box className="w-5" />
                        )}

                        <Input className={`flex-1 rounded-xl border-slate-200 h-14 bg-white ${isLast && isEmpty ? 'border-dashed opacity-60' : ''}`}>
                          <InputField
                            placeholder={index === 0 ? "ex.: pequeno" : "Adicionar outra opção"}
                            value={opt.name}
                            onChangeText={(val) => handleUpdateOption(index, val)}
                          />
                        </Input>

                        {isFilledItem ? (
                          <Pressable className="p-2" onPress={() => handleDeleteOptionInput(index)}>
                            <Icon as={Trash2} size="md" color="#0f172a" />
                          </Pressable>
                        ) : (
                          <Box className="w-9" />
                        )}
                      </HStack>
                    );
                  })}
                </VStack>
              </VStack>

              <Button action="primary" className="rounded-xl bg-slate-950 h-14 w-full mt-4" onPress={handleSave} disabled={isSaving}>
                <ButtonText className="font-bold text-white text-lg">{isSaving ? "Salvando..." : "Salvar"}</ButtonText>
              </Button>
            </VStack>
          </ScrollView>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
