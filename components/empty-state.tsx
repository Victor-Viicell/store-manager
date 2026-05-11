import React from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Inbox } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: any;
  title?: string;
  message?: string;
  className?: string;
}

export function EmptyState({ 
  icon: IconComponent = Inbox, 
  title, 
  message = "Nenhum item encontrado.",
  className = "py-12 items-center justify-center"
}: EmptyStateProps) {
  return (
    <Box className={className}>
      <VStack space="md" className="items-center">
        <Box className="w-16 h-16 rounded-full bg-slate-50 items-center justify-center mb-2">
          <IconComponent size={32} color="#94a3b8" strokeWidth={1.5} />
        </Box>
        {title && (
          <Text className="text-slate-900 font-semibold text-lg text-center">
            {title}
          </Text>
        )}
        <Text className="text-slate-500 text-center text-sm px-4">
          {message}
        </Text>
      </VStack>
    </Box>
  );
}
