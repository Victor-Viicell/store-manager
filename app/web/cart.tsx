import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "@/context/cart";
import { useAuth } from "@/context/auth";
import { supabase } from "@/utils/supabase";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import {
  ArrowLeft, Trash2, Plus, Minus, Package, ShoppingCart, LogIn,
  Send, MessageCircle, User, MapPin, ChevronDown, Check, PlusCircle, X,
} from "lucide-react-native";

type Address = {
  id: string; label: string; street: string; number: string | null;
  complement: string | null; neighborhood: string | null; city: string;
  state: string | null; zip: string | null; is_default: boolean;
};

const formatPrice = (p: number) => p.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatAddr = (a: Address) => {
  let s = a.street;
  if (a.number) s += `, ${a.number}`;
  if (a.complement) s += ` - ${a.complement}`;
  if (a.neighborhood) s += `, ${a.neighborhood}`;
  s += ` - ${a.city}`;
  if (a.state) s += `/${a.state}`;
  return s;
};

export default function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const { user, profile } = useAuth();

  const [customerNote, setCustomerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // New address form
  const [nLabel, setNLabel] = useState("Casa");
  const [nStreet, setNStreet] = useState("");
  const [nNumber, setNNumber] = useState("");
  const [nComplement, setNComplement] = useState("");
  const [nNeighborhood, setNNeighborhood] = useState("");
  const [nCity, setNCity] = useState("");
  const [nState, setNState] = useState("");
  const [nZip, setNZip] = useState("");
  const [fetchingCep, setFetchingCep] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoadingAddresses(true);
    const { data } = await supabase
      .from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    const list = (data || []) as Address[];
    setAddresses(list);
    if (!selectedAddressId && list.length > 0) {
      setSelectedAddressId(list.find(a => a.is_default)?.id || list[0].id);
    }
    setLoadingAddresses(false);
  }, [user]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || null;

  const handleCepBlur = async () => {
    const cleanCep = nZip.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setNStreet(data.logradouro || "");
        setNNeighborhood(data.bairro || "");
        setNCity(data.localidade || "");
        setNState(data.uf || "");
      } else {
        Alert.alert("CEP não encontrado", "Verifique o CEP digitado.");
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível buscar o CEP.");
    } finally {
      setFetchingCep(false);
    }
  };

  const handleSaveNewAddress = async () => {
    if (!nStreet.trim() || !nCity.trim()) {
      Alert.alert("Erro", "Preencha rua e cidade.");
      return;
    }
    setSavingAddr(true);
    const isFirst = addresses.length === 0;
    const { data, error } = await supabase.from("addresses").insert({
      user_id: user!.id, label: nLabel.trim() || "Casa", street: nStreet.trim(),
      number: nNumber.trim() || null, complement: nComplement.trim() || null,
      neighborhood: nNeighborhood.trim() || null, city: nCity.trim(),
      state: nState.trim() || null, zip: nZip.trim() || null, is_default: isFirst,
    }).select("id").single();
    setSavingAddr(false);
    if (error) { Alert.alert("Erro", error.message); return; }
    setShowNewAddress(false);
    setNStreet(""); setNNumber(""); setNComplement(""); setNNeighborhood("");
    setNCity(""); setNState(""); setNZip(""); setNLabel("Casa");
    await fetchAddresses();
    if (data?.id) setSelectedAddressId(data.id);
  };

  const handleSubmitOrder = async () => {
    if (!user) { router.push("/login?redirect=/web/cart"); return; }
    if (!selectedAddress) {
      Alert.alert("Endereço obrigatório", "Selecione ou adicione um endereço de entrega.");
      return;
    }
    const customerName = profile?.full_name || user.user_metadata?.full_name || user.email || "Cliente";
    setIsSubmitting(true);
    try {
      const { data: sellerItem } = await supabase.from("items").select("user_id").eq("id", cart.items[0]?.item_id).single();
      if (!sellerItem?.user_id) { Alert.alert("Erro", "Vendedor não encontrado."); setIsSubmitting(false); return; }

      const addrSnapshot = {
        label: selectedAddress.label, street: selectedAddress.street,
        number: selectedAddress.number, complement: selectedAddress.complement,
        neighborhood: selectedAddress.neighborhood, city: selectedAddress.city,
        state: selectedAddress.state, zip: selectedAddress.zip,
      };

      const { data: order, error: orderError } = await supabase.from("orders").insert({
        customer_id: user.id, seller_id: sellerItem.user_id, status: "pending",
        customer_name: customerName, customer_note: customerNote.trim() || null,
        total_price: cart.totalPrice, delivery_address: addrSnapshot,
      }).select("id").single();

      if (orderError || !order) { Alert.alert("Erro", orderError?.message || "Tente novamente."); setIsSubmitting(false); return; }

      const orderItems = cart.items.map(ci => {
        const modExtra = (ci.selectedModifiers || []).reduce((s, m) => s + (m.modifier_price || 0), 0);
        return {
          order_id: order.id, item_id: ci.item_id, item_name: ci.name, item_price: ci.price,
          quantity: ci.quantity, selected_options: ci.selectedOptions || [],
          selected_modifiers: ci.selectedModifiers || [], modifiers_extra: modExtra,
          line_total: (ci.price + modExtra) * ci.quantity,
        };
      });
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) { Alert.alert("Erro", itemsError.message); setIsSubmitting(false); return; }

      cart.clearCart();
      router.replace(`/web/order-confirmed?id=${order.id}`);
    } catch (err) { console.error(err); Alert.alert("Erro", "Ocorreu um erro inesperado."); }
    finally { setIsSubmitting(false); }
  };

  // ─── Render helpers ───
  const renderItemCard = (item: any) => {
    const modExtra = (item.selectedModifiers || []).reduce((s: number, m: any) => s + (m.modifier_price || 0), 0);
    const linePrice = (item.price + modExtra) * item.quantity;
    return (
      <Box key={item.cart_key} className="bg-white rounded-2xl border border-slate-100 p-4">
        <HStack space="md">
          <Box className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden items-center justify-center">
            {item.image_url ? <Image source={{ uri: item.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              : <Package size={24} color="#cbd5e1" />}
          </Box>
          <VStack className="flex-1 justify-between">
            <VStack>
              <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>{item.name}</Text>
              {item.selectedOptions?.length > 0 && (
                <HStack space="xs" className="mt-0.5 flex-wrap">
                  {item.selectedOptions.map((o: any) => (
                    <Box key={o.option_id} className="bg-slate-100 rounded-md px-1.5 py-0.5 mb-0.5">
                      <Text className="text-[9px] text-slate-600 font-semibold">{o.option_name}</Text>
                    </Box>
                  ))}
                </HStack>
              )}
              {item.selectedModifiers?.length > 0 && (
                <HStack space="xs" className="mt-0.5 flex-wrap">
                  {item.selectedModifiers.map((m: any) => (
                    <Box key={m.modifier_id} className="bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5 mb-0.5">
                      <Text className="text-[9px] text-amber-700 font-semibold">+ {m.modifier_name}</Text>
                    </Box>
                  ))}
                </HStack>
              )}
            </VStack>
            <HStack className="justify-between items-center mt-1.5">
              <HStack className="items-center border border-slate-200 rounded-lg overflow-hidden">
                <Pressable onPress={() => cart.updateQuantity(item.cart_key, item.quantity - 1)} className="w-8 h-8 items-center justify-center active:bg-slate-50">
                  <Minus size={12} color="#0f172a" />
                </Pressable>
                <Box className="w-8 h-8 items-center justify-center border-l border-r border-slate-200">
                  <Text className="text-xs font-bold text-slate-900">{item.quantity}</Text>
                </Box>
                <Pressable onPress={() => cart.updateQuantity(item.cart_key, item.quantity + 1)} className="w-8 h-8 items-center justify-center active:bg-slate-50">
                  <Plus size={12} color="#0f172a" />
                </Pressable>
              </HStack>
              <Text className="text-slate-900 font-bold text-sm">{formatPrice(linePrice)}</Text>
            </HStack>
          </VStack>
        </HStack>
      </Box>
    );
  };

  return (
    <Box className="flex-1 bg-slate-50">
      {/* Header */}
      <HStack className="justify-between items-center px-4 py-3 bg-white border-b border-slate-100">
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/web/store")} className="p-2 rounded-full active:bg-slate-50">
          <ArrowLeft size={22} color="#0f172a" />
        </Pressable>
        <Heading size="md" className="text-slate-900">Meu Pedido</Heading>
        {cart.items.length > 0 ? (
          <Pressable onPress={cart.clearCart} className="p-2 rounded-full active:bg-red-50"><Trash2 size={20} color="#ef4444" /></Pressable>
        ) : <Box style={{ width: 40 }} />}
      </HStack>

      {cart.items.length === 0 ? (
        <Box className="flex-1 items-center justify-center px-8">
          <ShoppingCart size={64} color="#cbd5e1" strokeWidth={1} />
          <Heading size="md" className="text-slate-800 mt-6">Nenhum item no pedido</Heading>
          <Text className="text-slate-400 text-center mt-2 text-sm">Adicione produtos da loja para montar seu pedido.</Text>
          <Button onPress={() => router.push("/web/store")} className="rounded-xl bg-[#111827] h-12 px-10 mt-8">
            <ButtonText className="font-bold text-base">Ver produtos</ButtonText>
          </Button>
        </Box>
      ) : (
        <>
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
            <VStack space="md">
              {/* Items */}
              <VStack space="sm">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Itens do pedido</Text>
                {cart.items.map(renderItemCard)}
              </VStack>

              {/* User + Address + Note */}
              {user && (
                <VStack space="sm" className="mt-2">
                  {/* User Info */}
                  <Box className="bg-white rounded-2xl border border-slate-100 p-4">
                    <HStack className="items-center" space="sm">
                      <Box className="w-9 h-9 rounded-full bg-primary-50 items-center justify-center">
                        <User size={18} color="#0891b2" />
                      </Box>
                      <VStack>
                        <Text className="text-sm font-bold text-slate-900">
                          {profile?.full_name || user.user_metadata?.full_name || user.email}
                        </Text>
                        {profile?.phone && <Text className="text-xs text-slate-400">{profile.phone}</Text>}
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Address Selection */}
                  <Box className="bg-white rounded-2xl border border-slate-100 p-4">
                    <VStack space="sm">
                      <HStack className="items-center" space="xs">
                        <MapPin size={14} color="#0f172a" />
                        <Text className="text-xs font-bold text-slate-900 uppercase tracking-wider">Endereço de entrega</Text>
                      </HStack>

                      {loadingAddresses ? (
                        <ActivityIndicator size="small" color="#64748b" />
                      ) : selectedAddress ? (
                        <Pressable onPress={() => setShowAddressPicker(!showAddressPicker)}
                          className="flex-row items-center p-3 bg-green-50 rounded-xl border border-green-200 active:bg-green-100">
                          <Box className="w-8 h-8 rounded-lg bg-green-600 items-center justify-center mr-3">
                            <Check size={16} color="white" />
                          </Box>
                          <VStack className="flex-1">
                            <Text className="text-xs font-bold text-green-800">{selectedAddress.label}</Text>
                            <Text className="text-xs text-green-700" numberOfLines={2}>{formatAddr(selectedAddress)}</Text>
                          </VStack>
                          <ChevronDown size={16} color="#15803d" />
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => addresses.length > 0 ? setShowAddressPicker(true) : setShowNewAddress(true)}
                          className="flex-row items-center p-3 bg-red-50 rounded-xl border border-dashed border-red-200 active:bg-red-100">
                          <MapPin size={18} color="#dc2626" className="mr-3" />
                          <Text className="text-xs font-bold text-red-600 flex-1">Selecione um endereço</Text>
                        </Pressable>
                      )}

                      {/* Address Picker Dropdown */}
                      {showAddressPicker && (
                        <VStack space="xs" className="mt-1">
                          {addresses.map(a => (
                            <Pressable key={a.id} onPress={() => { setSelectedAddressId(a.id); setShowAddressPicker(false); }}
                              className={`flex-row items-center p-3 rounded-xl border ${a.id === selectedAddressId ? "bg-slate-100 border-slate-300" : "bg-white border-slate-100"} active:bg-slate-50`}>
                              <Box className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${a.id === selectedAddressId ? "border-green-600 bg-green-600" : "border-slate-300"}`}>
                                {a.id === selectedAddressId && <Check size={12} color="white" />}
                              </Box>
                              <VStack className="flex-1">
                                <Text className="text-xs font-bold text-slate-800">{a.label}</Text>
                                <Text className="text-[11px] text-slate-500" numberOfLines={1}>{formatAddr(a)}</Text>
                              </VStack>
                            </Pressable>
                          ))}
                          <Pressable onPress={() => { setShowAddressPicker(false); setShowNewAddress(true); }}
                            className="flex-row items-center p-3 rounded-xl border border-dashed border-slate-200 active:bg-slate-50">
                            <PlusCircle size={16} color="#64748b" className="mr-2" />
                            <Text className="text-xs font-bold text-slate-500">Adicionar novo endereço</Text>
                          </Pressable>
                        </VStack>
                      )}

                      {/* Inline New Address Form */}
                      {showNewAddress && (
                        <Box className="bg-slate-50 rounded-xl p-4 mt-1 border border-slate-200">
                          <HStack className="justify-between items-center mb-3">
                            <Text className="text-xs font-bold text-slate-700">Novo endereço</Text>
                            <Pressable onPress={() => setShowNewAddress(false)}><X size={16} color="#94a3b8" /></Pressable>
                          </HStack>
                          <VStack space="sm">
                            <HStack space="xs">
                              {["Casa", "Trabalho", "Outro"].map(l => (
                                <Pressable key={l} onPress={() => setNLabel(l)}
                                  className={`flex-1 h-8 rounded-lg items-center justify-center border ${nLabel === l ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200"}`}>
                                  <Text className={`text-xs font-bold ${nLabel === l ? "text-white" : "text-slate-500"}`}>{l}</Text>
                                </Pressable>
                              ))}
                            </HStack>
                            <Input className="rounded-xl border-slate-200 h-10 bg-white">
                              <InputField placeholder="CEP" value={nZip} onChangeText={setNZip} onBlur={handleCepBlur} className="text-sm" keyboardType="numeric" maxLength={9} />
                              {fetchingCep && <ActivityIndicator size="small" color="#64748b" />}
                            </Input>
                            <Input className="rounded-xl border-slate-200 h-10 bg-white"><InputField placeholder="Rua *" value={nStreet} onChangeText={setNStreet} className="text-sm" /></Input>
                            <HStack space="xs">
                              <Input className="rounded-xl border-slate-200 h-10 bg-white flex-1"><InputField placeholder="Nº" value={nNumber} onChangeText={setNNumber} className="text-sm" keyboardType="numeric" /></Input>
                              <Input className="rounded-xl border-slate-200 h-10 bg-white flex-[2]"><InputField placeholder="Complemento" value={nComplement} onChangeText={setNComplement} className="text-sm" /></Input>
                            </HStack>
                            <Input className="rounded-xl border-slate-200 h-10 bg-white"><InputField placeholder="Bairro" value={nNeighborhood} onChangeText={setNNeighborhood} className="text-sm" /></Input>
                            <HStack space="xs">
                              <Input className="rounded-xl border-slate-200 h-10 bg-white flex-[2]"><InputField placeholder="Cidade *" value={nCity} onChangeText={setNCity} className="text-sm" /></Input>
                              <Input className="rounded-xl border-slate-200 h-10 bg-white flex-1"><InputField placeholder="UF" value={nState} onChangeText={setNState} className="text-sm" maxLength={2} autoCapitalize="characters" /></Input>
                            </HStack>
                            <Button onPress={handleSaveNewAddress} disabled={savingAddr} className="rounded-xl bg-green-600 h-10 mt-1">
                              <ButtonText className="font-bold text-sm">{savingAddr ? "Salvando..." : "Salvar endereço"}</ButtonText>
                            </Button>
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  </Box>

                  {/* Observations */}
                  <Box className="bg-white rounded-2xl border border-slate-100 p-4">
                    <VStack space="xs">
                      <HStack className="items-center" space="xs">
                        <MessageCircle size={14} color="#64748b" />
                        <Text className="text-xs font-bold text-slate-500">Observações (opcional)</Text>
                      </HStack>
                      <Textarea className="rounded-xl border-slate-200 h-20 bg-white">
                        <TextareaInput placeholder="Ex: entregar após 15h, sem cebola..." value={customerNote} onChangeText={setCustomerNote} className="text-sm" />
                      </Textarea>
                    </VStack>
                  </Box>
                </VStack>
              )}

              {/* Not logged in */}
              {!user && (
                <Box className="bg-white rounded-2xl border border-dashed border-slate-200 p-5 mt-2 items-center">
                  <Box className="w-12 h-12 rounded-full bg-slate-50 items-center justify-center mb-3"><LogIn size={22} color="#94a3b8" /></Box>
                  <Text className="text-sm font-bold text-slate-800 text-center">Faça login para enviar seu pedido</Text>
                  <Text className="text-xs text-slate-400 text-center mt-1 leading-relaxed max-w-[260px]">
                    Suas informações e endereços serão usados automaticamente.
                  </Text>
                  <Button onPress={() => router.push("/login?redirect=/web/cart")} className="rounded-xl bg-primary-600 h-11 px-8 mt-4">
                    <Icon as={LogIn} size="sm" className="mr-2 text-white" />
                    <ButtonText className="font-bold text-sm">Entrar ou criar conta</ButtonText>
                  </Button>
                </Box>
              )}

              {/* How it works */}
              <Box className="bg-slate-100/60 rounded-2xl p-5 mt-1">
                <VStack space="md">
                  <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">Como funciona</Text>
                  <VStack space="sm">
                    {[
                      { n: "1", t: "Envie seu pedido", d: "Seu pedido será registrado e enviado ao vendedor." },
                      { n: "2", t: "Aguarde o contato", d: "O vendedor entrará em contato para confirmar e combinar o pagamento." },
                      { n: "3", t: "Finalize com o vendedor", d: "Pagamento e entrega são combinados diretamente." },
                    ].map(s => (
                      <HStack key={s.n} space="sm" className="items-start">
                        <Box className="w-6 h-6 rounded-full bg-slate-900 items-center justify-center mt-0.5">
                          <Text className="text-white text-[10px] font-bold">{s.n}</Text>
                        </Box>
                        <VStack className="flex-1">
                          <Text className="text-sm font-bold text-slate-800">{s.t}</Text>
                          <Text className="text-xs text-slate-500 leading-relaxed">{s.d}</Text>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            </VStack>
          </ScrollView>

          {/* Bottom */}
          <Box className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 py-4 pb-8">
            <VStack space="sm">
              <HStack className="justify-between">
                <Text className="text-slate-500 text-sm">{cart.totalItems} {cart.totalItems === 1 ? "item" : "itens"}</Text>
                <Text className="text-slate-900 font-bold text-lg">{formatPrice(cart.totalPrice)}</Text>
              </HStack>
              <Button onPress={handleSubmitOrder} isDisabled={isSubmitting} className="rounded-xl bg-[#111827] h-14 w-full">
                {isSubmitting ? <ActivityIndicator color="white" size="small" /> : !user ? (
                  <><Icon as={LogIn} size="sm" className="mr-2 text-white" /><ButtonText className="font-bold text-base">Entrar para enviar pedido</ButtonText></>
                ) : (
                  <><Icon as={Send} size="sm" className="mr-2 text-white" /><ButtonText className="font-bold text-base">Enviar pedido</ButtonText></>
                )}
              </Button>
              {!user && <Text className="text-slate-400 text-xs text-center">Seu pedido será salvo automaticamente após o login.</Text>}
            </VStack>
          </Box>
        </>
      )}
    </Box>
  );
}