import React, { useEffect, useState } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, Alert, 
  Modal, StyleSheet, ToastAndroid, BackHandler 
} from 'react-native';
import FloatingBubble from '@increase21/rn-floating-bubble';

const App = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('ninguno');
  const [modalVisible, setModalVisible] = useState(false);

  // 1. Obtener grupos del backend
  const fetchGroups = async () => {
    try {
      const res = await fetch('http://127.0.0.1:3000/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (e) {
      console.log('Error fetching groups', e);
    }
  };

  // 2. Configurar la burbuja
  useEffect(() => {
    const setup = async () => {
      const granted = await FloatingBubble.requestPermission();
      if (granted) {
        await FloatingBubble.show();
        
        // Como la librería abre la app al tocar la burbuja, 
        // usamos esto para mostrar el modal.
        FloatingBubble.addListener('onPress', () => {
          setModalVisible(true);
        });
      }
    };
    setup();
    fetchGroups();

    // Manejar el botón físico "Atrás" de Android para cerrar el modal
    const backAction = () => {
      if (modalVisible) {
        setModalVisible(false);
        return true; // Evita que la app se cierre
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [modalVisible]);

  // 3. Cambiar de grupo
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
        
        // Notificación nativa de Android
        ToastAndroid.show(`Grupo cambiado a: ${groupName}`, ToastAndroid.SHORT);
        
        // Cerramos el modal inmediatamente para volver a WhatsApp
        setModalVisible(false);
      } else {
        Alert.alert('Error', 'El servidor rechazó la petición');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar al backend');
    }
  };

  // 4. Cerrar la burbuja
  const handleCloseApp = async () => {
    await FloatingBubble.hide();
    setModalVisible(false);
    ToastAndroid.show('Burbuja cerrada', ToastAndroid.SHORT);
  };

  return (
    <View style={styles.mainContainer}>
      {/* Pantalla principal (solo visible si el modal no está abierto) */}
      <Text style={styles.title}>App en segundo plano</Text>
      <Text style={styles.subtitle}>Usa la burbuja flotante para cambiar de grupo.</Text>
      
      <TouchableOpacity style={styles.closeBtn} onPress={handleCloseApp}>
        <Text style={styles.closeText}>Cerrar Burbuja y App</Text>
      </TouchableOpacity>

      {/* El Bottom Sheet / Panel Flotante */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragIndicator} />
            <Text style={styles.modalTitle}>Seleccionar Grupo</Text>
            
            <FlatList
              data={groups}
              keyExtractor={(item) => item}
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
            
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: { fontSize: 20, color: '#fff', marginBottom: 10 },
  subtitle: { color: '#94a3b8', marginBottom: 30, textAlign: 'center' },
  closeBtn: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontWeight: 'bold' },
  
  // Estilos del Bottom Sheet
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo semitransparente (se ve WhatsApp detrás)
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%', // No ocupa toda la pantalla
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  groupItem: {
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  groupItemActive: {
    backgroundColor: '#22c55e', // Verde si es el activo
  },
  groupText: { color: '#fff', fontSize: 16 },
  cancelBtn: {
    marginTop: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelText: { color: '#94a3b8', fontSize: 16 },
});

export default App;