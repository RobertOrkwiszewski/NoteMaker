import { Json, NoteFile, updateFile, getImageUrl, insertImage, deleteImage } from "./supabaseApi";
import { openPopup, closePopup, showPage, displayFoldersAndFiles } from "./backend";
import "./editCanvasFile";
import { initCanvasDrawing, Path, DrawingText, DrawingImage } from "./editCanvasFile";

export interface Module {
    type: string;
    content: string;
}

export let selectedFile: NoteFile = {
    fileId: "",
    fileUserId: "",
    parentFolderId: "",
    fileName: "",
    fileContent: [],
};
let selectedFileContent: Module[] = [];

let selectedModuleType: string = ""; // title, subTitle, text, drawing
let selectedModuleIndex: number = 0;

export function setFileForEditing(file: NoteFile) {
    selectedFile = file;
    if (Array.isArray(file.fileContent)) {
        selectedFileContent = file.fileContent as unknown as Module[];
    } else {
        selectedFileContent = [];
    }
    displayFileContent();
}

export async function addSelectedFileContent(module: Module) {
    selectedFileContent.push(module);
    selectedFile.fileContent = selectedFileContent as unknown as Json;
    try {
        await updateFile(selectedFile);
    } catch (error) {
        console.error("Fehler beim Speichern in Supabase", error);
    }
    displayFileContent();
}
export async function editSelectedFileCanvasDrawing(moduleIndex: number, drawingData: Path[]) {
    let contentObj = JSON.parse(selectedFileContent[moduleIndex].content);
    contentObj.drawingData = drawingData;
    selectedFileContent[moduleIndex].content = JSON.stringify(contentObj);

    selectedFile.fileContent = selectedFileContent as unknown as Json;

    try {
        await updateFile(selectedFile);
    } catch (error) {
        console.error("Fehler beim Speichern in Supabase", error);
    }
}
export async function editSelectedFileCanvasImage(moduleIndex: number, imageData: DrawingImage[]) {
    let contentObj = JSON.parse(selectedFileContent[moduleIndex].content);
    contentObj.imageData = imageData;
    selectedFileContent[moduleIndex].content = JSON.stringify(contentObj);

    selectedFile.fileContent = selectedFileContent as unknown as Json;

    try {
        await updateFile(selectedFile);
    } catch (error) {
        console.error("Fehler beim Speichern in Supabase", error);
    }
}
export async function editSelectedFileCanvasText(moduleIndex: number, textData: DrawingText[]) {
    let contentObj = JSON.parse(selectedFileContent[moduleIndex].content);
    contentObj.textData = textData;
    selectedFileContent[moduleIndex].content = JSON.stringify(contentObj);

    selectedFile.fileContent = selectedFileContent as unknown as Json;

    try {
        await updateFile(selectedFile);
    } catch (error) {
        console.error("Fehler beim Speichern in Supabase", error);
    }
}


// ========== BUTTON LISTENER (for nonlist Buttons) ==========

const navigateToFolderButton = document.getElementById('navigateToFolderButton');
if (navigateToFolderButton) {
    navigateToFolderButton.onclick = () => {
        showPage('folderPage');
        displayFoldersAndFiles();
    };
}
// Add Module Buttons
const addModuleBtn = document.getElementById('addModuleButton');
if (addModuleBtn) {
    addModuleBtn.onclick = () => {
        openPopup('addModule-modal');
    };
}
const addModuleTitleBtn = document.getElementById('addModuleTitle');
if (addModuleTitleBtn) {
    addModuleTitleBtn.onclick = () => {
        closePopup('addModule-modal');
        selectedModuleType = "title";
        openPopup('addModuleText-modal');
    };
}
const addModuleSubTitleBtn = document.getElementById('addModuleSubTitle');
if (addModuleSubTitleBtn) {
    addModuleSubTitleBtn.onclick = () => {
        closePopup('addModule-modal');
        selectedModuleType = "subTitle";
        openPopup('addModuleText-modal');
    };
}
const addModuleTextBtn = document.getElementById('addModuleText');
if (addModuleTextBtn) {
    addModuleTextBtn.onclick = () => {
        closePopup('addModule-modal');
        selectedModuleType = "text";
        openPopup('addModuleText-modal');
    };
}
const addModuleDrawingBtn = document.getElementById('addModuleDrawing');
if (addModuleDrawingBtn) {
    addModuleDrawingBtn.onclick = () => {
        closePopup('addModule-modal');
        selectedModuleType = "drawing";
        openPopup('addModuleDrawing-modal');
    };
}
const addModuleImageBtn = document.getElementById('addModuleImage');
if (addModuleImageBtn) {
    addModuleImageBtn.onclick = () => {
        closePopup('addModule-modal');
        selectedModuleType = "image";

        openPopup('addModuleImage-modal');
    };
}
const addImageModuleDeclineBtn = document.getElementById('addImageModuleDecline');
if (addImageModuleDeclineBtn) {
    addImageModuleDeclineBtn.onclick = () => {
        closePopup('addModuleImage-modal');
    };
}
const addImageModuleConfirmBtn = document.getElementById('addImageModuleConfirm');
if (addImageModuleConfirmBtn) {
    addImageModuleConfirmBtn.onclick = () => {
        closePopup('addModuleImage-modal');

        const imageInput = document.getElementById('imageInput') as HTMLInputElement;
        if (imageInput) {
            imageInput.click();
        }
    };
}
const imageInput = document.getElementById('imageInput') as HTMLInputElement;
if (imageInput) {
    imageInput.onchange = async () => {
        const imageRatio = parseFloat((document.getElementById('imageModuleTextField') as HTMLTextAreaElement).value);
        if (imageInput.files && imageInput.files.length > 0 && imageRatio > 0 && imageRatio < 10) {
            const file = imageInput.files[0];
            const fileExtension = file.name.split('.').pop();
            const imageId = `${crypto.randomUUID()}.${fileExtension}`;

            try {
                await insertImage(file, imageId);

                await addSelectedFileContent({
                    type: "image",
                    content: JSON.stringify({ imageId: imageId, imageRatio: imageRatio })
                });
            } catch (error) {
                console.error("Fehler beim Hochladen:", error);
            }

            imageInput.value = "";
        }
    };
}


const addTextModuleConfirmBtn = document.getElementById('addTextModuleConfirm');
if (addTextModuleConfirmBtn) {
    addTextModuleConfirmBtn.onclick = async () => {
        closePopup('addModuleText-modal');
        const textModuleTextField = document.getElementById('textModuleTextField') as HTMLTextAreaElement;

        if (textModuleTextField) {
            if (selectedModuleType === "title") {
                selectedFileContent.push({ type: "title", content: textModuleTextField.value });
            } else if (selectedModuleType === "subTitle") {
                selectedFileContent.push({ type: "subTitle", content: textModuleTextField.value });
            } else if (selectedModuleType === "text") {
                selectedFileContent.push({ type: "text", content: textModuleTextField.value });
            }

            // Set the content as JSON list in selectedFile
            selectedFile.fileContent = selectedFileContent as unknown as Json;

            // Assuming we must save immediately to Supabase
            try {
                await updateFile(selectedFile);
            } catch (error) {
                console.error("Fehler beim Speichern in Supabase", error);
            }

            textModuleTextField.value = "";
            displayFileContent();
        }
    };
}
const addTextModuleDeclineBtn = document.getElementById('addTextModuleDecline');
if (addTextModuleDeclineBtn) {
    addTextModuleDeclineBtn.onclick = () => {
        closePopup('addModuleText-modal');
    };
}

// ========== BUTTON LISTENER END (for nonlist Buttons) ==========

// ========== BUTTON LISTENER EDIT MODULE (for nonlist Buttons) ==========

const editModuleMoveUpBtns = document.querySelectorAll('.editModuleMoveUp');
editModuleMoveUpBtns.forEach((btn) => {
    (btn as HTMLButtonElement).onclick = async () => {
        var selectedModule = selectedFileContent[selectedModuleIndex];
        var changeModule = selectedFileContent[selectedModuleIndex - 1];
        if (selectedModuleIndex > 0) {
            selectedFileContent.splice(selectedModuleIndex, 1, changeModule);
            selectedFileContent.splice(selectedModuleIndex - 1, 1, selectedModule);
            selectedFile.fileContent = selectedFileContent as unknown as Json;
            try {
                await updateFile(selectedFile);
            } catch (error) {
                console.error("Fehler beim Speichern in Supabase", error);
            }
        }
        closePopup('editModule-modal');
        closePopup('editTextModule-modal');
        displayFileContent();
    };
});
const editModuleMoveDownBtns = document.querySelectorAll('.editModuleMoveDown');
editModuleMoveDownBtns.forEach((btn) => {
    (btn as HTMLButtonElement).onclick = async () => {
        var selectedModule = selectedFileContent[selectedModuleIndex];
        var changeModule = selectedFileContent[selectedModuleIndex + 1];
        if (selectedModuleIndex < selectedFileContent.length - 1) {
            selectedFileContent.splice(selectedModuleIndex, 1, changeModule);
            selectedFileContent.splice(selectedModuleIndex + 1, 1, selectedModule);
            selectedFile.fileContent = selectedFileContent as unknown as Json;
            try {
                await updateFile(selectedFile);
            } catch (error) {
                console.error("Fehler beim Speichern in Supabase", error);
            }
        }
        closePopup('editModule-modal');
        closePopup('editTextModule-modal');
        displayFileContent();
    };
});
const editModuleDeclineBtns = document.querySelectorAll('.editModuleDecline');
editModuleDeclineBtns.forEach((btn) => {
    (btn as HTMLButtonElement).onclick = () => {
        closePopup('editTextModule-modal');
        closePopup('editModule-modal');
    };
});
const editModuleDeleteBtns = document.querySelectorAll('.editModuleDelete');
editModuleDeleteBtns.forEach((btn) => {
    (btn as HTMLButtonElement).onclick = async () => {
        if (selectedModuleType === "image") {
            await deleteImage(selectedFileContent[selectedModuleIndex].content);
        }

        selectedFileContent.splice(selectedModuleIndex, 1);
        selectedFile.fileContent = selectedFileContent as unknown as Json;
        try {
            await updateFile(selectedFile);
        } catch (error) {
            console.error("Fehler beim Speichern in Supabase", error);
        }
        closePopup('editTextModule-modal');
        closePopup('editModule-modal');
        displayFileContent();
    };
});
// COMMON END


const editTextModuleSaveBtn = document.getElementById('editTextModuleSave');
if (editTextModuleSaveBtn) {
    editTextModuleSaveBtn.onclick = async () => {
        const editTextModuleTextField = document.getElementById('editTextModuleTextField') as HTMLTextAreaElement;
        if (editTextModuleTextField) {
            selectedFileContent[selectedModuleIndex].content = editTextModuleTextField.value;
        }
        selectedFile.fileContent = selectedFileContent as unknown as Json;
        try {
            await updateFile(selectedFile);
        } catch (error) {
            console.error("Fehler beim Speichern in Supabase", error);
        }
        closePopup('editTextModule-modal');
        displayFileContent();
    };
}


// ========== BUTTON LISTENER EDIT MODULE END (for nonlist Buttons) ==========

// ========== LIST UI DISPLAY ==========

function displayFileContent() {
    const container = document.querySelector('#fileEditListDiv');
    if (!container) return;

    container.innerHTML = "";

    selectedFileContent.forEach((module, index) => {
        if (module.type === "drawing") {
            const settingsContainer = document.createElement('div');
            settingsContainer.classList.add('canvasSettingsContainer');

            const editCanvasButton = document.createElement('button');
            editCanvasButton.classList.add('canvasEditButton');
            editCanvasButton.classList.add('canvasButton');
            const editCanvasIcon = document.createElement('i');
            editCanvasIcon.setAttribute('data-lucide', 'settings');
            editCanvasButton.appendChild(editCanvasIcon);
            editCanvasButton.onclick = () => {
                selectedModuleIndex = index;
                openPopup('editModule-modal');
            };

            const addImageCanvasInput = document.createElement('input');
            addImageCanvasInput.setAttribute('type', 'file');
            addImageCanvasInput.setAttribute('accept', 'image/*');
            addImageCanvasInput.classList.add('canvasAddImageInput');

            const addImageCanvasButton = document.createElement('button');
            addImageCanvasButton.classList.add('canvasAddImageButton');
            addImageCanvasButton.classList.add('canvasButton');
            const addImageIcon = document.createElement('i');
            addImageIcon.setAttribute('data-lucide', 'image');
            addImageCanvasButton.appendChild(addImageIcon);
            addImageCanvasButton.onclick = () => {
                addImageCanvasInput.click();
            };

            const selectCanvasButton = document.createElement('button');
            selectCanvasButton.classList.add('canvasSelectButton');
            selectCanvasButton.classList.add('canvasButton');
            const selectCanvasIcon = document.createElement('i');
            selectCanvasIcon.setAttribute('data-lucide', 'mouse-pointer');
            selectCanvasButton.appendChild(selectCanvasIcon);

            const pencilButton = document.createElement('button');
            pencilButton.classList.add('canvasPencilButton');
            pencilButton.classList.add('canvasButton');
            const pencilIcon = document.createElement('i');
            pencilIcon.setAttribute('data-lucide', 'pencil');
            pencilButton.appendChild(pencilIcon);

            const pencilSettingsButton = document.createElement('button');
            pencilSettingsButton.classList.add('canvasPencilSettingsButton');
            pencilSettingsButton.classList.add('canvasButton');
            const pencilSettingsIcon = document.createElement('i');
            pencilSettingsIcon.setAttribute('data-lucide', 'pipette');
            pencilSettingsButton.appendChild(pencilSettingsIcon);

            const pencilForwardCanvasButton = document.createElement('button');
            pencilForwardCanvasButton.classList.add('pencilForwardCanvasButton');
            pencilForwardCanvasButton.classList.add('canvasButton');
            const pencilForwardCanvasIcon = document.createElement('i');
            pencilForwardCanvasIcon.setAttribute('data-lucide', 'arrow-right');
            pencilForwardCanvasButton.appendChild(pencilForwardCanvasIcon);

            const pencilBackCanvasButton = document.createElement('button');
            pencilBackCanvasButton.classList.add('pencilBackCanvasButton');
            pencilBackCanvasButton.classList.add('canvasButton');
            const pencilBackCanvasIcon = document.createElement('i');
            pencilBackCanvasIcon.setAttribute('data-lucide', 'arrow-left');
            pencilBackCanvasButton.appendChild(pencilBackCanvasIcon);

            const addTextCanvasButton = document.createElement('button');
            addTextCanvasButton.classList.add('addTextCanvasButton');
            addTextCanvasButton.classList.add('canvasButton');
            const addTextCanvasIcon = document.createElement('i');
            addTextCanvasIcon.setAttribute('data-lucide', 'type');
            addTextCanvasButton.appendChild(addTextCanvasIcon);

            const editTextCanvasButton = document.createElement('button');
            editTextCanvasButton.classList.add('editTextCanvasButton');
            editTextCanvasButton.classList.add('canvasButton');
            const editTextCanvasIcon = document.createElement('i');
            editTextCanvasIcon.setAttribute('data-lucide', 'highlighter');
            editTextCanvasButton.appendChild(editTextCanvasIcon);

            settingsContainer.appendChild(editCanvasButton);
            settingsContainer.appendChild(addImageCanvasButton);
            settingsContainer.appendChild(selectCanvasButton);
            settingsContainer.appendChild(pencilButton);
            settingsContainer.appendChild(pencilBackCanvasButton);
            settingsContainer.appendChild(pencilForwardCanvasButton);
            settingsContainer.appendChild(pencilSettingsButton);
            settingsContainer.appendChild(addTextCanvasButton);
            settingsContainer.appendChild(editTextCanvasButton);

            const moduleElement = document.createElement('canvas');
            const drawingDataObj = JSON.parse(module.content);
            moduleElement.width = drawingDataObj.width;
            moduleElement.height = drawingDataObj.height;
            moduleElement.classList.add('moduleCanvas');
            initCanvasDrawing(pencilButton, pencilSettingsButton, selectCanvasButton, addImageCanvasInput, editTextCanvasButton, addTextCanvasButton, pencilBackCanvasButton, pencilForwardCanvasButton, moduleElement, index, drawingDataObj.drawingData, drawingDataObj.imageData, drawingDataObj.textData, drawingDataObj.width, drawingDataObj.height);

            // Füge Einstellungen und Canvas zum Container hinzu
            container.appendChild(settingsContainer);
            container.appendChild(moduleElement);
        } else if (module.type === "image") {
            const imgDataJson = JSON.parse(module.content);
            const imgElement = document.createElement('img');
            imgElement.src = getImageUrl(imgDataJson.imageId);
            imgElement.classList.add('moduleImage');
            imgElement.onload = () => {
                imgElement.style.width = `${imgElement.naturalWidth * imgDataJson.imageRatio}px`;
            };

            imgElement.onclick = () => {
                selectedModuleIndex = index;
                openPopup('editModule-modal');
            };

            container.appendChild(imgElement);
        } else {
            const moduleElement = document.createElement('text');
            if (module.type === "title") {
                moduleElement.classList.add('moduleTitle');
            } else if (module.type === "subTitle") {
                moduleElement.classList.add('moduleSubTitle');
            } else if (module.type === "text") {
                moduleElement.classList.add('moduleText');
            }
            moduleElement.textContent = module.content;
            moduleElement.style.whiteSpace = 'pre-wrap';
            moduleElement.onclick = () => {
                selectedModuleIndex = index;
                const editModuleTextField = document.getElementById('editTextModuleTextField') as HTMLTextAreaElement;
                if (editModuleTextField) {
                    editModuleTextField.value = module.content;
                }
                openPopup('editTextModule-modal');
            };

            container.appendChild(moduleElement);
        }
    });

    if (typeof (window as any).lucide !== 'undefined') {
        (window as any).lucide.createIcons();
    }
}

// ========== LIST UI DISPLAY END ==========