import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";

export default function Costumers() {
    return (
        <VStack space="md">
            <Heading size="xl">Clientes</Heading>
            <Text className="text-slate-500">Gerencie seus relacionamentos com clientes e veja o histórico de compras.</Text>
            
            <Box className="bg-white p-20 rounded-3xl border border-slate-100 items-center justify-center mt-8">
                <Text className="text-slate-400 font-medium">Espaço reservado para Lista de Clientes</Text>
            </Box>
        </VStack>
    );
}