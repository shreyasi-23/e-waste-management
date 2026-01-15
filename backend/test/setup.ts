// Mock localStorage for Node environment (required by @google/generative-ai)
if (typeof global !== 'undefined' && typeof (global as any).localStorage === 'undefined') {
  const mockStorage: { [key: string]: string } = {};

  (global as any).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    },
    key: (index: number) => {
      const keys = Object.keys(mockStorage);
      return keys[index] || null;
    },
    length: Object.keys(mockStorage).length,
  };
}
