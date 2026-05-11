import React, { useState, useEffect } from "react";
import { Pressable, ScrollView, ActivityIndicator, Alert, Linking, View } from "react-native";
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
import { SkeletonText } from "@/components/ui/skeleton";
import {
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Clock,
  Check,
  XCircle,
  User,
  FileText,
  Package,
  MapPin,
} from "lucide-react-native";

const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return "R$ 0,00";
  try {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch (e) {
    // Fallback for environments without full Intl support
    return `R$ ${price.toFixed(2).replace(".", ",")}`;
  }
};

const formatDate = (date: string | null | undefined) => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return new Date(date).toDateString();
  }
};

type OrderRow = {
  id: string;
  customer_id: string;
  status: string;
  customer_name: string;
  customer_note: string | null;
  total_price: number;
  created_at: string;
  delivery_address: {
    label: string; street: string; number?: string; complement?: string;
    neighborhood?: string; city: string; state?: string; zip?: string;
  } | null;
};

type OrderItemRow = {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  selected_options: any[];
  selected_modifiers: any[];
  modifiers_extra: number;
  line_total: number;
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  pending: {
    label: "Pendente",
    color: "text-amber-700",
    bg: "bg-amber-50",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmado",
    color: "text-blue-700",
    bg: "bg-blue-50",
    icon: Check,
  },
  completed: {
    label: "Finalizado",
    color: "text-green-700",
    bg: "bg-green-50",
    icon: Check,
  },
  cancelled: {
    label: "Cancelado",
    color: "text-red-700",
    bg: "bg-red-50",
    icon: XCircle,
  },
};

const statusFilters = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendentes" },
  { key: "confirmed", label: "Confirmados" },
  { key: "completed", label: "Finalizados" },
  { key: "cancelled", label: "Cancelados" },
];

export default function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItemRow[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setOrders(data as OrderRow[]);
    if (error) console.error(error);
    setIsLoading(false);
  };

  const toggleExpandOrder = async (orderId: string) => {
    try {
      if (expandedOrderId === orderId) {
        setExpandedOrderId(null);
        return;
      }

      setExpandedOrderId(orderId);

      // Fetch items if not already loaded
      if (!orderItems[orderId]) {
        setLoadingItems((prev) => ({ ...prev, [orderId]: true }));
        const { data, error } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at");

        if (error) throw error;

        setOrderItems((prev) => ({
          ...prev,
          [orderId]: (data as OrderItemRow[]) || [],
        }));
        setLoadingItems((prev) => ({ ...prev, [orderId]: false }));
      }
    } catch (error: any) {
      console.error("Error expanding order:", error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes do pedido.");
      setExpandedOrderId(null);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
    setIsUpdating(false);
  };

  const filteredOrders =
    activeFilter === "all"
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
      <VStack space="xl" className="flex-1 max-w-[800px] w-full mx-auto p-4 md:p-8">
        {/* Header */}
        <HStack className="justify-between items-center mb-2">
          <HStack className="items-center" space="md">
            <Heading size="xl" className="text-slate-900 font-bold">
              Pedidos
            </Heading>
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 rounded-full px-2.5 py-1">
                <BadgeText className="text-white text-xs font-bold">
                  {pendingCount} {pendingCount === 1 ? "novo" : "novos"}
                </BadgeText>
              </Badge>
            )}
          </HStack>
        </HStack>

        <Box className="-mt-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-grow-0"
            contentContainerStyle={{ paddingRight: 16, alignItems: 'center' }}
          >
            <HStack space="sm" className="items-center h-12">
            {statusFilters.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                className={`px-4 py-2 rounded-full ${
                  activeFilter === f.key
                    ? "bg-slate-900"
                    : "bg-white border border-slate-200"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeFilter === f.key ? "text-white" : "text-slate-600"
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </HStack>
        </ScrollView>
        </Box>

        {/* Orders List */}
        <VStack className="pb-24" space="md">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Box
                key={i}
                className="bg-white rounded-2xl border border-slate-100 p-4"
              >
                <SkeletonText _lines={1} className="w-32 h-4 mb-2" />
                <SkeletonText _lines={1} className="w-48 h-3" />
              </Box>
            ))
          ) : filteredOrders.length === 0 ? (
            <Box className="items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
              <ShoppingBag size={48} color="#cbd5e1" strokeWidth={1} />
              <Text className="text-slate-400 text-sm mt-4">
                Nenhum pedido encontrado.
              </Text>
            </Box>
          ) : (
            filteredOrders.map((order) => {
              const st = statusConfig[order.status] || statusConfig.pending;
              const orderCode = `#${order.id.slice(0, 8).toUpperCase()}`;
              const isExpanded = expandedOrderId === order.id;
              const items = orderItems[order.id] || [];
              const isLoadingDetails = loadingItems[order.id];

              return (
                <Box
                  key={order.id}
                  className={`bg-white rounded-2xl border ${
                    isExpanded ? "border-slate-300" : "border-slate-100"
                  }`}
                >
                  {/* Compact Card Header */}
                  <Pressable
                    onPress={() => toggleExpandOrder(order.id)}
                    className={`p-4 ${isExpanded ? "bg-slate-50 rounded-t-2xl border-b border-slate-100" : ""}`}
                  >
                    <HStack className="justify-between items-center">
                      <VStack space="xs" className="flex-1 pr-4">
                        <HStack className="items-center justify-between">
                          <HStack className="items-center" space="sm">
                            <Text className="text-slate-900 font-bold text-base">
                              {order.customer_name || "Cliente"}
                            </Text>
                            <Badge className={`${st.bg} rounded-md px-2 py-0.5`}>
                              <BadgeText
                                className={`${st.color} text-[10px] font-bold`}
                              >
                                {st.label}
                              </BadgeText>
                            </Badge>
                          </HStack>
                        </HStack>
                        <HStack className="items-center" space="md">
                          <Text className="text-slate-400 text-xs font-mono">
                            {orderCode}
                          </Text>
                          <Text className="text-slate-400 text-xs">
                            {formatDate(order.created_at)}
                          </Text>
                        </HStack>
                        <Text className="text-slate-900 font-bold text-sm mt-1">
                          {formatPrice(order.total_price)}
                        </Text>
                      </VStack>
                      <Box className={`p-2 rounded-full ${isExpanded ? "bg-white" : "bg-slate-50"}`}>
                        <Icon as={isExpanded ? ChevronUp : ChevronDown} size="sm" color="#64748b" />
                      </Box>
                    </HStack>
                  </Pressable>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <VStack space="lg" className="p-4">
                      {/* Customer Note */}
                      {order.customer_note && (
                        <Box className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                          <HStack className="items-start" space="sm">
                            <Icon as={FileText} size="sm" color="#92400e" className="mt-0.5" />
                            <VStack className="flex-1">
                              <Text className="text-xs font-bold text-amber-700">
                                Observação do cliente
                              </Text>
                              <Text className="text-sm text-amber-800 mt-0.5">
                                {order.customer_note}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      )}

                      {/* Delivery Address */}
                      {order.delivery_address && (
                        <Box className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                          <HStack className="items-start" space="sm">
                            <Icon as={MapPin} size="sm" color="#0f172a" className="mt-0.5" />
                            <VStack className="flex-1">
                              <Text className="text-xs font-bold text-slate-700">
                                {order.delivery_address.label}
                              </Text>
                              <Text className="text-xs text-slate-500 mt-0.5">
                                {order.delivery_address.street}
                                {order.delivery_address.number ? `, ${order.delivery_address.number}` : ""}
                                {order.delivery_address.complement ? ` - ${order.delivery_address.complement}` : ""}
                                {order.delivery_address.neighborhood ? `, ${order.delivery_address.neighborhood}` : ""}
                                {" "}- {order.delivery_address.city}
                                {order.delivery_address.state ? `/${order.delivery_address.state}` : ""}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      )}

                      {/* Order Items */}
                      <VStack space="md">
                        <HStack className="items-center" space="sm">
                          <Icon as={Package} size="sm" color="#64748b" />
                          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Itens do pedido
                          </Text>
                        </HStack>

                        {isLoadingDetails ? (
                          <ActivityIndicator size="small" color="#94a3b8" />
                        ) : (
                          <VStack space="sm">
                            {items.map((oi) => (
                              <HStack
                                key={oi.id}
                                className="justify-between items-start py-2 border-b border-slate-50 last:border-b-0"
                              >
                                <VStack className="flex-1 pr-3">
                                  <Text className="text-sm text-slate-800 font-bold">
                                    {oi.quantity}x {oi.item_name}
                                  </Text>
                                  {oi.selected_options?.length > 0 && (
                                    <HStack space="xs" className="mt-1 flex-wrap">
                                      {oi.selected_options.map((opt: any, idx: number) => (
                                        <Box
                                          key={idx}
                                          className="bg-slate-100 rounded-md px-1.5 py-0.5 mb-0.5"
                                        >
                                          <Text className="text-[10px] text-slate-600 font-semibold">
                                            {opt.option_name}
                                          </Text>
                                        </Box>
                                      ))}
                                    </HStack>
                                  )}
                                  {oi.selected_modifiers?.length > 0 && (
                                    <HStack space="xs" className="mt-0.5 flex-wrap">
                                      {oi.selected_modifiers.map((mod: any, idx: number) => (
                                        <Box
                                          key={idx}
                                          className="bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5 mb-0.5"
                                        >
                                          <Text className="text-[10px] text-amber-700 font-semibold">
                                            + {mod.modifier_name}
                                          </Text>
                                        </Box>
                                      ))}
                                    </HStack>
                                  )}
                                </VStack>
                                <Text className="text-sm text-slate-800 font-bold">
                                  {formatPrice(oi.line_total)}
                                </Text>
                              </HStack>
                            ))}
                          </VStack>
                        )}
                      </VStack>

                      {/* Actions */}
                      <VStack space="sm" className="mt-2 pt-4 border-t border-slate-100">
                        {order.status === "pending" && (
                          <HStack space="sm">
                            <Button
                              onPress={() => updateStatus(order.id, "confirmed")}
                              isDisabled={isUpdating}
                              className="flex-1 rounded-xl bg-blue-600 h-12"
                            >
                              <ButtonText className="font-bold text-sm">Confirmar Pedido</ButtonText>
                            </Button>
                            <Button
                              onPress={() => updateStatus(order.id, "cancelled")}
                              isDisabled={isUpdating}
                              variant="outline"
                              className="flex-1 rounded-xl border-red-200 h-12"
                            >
                              <ButtonText className="text-red-500 font-bold text-sm">Cancelar</ButtonText>
                            </Button>
                          </HStack>
                        )}

                        {order.status === "confirmed" && (
                          <HStack space="sm">
                            <Button
                              onPress={() => updateStatus(order.id, "completed")}
                              isDisabled={isUpdating}
                              className="flex-1 rounded-xl bg-green-600 h-12"
                            >
                              <ButtonText className="font-bold text-sm">Finalizar</ButtonText>
                            </Button>
                            <Button
                              onPress={() => updateStatus(order.id, "cancelled")}
                              isDisabled={isUpdating}
                              variant="outline"
                              className="flex-1 rounded-xl border-red-200 h-12"
                            >
                              <ButtonText className="text-red-500 font-bold text-sm">Cancelar</ButtonText>
                            </Button>
                          </HStack>
                        )}

                        {order.status === "completed" && (
                          <Box className="bg-green-50 rounded-xl p-3 items-center flex-row justify-center border border-green-100">
                            <Icon as={Check} size="sm" color="#16a34a" />
                            <Text className="text-green-700 font-bold text-xs ml-2">
                              Pedido finalizado com sucesso
                            </Text>
                          </Box>
                        )}

                        {order.status === "cancelled" && (
                          <Box className="bg-red-50 rounded-xl p-3 items-center flex-row justify-center border border-red-100">
                            <Icon as={XCircle} size="sm" color="#dc2626" />
                            <Text className="text-red-700 font-bold text-xs ml-2">
                              Pedido cancelado
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </VStack>
                  )}
                </Box>
              );
            })
          )}
        </VStack>
      </VStack>
    </ScrollView>
  );
}
