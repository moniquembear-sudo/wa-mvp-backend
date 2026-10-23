import React, { useEffect, useState } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, Alert, 
  StyleSheet, ToastAndroid, BackHandler 
} from 'react-native';
import FloatingBubble from '@increase21/rn-floating-bubble';

const App = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('ninguno');

  // 1. Obtener grupos del backend
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

  // 2. Configurar la burbuja al arrancar
  useEffect(() => {
    const setup = async () => {
      const granted = await FloatingBubble.requestPermission();
      if (granted) {
        await FloatingBubble.show();
      }
    };
    setup();
    fetchGroups();
  }, []);

  // 3. Cambiar de grupo y minimizar app
  const setGroup = async (groupName) => {
    try {
      const res = await fetch('http://127.0.0.1:3000/api/set-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: groupName }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setActiveGroup(data.group || groupName);
        ToastAndroid.show(`Grupo: ${groupName}`, ToastAndroid.SHORT);
        
        // Minimiza la app inmediatamente para volver a WhatsApp
        setTimeout(() => BackHandler.exitApp(), 300);
      } else {
        Alert.alert('Error', 'El servidor rechazó la petición');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar al backend');
    }
  };

  // 4. Cerrar la burbuja y la app
  const handleCloseApp = async () => {
    await FloatingBubble.hide();
    ToastAndroid.show('Burbuja cerrada', ToastAndroid.SHORT);
    setTimeout(() => BackHandler.exitApp(), 300);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Control</Text>
      <Text style={styles.subtitle}>Grupo activo: {activeGroup}</Text>

      {/* Botones de acción */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnUpdate} onPress={fetchGroups}>
          <Text style={styles.btnText}>Actualizar Grupos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnClose} onPress={handleCloseApp}>
          <Text style={styles.btnText}>Cerrar Burbuja y App</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de grupos */}
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
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Fondo oscuro sólido
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 20,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  btnUpdate: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnClose: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  groupItem: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  groupItemActive: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  groupText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
  }
});

export default App;