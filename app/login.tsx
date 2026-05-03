import React, { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Store, Lock, Mail, ArrowRight } from "lucide-react-native";
import { Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";

export default function Login() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    setLoading(true);
    let error;
    let userRole = "customer";

    if (isLogin) {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = signInError;
      if (data?.user) {
        userRole = data.user.user_metadata?.role || "customer";
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: "customer" }, // Sempre cria como cliente por padrão
        }
      });
      error = signUpError;
    }

    setLoading(false);

    if (error) {
      if (error.message === "Email not confirmed") {
        Alert.alert("Verifique seu E-mail", "Você precisa confirmar seu e-mail antes de fazer login. Verifique sua caixa de entrada.");
      } else {
        Alert.alert("Erro", error.message);
      }
    } else {
      if (!isLogin) {
        Alert.alert(
          "Verifique seu E-mail", 
          "Sua conta foi criada! Um e-mail de confirmação foi enviado para você. Por favor, confirme seu e-mail antes de fazer o login."
        );
        setIsLogin(true);
      } else {
        // Redireciona de acordo com o papel ou o parâmetro 'redirect'
        if (redirect) {
          router.replace(redirect as any);
        } else if (userRole === "manager") {
          router.replace("/app/dashboard");
        } else {
          router.replace("/web/store");
        }
      }
    }
  };

  return (
    <Box className="flex-1 bg-slate-50 items-center justify-center p-6">
      <VStack space="2xl" className="max-w-md w-full bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100">
        
        <VStack space="sm" className="items-center mb-6">
          <Box className="bg-primary-50 p-4 rounded-3xl mb-2">
            <Store size={32} color="#0891b2" />
          </Box>
          <Heading size="2xl" className="text-slate-900 text-center">
            {isLogin ? "Bem-vindo de volta" : "Criar uma conta"}
          </Heading>
          <Text className="text-slate-500 text-center">
            {isLogin ? "Faça login para continuar" : "Preencha os dados para se cadastrar na loja"}
          </Text>
        </VStack>

        <VStack space="xl">
          <VStack space="xs">
            <Text className="text-sm font-bold text-slate-700 ml-1">E-mail</Text>
            <Input className="rounded-2xl border-slate-200 h-14 bg-slate-50/50 px-4">
              <Mail size={20} color="#94a3b8" className="mr-2" />
              <InputField 
                placeholder="seu@email.com" 
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Input>
          </VStack>

          <VStack space="xs">
            <Text className="text-sm font-bold text-slate-700 ml-1">Senha</Text>
            <Input className="rounded-2xl border-slate-200 h-14 bg-slate-50/50 px-4">
              <Lock size={20} color="#94a3b8" className="mr-2" />
              <InputField 
                placeholder="••••••••" 
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </Input>
          </VStack>

          <Button 
            size="xl" 
            className="h-14 rounded-2xl bg-primary-600 mt-2"
            onPress={handleAuth}
            disabled={loading}
          >
            <ButtonText className="font-bold text-base">
              {loading ? "Aguarde..." : (isLogin ? "Entrar" : "Cadastrar")}
            </ButtonText>
            {!loading && <ArrowRight size={18} color="white" className="ml-2" />}
          </Button>

          <HStack className="justify-center mt-2">
            <Text className="text-slate-500">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
            </Text>
            <Pressable onPress={() => setIsLogin(!isLogin)} className="ml-2">
              <Text className="text-primary-600 font-bold underline">
                {isLogin ? "Criar conta" : "Fazer login"}
              </Text>
            </Pressable>
          </HStack>
        </VStack>

      </VStack>
    </Box>
  );
}
