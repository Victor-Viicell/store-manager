import { useRouter } from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Box } from "@/components/ui/box";
import { Store, ShoppingCart, ArrowRight } from "lucide-react-native";

export default function Index() {
  const router = useRouter();

  return (
    <Box className="flex-1 bg-slate-50 items-center justify-center p-6">
      <VStack space="2xl" className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-xl border border-slate-100">
        <VStack space="md" className="items-center mb-4">
          <Box className="bg-primary-600 p-4 rounded-3xl shadow-lg shadow-primary-200">
            <Store size={40} color="white" />
          </Box>
          <Heading size="3xl" className="text-slate-900 text-center">Store Manager</Heading>
          <Text className="text-slate-500 text-center px-4">
            Selecione uma interface para começar a gerenciar seu negócio ou visualizar sua loja.
          </Text>
        </VStack>

        <VStack space="lg">
          <Button 
            size="xl" 
            className="h-16 rounded-2xl bg-primary-600 border-none hover:bg-primary-700 active:scale-95 transition-all"
            onPress={() => router.push("/app/dashboard")}
          >
            <HStack className="items-center justify-between w-full px-4">
              <HStack space="md" className="items-center">
                <Box className="bg-white/20 p-2 rounded-lg">
                  <Store size={20} color="white" />
                </Box>
                <ButtonText className="font-bold">Portal do Lojista</ButtonText>
              </HStack>
              <ArrowRight size={20} color="white" />
            </HStack>
          </Button>

          <Button 
            size="xl" 
            variant="outline"
            className="h-16 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
            onPress={() => router.push("/web/store")}
          >
            <HStack className="items-center justify-between w-full px-4">
              <HStack space="md" className="items-center">
                <Box className="bg-slate-100 p-2 rounded-lg">
                  <ShoppingCart size={20} color="#64748b" />
                </Box>
                <ButtonText className="text-slate-700 font-bold">Loja do Cliente</ButtonText>
              </HStack>
              <ArrowRight size={20} color="#64748b" />
            </HStack>
          </Button>
        </VStack>

        <Box className="mt-4 pt-8 border-t border-slate-50 items-center">
          <Text className="text-slate-400 text-xs font-medium uppercase tracking-widest">Desenvolvido com Gluestack</Text>
        </Box>
      </VStack>
    </Box>
  );
}