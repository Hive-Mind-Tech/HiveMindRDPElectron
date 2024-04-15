const { ipcRenderer, contextBridge } = require("electron")

contextBridge.exposeInMainWorld('electronAPI', {
    setSize: (size) => {
        ipcRenderer.send('set-size', size);
    },
    getScreenId: () => {
        ipcRenderer.send('GET_SOURCE_ID');
    },
    join: (room_id) => {
        ipcRenderer.send('JOIN_ROOM',room_id);
    },
    setScreenId: (callback) => {
        ipcRenderer.on('SET_SOURCE_ID', (_event, value) => {
            callback(value);
          });
    },
});
