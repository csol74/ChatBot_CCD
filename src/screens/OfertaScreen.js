import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consultarOferta } from '../services/chatService';
import colors from '../constants/colors';

export default function OfertaScreen() {
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError(false);
    const data = await consultarOferta();
    if (data === null) setError(true);
    else setRespuesta(data);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>📚</Text>
        <View>
          <Text style={styles.headerTitle}>Oferta de Cursos</Text>
          <Text style={styles.headerSub}>Semestre 2025-1</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color={colors.azulUnab} />
            <Text style={styles.cargandoText}>Cargando oferta académica...</Text>
          </View>
        ) : error ? (
          <View style={styles.centrado}>
            <Text style={styles.errorText}>No se pudo cargar la oferta</Text>
            <TouchableOpacity style={styles.reintentarBtn} onPress={cargar}>
              <Text style={styles.reintentarText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.respuestaCard}>
            <Text style={styles.respuestaLabel}>📚 Cursos disponibles</Text>
            <Text style={styles.respuestaTexto}>{respuesta || 'No hay cursos disponibles por ahora.'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grisClaro },
  header: {
    backgroundColor: colors.azulUnab,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14, gap: 12,
  },
  headerEmoji: { fontSize: 28 },
  headerTitle: { color: colors.blanco, fontSize: 15, fontWeight: '600' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  body: { padding: 16 },
  centrado: { alignItems: 'center', marginTop: 60, gap: 16 },
  cargandoText: { color: colors.grisMedio, fontSize: 14 },
  errorText: { color: colors.rojo, fontSize: 14 },
  reintentarBtn: {
    borderWidth: 1, borderColor: colors.azulUnab,
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 20,
  },
  reintentarText: { color: colors.azulUnab, fontSize: 13 },
  respuestaCard: {
    backgroundColor: colors.blanco,
    borderRadius: 12, padding: 16,
    borderWidth: 0.5, borderColor: '#ddd',
  },
  respuestaLabel: { fontSize: 13, fontWeight: '600', color: colors.azulUnab, marginBottom: 12 },
  respuestaTexto: { fontSize: 13, color: '#333', lineHeight: 22 },
});