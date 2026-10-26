import React, { useEffect, useState } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, Alert, 
  StyleSheet, ToastAndroid, BackHandler, NativeModules, Platform 
} from 'react-native';
import FloatingBubble from '@increase21/rn-floating-bubble';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('ninguno');

  // 1. Cargar estado inicial y configurar burbuja
  useEffect(() => {
    const loadState = async () => {
      try {
        // Recuperar el grupo que estaba activo antes de que la app se cerrara/minimizara
        const savedGroup = await AsyncStorage.getItem('@active_group');
        if (savedGroup) {
          setActiveGroup(savedGroup);
        }

        // Iniciar la burbuja
        const granted = await FloatingBubble.requestPermission();
        if (granted) {
          await FloatingBubble.show();
        }
      } catch (e) {
        console.log('Error cargando estado:', e);
      }
    };
    
    loadState();
    fetchGroups();
  }, []);

  // 2. Obtener grupos del backend
  const fetchGroups = async () => {
    try {
      const res = await fetch('http://127.0.0.1:3000/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        ToastAndroid.show('Grupos actualizados', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show('Error al cargar grupos', ToastAndroid.SHORT);
      }
    } catch (e) {
      ToastAndroid.show('Error de conexión', ToastAndroid.SHORT);
    }
  };


// 3. Cambiar de grupo, guardar y minimizar (Versión definitiva)
const setGroup = async (groupName) => {
  // 1. Mostramos el Toast inmediatamente
  ToastAndroid.show(`Grupo: ${groupName}`, ToastAndroid.SHORT);
  
  // 2. Minimizamos la app INMEDIATAMENTE usando NativeModules
  if (Platform.OS === 'android') {
    // Esto lanza el Intent de Home de Android
    NativeModules.DevSettings.reload(); // Fallback por si no tenemos acceso directo al Intent
    // La forma más limpia sin librerías externas:
    const { DevSettings } = NativeModules;
    // Nota: React Native no expone un método directo "goHome" en NativeModules.
    // Usaremos BackHandler pero sin el setTimeout para que sea inmediato.
    BackHandler.exitApp(); 
  }

  // 3. Hacemos la petición al backend en segundo plano (no esperamos la respuesta)
  try {
    await fetch('http://127.0.0.1:3000/api/set-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: groupName }),
    });
    // Opcional: guardar el grupo en AsyncStorage si quieres persistencia
  } catch (e) {
    console.log('Error en petición en segundo plano:', e);
  }
};
  // 4. Cerrar burbuja y limpiar estado
  const handleCloseApp = async () => {
    try {
      await FloatingBubble.hide();
      await AsyncStorage.removeItem('@active_group'); // Limpiamos el grupo activo
      ToastAndroid.show('Burbuja cerrada', ToastAndroid.SHORT);
      
      setTimeout(() => {
        if (BackHandler.moveTaskToBack) {
          BackHandler.moveTaskToBack(true);
        }
      }, 300);
    } catch (e) {
      console.log('Error al cerrar:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Control</Text>
      <Text style={styles.subtitle}>Grupo activo: {activeGroup}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnUpdate} onPress={fetchGroups}>
          <Text style={styles.btnText}>Actualizar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnClose} onPress={handleCloseApp}>
          <Text style={styles.btnText}>Cerrar Burbuja</Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? (
        <Text style={styles.emptyText}>No hay grupos cargados.</Text>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setGroup(item)}
              style={[
                styles.groupItem,
                item === activeGroup && styles.groupItemActive
              ]}
            >
              <Text style={styles.groupText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 20, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  btnUpdate: { flex: 1, backgroundColor: '#3b82f6', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnClose: { flex: 1, backgroundColor: '#ef4444', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  list: { flex: 1 },
  groupItem: { backgroundColor: '#1e293b', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  groupItemActive: { backgroundColor: '#22c55e', borderColor: '#16a34a' },
  groupText: { color: '#fff', fontSize: 16 },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 20 },
});

export default App;