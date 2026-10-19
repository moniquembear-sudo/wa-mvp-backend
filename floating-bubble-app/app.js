import React, { useEffect } from 'react';
import { View, Text, Alert, Button } from 'react-native';
import FloatingBubble from '@increase21/rn-floating-bubble';

const App = () => {
  useEffect(() => {
    const setup = async () => {
      const granted = await FloatingBubble.requestPermission();
      if (granted) await FloatingBubble.show();
    };
    setup();
  }, []);

  const setGroup = async (groupName) => {
    try {
      // Nota: En un dispositivo real, 'localhost' apunta al propio móvil.
      // Si Termux corre en el mismo móvil, 127.0.0.1 funcionará.
      const res = await fetch('http://127.0.0.1:3000/api/set-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: groupName }),
      });
      const data = await res.json();
      Alert.alert('Grupo activado', data.group);
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar al backend');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>App Icono Flotante</Text>
      <Text style={{ textAlign: 'center', marginBottom: 20 }}>
        La burbuja debería aparecer sobre otras apps. Usa los botones para probar la conexión.
      </Text>
      <Button title="Activar Grupo Prueba 1" onPress={() => setGroup('grupo prueba 1')} />
      <View style={{ height: 10 }} />
      <Button title="Cerrar Sesión" onPress={() => setGroup('')} />
    </View>
  );
};

export default App;
