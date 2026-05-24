import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// 1. IMPORTAMOS LA LIBRERÍA DE MARKDOWN
import Markdown from 'react-native-markdown-display';
import { useApp } from '../context/AppContext';
import { preguntarAlAgente } from '../services/chatService';
import colors from '../constants/colors';

const MENSAJE_BIENVENIDA = `¡Hola! Soy el asistente virtual del CCD UNAB 👋

Puedo ayudarte con:
📚 Información sobre cursos y pilares
📊 Tu progreso académico
📅 Fechas importantes del calendario
📰 Noticias y convocatorias del CCD

¿En qué te puedo ayudar hoy?`;

const CHIPS = [
  '¿Cuál es mi progreso?',
  '¿Qué cursos hay disponibles?',
  '¿Cuándo son las inscripciones?',
  '¿Qué es la insignia digital?',
];

export default function ChatScreen({ navigation }) {
  const { idEstudiante, cerrarSesion } = useApp();
  const [mensajes, setMensajes] = useState([
    { id: '0', role: 'bot', texto: MENSAJE_BIENVENIDA },
  ]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarChips, setMostrarChips] = useState(true);
  const flatRef = useRef(null);

  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [mensajes, cargando]);

  const cambiarEstudiante = async () => {
  await cerrarSesion();
  navigation.replace('Login');
};

  const enviar = async (msg) => {
    const mensaje = msg || texto.trim();
    if (!mensaje || cargando) return;
    setTexto('');
    setMostrarChips(false);

    const nuevoUsuario = { id: Date.now().toString(), role: 'user', texto: mensaje };
    setMensajes(prev => [...prev, nuevoUsuario]);
    setCargando(true);

    const respuesta = await preguntarAlAgente(mensaje, idEstudiante);
    setCargando(false);

    const nuevoBot = { id: (Date.now() + 1).toString(), role: 'bot', texto: respuesta };
    setMensajes(prev => [...prev, nuevoBot]);
  };

  // 2. MODIFICAMOS EL RENDERIZADO DEL MENSAJE
  const renderMensaje = ({ item }) => (
    <View style={[styles.msgRow, item.role === 'user' && styles.msgRowUser]}>
      <View style={[styles.burbuja, item.role === 'user' ? styles.burbujaUser : styles.burbujaBot]}>
        {item.role === 'user' ? (
          // El usuario sigue viendo texto plano tradicional blanco
          <Text style={[styles.msgTexto, { color: colors.blanco }]}>
            {item.texto}
          </Text>
        ) : (
          // El Bot ahora renderiza Markdown con estilos personalizados adaptados a las fuentes
          <Markdown style={markdownStyles}>
            {item.texto}
          </Markdown>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
  <View style={styles.headerLeft}>
    <View style={styles.headerIcon}>
      <Text style={{ fontSize: 20 }}>🤖</Text>
    </View>

    <View>
      <Text style={styles.headerTitle}>
        Asistente CCD UNAB
      </Text>

      <Text style={styles.headerSub}>
        {cargando ? 'Escribiendo...' : `ID: ${idEstudiante}`}
      </Text>
    </View>
  </View>

  <TouchableOpacity
    style={styles.logoutBtn}
    onPress={cambiarEstudiante}
  >
    <Text style={styles.logoutText}>↩</Text>
  </TouchableOpacity>
</View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={mensajes}
          keyExtractor={item => item.id}
          renderItem={renderMensaje}
          contentContainerStyle={styles.lista}
          ListFooterComponent={
            <>
              {cargando && (
                <View style={styles.msgRow}>
                  <View style={styles.burbujaBot}>
                    <ActivityIndicator size="small" color={colors.grisMedio} />
                  </View>
                </View>
              )}
              {mostrarChips && (
                <View style={styles.chipsWrap}>
                  {CHIPS.map(chip => (
                    <TouchableOpacity key={chip} style={styles.chip} onPress={() => enviar(chip)}>
                      <Text style={styles.chipTexto}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu pregunta..."
            placeholderTextColor={colors.grisMedio}
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={() => enviar()}
            editable={!cargando}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, cargando && { opacity: 0.5 }]}
            onPress={() => enviar()}
            disabled={cargando}
          >
            <Text style={{ color: colors.blanco, fontSize: 18 }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 3. AGREGAMOS ESTILOS ESPECÍFICOS PARA EL CONTENIDO EN MARKDOWN
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#222',
  },
  strong: {
    fontWeight: 'bold',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 6,
    padding: 4,
    marginVertical: 6,
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  th: {
    padding: 6,
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  td: {
    padding: 6,
    flex: 1,
  },
  bullet_list: {
    marginVertical: 4,
  },
  list_item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grisClaro },
  header: {
    backgroundColor: colors.azulUnab,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40, height: 40,
    backgroundColor: colors.doradoUnab,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: colors.blanco, fontSize: 15, fontWeight: '600' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  logoutBtn: {
  width: 38,
  height: 38,
  borderRadius: 12,
  backgroundColor: 'rgba(255,255,255,0.15)',
  alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: colors.blanco,
    fontSize: 18,
    fontWeight: 'bold',
  },
  lista: { padding: 12, gap: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  burbuja: { maxWidth: '85%', padding: 12, borderRadius: 16 }, // Subí un poco el maxWidth para que quepan mejor las tablas
  burbujaBot: {
    backgroundColor: colors.blanco,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  burbujaUser: {
    backgroundColor: colors.azulUnab,
    borderBottomRightRadius: 4,
  },
  msgTexto: { fontSize: 14, lineHeight: 20, color: '#222' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.azulUnab,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.blanco,
  },
  chipTexto: { color: colors.azulUnab, fontSize: 12 },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: colors.blanco,
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.grisClaro,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: '#222',
  },
  sendBtn: {
    width: 40, height: 40,
    backgroundColor: colors.azulUnab,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});