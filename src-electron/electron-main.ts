import { app, BrowserWindow, ipcMain, Tray, Menu } from "electron";
import path from "path";
import os from "os";

const platform = process.platform || os.platform();

let mainWindow: BrowserWindow | undefined;
let tray: Tray | null;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"),
    width: 1000,
    height: 600,
    minHeight: 850,
    minWidth: 450,
    useContentSize: true,
    frame: false,
    roundedCorners: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
    },
    autoHideMenuBar: true
  });

  mainWindow.loadURL(process.env.APP_URL);

  if (process.env.DEBUGGING) {
    mainWindow.webContents.openDevTools();
  } else {
    // mainWindow.webContents.on("devtools-opened", () => {
    //   mainWindow?.webContents.closeDevTools();
    // });
  }

  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === undefined) {
    createWindow();
  }
});

ipcMain.on("minimize-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on("maximize-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win?.isMaximized()) {
    win?.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on("close-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

function createTray() {
  if (process.env.DEBUGGING) return;
  const iconPath = path.resolve(__dirname, "icons/tray.png");
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", click: () => mainWindow?.show() },
    { label: "Exit", click: () => app.quit() }
  ]);

  tray.setToolTip("SharinFlame");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}
