import React, { useState, useEffect } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
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
  Menu,
  MenuItem,
  MenuItemLabel,
} from "@/components/ui/menu";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  X,
  Upload,
  Download,
  ChevronDown,
} from "lucide-react-native";
import { Pressable, ScrollView } from "react-native";
import { supabase } from "@/utils/supabase";

export default function Customers() {
  const [viewMode, setViewMode] = useState<"list" | "add">("list");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [complement, setComplement] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [taxId, setTaxId] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setCustomers(data);
    else if (error) console.error(error);
    setIsLoading(false);
  };

  const openAddView = () => {
    setName(""); setEmail(""); setPhone(""); setStreet("");
    setComplement(""); setCity(""); setZip(""); setCountry("Brasil"); setTaxId("");
    setViewMode("add");
  };
  
  const closeAddView = () => setViewMode("list");

  const handleSave = async (addAnother = false) => {
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address_street: street.trim() || null,
      address_complement: complement.trim() || null,
      address_city: city.trim() || null,
      address_zip: zip.trim() || null,
      address_country: country,
      tax_id: taxId.trim() || null
    };

    const { data, error } = await supabase
      .from('customers')
      .insert([payload])
      .select();
      
    if (data) {
      setCustomers([data[0], ...customers]);
      if (addAnother) {
        setName(""); setEmail(""); setPhone(""); setStreet("");
        setComplement(""); setCity(""); setZip(""); setCountry("Brasil"); setTaxId("");
      } else {
        closeAddView();
      }
    } else if (error) {
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (viewMode === "add") {
    return (
      <VStack className="flex-1 w-full bg-slate-50/50 -m-4 md:-m-8 p-4 md:p-8">
        <ScrollView className="flex-1">
          <VStack space="xl" className="max-w-[1100px] w-full mx-auto pb-12">
            
            {/* Header */}
            <HStack className="items-center justify-between mb-8">
              <HStack space="md" className="items-center">
                <Pressable onPress={closeAddView} className="p-2 rounded-full hover:bg-slate-200">
                  <Icon as={X} size="xl" color="#0f172a" />
                </Pressable>
                <Heading size="xl" className="text-slate-900 font-bold ml-2">Adicionar cliente</Heading>
              </HStack>
              
              <Menu
                offset={5}
                placement="bottom right"
                trigger={({ ...triggerProps }) => (
                  <Button {...triggerProps} action="primary" className="rounded-xl px-6 bg-slate-950 h-11">
                    <ButtonText className="font-bold mr-2">Salvar</ButtonText>
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

            {/* Form Content */}
            <VStack space="2xl">
              
              {/* Visão Geral */}
              <VStack space="lg">
                <Heading size="md" className="text-slate-900 font-bold">Visão geral</Heading>
                <VStack space="md">
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-slate-500">Nome</Text>
                    <Input className="rounded-xl border-slate-200 bg-white h-12 max-w-[500px]">
                      <InputField placeholder="Nome" value={name} onChangeText={setName} />
                    </Input>
                  </VStack>
                  <HStack space="md">
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm font-semibold text-slate-500">E-mail</Text>
                      <Input className="rounded-xl border-slate-200 bg-white h-12">
                        <InputField placeholder="you@example.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
                      </Input>
                    </VStack>
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm font-semibold text-slate-500">Número do celular</Text>
                      <Input className="rounded-xl border-slate-200 bg-white h-12">
                        <InputField placeholder="+44 12 34 56 789" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                      </Input>
                    </VStack>
                  </HStack>
                </VStack>
              </VStack>

              {/* Endereço */}
              <VStack space="lg">
                <Heading size="md" className="text-slate-900 font-bold">Endereço</Heading>
                <VStack space="md">
                  <HStack space="md">
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm font-semibold text-slate-500">Endereço</Text>
                      <Input className="rounded-xl border-slate-200 bg-white h-12">
                        <InputField placeholder="Rua, avenida, alameda" value={street} onChangeText={setStreet} />
                      </Input>
                    </VStack>
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm font-semibold text-slate-500">Apartment, suite, etc.</Text>
                      <Input className="rounded-xl border-slate-200 bg-white h-12">
                        <InputField placeholder="Floor 1" value={complement} onChangeText={setComplement} />
                      </Input>
                    </VStack>
                  </HStack>
                  <HStack space="md">
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm font-semibold text-slate-500">Cidade</Text>
                      <Input className="rounded-xl border-slate-200 bg-white h-12">
                        <InputField placeholder="Cidade" value={city} onChangeText={setCity} />
                      </Input>
                    </VStack>
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm font-semibold text-slate-500">Código postal</Text>
                      <Input className="rounded-xl border-slate-200 bg-white h-12">
                        <InputField placeholder="00000-000" value={zip} onChangeText={setZip} />
                      </Input>
                    </VStack>
                  </HStack>
                  <VStack space="xs" className="max-w-[500px]">
                    <Text className="text-sm font-semibold text-slate-500">País</Text>
                    <Select selectedValue={country} onValueChange={setCountry}>
                      <SelectTrigger className="rounded-xl border-slate-200 bg-white h-12 px-4 flex-row justify-between items-center">
                        <SelectInput placeholder="Selecione o país" />
                        <SelectIcon as={ChevronDown} size="sm" color="#64748b" />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectBackdrop />
                        <SelectContent>
                          <SelectDragIndicatorWrapper>
                            <SelectDragIndicator />
                          </SelectDragIndicatorWrapper>
                          <SelectItem label="Brasil" value="Brasil" />
                          <SelectItem label="Portugal" value="Portugal" />
                          <SelectItem label="EUA" value="EUA" />
                        </SelectContent>
                      </SelectPortal>
                    </Select>
                  </VStack>
                </VStack>
              </VStack>

              {/* Número Fiscal */}
              <VStack space="lg">
                <Heading size="md" className="text-slate-900 font-bold">Número fiscal</Heading>
                <VStack space="xs" className="max-w-[500px]">
                  <Input className="rounded-xl border-slate-200 bg-white h-12">
                    <InputField placeholder="CPF ou CNPJ" value={taxId} onChangeText={setTaxId} />
                  </Input>
                </VStack>
              </VStack>

            </VStack>
          </VStack>
        </ScrollView>
      </VStack>
    );
  }

  return (
    <VStack space="xl" className="flex-1 max-w-[1200px] w-full mx-auto">
      {/* Header */}
      <HStack className="justify-between items-center mb-2">
        <Heading size="xl" className="text-slate-900 font-bold">Clientes</Heading>
        <HStack space="md">
          <Button variant="outline" action="secondary" className="rounded-xl border-slate-200 px-4 h-11">
            <ButtonIcon as={Upload} size="xs" className="mr-2" />
            <ButtonText className="font-bold text-sm">Importar</ButtonText>
          </Button>
          <Button variant="outline" action="secondary" className="rounded-xl border-slate-200 px-4 h-11">
            <ButtonIcon as={Download} size="xs" className="mr-2" />
            <ButtonText className="font-bold text-sm">Exportar</ButtonText>
          </Button>
          <Button action="primary" className="rounded-xl bg-slate-950 px-6 h-11" onPress={openAddView}>
            <ButtonText className="font-bold text-sm">Adicionar cliente</ButtonText>
          </Button>
        </HStack>
      </HStack>

      {/* Search Bar */}
      <HStack className="justify-end items-center mt-2">
        <Input className="w-80 rounded-xl border-slate-200 bg-white h-11">
          <InputSlot className="pl-3">
            <InputIcon as={Search} size="sm" color="#94a3b8" />
          </InputSlot>
          <InputField 
            placeholder="Pesquisar por nome, e-m..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="text-sm" 
          />
        </Input>
      </HStack>

      {/* Table */}
      <Box className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mt-4">
        <Table className="w-full">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-slate-100">
              <TableHead className="px-6 py-5">
                <Text className="font-bold text-slate-500 text-sm">Nome</Text>
              </TableHead>
              <TableHead className="px-6 py-5">
                <Text className="font-bold text-slate-500 text-sm">E-mail</Text>
              </TableHead>
              <TableHead className="px-6 py-5">
                <Text className="font-bold text-slate-500 text-sm">Número do celular</Text>
              </TableHead>
              <TableHead className="px-6 py-5 text-right">
                <Text className="font-bold text-slate-500 text-sm">Data do registro</Text>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableData className="px-6 py-8 text-center">
                  <Text className="text-slate-500">Carregando...</Text>
                </TableData>
                <TableData /><TableData /><TableData />
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableData className="px-6 py-8 text-center">
                  <Text className="text-slate-500">Nenhum cliente encontrado.</Text>
                </TableData>
                <TableData /><TableData /><TableData />
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <TableData className="px-6 py-8">
                    <Text className="text-slate-900 font-medium">{customer.name}</Text>
                  </TableData>
                  <TableData className="px-6 py-8">
                    <Text className="text-slate-600">{customer.email || "-"}</Text>
                  </TableData>
                  <TableData className="px-6 py-8">
                    <Text className="text-slate-600">{customer.phone || "-"}</Text>
                  </TableData>
                  <TableData className="px-6 py-8 text-right">
                    <Text className="text-slate-600">{formatDate(customer.created_at)}</Text>
                  </TableData>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </VStack>
  );
}