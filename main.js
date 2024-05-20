const {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  Menu,
  screen,
} = require("electron");
const { execFile } = require("child_process");
const path = require("path");
// const robot = require('robotjs');
const { io } = require("socket.io-client");
const socket = io.connect("wss://websocket.hm-rdp.com/", {
  transports: ["websocket"],
});

socket.on("mouse_click", (coordinates) => {
  console.log("coordinates are: ", coordinates);
  handleMouseDown(coordinates);
});
app.commandLine.appendSwitch("disable-http-cache");
let lastClickTime = new Date().getTime();
let availableScreens;
let mainWindow;
let displays;

const sendSelectedScreen = (item) => {
  console.log("setting source id to: ", item.id);
  const mainScreen = screen.getPrimaryDisplay();
  const displaySize = mainScreen.size;
  mainWindow.webContents.send("SET_SOURCE_ID", {
    id: item.id,
    dimension: displaySize,
  });
  socket.emit("source_dim", displaySize);
};
const createTray = () => {
  const screensMenu = availableScreens.map((item) => {
    return {
      label: item.name,
      click: () => {
        sendSelectedScreen(item);
      },
    };
  });
  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [{ role: "quit" }],
    },
    // {
    //     label: 'Screens',
    //     submenu: screensMenu
    // }
  ]);

  Menu.setApplicationMenu(menu);
};
const createWindow = () => {
  mainWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  ipcMain.on("GET_SOURCE_ID", (event) => {
    if (availableScreens) {
      const mainScreen = screen.getPrimaryDisplay();
      const displaySize = mainScreen.size;
      event.reply("SET_SOURCE_ID", {
        id: availableScreens[0],
        dimension: displaySize,
      });
    }
  });
  ipcMain.on("JOIN_ROOM", (_event, room_id) => {
    socket.emit("join", room_id);
  });
  ipcMain.on("set-size", (event, size) => {
    const { width, height } = size;
    try {
      console.log("electron dim..", width, height);
      !isNaN(height) && mainWindow.setSize(width, height, false);
    } catch (e) {
      console.log(e);
    }
  });
  // TO-DO: load proper url
  mainWindow.loadURL("https://www.aygen.hm-rdp.com/login", {
    extraHeaders: "pragma: no-cache\n",
  });
  // mainWindow.loadURL("http://localhost:3000/login", {
  //     extraHeaders: "pragma: no-cache\n",
  // });
  mainWindow.once("ready-to-show", () => {
    displays = screen.getAllDisplays();

    mainWindow.show();
    mainWindow.setPosition(0, 0);

    desktopCapturer
      .getSources({
        types: ["screen"],
      })
      .then((sources) => {
        sendSelectedScreen(sources[0]);
        availableScreens = sources;
        createTray();
      });
  });
  // mainWindow.webContents.openDevTools();
};
app.on("ready", () => {
  createWindow();
  console.log("hi");
});

async function handleMouseDown(coordinates) {
  const currentTime = new Date().getTime();
  const timeSinceLastClick = currentTime - lastClickTime;

  const args = [
    Math.round(coordinates.x),
    Math.round(coordinates.y),
    timeSinceLastClick > 0 && timeSinceLastClick < 300,
  ];
  const developmentEnv = true;
  const clickGoPath =
    developmentEnv === true
      ? path.join(__dirname, "bin", "click_go")
      : path.join(process.resourcesPath, "bin", "click_go");
  execFile(clickGoPath, args, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing click_go: ${error}`);
      return;
    }
    if (stdout) {
      console.log(`stdout: ${stdout}`);
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
  });

  lastClickTime = currentTime;
}
