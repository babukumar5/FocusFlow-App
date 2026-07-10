import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error('Error saving data to AsyncStorage', e);
    }
  },
  
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading data from AsyncStorage', e);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing data from AsyncStorage', e);
    }
  },
  
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error clearing AsyncStorage', e);
    }
  }
};
