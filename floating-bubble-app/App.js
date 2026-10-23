import React, { useEffect, useState } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, Alert, 
  Modal, StyleSheet, ToastAndroid, BackHandler 
} from 'react-native';
import FloatingBubble from '@increase21/rn-floating-bubble';

const App = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('ninguno');
  // Iniciamos en true para que al abrir la app (desde la burbuja) muestre el modal de inmediato
  const [modalVisible, setModalVisible] = useState(true);

  // 1. Obtener grupos del backend
  const fetchGroups = async () => {
    try {
      const res = await fetch('http://127.0.0.1:3000/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      } else {
        ToastAndroid.show('Error al cargar grupos', ToastAndroid.SHORT);
      }
    } catch (e) {
      ToastAndroid.show('Error de conexión al backend', ToastAndroid.SHORT);
    }
  };

  // 2. Configurar la burbuja y la carga inicial
  useEffect(() => {
    const setup = async () => {
      const granted = await FloatingBubble.requestPermission();
      if (granted) {
        await FloatingBubble.show();
      }
    };
    setup();
    fetchGroups();

    // Si el usuario presiona "Atrás" en Android, minimizamos la app
    const backAction = () => {
      if (modalVisible) {
        BackHandler.exitApp(); // Cierra/minimiza la app volviendo a WhatsApp
        return true;
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
        ToastAndroid.show(`Grupo: ${groupName}`, ToastAndroid.SHORT);
        
        // Cerramos el modal y minimizamos la app para volver a WhatsApp
        setModalVisible(false);
        setTimeout(() => BackHandler.exitApp(), 200); 
      } else {
        Alert.alert('Error', 'El servidor rechazó la petición');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar al backend');
    }
  };

  // 4. Cerrar la burbuja
  const handleCloseBubble = async () => {
    await FloatingBubble.hide();
    setModalVisible(false);
    ToastAndroid.show('Burbuja cerrada', ToastAndroid.SHORT);
    setTimeout(() => BackHandler.exitApp(), 200);
  };

  return (
    <View style={styles.mainContainer}>
      {/* Pantalla de fondo (solo visible si el modal se cancela manualmente) */}
      <Text style={styles.subtitle}>App en segundo plano</Text>
      <TouchableOpacity style={styles.closeBtn} onPress={handleCloseBubble}>
        <Text style={styles.closeText}>Cerrar Burbuja</Text>
      </TouchableOpacity>

      {/* Panel flotante (Modal) */}
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
            
            {groups.length === 0 ? (
              <Text style={{color: '#fff', textAlign: 'center', marginBottom: 20}}>
                Cargando grupos o ninguno disponible...
              </Text>
            ) : (
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
            )}
            
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => {
                setModalVisible(false);
                setTimeout(() => BackHandler.exitApp(), 200); // Volver a WhatsApp
              }}
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
  subtitle: { color: '#94a3b8', marginBottom: 30, textAlign: 'center' },
  closeBtn: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontWeight: 'bold' },
  
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
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
    backgroundColor: '#22c55e',
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