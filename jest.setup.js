// AsyncStorage hat in Jest kein natives Modul – offiziellen Mock verwenden.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
