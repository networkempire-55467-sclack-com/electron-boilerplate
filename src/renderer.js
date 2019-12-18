const {ipcRenderer} = require('electron')
const log = require('electron-log')
const Cropper = require('cropperjs')
const ClassicEditor = require('./static/scripts/ckeditor.js')
// Const neDB = require('./neDB')
const userIcon = './userIcon.png'
const img = document.querySelector('#img') // Btn sélection photo
const fileElem = document.querySelector('#fileElem') // Input photo
const fileSelect = document.querySelector('#fileSelect') // Button charger photo
const formAdd = document.querySelector('#formAdd') // Formulaire photo
const btnCrop = document.querySelector('#btnCrop') // Btn crop photo
const imgOut = document.querySelector('#imgOut') // Image de sortie
const diaImg = document.querySelector('#diaImg') // Dialog crop image
const diaList = document.querySelector('#diaList') // Dialog list users
const btnCancelAdd = document.querySelector('#cancelAdd')
const listMembers = document.querySelector('#listMembers')
const btnAdd = document.querySelector('#btnAdd')
const diaUser = document.querySelector('#diaUser')
const snackContainer = document.querySelector('#snackbar')
const search = document.querySelector('#search')
const clearSearch = document.querySelector('#clearSearch')
let cropper
let editor
document.querySelector('#name').addEventListener('input', e => {
	document.querySelector('#submit').disabled = e.target.value === ''
})

ClassicEditor
	.create(document.querySelector('#editor'), {
		fontColor: {
			colors: [{
				color: 'hsl(0, 0%, 0%)',
				label: 'Black'
			},
			{
				color: 'hsl(0, 75%, 60%)',
				label: 'Red'
			},
			{
				color: 'hsl(30, 75%, 60%)',
				label: 'Orange'
			},
			{
				color: 'hsl(60, 75%, 60%)',
				label: 'Yellow'
			},
			{
				color: 'hsl(90, 75%, 60%)',
				label: 'Light green'
			},
			{
				color: 'hsl(120, 75%, 60%)',
				label: 'Green'
			}]
		},
		fontBackgroundColor: {
			colors: [{
				color: 'hsl(0, 75%, 60%)',
				label: 'Red'
			},
			{
				color: 'hsl(30, 75%, 60%)',
				label: 'Orange'
			},
			{
				color: 'hsl(60, 75%, 60%)',
				label: 'Yellow'
			},
			{
				color: 'hsl(90, 75%, 60%)',
				label: 'Light green'
			},
			{
				color: 'hsl(120, 75%, 60%)',
				label: 'Green'
			}]
		}
	})
	.then(edit => {
		editor = edit
	})
	.catch(error => {
		log.error('Erreur Editeur: ', error)
	})

const sendSnack = (message, timeout, actionHandler, actionText) => {
	const data = {
		message
	}
	snackContainer.MaterialSnackbar.showSnackbar(data, timeout, actionHandler, actionText)
}

btnAdd.addEventListener('click', () => {
	showUserForm('add')
})

const showUserForm = (type, user) => {
	document.querySelector('#submit').disabled = formAdd.name.value === ''

	if (type === 'add') {
		// ImgOut.src = userIcon
		imgOut.src = './userIcon.png'
		formAdd.name.value = null
		editor.setData('')
		formAdd.addEventListener('submit', e => {
			e.preventDefault()
			submit(e.target, type)
		})
	} else if (type === 'edit') {
		formAdd.idUser.value = user._id
		formAdd.name.value = user.name
		editor.setData(user.comment)
		document.querySelector('#submit').disabled = formAdd.name.value === ''
		imgOut.src = user.photo === undefined ? userIcon : user.photo
		formAdd.addEventListener('submit', e => {
			e.preventDefault()
			submit(e.target, type)
		})
	}

	diaUser.showModal()
}

const del = id => {
	if (confirm('Êtes-vous sûr de vouloir supprimer ce membre?')) {
		ipcRenderer.send('ne-delId', id)
		createList()
	}
}

const edit = user => {
	showUserForm('edit', user)
}

fileSelect.addEventListener('click', () => {
	if (fileElem) {
		fileElem.click()
	}
}, false)

const createUser = user => {
	const li = document.createElement('li') // Ligne
	li.className = 'mdl-list__item'

	const span1 = document.createElement('span') // Contenu primaire gauche (nom + photo)
	span1.className = 'mdl-list__item-primary-content'
	if (user.photo === undefined) {
		const i = document.createElement('i')
		i.className = 'material-icons mdl-list__item-avatar'
		i.textContent = 'person'
		span1.append(i)
	} else {
		const img = document.createElement('img') // Img
		img.src = user.photo || ''
		img.className = 'mdl-list__item-avatar'
		span1.append(img)
	}

	const text = document.createElement('span') // Name
	text.textContent = user.name
	span1.append(text)

	li.append(span1)

	const span2 = document.createElement('span') // Contenu secondaire droite (bouton)
	span2.className = 'mdl-list__item-secondary-action'

	const btnEdit = document.createElement('button') // Butron edit
	btnEdit.className = 'mdl-button mdl-js-button mdl-button--icon mdl-button--colored mdl-js-ripple-effect'
	btnEdit.addEventListener('click', () => {
		edit(user)
	})
	const iEdit = document.createElement('i')
	iEdit.className = 'material-icons'
	iEdit.textContent = 'edit'
	btnEdit.append(iEdit)
	span2.append(btnEdit)

	const btnDel = document.createElement('button') // Button delete
	btnDel.className = 'mdl-button mdl-js-button mdl-button--icon mdl-button--colored mdl-js-ripple-effect'
	btnDel.addEventListener('click', () => {
		del(user._id)
	})
	const iDel = document.createElement('i') // Icon delete
	iDel.className = 'material-icons'
	iDel.textContent = 'delete'
	btnDel.append(iDel)
	span2.append(btnDel)
	li.append(span2)
	return li
}

const createList = async (filter = search.value) => {
	try {
		listMembers.innerHTML = ''
		const users = await ipcRenderer.sendSync('ne-readAll')
		if (users.length === 0) {
			listMembers.innerHTML = 'Aucun membre pour le moment, pour en ajouter cliquez sur "Ajouter un membre"'
		} else {
			await users.filter(user => user.name.includes(filter)).forEach(user => {
				listMembers.append(createUser(user))
			})
		}
	} catch (error) {
		log.error('Erreur création liste membre')
		log.error(error)
		sendSnack('Erreur Lecture', 2500)
	}
}

const showList = async () => {
	try {
		await createList()
		await diaList.showModal()
	} catch (error) {
		console.error(error)
	}
}

const closeModalImg = () => {
	diaImg.close()
	if (cropper) {
		cropper.destroy()
		cropper = null
	}
}

const closeModalList = () => {
	search.value = ''
	diaList.close()
}

const closeModalUser = () => {
	formAdd.name.value = null
	editor.setData('')
	imgOut.src = '#'
	diaUser.close()
}

// When the user clicks anywhere outside of the modal, close it
window.addEventListener('click', event => {
	if (event.target === diaList) {
		closeModalList()
	}

	if (event.target === diaUser) {
		closeModalUser()
	}
})

btnCancelAdd.addEventListener('click', () => {
	closeModalUser()
})

fileElem.addEventListener('change', e => {
	const {files} = e.target
	const done = url => {
		diaImg.showModal()
		fileElem.value = ''
		img.src = url
		cropper = new Cropper(img, {
			aspectRatio: 1
		})
	}

	let reader
	let file
	if (files && files.length > 0) {
		file = files[0]
		if (URL) {
			done(URL.createObjectURL(file))
		} else if (FileReader) {
			reader = new FileReader()
			reader.addEventListener('load', () => {
				done(reader.result)
			})
			reader.readAsDataURL(file)
		}
	}
})

btnCrop.addEventListener('click', () => {
	let canvas
	if (cropper) {
		canvas = cropper.getCroppedCanvas({
			width: 100,
			height: 100
		})
		imgOut.src = canvas.toDataURL()
		closeModalImg()
	}
})

const submit = async (form, type) => {
	const startData = /^data/
	const photo = startData.test(imgOut.src) ? imgOut.src : undefined
	try {
		if (type === 'add') {
			await ipcRenderer.send('ne-create', {
				name: form.name.value,
				photo,
				com: editor.getData()
			})
			await sendSnack('Membre Ajouté', 2500)
		} else if (type === 'edit') {
			await ipcRenderer.send('ne-update', {
				id: form.idUser.value,
				name: form.name.value,
				photo,
				com: editor.getData()
			})
			await sendSnack('Membre mis à jour', 2500)
			diaUser.close()
			createList()
		}

		form.name.value = ''
		editor.setData('')
		imgOut.src = './userIcon.png'
		document.querySelector('#submit').disabled = formAdd.name.value === ''
	} catch (error) {
		log.error('Erreur submit: ')
		log.error(error)
		sendSnack('Erreur enregistrement', 2500)
	}
}

search.addEventListener('input', e => {
	createList(e.target.value)
})
clearSearch.addEventListener('click', () => {
	search.value = ''
	createList()
})

const formPDF = document.querySelector('#tableau') // Form générate pdf
formPDF.addEventListener('submit', async e => {
	// Submit create pdf
	e.preventDefault()
	try {
		const type = e.target.type.value
		const users = await ipcRenderer.sendSync('ne-readAll')
		ipcRenderer.send('printPDF', type, users)
	} catch (error) {
		log.error('Erreur génération pdf')
		log.error(error)
	}
})

ipcRenderer.on('wrote-pdf', (event, arg) => {
	log.log(arg)
})

ipcRenderer.on('sendSnack', (event, arg) => {
	sendSnack(arg, 2500)
})
