import React from 'react';

import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack>
      
      <Stack.Screen
        name="add-extinguisher"
       
        options={{ title: 'Add Extinguisher',
           presentation: 'modal', 
           headerShown: true ,
           animation: 'fade',
           headerStyle: { backgroundColor: '#3577f1' },
           headerTintColor: '#fff',
           headerTitleStyle: { fontWeight: 'bold' }}}
      />
    </Stack>
  );
}

