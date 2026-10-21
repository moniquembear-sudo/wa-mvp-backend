import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Button, FlatList, TouchableOpacity } from 'react-native';
import FloatingBubble from '@increase21/rn-floating-bubble';

const App = () => {
  const [activeGroup, setActiveGroup] = useState(null);
  const [groups] = useState(['grupo prueba 1', 'grupo prueba 2', 'MIPYME 3 MATANZAS']);

  useEffect(() => {
    const setup = async () => {
      const granted = await FloatingBubble.requestPermission();
      if (granted) {
        await FloatingBubble.show();
      }
    };
    setup();
  }, []);

  const setGroup = async (groupName) => {
    try {
      const res = await fetch('http://10.210.251.171:3000/api/set-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: groupName }),
      });
      const data = await res.json();
      setActiveGroup(data.group);
      Alert.alert('Grupo activado', `Ahora: ${data.group}`);
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar al backend');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0f172a' }}>
      <Text style={{ fontSize: 20, color: '#fff', marginBottom: 20, textAlign: 'center' }}>
        Icono Flotante
      </Text>
      <Text style={{ color: '#94a3b8', marginBottom: 20, textAlign: 'center' }}>
        Grupo activo: {activeGroup || 'ninguno'}
      </Text>
      <FlatList
        data={groups}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setGroup(item)}
            style={{ backgroundColor: '#1e293b', padding: 15, borderRadius: 8, marginBottom: 10 }}
          >
            <Text style={{ color: '#fff' }}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <Button title="Cerrar Sesión" onPress={() => setGroup('')} color="#ef4444" />
    </View>
  );
};

export default App;
