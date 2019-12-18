const {
	dialog,
	shell
} = require('electron').remote
const ipcRenderer = require('electron').ipcRenderer
const log = require('electron-log')
const Cropper = require('cropperjs')
const ClassicEditor = require("./static/scripts/ckeditor.js")
// const neDB = require('./neDB')
const userIcon = './userIcon.png'
var img = document.getElementById("img"), // Btn sélection photo
	fileElem = document.getElementById("fileElem"), // input photo
	fileSelect = document.getElementById('fileSelect'), //button charger photo
	formAdd = document.getElementById('formAdd'), // formulaire photo
	btnCrop = document.getElementById('btnCrop'), // btn crop photo
	imgOut = document.getElementById('imgOut'), // image de sortie
	diaImg = document.getElementById('diaImg'), // dialog crop image
	diaList = document.getElementById('diaList'), // dialog list users
	btnCancelAdd = document.getElementById('cancelAdd'),
	btnList = document.getElementById('btnList'),
	list = document.getElementById('list'),
	listMembers = document.getElementById('listMembers'),
	btnAdd = document.getElementById('btnAdd'),
	diaUser = document.getElementById('diaUser'),
	snackContainer = document.getElementById('snackbar'),
	search = document.getElementById("search"),
	clearSearch = document.getElementById("clearSearch")
var cropper, editId, editor;
document.getElementById('name').oninput = e => {
	if (e.target.value !== '') document.getElementById('submit').disabled = false
	else document.getElementById('submit').disabled = true
}

ClassicEditor
	.create(document.querySelector('#editor'), {
		fontColor: {
				colors: [
						{
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
						},

						// ...
				]
		},
		fontBackgroundColor: {
				colors: [
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
						},

						// ...
				]
		}
	})
	.then(edit => editor = edit)
	.catch(error => {
		log.error("Erreur Editeur: ", error)
	});

const sendSnack = (message, timeout, actionHandler, actionText) => {
	const data = {
		message
	}
	snackContainer.MaterialSnackbar.showSnackbar(data)
}

btnAdd.addEventListener('click', () => {
	showUserForm('add')
})

const showUserForm = (type, user) => {
	let valider = document.getElementById('valider')
	let input = document.createElement('input')
	if (formAdd.name.value !== '') document.getElementById('submit').disabled = false
	else document.getElementById('submit').disabled = true
	if (type === 'add') {
		// imgOut.src = userIcon
		imgOut.src = './userIcon.png'
		formAdd.name.value = null
		editor.setData("");
		formAdd.onsubmit = e => {
			e.preventDefault()
			submit(e.target, type)
		}
	} else if (type === 'edit') {
		formAdd.idUser.value = user._id
		formAdd.name.value = user.name
		editor.setData(user.comment)
		if (formAdd.name.value !== '') document.getElementById('submit').disabled = false
		else document.getElementById('submit').disabled = true
		imgOut.src = user.photo !== undefined ? user.photo : userIcon
		formAdd.onsubmit = e => {
			e.preventDefault()
			submit(e.target, type)
		}
	}
	diaUser.showModal()
}

var del = (id) => {
	if (confirm("Êtes-vous sûr de vouloir supprimer ce membre?")) {
		ipcRenderer.send('ne-delId', id)
		createList()
	}
}

const edit = user => {
	showUserForm('edit', user)
}

fileSelect.addEventListener("click", function (e) {
	if (fileElem) {
		fileElem.click();
	}
}, false);

const createUser = (user) => {
	let li = document.createElement('li') // ligne
	li.className = "mdl-list__item"

	let span1 = document.createElement('span') // contenu primaire gauche (nom + photo)
	span1.className = "mdl-list__item-primary-content"
	if (user.photo !== undefined) {

		let img = document.createElement('img') // img
		img.src = user.photo || ""
		img.className = 'mdl-list__item-avatar'
		span1.appendChild(img)
	} else {
		let i = document.createElement('i')
		i.className = "material-icons mdl-list__item-avatar"
		i.textContent = "person"
		span1.appendChild(i)
	}
	let text = document.createElement('span') // name
	text.textContent = user.name
	span1.appendChild(text)

	li.appendChild(span1)

	let span2 = document.createElement('span') // contenu secondaire droite (bouton)
	span2.className = "mdl-list__item-secondary-action"

	let btnEdit = document.createElement('button') // butron edit
	btnEdit.className = "mdl-button mdl-js-button mdl-button--icon mdl-button--colored mdl-js-ripple-effect"
	btnEdit.addEventListener('click', () => {
		edit(user)
	})
	let iEdit = document.createElement('i')
	iEdit.className = "material-icons"
	iEdit.textContent = "edit"
	btnEdit.appendChild(iEdit)
	span2.appendChild(btnEdit)

	let btnDel = document.createElement('button') // button delete
	btnDel.className = "mdl-button mdl-js-button mdl-button--icon mdl-button--colored mdl-js-ripple-effect"
	btnDel.addEventListener('click', () => {
		del(user._id)
	})
	let iDel = document.createElement('i') // icon delete
	iDel.className = "material-icons"
	iDel.textContent = "delete"
	btnDel.appendChild(iDel)
	span2.appendChild(btnDel)
	li.appendChild(span2)
	return li
}

const createList = async (filter = search.value) => {
	try {
		listMembers.innerHTML = ''
		const users = await ipcRenderer.sendSync('ne-readAll')
		if (users.length === 0) {
			listMembers.innerHTML = 'Aucun membre pour le moment, pour en ajouter cliquez sur "Ajouter un membre"'
		} else {
			await users.filter((user) => user.name.includes(filter)).forEach(user => {
				listMembers.appendChild(createUser(user))
			})
		}
	} catch (error) {
		log.error('Erreur création liste membre')
		log.error(error)
		sendSnack("Erreur Lecture", 2500)
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

var closeModalImg = () => {
	diaImg.close()
	if (cropper) {
		cropper.destroy()
		cropper = null
	}
}

var closeModalList = () => {
	search.value = ''
	diaList.close()
}

const closeModalUser = () => {
	formAdd.name.value = null
	editor.setData("")
	imgOut.src = '#'
	diaUser.close()
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
	if (event.target == diaList) {
		closeModalList()
	}
	if (event.target == diaUser) {
		closeModalUser()
	}
}

btnCancelAdd.addEventListener('click', e => {
	closeModalUser()
})

fileElem.addEventListener('change', e => {
	var files = e.target.files
	var photoResize
	var done = url => {
		diaImg.showModal()
		fileElem.value = ''
		img.src = url
		cropper = new Cropper(img, {
			aspectRatio: 1
		})
	}
	var reader, file, url
	if (files && files.length > 0) {
		file = files[0];
		if (URL) {
			done(URL.createObjectURL(file))
		} else if (FileReader) {
			reader = new FileReader()
			reader.onload = e => {
				done(reader.result)
			}
			reader.readAsDataURL(file)
		}
	}
})

btnCrop.addEventListener('click', () => {
	var canvas
	if (cropper) {
		canvas = cropper.getCroppedCanvas({
			width: 100,
			height: 100
		})
		imgOut.src = canvas.toDataURL()
		closeModalImg()
	}
})



let submit = async (form, type) => {
	const startData = /^data/
	let photo = startData.test(imgOut.src) ? imgOut.src : undefined
	try {
		if (type === "add") {
			await ipcRenderer.send('ne-create', {name: form.name.value, photo, com: editor.getData()})
			await sendSnack('Membre Ajouté', 2500)
		} else if (type === "edit") {
			await ipcRenderer.send('ne-update',{id: form.idUser.value, name: form.name.value, photo, com: editor.getData()})
			await sendSnack('Membre mis à jour', 2500)
			diaUser.close()
			createList()
		}
		form.name.value = ''
		editor.setData("")
		imgOut.src = "./userIcon.png"
		if (formAdd.name.value !== '') document.getElementById('submit').disabled = false
		else document.getElementById('submit').disabled = true
	} catch (error) {
		log.error('Erreur submit: ')
		log.error(error)
		sendSnack("Erreur enregistrement", 2500)
	}
}

search.addEventListener("input", (e) => {
	createList(e.target.value)
})
clearSearch.addEventListener("click", () => {
	search.value = ''
	createList()
})

var formPDF = document.getElementById('tableau') // form générate pdf
formPDF.addEventListener('submit', async e => {
	// submit create pdf
	e.preventDefault()
	try {
		const type = e.target.type.value
		const users = await ipcRenderer.sendSync('ne-readAll')
		ipcRenderer.send('printPDF', type, users)
	} catch (error) {
		log.error("Erreur génération pdf")
		log.error(error)
	}
})

ipcRenderer.on('wrote-pdf', (event, arg) => {
	log.log(arg)
})

ipcRenderer.on('sendSnack', (event, arg) => {
	sendSnack(arg, 2500)
})