import React, { useState, useRef } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonText } from "@/components/ui/button";
import {
  X,
  SwitchCamera,
  Check,
  RotateCcw,
} from "lucide-react-native";

const MAX_VIEWFINDER_SIZE = 480;

interface CameraCaptureProps {
  isVisible: boolean;
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export function CameraCapture({
  isVisible,
  onCapture,
  onClose,
}: CameraCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  // Square size: full width on mobile (with padding), capped at max on desktop
  const viewfinderSize = Math.min(screenWidth - 32, MAX_VIEWFINDER_SIZE);

  if (!isVisible) return null;

  // Still loading permission
  if (!permission) {
    return (
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator color="white" size="large" />
        </SafeAreaView>
      </View>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <VStack space="xl" className="items-center px-8">
            <Text className="text-white text-xl font-bold text-center">
              Acesso à câmera
            </Text>
            <Text className="text-white/70 text-center text-base leading-relaxed">
              Precisamos de permissão para acessar a câmera do seu dispositivo
              para tirar fotos dos seus itens.
            </Text>
            <Button
              action="primary"
              className="rounded-2xl bg-white px-10 h-14 mt-4"
              onPress={requestPermission}
            >
              <ButtonText className="text-slate-900 font-bold text-base">
                Permitir acesso
              </ButtonText>
            </Button>
            <Pressable onPress={onClose} className="mt-4">
              <Text className="text-white/60 text-sm underline">Cancelar</Text>
            </Pressable>
          </VStack>
        </SafeAreaView>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (photo) {
        setCapturedUri(photo.uri);
      }
    } catch (err) {
      console.error("Camera capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
  };

  const handleConfirm = () => {
    if (capturedUri) {
      onCapture(capturedUri);
      setCapturedUri(null);
    }
  };

  const handleClose = () => {
    setCapturedUri(null);
    onClose();
  };

  const toggleFacing = () => {
    setFacing((f) => (f === "back" ? "front" : "back"));
  };

  // Preview captured photo
  if (capturedUri) {
    return (
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable onPress={handleClose} style={styles.topButton}>
              <Icon as={X} size="xl" color="white" />
            </Pressable>
          </View>

          {/* Square preview */}
          <View style={styles.centerContent}>
            <View
              style={[
                styles.squareFrame,
                { width: viewfinderSize, height: viewfinderSize },
              ]}
            >
              <Image
                source={{ uri: capturedUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomBar}>
            <Pressable onPress={handleRetake} style={styles.actionButton}>
              <View style={styles.actionButtonInner}>
                <Icon as={RotateCcw} size="md" color="white" />
              </View>
              <Text style={styles.actionLabel}>Tirar outra</Text>
            </Pressable>

            <Pressable onPress={handleConfirm} style={styles.actionButton}>
              <View style={[styles.actionButtonInner, styles.confirmButton]}>
                <Icon as={Check} size="lg" color="white" />
              </View>
              <Text style={styles.actionLabel}>Usar foto</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Camera viewfinder
  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={handleClose} style={styles.topButton}>
            <Icon as={X} size="xl" color="white" />
          </Pressable>
        </View>

        {/* Square camera viewfinder */}
        <View style={styles.centerContent}>
          <View
            style={[
              styles.squareFrame,
              { width: viewfinderSize, height: viewfinderSize },
            ]}
          >
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
            />
            {/* Corner guides */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.cameraBottomBar}>
          {/* Spacer for symmetry */}
          <View style={{ width: 56 }} />

          {/* Shutter button */}
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            style={({ pressed }) => [
              styles.shutterButton,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
          >
            {isCapturing ? (
              <ActivityIndicator color="#0f172a" size="small" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </Pressable>

          {/* Flip camera */}
          <Pressable
            onPress={toggleFacing}
            style={({ pressed }) => [
              styles.flipButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Icon as={SwitchCamera} size="lg" color="white" />
          </Pressable>
        </View>

        <Text style={styles.hintText}>Toque para capturar</Text>
      </SafeAreaView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 20 : 8,
    paddingBottom: 8,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  squareFrame: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1e293b",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  // Corner guide decorations
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 12,
    left: 12,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: "rgba(255,255,255,0.6)",
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 12,
    right: 12,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: "rgba(255,255,255,0.6)",
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: "rgba(255,255,255,0.6)",
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: "rgba(255,255,255,0.6)",
    borderBottomRightRadius: 8,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === "web" ? 32 : 16,
    paddingTop: 24,
    gap: 48,
  },
  cameraBottomBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 8,
    gap: 32,
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "white",
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    alignItems: "center",
    gap: 8,
  },
  actionButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    backgroundColor: "#16a34a",
  },
  actionLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  hintText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    paddingBottom: Platform.OS === "web" ? 24 : 12,
  },
});
