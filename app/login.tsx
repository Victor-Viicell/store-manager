import React, { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import {
  Store,
  Lock,
  Mail,
  ArrowRight,
  User,
  Phone,
  MapPin,
  SkipForward,
} from "lucide-react-native";
import { Pressable, Alert, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";

type Step = "auth" | "address";

export default function Login() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<Step>("auth");

  // Auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Address fields
  const [addrLabel, setAddrLabel] = useState("Casa");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrNumber, setAddrNumber] = useState("");
  const [addrComplement, setAddrComplement] = useState("");
  const [addrNeighborhood, setAddrNeighborhood] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [fetchingCep, setFetchingCep] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Store the new user info for address step
  const [newUserId, setNewUserId] = useState<string | null>(null);

  const navigateAfterAuth = (userRole: string) => {
    if (redirect) {
      router.replace(redirect as any);
    } else if (userRole === "manager") {
      router.replace("/app/dashboard");
    } else {
      router.replace("/web/store");
    }
  };

  const handleCepBlur = async () => {
    const cleanCep = addrZip.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (!data.erro) {
        setAddrStreet(data.logradouro || "");
        setAddrNeighborhood(data.bairro || "");
        setAddrCity(data.localidade || "");
        setAddrState(data.uf || "");
      } else {
        Alert.alert("CEP não encontrado", "Por favor, verifique o CEP digitado.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível buscar o CEP.");
    } finally {
      setFetchingCep(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha e-mail e senha.");
      return;
    }

    if (!isLogin && !fullName.trim()) {
      Alert.alert("Erro", "Informe seu nome completo.");
      return;
    }

    setLoading(true);
    let error;
    let userRole = "customer";

    if (isLogin) {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      error = signInError;
      if (data?.user) {
        // userRole = data.user.user_metadata?.role || "customer";
        const { data: profile } = await supabase.from('profiles').select('is_manager').eq('id', data.user.id).single();
        if (profile?.is_manager) {
          userRole = "manager";
        } else {
          userRole = data.user.user_metadata?.role || "customer";
        }
      }
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "customer",
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            is_manager: false,
          },
        },
      });
      error = signUpError;
      if (data?.user) {
        setNewUserId(data.user.id);
      }
    }

    setLoading(false);

    if (error) {
      if (error.message === "Email not confirmed") {
        Alert.alert(
          "Verifique seu E-mail",
          "Você precisa confirmar seu e-mail antes de fazer login. Verifique sua caixa de entrada."
        );
      } else {
        Alert.alert("Erro", error.message);
      }
    } else {
      if (!isLogin) {
        // After signup, show address step (skippable)
        setStep("address");
      } else {
        navigateAfterAuth(userRole);
      }
    }
  };

  const handleSaveAddress = async () => {
    if (!addrStreet.trim() || !addrCity.trim()) {
      Alert.alert("Erro", "Preencha pelo menos rua e cidade.");
      return;
    }

    setSavingAddress(true);

    const { error } = await supabase.from("addresses").insert({
      user_id: newUserId,
      label: addrLabel.trim() || "Casa",
      street: addrStreet.trim(),
      number: addrNumber.trim() || null,
      complement: addrComplement.trim() || null,
      neighborhood: addrNeighborhood.trim() || null,
      city: addrCity.trim(),
      state: addrState.trim() || null,
      zip: addrZip.trim() || null,
      is_default: true,
    });

    setSavingAddress(false);

    if (error) {
      Alert.alert("Erro ao salvar endereço", error.message);
    } else {
      Alert.alert(
        "Conta criada!",
        "Sua conta e endereço foram salvos. Confirme seu e-mail para fazer login."
      );
      // Reset to login
      setStep("auth");
      setIsLogin(true);
    }
  };

  const handleSkipAddress = () => {
    Alert.alert(
      "Conta criada!",
      "Um e-mail de confirmação foi enviado. Confirme e faça login. Você pode adicionar endereços depois."
    );
    setStep("auth");
    setIsLogin(true);
  };

  // ─── Address Step ───
  if (step === "address") {
    return (
      <Box className="flex-1 bg-slate-50 items-center justify-center p-6">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
          showsVerticalScrollIndicator={false}
          style={{ width: "100%" }}
        >
          <VStack
            space="md"
            className="max-w-md w-full"
          >
            {/* Email verification banner */}
            <Box className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex-row items-start">
              <Mail size={20} color="#d97706" style={{ marginRight: 12, marginTop: 2 }} />
              <VStack className="flex-1">
                <Text className="text-sm font-bold text-amber-800">
                  Confirme seu e-mail
                </Text>
                <Text className="text-xs text-amber-700 leading-relaxed mt-0.5">
                  Enviamos um e-mail de confirmação para {email}. Confirme antes de fazer login.
                </Text>
              </VStack>
            </Box>

            <VStack
              space="2xl"
              className="w-full bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100"
            >
            <VStack space="sm" className="items-center mb-2">
              <Box className="bg-green-50 p-4 rounded-3xl mb-2">
                <MapPin size={32} color="#16a34a" />
              </Box>
              <Heading size="xl" className="text-slate-900 text-center">
                Adicionar endereço
              </Heading>
              <Text className="text-slate-500 text-center text-sm">
                Adicione um endereço de entrega (você pode pular esta etapa)
              </Text>
            </VStack>

            <VStack space="lg">
              {/* Label selector */}
              <VStack space="xs">
                <Text className="text-xs font-bold text-slate-700 ml-1">
                  Tipo
                </Text>
                <HStack space="sm">
                  {["Casa", "Trabalho", "Outro"].map((lbl) => (
                    <Pressable
                      key={lbl}
                      onPress={() => setAddrLabel(lbl)}
                      className={`flex-1 h-10 rounded-xl items-center justify-center border ${
                        addrLabel === lbl
                          ? "bg-slate-900 border-slate-900"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          addrLabel === lbl
                            ? "text-white"
                            : "text-slate-600"
                        }`}
                      >
                        {lbl}
                      </Text>
                    </Pressable>
                  ))}
                </HStack>
              </VStack>

              {/* ZIP */}
              <VStack space="xs">
                <Text className="text-xs font-bold text-slate-700 ml-1">
                  CEP
                </Text>
                <Input className="rounded-2xl border-slate-200 h-12 bg-slate-50/50 px-4">
                  <InputField
                    placeholder="00000-000"
                    value={addrZip}
                    onChangeText={setAddrZip}
                    onBlur={handleCepBlur}
                    keyboardType="numeric"
                    maxLength={9}
                  />
                  {fetchingCep && <ActivityIndicator size="small" color="#64748b" />}
                </Input>
              </VStack>

              {/* Street */}
              <VStack space="xs">
                <Text className="text-xs font-bold text-slate-700 ml-1">
                  Rua *
                </Text>
                <Input className="rounded-2xl border-slate-200 h-12 bg-slate-50/50 px-4">
                  <InputField
                    placeholder="Rua, Avenida..."
                    value={addrStreet}
                    onChangeText={setAddrStreet}
                  />
                </Input>
              </VStack>

              {/* Number + Complement */}
              <HStack space="sm">
                <VStack space="xs" className="flex-1">
                  <Text className="text-xs font-bold text-slate-700 ml-1">
                    Número
                  </Text>
                  <Input className="rounded-2xl border-slate-200 h-12 bg-slate-50/50 px-4">
                    <InputField
                      placeholder="123"
                      value={addrNumber}
                      onChangeText={setAddrNumber}
                      keyboardType="numeric"
                    />
                  </Input>
                </VStack>
                <VStack space="xs" className="flex-1">
                  <Text className="text-xs font-bold text-slate-700 ml-1">
                    Complemento
                  </Text>
                  <Input className="rounded-2xl border-slate-200 h-12 bg-slate-50/50 px-4">
                    <InputField
                      placeholder="Apto 4B"
                      value={addrComplement}
                      onChangeText={setAddrComplement}
                    />
                  </Input>
                </VStack>
              </HStack>

              {/* Neighborhood */}
              <VStack space="xs">
                <Text className="text-xs font-bold text-slate-700 ml-1">
                  Bairro
                </Text>
                <Input className="rounded-2xl border-slate-200 h-12 bg-slate-50/50 px-4">
                  <InputField
                    placeholder="Bairro"
                    value={addrNeighborhood}
                    onChangeText={setAddrNeighborhood}
                  />
                </Input>
              </VStack>

              {/* City + State */}
              <HStack space="sm">
                <VStack space="xs" className="flex-[2]">
                  <Text className="text-xs font-bold text-slate-700 ml-1">
                    Cidade *
                  </Text>
                  <Input className="rounded-2xl border-slate-200 h-12 bg-slate-50/50 px-4">
                    <InputField
                      placeholder="Cidade"
                      value={addrCity}
                      onChangeText={setAddrCity}
                    />
                  </Input>
                </VStack>
                <VStack space="xs" className="flex-1">
                  <Text className="text-xs font-bold text-slate-700 ml-1">
                    Estado
                  </Text>
                  <Input className="rounded-2xl border-slate-200 h-12 bg-slate-50/50 px-4">
                    <InputField
                      placeholder="SP"
                      value={addrState}
                      onChangeText={setAddrState}
                      autoCapitalize="characters"
                      maxLength={2}
                    />
                  </Input>
                </VStack>
              </HStack>

              {/* Save */}
              <Button
                size="xl"
                className="h-14 rounded-2xl bg-green-600 mt-1"
                onPress={handleSaveAddress}
                disabled={savingAddress}
              >
                <MapPin size={18} color="white" className="mr-2" />
                <ButtonText className="font-bold text-base">
                  {savingAddress ? "Salvando..." : "Salvar endereço"}
                </ButtonText>
              </Button>

              {/* Skip */}
              <Pressable
                onPress={handleSkipAddress}
                className="flex-row items-center justify-center py-2"
              >
                <SkipForward size={16} color="#94a3b8" />
                <Text className="text-slate-400 font-semibold text-sm ml-2">
                  Pular por agora
                </Text>
              </Pressable>
            </VStack>
          </VStack>
          </VStack>
        </ScrollView>
      </Box>
    );
  }

  // ─── Auth Step ───
  return (
    <Box className="flex-1 bg-slate-50 items-center justify-center p-6">
      <VStack
        space="2xl"
        className="max-w-md w-full bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100"
      >
        <VStack space="sm" className="items-center mb-6">
          <Box className="bg-primary-50 p-4 rounded-3xl mb-2">
            <Store size={32} color="#0891b2" />
          </Box>
          <Heading size="2xl" className="text-slate-900 text-center">
            {isLogin ? "Bem-vindo de volta" : "Criar uma conta"}
          </Heading>
          <Text className="text-slate-500 text-center">
            {isLogin
              ? "Faça login para continuar"
              : "Preencha seus dados para se cadastrar"}
          </Text>
        </VStack>

        <VStack space="xl">
          {/* Signup-only fields */}
          {!isLogin && (
            <>
              <VStack space="xs">
                <Text className="text-xs font-bold text-slate-700 ml-1">
                  Nome completo *
                </Text>
                <Input className="rounded-2xl border-slate-200 h-14 bg-slate-50/50 px-4">
                  <User size={20} color="#94a3b8" className="mr-2" />
                  <InputField
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text className="text-xs font-bold text-slate-700 ml-1">
                  Telefone
                </Text>
                <Input className="rounded-2xl border-slate-200 h-14 bg-slate-50/50 px-4">
                  <Phone size={20} color="#94a3b8" className="mr-2" />
                  <InputField
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </Input>
              </VStack>
            </>
          )}

          <VStack space="xs">
            <Text className="text-xs font-bold text-slate-700 ml-1">
              E-mail
            </Text>
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
            <Text className="text-xs font-bold text-slate-700 ml-1">
              Senha
            </Text>
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
              {loading
                ? "Aguarde..."
                : isLogin
                ? "Entrar"
                : "Cadastrar"}
            </ButtonText>
            {!loading && (
              <ArrowRight size={18} color="white" className="ml-2" />
            )}
          </Button>

          <HStack className="justify-center mt-2">
            <Text className="text-slate-500">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
            </Text>
            <Pressable
              onPress={() => setIsLogin(!isLogin)}
              className="ml-2"
            >
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
