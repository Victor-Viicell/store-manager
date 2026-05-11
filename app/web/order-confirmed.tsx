import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/utils/supabase";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  Clock,
  MessageCircle,
  Instagram,
  Phone,
  ExternalLink,
  MapPin,
} from "lucide-react-native";

const formatPrice = (price: number) =>
  price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type OrderData = {
  id: string;
  status: string;
  customer_name: string;
  customer_note: string | null;
  total_price: number;
  created_at: string;
  seller_id: string;
  delivery_address: {
    label: string; street: string; number?: string; complement?: string;
    neighborhood?: string; city: string; state?: string; zip?: string;
  } | null;
};

type OrderItemData = {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  selected_options: any[];
  selected_modifiers: any[];
  modifiers_extra: number;
  line_total: number;
};

type SellerProfile = {
  full_name: string | null;
  store_name: string | null;
  whatsapp: string | null;
  instagram: string | null;
};

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Aguardando contato", color: "text-amber-700", bg: "bg-amber-50" },
  confirmed: { label: "Confirmado", color: "text-blue-700", bg: "bg-blue-50" },
  completed: { label: "Finalizado", color: "text-green-700", bg: "bg-green-50" },
  cancelled: { label: "Cancelado", color: "text-red-700", bg: "bg-red-50" },
};

export default function OrderConfirmedPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrder(id);
  }, [id]);

  const fetchOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderErr) throw orderErr;
      setOrder(orderData as OrderData);

      // Fetch order items
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at");

      setOrderItems((items as OrderItemData[]) || []);

      // Fetch seller profile
      if (orderData?.seller_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, store_name, whatsapp, instagram")
          .eq("id", orderData.seller_id)
          .single();

        setSellerProfile(profile as SellerProfile);
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (!sellerProfile?.whatsapp) return;
    const phone = sellerProfile.whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá! Fiz o pedido #${order?.id?.slice(0, 8).toUpperCase()} na loja online. Gostaria de combinar o pagamento e entrega.`
    );
    Linking.openURL(`https://wa.me/${phone}?text=${message}`);
  };

  const openInstagram = () => {
    if (!sellerProfile?.instagram) return;
    const handle = sellerProfile.instagram.replace("@", "");
    Linking.openURL(`https://instagram.com/${handle}`);
  };

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box className="flex-1 items-center justify-center bg-white px-8">
        <Package size={48} color="#cbd5e1" />
        <Text className="text-slate-400 mt-4">Pedido não encontrado.</Text>
        <Pressable
          onPress={() => router.replace("/web/store")}
          className="mt-4"
        >
          <Text className="text-primary-600 font-semibold">Voltar à loja</Text>
        </Pressable>
      </Box>
    );
  }

  const status = statusLabels[order.status] || statusLabels.pending;
  const orderCode = `#${order.id.slice(0, 8).toUpperCase()}`;
  const storeName = sellerProfile?.store_name || sellerProfile?.full_name || "Vendedor";
  const hasContacts = sellerProfile?.whatsapp || sellerProfile?.instagram;

  return (
    <Box className="flex-1 bg-slate-50">
      {/* Header */}
      <HStack className="justify-between items-center px-4 py-3 bg-white border-b border-slate-100">
        <Box style={{ width: 40 }} />
        <Heading size="md" className="text-slate-900">
          Pedido Enviado
        </Heading>
        <Pressable
          onPress={() => router.replace("/web/store")}
          className="p-2 rounded-full active:bg-slate-50"
        >
          <ShoppingBag size={22} color="#0f172a" />
        </Pressable>
      </HStack>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md">
          {/* Success Header */}
          <Box className="bg-white rounded-3xl border border-slate-100 p-6 items-center">
            <Box className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4">
              <CheckCircle2 size={44} color="#16a34a" strokeWidth={1.5} />
            </Box>
            <Heading
              size="lg"
              className="text-slate-900 text-center font-bold"
            >
              Pedido enviado!
            </Heading>
            <Text className="text-slate-500 text-center text-sm mt-2 leading-relaxed max-w-[280px]">
              Seu pedido foi registrado com sucesso. O vendedor entrará em contato para finalizar.
            </Text>

            <HStack space="sm" className="mt-4 items-center">
              <Text className="text-xs text-slate-400 font-bold">
                Pedido
              </Text>
              <Badge className="bg-slate-100 rounded-lg px-3 py-1">
                <BadgeText className="text-slate-700 text-xs font-bold tracking-wider">
                  {orderCode}
                </BadgeText>
              </Badge>
            </HStack>

            <Badge className={`${status.bg} rounded-lg px-3 py-1.5 mt-3`}>
              <HStack space="xs" className="items-center">
                <Clock size={12} color="#92400e" />
                <BadgeText className={`${status.color} text-xs font-bold`}>
                  {status.label}
                </BadgeText>
              </HStack>
            </Badge>
          </Box>

          {/* Contact Seller Section */}
          <Box className="bg-white rounded-3xl border border-slate-100 p-5">
            <VStack space="md">
              <VStack space="xs">
                <Text className="text-sm font-bold text-slate-900">
                  Fale com {storeName}
                </Text>
                <Text className="text-xs text-slate-500 leading-relaxed">
                  Entre em contato para combinar pagamento e entrega do seu pedido.
                </Text>
              </VStack>

              {hasContacts ? (
                <VStack space="sm">
                  {sellerProfile?.whatsapp && (
                    <Pressable
                      onPress={openWhatsApp}
                      className="flex-row items-center p-4 bg-green-50 rounded-2xl border border-green-100 active:bg-green-100"
                    >
                      <Box className="w-11 h-11 rounded-xl bg-green-600 items-center justify-center mr-4">
                        <MessageCircle
                          size={22}
                          color="white"
                          strokeWidth={2}
                        />
                      </Box>
                      <VStack className="flex-1">
                        <Text className="text-green-900 font-bold text-sm">
                          WhatsApp
                        </Text>
                        <Text className="text-green-700 text-xs">
                          {sellerProfile.whatsapp}
                        </Text>
                      </VStack>
                      <ExternalLink size={16} color="#15803d" />
                    </Pressable>
                  )}

                  {sellerProfile?.instagram && (
                    <Pressable
                      onPress={openInstagram}
                      className="flex-row items-center p-4 bg-purple-50 rounded-2xl border border-purple-100 active:bg-purple-100"
                    >
                      <Box className="w-11 h-11 rounded-xl bg-purple-600 items-center justify-center mr-4">
                        <Instagram size={22} color="white" strokeWidth={2} />
                      </Box>
                      <VStack className="flex-1">
                        <Text className="text-purple-900 font-bold text-sm">
                          Instagram
                        </Text>
                        <Text className="text-purple-700 text-xs">
                          @{sellerProfile.instagram.replace("@", "")}
                        </Text>
                      </VStack>
                      <ExternalLink size={16} color="#7e22ce" />
                    </Pressable>
                  )}
                </VStack>
              ) : (
                <Box className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 items-center">
                  <Text className="text-slate-400 text-sm text-center">
                    O vendedor ainda não cadastrou contatos. Aguarde o contato dele.
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>

          {/* Delivery Address */}
          {order.delivery_address && (
            <Box className="bg-white rounded-3xl border border-slate-100 p-5">
              <VStack space="sm">
                <HStack className="items-center" space="xs">
                  <MapPin size={14} color="#0f172a" />
                  <Text className="text-sm font-bold text-slate-900">Endereço de entrega</Text>
                </HStack>
                <Box className="bg-slate-50 rounded-xl p-3">
                  <Text className="text-xs font-bold text-slate-700">{order.delivery_address.label}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {order.delivery_address.street}{order.delivery_address.number ? `, ${order.delivery_address.number}` : ""}
                    {order.delivery_address.complement ? ` - ${order.delivery_address.complement}` : ""}
                    {order.delivery_address.neighborhood ? `, ${order.delivery_address.neighborhood}` : ""}
                    {" "}- {order.delivery_address.city}{order.delivery_address.state ? `/${order.delivery_address.state}` : ""}
                    {order.delivery_address.zip ? ` - ${order.delivery_address.zip}` : ""}
                  </Text>
                </Box>
              </VStack>
            </Box>
          )}

          {/* Order Summary */}
          <Box className="bg-white rounded-3xl border border-slate-100 p-5">
            <VStack space="md">
              <Text className="text-sm font-bold text-slate-900">
                Resumo do pedido
              </Text>

              {order.customer_note && (
                <Box className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <Text className="text-xs text-amber-700 font-semibold">
                    📝 {order.customer_note}
                  </Text>
                </Box>
              )}

              <VStack space="xs">
                {orderItems.map((oi) => (
                  <HStack
                    key={oi.id}
                    className="justify-between items-start py-2"
                  >
                    <HStack space="sm" className="flex-1 items-start">
                      <Text className="text-xs text-slate-400 font-bold w-6">
                        {oi.quantity}x
                      </Text>
                      <VStack className="flex-1">
                        <Text
                          className="text-sm text-slate-800 font-semibold"
                          numberOfLines={1}
                        >
                          {oi.item_name}
                        </Text>
                        {oi.selected_options?.length > 0 && (
                          <Text className="text-[10px] text-slate-400">
                            {oi.selected_options
                              .map((o: any) => o.option_name)
                              .join(", ")}
                          </Text>
                        )}
                        {oi.selected_modifiers?.length > 0 && (
                          <Text className="text-[10px] text-amber-600">
                            +{" "}
                            {oi.selected_modifiers
                              .map((m: any) => m.modifier_name)
                              .join(", ")}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <Text className="text-sm text-slate-800 font-bold ml-2">
                      {formatPrice(oi.line_total)}
                    </Text>
                  </HStack>
                ))}
              </VStack>

              <Divider className="bg-slate-100" />

              <HStack className="justify-between items-center">
                <Text className="text-base font-bold text-slate-900">
                  Total
                </Text>
                <Text className="text-lg font-bold text-slate-900">
                  {formatPrice(order.total_price)}
                </Text>
              </HStack>
            </VStack>
          </Box>

          {/* Back to store */}
          <Button
            onPress={() => router.replace("/web/store")}
            variant="outline"
            className="rounded-xl border-slate-200 h-12 mt-2"
          >
            <ButtonText className="text-slate-700 font-bold text-sm">
              Continuar comprando
            </ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
}
