import {
    NoteFile, Folder,
    getFolders, insertFolder, deleteFolder,
    getFiles, insertFile, deleteFile,
    updateFolder,
    updateFile
} from './supabaseApi';
import { setFileForEditing } from './editFile';
import { setViewFileForEditing } from './viewFile';


let userId = "test-user";

//Folder States
let folders: Folder[] = [];
let displayedFolders: Folder[] = [];

let selectedFolders: Folder[] = [];
let selectedFolder: Folder = {
    folderId: "",
    folderUserId: "",
    parentFolderId: "",
    folderName: "",
};
//FolderStates End

//File States
let files: NoteFile[] = [];
let displayedFiles: NoteFile[] = [];
//FileStates End

// ========== STATES ==========

let isEditMode = true;
let popupState = {
    isOpen: false
};
let deleteMode = false;
let renameMode = false;

// ========== STATES END ==========

// ========== POPUP FUNKTIONEN ==========

export function openPopup(popupId: string) {
    popupState.isOpen = true;

    const popup = document.getElementById(popupId);
    if (popup) {
        popup.classList.add('open');
    }
}
export function closePopup(popupId: string) {
    popupState.isOpen = false;

    const popup = document.getElementById(popupId);
    if (popup) {
        popup.classList.remove('open');
    }
}
export function showPage(pageId: string) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');
}
async function confirmTask(confirmText: string) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmTaskModal');
        const textElement = document.getElementById('confirmTaskText');
        const confirmBtn = document.getElementById('confirmTaskButton');
        const cancelBtn = document.getElementById('cancelTaskButton');

        if (!modal || !textElement || !confirmBtn || !cancelBtn) {
            resolve(null);
            return;
        }
        textElement.textContent = confirmText;
        openPopup('confirmTaskModal');

        const onConfirm = () => {
            cleanup();
            resolve(true);
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            closePopup('confirmTaskModal');
        };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
}
async function textFieldTask(confirmText: string, textFieldValue: string) {
    return new Promise((resolve) => {
        const textField = document.getElementById('textFieldTaskTextField') as HTMLTextAreaElement;
        const textElement = document.getElementById('textFieldTaskText');
        const confirmBtn = document.getElementById('confirmTextFieldTaskButton');
        const cancelBtn = document.getElementById('cancelTextFieldTaskButton');

        if (!textField || !textElement || !confirmBtn || !cancelBtn) {
            resolve(false);
            return;
        }
        textElement.textContent = confirmText;
        textField.value = textFieldValue;
        openPopup('textFieldTaskModal');

        const onConfirm = () => {
            cleanup();
            resolve(textField.value);
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            closePopup('textFieldTaskModal');
        };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// ========== POPUP FUNKTIONEN END ==========

// ========== BUTTON LISTENER (for nonlist Buttons) ==========

const newFolderBtn = document.getElementById('newFolderButton');
if (newFolderBtn) {
    newFolderBtn.onclick = () => {
        openPopup('newFolder-modal');
    };
}
const addFolderConfirm = document.getElementById('addFolderConfirm');
if (addFolderConfirm) {
    addFolderConfirm.onclick = async () => {
        const folderTextField = document.getElementById('folderTextField') as HTMLTextAreaElement;

        const newFolder = await insertFolder({ folderId: crypto.randomUUID(), folderUserId: userId, parentFolderId: selectedFolder.folderId, folderName: folderTextField.value });
        if (newFolder) {
            folders.push(newFolder);
        }
        displayFoldersAndFiles();

        if (folderTextField) {
            folderTextField.value = "";
        }
        closePopup('newFolder-modal');
    };
}
const addFolderDecline = document.getElementById('addFolderDecline');
if (addFolderDecline) {
    addFolderDecline.onclick = () => {
        closePopup('newFolder-modal');
    };
}

const newFileBtn = document.getElementById('newFileButton');
if (newFileBtn) {
    newFileBtn.onclick = () => {
        openPopup('newFile-modal');
    };
}
const addFileConfirm = document.getElementById('addFileConfirm');
if (addFileConfirm) {
    addFileConfirm.onclick = async () => {
        const fileTextField = document.getElementById('fileTextField') as HTMLTextAreaElement;

        const newFile = await insertFile({ fileId: crypto.randomUUID(), fileUserId: userId, parentFolderId: selectedFolder.folderId, fileName: fileTextField.value, fileContent: {} });
        if (newFile) {
            files.push(newFile);
        }
        displayFoldersAndFiles();

        if (fileTextField) {
            fileTextField.value = "";
        }
        closePopup('newFile-modal');
    };
}
const addFileDecline = document.getElementById('addFileDecline');
if (addFileDecline) {
    addFileDecline.onclick = () => {
        closePopup('newFile-modal');
    };
}

const deleteFolderFileButton = document.getElementById('deleteFolderFileButton');
if (deleteFolderFileButton) {
    deleteFolderFileButton.onclick = () => {
        deleteMode = !deleteMode;

        renameMode = false;
        const renameFolderFileButton = document.getElementById('renameFolderFileButton');
        if (renameFolderFileButton) {
            renameFolderFileButton.classList.remove('renameModeActive');
        }

        if (deleteMode) {
            deleteFolderFileButton.classList.add('deleteModeActive');
        } else {
            deleteFolderFileButton.classList.remove('deleteModeActive');
        }
    };
}
const renameFolderFileButton = document.getElementById('renameFolderFileButton');
if (renameFolderFileButton) {
    renameFolderFileButton.onclick = () => {
        renameMode = !renameMode;

        deleteMode = false;
        const deleteFolderFileButton = document.getElementById('deleteFolderFileButton');
        if (deleteFolderFileButton) {
            deleteFolderFileButton.classList.remove('deleteModeActive');
        }

        if (renameMode) {
            renameFolderFileButton.classList.add('renameModeActive');
        } else {
            renameFolderFileButton.classList.remove('renameModeActive');
        }
    };
}

const selectedFolderButton = document.getElementById('selectedFolderButton');
if (selectedFolderButton) {
    selectedFolderButton.onclick = () => {
        selectedFolders.pop();

        // Aktualisiere den aktuell ausgewählten Ordner auf das neue Ende der Liste
        if (selectedFolders.length > 0) {
            selectedFolder = selectedFolders[selectedFolders.length - 1];
        } else {
            // Zurück zur obersten Ebene
            selectedFolder = {
                folderId: "",
                folderUserId: "",
                parentFolderId: "",
                folderName: "",
            };
        }

        displayFoldersAndFiles();
    };
}

const isEditModeButton = document.getElementById('isEditModeButton');
if (isEditModeButton) {
    isEditModeButton.onclick = () => {
        if (isEditMode) {
            isEditModeButton.innerText = "Ansichtsmodus";
            isEditMode = false;
        } else {
            isEditModeButton.innerText = "Bearbeitungsmodus";
            isEditMode = true;
        }
    };
}

// ========== BUTTON LISTENER END (for nonlist Buttons) ==========

// ========== LIST BUTTON LOGIC ==========

async function onFolderButton(folder: Folder) {
    if (deleteMode) {
        if (await confirmTask("Bist du sicher, dass du den Ordner löschen möchtest?")) {
            deleteChildFoldersFiles(folder.folderId);
            displayFoldersAndFiles();
        }

        if (deleteFolderFileButton) {
            deleteFolderFileButton.classList.remove('deleteModeActive');
        }
        deleteMode = false;
    } else if (renameMode) {
        const newFolderName = await textFieldTask("Benenne deinen Ordner", folder.folderName);
        if (typeof newFolderName === 'string' && newFolderName.trim() !== '') {
            folder.folderName = newFolderName;
            await updateFolder(folder);
            displayFoldersAndFiles();
        }

        if (renameFolderFileButton) {
            renameFolderFileButton.classList.remove('renameModeActive');
        }
        renameMode = false;
    } else {
        selectedFolder = folder;
        selectedFolders.push(folder);
        displayFoldersAndFiles();
    }
}
async function onFileButton(file: NoteFile) {
    if (deleteMode) {
        if (await confirmTask("Bist du sicher, dass du die Datei löschen möchtest?")) {
            deleteFile(file.fileId);
            files = files.filter(f => f.fileId !== file.fileId);
            displayFoldersAndFiles();
        }

        if (deleteFolderFileButton) {
            deleteFolderFileButton.classList.remove('deleteModeActive');
        }
        deleteMode = false;
    } else if (renameMode) {
        const newFileName = await textFieldTask("Benenne deine Datei", file.fileName);
        if (typeof newFileName === 'string' && newFileName.trim() !== '') {
            file.fileName = newFileName;
            await updateFile(file);
            displayFoldersAndFiles();
        }

        if (renameFolderFileButton) {
            renameFolderFileButton.classList.remove('renameModeActive');
        }
        renameMode = false;
    } else {
        if (isEditMode) {
            setFileForEditing(file);
            showPage('fileEditPage');
        } else {
            setViewFileForEditing(file);
            showPage('fileViewPage');
        }
    }

}

// ========== LIST BUTTON LOGIC END ==========

// ========== LIST UI DISPLAY ==========

export function displayFoldersAndFiles() {
    const container = document.querySelector('#folderList');
    if (!container) return;

    // Folders
    const existingButtons = container.querySelectorAll('.folderButton');
    existingButtons.forEach(btn => btn.remove());

    displayedFolders = folders.filter(folder => folder.parentFolderId === selectedFolder.folderId);

    displayedFolders.forEach(folder => {
        const button = document.createElement('button');
        button.className = 'folderButton';
        button.innerText = folder.folderName;

        button.onclick = () => {
            onFolderButton(folder);
        };

        container.appendChild(button);
    });

    // Files
    const existingFileButtons = container.querySelectorAll('.fileButton');
    existingFileButtons.forEach(btn => btn.remove());

    displayedFiles = files.filter(file => file.parentFolderId === selectedFolder.folderId);

    displayedFiles.forEach(file => {
        const button = document.createElement('button');
        button.className = 'fileButton';

        // Icon hinzufügen
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'file-text');
        button.appendChild(icon);

        // Text hinzufügen
        const span = document.createElement('span');
        span.innerText = file.fileName;
        button.appendChild(span);

        button.onclick = () => {
            onFileButton(file);
        };

        container.appendChild(button);
    });

    // WICHTIG: Icons neu rendern
    (window as any).lucide.createIcons();


    // Selected folder button
    const selectedFolderButton = document.getElementById('selectedFolderButton');
    if (selectedFolderButton) {
        if (selectedFolders.length > 0) {
            selectedFolderButton.innerText = selectedFolders.map(f => f.folderName).join(' / ');
        } else {
            selectedFolderButton.innerText = "Kein Ordner ausgewählt";
        }
    }
}

// ========== LIST UI DISPLAY END ==========

// ========== LOGIC ==========

function deleteChildFoldersFiles(folderId: string) {
    // 1. Untergeordnete Dateien löschen
    const nestedFiles = files.filter(f => f.parentFolderId === folderId);
    nestedFiles.forEach(file => {
        deleteFile(file.fileId);
    });
    // Dateien aus dem lokalen State entfernen
    files = files.filter(f => f.parentFolderId !== folderId);

    // 2. Untergeordnete Ordner finden und rekursiv löschen
    const nestedFolders = folders.filter(f => f.parentFolderId === folderId);
    nestedFolders.forEach(folder => {
        deleteChildFoldersFiles(folder.folderId);
    });

    // 3. Den aktuellen Ordner löschen
    deleteFolder(folderId);
    folders = folders.filter(folder => folder.folderId !== folderId);
}

// ========== LOGIC END ==========

// ========== INIT ========== 

// Diese Zeile sorgt dafür, dass die Funktion ausgeführt wird, sobald alles geladen ist
window.onload = init;

async function init() {
    folders = await getFolders('test-user');
    files = await getFiles('test-user');

    displayFoldersAndFiles();
    showPage('folderPage');

    // Initialisiert die Lucide Icons
    (window as any).lucide.createIcons();
}

