import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import colors from '../constants/colors';

export default function LoginScreen({ navigation }) {
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);

  const { guardarEstudiante, cargarEstudiante } = useApp();

  useEffect(() => {
    const verificarSesion = async () => {
      const id = await cargarEstudiante();
      if (id) navigation.replace('Main');
    };

    verificarSesion();
  }, []);

  const handleLogin = async () => {
    if (!/^\d{8}$/.test(codigo)) {
      Alert.alert(
        'Código inválido',
        'El código estudiantil debe tener exactamente 8 dígitos.'
      );
      return;
    }

    setCargando(true);

    await guardarEstudiante(codigo);

    setCargando(false);
    navigation.replace('Main');
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#06172E"
      />

      <LinearGradient
        colors={['#06172E', '#0D2B52', '#133E73']}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Glow */}
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>🎓</Text>
            </View>

            <Text style={styles.title}>CCD UNAB</Text>

            <Text style={styles.subtitle}>
              Centro de Competencias Digitales
            </Text>

            <Text style={styles.description}>
              Accede al asistente virtual institucional
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.label}>
              Código estudiantil
            </Text>

            <TextInput
              style={styles.input}
              placeholder="20220003"
              placeholderTextColor="#8E9AAF"
              keyboardType="numeric"
              maxLength={8}
              value={codigo}
              onChangeText={setCodigo}
              onSubmitEditing={handleLogin}
              selectionColor={colors.azulUnab}
            />

            <Text style={styles.helper}>
              Ingresa los 8 dígitos de tu código
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.button}
              onPress={handleLogin}
              disabled={cargando}
            >
              <LinearGradient
                colors={['#1D4ED8', '#2563EB', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {cargando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Ingresar
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Universidad Autónoma de Bucaramanga · 2026
          </Text>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  glowTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderRadius: 200,
    top: -60,
    right: -60,
  },

  glowBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 200,
    bottom: -40,
    left: -40,
  },

  header: {
    alignItems: 'center',
    marginBottom: 42,
  },

  logoContainer: {
    width: 95,
    height: 95,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 26,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 12,
  },

  logo: {
    fontSize: 42,
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    fontWeight: '600',
  },

  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 10,
    textAlign: 'center',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 30,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 25,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 14,
  },

  label: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  input: {
    height: 60,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontSize: 24,
    color: '#0F172A',
    letterSpacing: 6,
    fontWeight: '700',
  },

  helper: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },

  button: {
    marginTop: 28,
    borderRadius: 18,
    overflow: 'hidden',
  },

  buttonGradient: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  footer: {
    marginTop: 30,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '500',
  },
});