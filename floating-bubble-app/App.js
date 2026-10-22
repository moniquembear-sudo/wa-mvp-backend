import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, Alert, AppState } from 'react-native';
import FloatingBubble from '@increase21/rn-floating-bubble';

const App = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('ninguno');
  const [lastTap, setLastTap] = useState(0);

  // 1. Obtener grupos del backend
  const fetchGroups = async () => {
    try {
      // Asumiendo que tienes un endpoint /api/groups o usamos los productos
      // Si no tienes /api/groups, podemos usar el de sesiones
      const res = await fetch('http://127.0.0.1:3000/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      } else {
        // Fallback temporal por si no creaste el endpoint
        setGroups(['grupo prueba 1', 'grupo prueba 2', 'MIPYME 3 MATANZAS']);
      }
    } catch (e) {
      console.log('Error fetching groups', e);
      setGroups(['grupo prueba 1', 'grupo prueba 2']); // Fallback
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 2. Configurar la burbuja y los gestos
  useEffect(() => {
    const setup = async () => {
      const granted = await FloatingBubble.requestPermission();
      if (granted) {
        await FloatingBubble.show();
        // Lógica de toque en la burbuja
        FloatingBubble.addListener('onPress', () => {
          const now = Date.now();
          const DOUBLE_PRESS_DELAY = 300;
          
          if (now - lastTap < DOUBLE_PRESS_DELAY) {
            // Doble toque: Abrir la app (simulado trayéndola al frente)
            // En React Native, para traer al frente desde un servicio, 
            // se requiere una librería nativa o usar AppState. 
            // Por ahora, mostraremos un Alert o pediremos al usuario que abra la app.
            Alert.alert('Configuración', 'Aquí iría la configuración o apertura de app');
          } else {
            // Un solo toque: Cambiar al siguiente grupo
            if (groups.length > 0) {
              const currentIndex = groups.indexOf(activeGroup);
              const nextIndex = (currentIndex + 1) % groups.length;
              setGroup(groups[nextIndex]);
            }
          }
          setLastTap(now);
        });
      }
    };
    setup();
  }, [groups, activeGroup, lastTap]); // Dependencias para que el listener tenga los datos actuales

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
      } else {
        Alert.alert('Error', 'El servidor rechazó la petición');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar al backend');
    }
  };

  // 3. Botón para cerrar la burbuja y la app
  const handleCloseApp = async () => {
    await FloatingBubble.hide(); // Esto destruye el servicio en primer plano
    // En Android, para cerrar completamente la app:
    // BackHandler.exitApp(); (requiere import { BackHandler } from 'react-native')
    // O simplemente el usuario la quita de recientes. 
    // Pero con hide() la burbuja ya desaparece.
    Alert.alert('Burbuja cerrada', 'La burbuja ya no está flotando.');
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#0f172a' }}>
      <Text style={{ fontSize: 20, color: '#fff', marginBottom: 10, textAlign: 'center' }}>
        Icono Flotante
      </Text>
      <Text style={{ color: '#94a3b8', marginBottom: 20, textAlign: 'center' }}>
        Grupo activo: {activeGroup}
      </Text>

      <Button title="Actualizar Grupos" onPress={fetchGroups} color="#3b82f6" />
      <View style={{ height: 10 }} />

      <FlatList
        data={groups}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setGroup(item)}
            style={{ 
              backgroundColor: item === activeGroup ? '#22c55e' : '#1e293b', 
              padding: 15, 
              borderRadius: 8, 
              marginBottom: 10 
            }}
          >
            <Text style={{ color: '#fff' }}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <Button title="Cerrar Burbuja y App" onPress={handleCloseApp} color="#ef4444" />
    </View>
  );
};

export default App;