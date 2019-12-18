window.addEventListener('DOMContentLoaded', () => {
	console.log(window)
	const sendSnack = (message, timeout, actionHandler, actionText) => {
		const data = {
			message
		}
		window.snackContainer.MaterialSnackbar.showSnackbar(data)
	}
	window.ipcRenderer = require('electron').ipcRenderer
	window.log = require('electron-log')
	window.Cropper = require('cropperjs')
	ipcRenderer.on('wrote-pdf', (event, arg) => {
		log.log(arg)
	})

	ipcRenderer.on('sendSnack', (event, arg) => {
		sendSnack(arg, 2500)
	})
	sendSnack({message: "Test"}, 2500)
})
