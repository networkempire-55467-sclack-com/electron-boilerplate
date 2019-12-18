'use strict'
const path = require('path')
const {
	app,
	Menu,
	shell,
	dialog
} = require('electron')
const fs = require('fs')
const {
	is,
	appMenu,
	aboutMenuItem
} = require('electron-util')
const log = require('electron-log')
const config = require('./config')

const showPreferences = () => {
	// Show the app's preferences here
}

const dlLog = () => {
	log.log('Dl Log')
	const logPath = dialog.showSaveDialogSync({
		title: 'Sauvegarde du Fichier log',
		filters: [{
			name: 'Texte',
			extensions: ['txt']
		}]
	})
	if (logPath) {
		fs.copyFile(log.transports.file.findLogPath(), logPath, err => {
			if (err) {
				console.error('Erreur dl Log')
				console.error(err)
				log.error('Erreur dl Log')
				log.error(err)
			}
		})
	}
}

// Const exportData = () => {

// };

// const importData = combine => {
// 	if (combine) {

// 	} else {

// 	}
// };

const helpSubmenu = [{
	label: 'Télécharger logs',
	click: () => {
		dlLog()
	}
},
{
	label: 'Contact',
	click: () => {
		shell.openExternal('mailto:vic16@hotmail.be?subject=[Trombinoscope]')
	}
},
{
	type: 'separator'
},
{
	label: 'Version: ' + app.getVersion()
}]

if (!is.macos) {
	helpSubmenu.push({
		type: 'separator'
	},
	aboutMenuItem({
		icon: path.join(__dirname, 'static', 'icon.png'),
		text: 'Created by Victor Santelé'
	})
	)
}

const debugSubmenu = [{
	label: 'Show Settings',
	click() {
		config.openInEditor()
	}
},
{
	label: 'Show App Data',
	click() {
		shell.openItem(app.getPath('userData'))
	}
},
{
	type: 'separator'
},
{
	label: 'Delete Settings',
	click() {
		config.clear()
		app.relaunch()
		app.quit()
	}
},
{
	label: 'Delete App Data',
	click() {
		shell.moveItemToTrash(app.getPath('userData'))
		app.relaunch()
		app.quit()
	}
}]

const macosTemplate = [
	appMenu([{
		label: 'Preferences…',
		accelerator: 'Command+,',
		click() {
			showPreferences()
		}
	}]),
	{
		role: 'fileMenu',
		submenu: [{
			label: 'Custom'
		},
		{
			type: 'separator'
		},
		{
			role: 'close'
		}]
	},
	{
		role: 'editMenu'
	},
	{
		role: 'viewMenu'
	},
	{
		role: 'windowMenu'
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
]

// Linux and Windows
const otherTemplate = [{
	role: 'fileMenu',
	submenu: [{
		label: 'Custom'
	},
	{
		type: 'separator'
	},
	{
		label: 'Settings',
		accelerator: 'Control+,',
		click() {
			showPreferences()
		}
	},
	{
		type: 'separator'
	},
	{
		role: 'quit'
	}]
},
{
	role: 'editMenu'
},
{
	role: 'viewMenu'
},
{
	role: 'help',
	submenu: helpSubmenu
}]

const template = process.platform === 'darwin' ? macosTemplate : otherTemplate

if (is.development) {
	template.push({
		label: 'Debug',
		submenu: debugSubmenu
	})
}

module.exports = Menu.buildFromTemplate(template)
