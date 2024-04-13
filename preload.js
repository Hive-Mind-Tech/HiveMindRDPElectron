const { ipcRenderer, contextBridge } = require("electron")

contextBridge.exposeInMainWorld('electronAPI', {
    setSize: (size) => {
        ipcRenderer.send('set-size', size);
    },
    getScreenId: () => {
        ipcRenderer.send('GET_SOURCE_ID');
    },
    setScreenId: (callback) => {
        // console.log("setScreenId function is called, hello from preload.js");
        ipcRenderer.on('SET_SOURCE_ID', (_event, value) => {
            // console.log('Received SET_SOURCE_ID, id: ', value.id);
            // console.log('Received SET_SOURCE_ID, dim:', value.dimension);
            callback(value);
          });
    },
});
