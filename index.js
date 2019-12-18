'use strict'
const path = require('path')
const {
	app,
	BrowserWindow,
	Menu,
	ipcMain,
	dialog,
	shell
} = require('electron')
/// const {autoUpdater} = require('electron-updater');
const fs = require('fs')
const {
	is
} = require('electron-util')
const unhandled = require('electron-unhandled')
const debug = require('electron-debug')
const contextMenu = require('electron-context-menu')
const log = require('electron-log')
const menu = require('./menu')
const packageJson = require('./package.json')
const neDB = require('./scripts/neDB')

unhandled()
debug()
contextMenu()

app.setAppUserModelId(packageJson.build.appId)

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
let mainWindow; let workerWindow

const createMainWindow = async () => {
	const win = new BrowserWindow({
		title: app.name,
		show: false,
		width: 800,
		height: 600,
		icon: path.join(__dirname, 'static/assets/icons/png/64x64.png'),
		webPreferences: {
			nodeIntegration: true
		}
	})

	win.on('ready-to-show', () => {
		win.show()
	})

	win.on('closed', () => {
		// Dereference the window
		// For multiple windows store them in an array
		mainWindow = undefined
		workerWindow = undefined
	})

	await win.loadFile(path.join(__dirname, 'src', 'index.html'))

	return win
}

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
	app.quit()
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore()
		}

		mainWindow.show()
	}
})

app.on('window-all-closed', () => {
	if (!is.macos) {
		app.quit()
	}
})

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow()
	}
});

(async () => {
	await app.whenReady()
	Menu.setApplicationMenu(menu)
	mainWindow = await createMainWindow()
})()

ipcMain.on('printPDF', async (event, type, users) => {
	try {
		log.log('preparation print PDF')
		workerWindow = new BrowserWindow({
			show: false,
			webPreferences: {
				nodeIntegration: true
			}
		})
		// workerWindow.loadURL(`file://${__dirname}/worker.html`)
		// if(isDev) {
		//   workerWindow.webContents.openDevTools()
		// } else {
		//   workerWindow.hide()
		// }
		workerWindow.on('closed', () => {
			workerWindow = null
		})
		await workerWindow.loadURL(`file://${__dirname}/src/worker.html`)
		workerWindow.on('ready-to-show', () => {
			workerWindow.webContents.send('printPDF', type, users)
		})
	} catch (error) {
		log.error('Erreur ouverture worker')
		log.error(error)
		event.sender.send('sendSnack', 'Erreur envoie information vers pdf')
	}
})

ipcMain.on('readyToPrintPDF', event => {
	log.log('PDF Pret')
	const pdfPath = dialog.showSaveDialogSync({
		title: 'Sauvegarde du Fichier',
		filters: [{
			name: 'PDF',
			extensions: ['pdf']
		}]
	})
	if (pdfPath) {
		log.log(pdfPath)
		const win = BrowserWindow.fromWebContents(event.sender)
		win.webContents.printToPDF({
			pageSize: 'A4',
			landscape: false,
			printBackground: true
		}).then(data => {
			fs.writeFile(pdfPath, data, error => {
				if (error) {
					mainWindow.webContents.send('sendSnack', 'Erreur sauvegarde PDF')
					log.error('Erreur Sauvegarde PDF')
					return log.error(error.message)
				}

				log.log('fichier enregistré : ', pdfPath)
				shell.openExternal('file://' + pdfPath)
				event.sender.send('finish')
			})
		}).catch(error => {
			if (error) {
				log.error('Erreur Print PDF')
				return log.error(error.message)
			}
		})
	}
})

ipcMain.on('ne-delId', async (event, id) => {
	try {
		event.returnValue = await neDB.delId(id)
		log.log('Suppression id: ', id)
	} catch (error) {
		log.error('Erreur Del Id')
		log.error(error)
		event.sender.send('sendSnack', 'Erreur Suppression Membre')
	}
})

ipcMain.on('ne-readAll', async event => {
	try {
		event.returnValue = await neDB.readAll()
	} catch (error) {
		log.error('Erreur readAll')
		log.error(error)
		event.sender.send('sendSnack', 'Erreur Récupération Membre')
	}
})

ipcMain.on('ne-create', async (event, {
	name,
	photo,
	com
}) => {
	try {
		await neDB.create(name, photo, com)
	} catch (error) {
		log.error('Erreur Création Membre')
		log.error(error)
		event.sender.send('sendSnack', 'Erreur Création Membre')
	}
})

ipcMain.on('ne-update', async (event, {
	id,
	name,
	photo,
	com
}) => {
	try {
		await neDB.update(id, name, photo, com)
	} catch (error) {
		log.error('Erreur MAJ Membre')
		log.error(error)
		event.sender.send('sendSnack', 'Erreur Mise à Jour Membre')
	}
})
