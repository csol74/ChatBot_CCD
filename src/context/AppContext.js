import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [idEstudiante, setIdEstudiante] = useState('');

  const guardarEstudiante = async (id) => {
    setIdEstudiante(id);
    await AsyncStorage.setItem('id_estudiante', id);
  };

  const cargarEstudiante = async () => {
    const id = await AsyncStorage.getItem('id_estudiante');
    if (id) setIdEstudiante(id);
    return id;
  };

  const cerrarSesion = async () => {
    setIdEstudiante('');
    await AsyncStorage.removeItem('id_estudiante');
  };

  return (
    <AppContext.Provider value={{ idEstudiante, guardarEstudiante, cargarEstudiante, cerrarSesion }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);