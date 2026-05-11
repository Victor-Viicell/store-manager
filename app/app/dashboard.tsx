import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react-native";
import { ScrollView } from "react-native";

const StatCard = ({ icon: IconComponent, title, value, delta, color }: any) => (
  <Box className="w-full md:flex-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-4 md:mb-0">
    <HStack className="justify-between items-start mb-4">
      <Box className={`p-3 rounded-2xl ${color}`}>
        <IconComponent size={24} color="white" />
      </Box>
      <Box className="bg-green-100 px-2 py-1 rounded-lg">
        <Text className="text-green-700 text-xs font-bold">{delta}</Text>
      </Box>
    </HStack>
    <Text className="text-slate-500 font-medium mb-1">{title}</Text>
    <Heading size="xl" className="text-slate-900">{value}</Heading>
  </Box>
);

export default function Dashboard() {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
      <VStack space="xl" className="flex-1 p-4 md:p-8">
        <VStack>
          <Heading size="2xl" className="text-slate-900">Painel</Heading>
          <Text className="text-slate-500">Bem-vindo de volta! Aqui está o que está acontecendo hoje.</Text>
        </VStack>

        <VStack space="md" className="md:flex-row w-full md:gap-4">
          <StatCard 
            icon={DollarSign} 
            title="Receita Total" 
            value="$12,845.00" 
            delta="+12%" 
            color="bg-emerald-500"
          />
          <StatCard 
            icon={ShoppingBag} 
            title="Total de Pedidos" 
            value="456" 
            delta="+8%" 
            color="bg-blue-500"
          />
          <StatCard 
            icon={Users} 
            title="Novos Clientes" 
            value="89" 
            delta="+24%" 
            color="bg-violet-500"
          />
          <StatCard 
            icon={TrendingUp} 
            title="Ticket Médio" 
            value="$28.15" 
            delta="+3%" 
            color="bg-orange-500"
          />
        </VStack>

        <VStack space="md" className="md:flex-row md:flex-1 md:gap-4">
          <Box className="flex-[2] bg-white p-8 rounded-3xl border border-slate-100 shadow-sm items-center justify-center min-h-[200px] mb-4 md:mb-0">
            <Text className="text-slate-400 font-medium">Espaço reservado para Gráfico de Vendas</Text>
          </Box>
          <Box className="md:flex-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <Heading size="md" className="mb-6">Atividade Recente</Heading>
            <VStack>
              {[1, 2, 3, 4].map((i) => (
                <HStack key={i} className="items-center justify-between border-b border-slate-100 py-4 last:border-0">
                  <HStack space="lg" className="items-center">
                    <Box className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100">
                      <ShoppingBag size={20} color="#0891b2" />
                    </Box>
                    <VStack space="xs">
                      <Text className="text-slate-900 font-bold text-base">Pedido #203{i}</Text>
                      <Text className="text-slate-500 text-sm">2 min atrás</Text>
                    </VStack>
                  </HStack>
                  <VStack space="xs" className="items-end">
                    <Text className="font-bold text-slate-900 text-base">$45.00</Text>
                    <Text className="text-green-600 text-xs font-bold">Pago</Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </Box>
        </VStack>
      </VStack>
    </ScrollView>
  );
}