import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/context/auth";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  Check,
  XCircle,
  ChevronRight,
  Package,
} from "lucide-react-native";

const formatPrice = (price: number) =>
  price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (date: string) =>
  new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type OrderRow = {
  id: string;
  status: string;
  customer_name: string;
  total_price: number;
  created_at: string;
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Aguardando contato", color: "text-amber-700", bg: "bg-amber-50" },
  confirmed: { label: "Confirmado", color: "text-blue-700", bg: "bg-blue-50" },
  completed: { label: "Finalizado", color: "text-green-700", bg: "bg-green-50" },
  cancelled: { label: "Cancelado", color: "text-red-700", bg: "bg-red-50" },
};

export default function MyOrders() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
    else if (!authLoading) setIsLoading(false);
  }, [user, authLoading]);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, customer_name, total_price, created_at")
      .eq("customer_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) setOrders(data as OrderRow[]);
    if (error) console.error(error);
    setIsLoading(false);
  };

  if (!user && !authLoading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center px-8">
        <ShoppingBag size={64} color="#cbd5e1" strokeWidth={1} />
        <Heading size="md" className="text-slate-800 mt-6">
          Faça login para ver seus pedidos
        </Heading>
        <Button
          onPress={() => router.push("/login?redirect=/web/my-orders")}
          className="rounded-xl bg-[#111827] h-12 px-10 mt-6"
        >
          <ButtonText className="font-bold text-base">Entrar</ButtonText>
        </Button>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-slate-50">
      {/* Header */}
      <HStack className="justify-between items-center px-4 py-3 bg-white border-b border-slate-100">
        <Pressable
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/web/store")
          }
          className="p-2 rounded-full active:bg-slate-50"
        >
          <ArrowLeft size={22} color="#0f172a" />
        </Pressable>
        <Heading size="md" className="text-slate-900">
          Meus Pedidos
        </Heading>
        <Box style={{ width: 40 }} />
      </HStack>

      {isLoading ? (
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f172a" />
        </Box>
      ) : orders.length === 0 ? (
        <Box className="flex-1 items-center justify-center px-8">
          <Package size={64} color="#cbd5e1" strokeWidth={1} />
          <Heading size="md" className="text-slate-800 mt-6">
            Nenhum pedido ainda
          </Heading>
          <Text className="text-slate-400 text-center mt-2 text-sm leading-relaxed">
            Seus pedidos aparecerão aqui após você fazer uma compra.
          </Text>
          <Button
            onPress={() => router.push("/web/store")}
            className="rounded-xl bg-[#111827] h-12 px-10 mt-8"
          >
            <ButtonText className="font-bold text-base">
              Ver produtos
            </ButtonText>
          </Button>
        </Box>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <VStack space="sm">
            {orders.map((order) => {
              const st = statusConfig[order.status] || statusConfig.pending;
              const orderCode = `#${order.id.slice(0, 8).toUpperCase()}`;

              return (
                <Pressable
                  key={order.id}
                  onPress={() =>
                    router.push(`/web/order-confirmed?id=${order.id}`)
                  }
                  className="bg-white rounded-2xl border border-slate-100 p-4 active:bg-slate-50"
                >
                  <HStack className="justify-between items-start">
                    <VStack space="xs" className="flex-1 pr-4">
                      <HStack className="items-center" space="sm">
                        <Text className="text-slate-900 font-bold text-sm font-mono">
                          {orderCode}
                        </Text>
                        <Badge
                          className={`${st.bg} rounded-md px-2 py-0.5`}
                        >
                          <BadgeText
                            className={`${st.color} text-[10px] font-bold`}
                          >
                            {st.label}
                          </BadgeText>
                        </Badge>
                      </HStack>
                      <Text className="text-slate-400 text-xs">
                        {formatDate(order.created_at)}
                      </Text>
                      <Text className="text-slate-900 font-bold text-base mt-1">
                        {formatPrice(order.total_price)}
                      </Text>
                    </VStack>
                    <ChevronRight size={18} color="#94a3b8" />
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
}
