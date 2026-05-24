import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { consultarProgreso } from '../services/chatService';
import colors from '../constants/colors';

const PILARES = [
  { num: 1, nombre: 'Competencias Digitales Básicas', emoji: '💻' },
  { num: 2, nombre: 'Analítica y Contenido Digital', emoji: '📊' },
  { num: 3, nombre: 'Transformación Digital', emoji: '🚀' },
];

export default function ProgresoScreen() {
  const { idEstudiante } = useApp();
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError(false);
    const data = await consultarProgreso(idEstudiante);
    if (data === null) {
      setError(true);
    } else {
      setRespuesta(data);
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const completados = PILARES.filter(p =>
    respuesta.includes(`P${p.num}`) && respuesta.includes('✅')
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>📊</Text>
        <View>
          <Text style={styles.headerTitle}>Mi Progreso</Text>
          <Text style={styles.headerSub}>ID: {idEstudiante}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color={colors.azulUnab} />
            <Text style={styles.cargandoText}>Consultando tu progreso...</Text>
          </View>
        ) : error ? (
          <View style={styles.centrado}>
            <Text style={styles.errorText}>No se pudo cargar el progreso</Text>
            <TouchableOpacity style={styles.reintentarBtn} onPress={cargar}>
              <Text style={styles.reintentarText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.barraCard}>
              <Text style={styles.barraLabel}>Progreso general — {completados} de 3 pilares</Text>
              <View style={styles.barraTrack}>
                <View style={[styles.barraFill, { width: `${Math.round((completados / 3) * 100)}%` }]} />
              </View>
              <Text style={styles.barraPct}>{Math.round((completados / 3) * 100)}% completado</Text>
            </View>

            {PILARES.map(p => {
              const completado = respuesta.includes(`P${p.num}`) && respuesta.includes('✅');
              return (
                <View key={p.num} style={styles.pilarCard}>
                  <View style={styles.pilarHeader}>
                    <Text style={styles.pilarEmoji}>{p.emoji}</Text>
                    <Text style={styles.pilarNombre}>Pilar {p.num}: {p.nombre}</Text>
                    <View style={[styles.badge, completado ? styles.badgeVerde : styles.badgeNaranja]}>
                      <Text style={[styles.badgeText, { color: completado ? '#2e7d32' : '#e65100' }]}>
                        {completado ? 'Completado' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {respuesta ? (
              <View style={styles.respuestaCard}>
                <Text style={styles.respuestaLabel}>Detalle del asistente</Text>
                <Text style={styles.respuestaTexto}>{respuesta}</Text>
              </View>
            ) : null}
          </>
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
    padding: 14,
    gap: 12,
  },
  headerEmoji: { fontSize: 28 },
  headerTitle: { color: colors.blanco, fontSize: 15, fontWeight: '600' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  body: { padding: 16, gap: 14 },
  centrado: { alignItems: 'center', marginTop: 60, gap: 16 },
  cargandoText: { color: colors.grisMedio, fontSize: 14 },
  errorText: { color: colors.rojo, fontSize: 14 },
  reintentarBtn: {
    borderWidth: 1, borderColor: colors.azulUnab,
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 20,
  },
  reintentarText: { color: colors.azulUnab, fontSize: 13 },
  barraCard: {
    backgroundColor: colors.blanco,
    borderRadius: 12, padding: 16,
    borderWidth: 0.5, borderColor: '#ddd',
  },
  barraLabel: { fontSize: 12, color: colors.grisMedio, marginBottom: 10 },
  barraTrack: {
    height: 8, backgroundColor: '#eee',
    borderRadius: 4, overflow: 'hidden',
  },
  barraFill: {
    height: '100%', backgroundColor: colors.azulUnab,
    borderRadius: 4,
  },
  barraPct: { fontSize: 13, fontWeight: '600', color: colors.azulUnab, marginTop: 8 },
  pilarCard: {
    backgroundColor: colors.blanco,
    borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#ddd',
  },
  pilarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pilarEmoji: { fontSize: 22 },
  pilarNombre: { flex: 1, fontSize: 13, fontWeight: '500', color: '#222' },
  badge: { borderRadius: 12, paddingVertical: 3, paddingHorizontal: 10 },
  badgeVerde: { backgroundColor: '#e8f5e9' },
  badgeNaranja: { backgroundColor: '#fff3e0' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  respuestaCard: {
    backgroundColor: colors.blanco,
    borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#ddd',
  },
  respuestaLabel: { fontSize: 12, color: colors.grisMedio, marginBottom: 8 },
  respuestaTexto: { fontSize: 13, color: '#333', lineHeight: 20 },
});