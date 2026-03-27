import { displayFoldersAndFiles, showPage } from "./backend";
import { DrawingImage, DrawingText, Path } from "./editCanvasFile";
import { Module } from "./editFile";
import { getImageUrl, NoteFile } from "./supabaseApi";


let selectedFileView: NoteFile;
let selectedFileViewContent: Module[] = [];


export function setViewFileForEditing(file: NoteFile) {
    selectedFileView = file;
    if (Array.isArray(file.fileContent)) {
        selectedFileViewContent = file.fileContent as unknown as Module[];
    } else {
        selectedFileViewContent = [];
    }
    displayFileViewContent();
}

// ========== BUTTON LISTENER (for nonlist Buttons) ==========

const navigateToFolderViewButton = document.getElementById('navigateToFolderViewButton');
if (navigateToFolderViewButton) {
    navigateToFolderViewButton.onclick = () => {
        showPage('folderPage');
        displayFoldersAndFiles();
    };
}

// ========== BUTTON LISTENER END (for nonlist Buttons) ==========

// ========== LIST UI DISPLAY ==========

function displayFileViewContent() {
    const container = document.querySelector('#fileViewListDiv');
    if (!container) return;

    container.innerHTML = "";

    selectedFileViewContent.forEach((module, index) => {
        if (module.type === "drawing") {
            const moduleElement = document.createElement('canvas');
            const drawingDataObj = JSON.parse(module.content);
            moduleElement.width = drawingDataObj.width;
            moduleElement.height = drawingDataObj.height;
            moduleElement.classList.add('moduleCanvas');
            initCanvasDrawing(moduleElement, drawingDataObj.drawingData, drawingDataObj.imageData, drawingDataObj.textData, drawingDataObj.width, drawingDataObj.height);

            container.appendChild(moduleElement);
        } else if (module.type === "image") {
            const imgDataJson = JSON.parse(module.content);
            const imgElement = document.createElement('img');
            imgElement.src = getImageUrl(imgDataJson.imageId);
            imgElement.classList.add('moduleImage');
            imgElement.onload = () => {
                imgElement.style.width = `${imgElement.naturalWidth * imgDataJson.imageRatio}px`;
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

            container.appendChild(moduleElement);
        }
    });

    if (typeof (window as any).lucide !== 'undefined') {
        (window as any).lucide.createIcons();
    }
}

// ========== LIST UI DISPLAY END ==========


// INIT CANVAS DRAWING BEGIN

export function initCanvasDrawing(
    canvas: HTMLCanvasElement,
    drawingData: Path[],
    imageData: DrawingImage[],
    textData: DrawingText[],
    width: number,
    height: number,
) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;


    let currentDrawingData = drawingData;
    let currentImageData = imageData;
    let currentTextData = textData;


    function reloadCanvas() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        if (currentImageData && currentImageData.length > 0) {
            currentImageData.forEach(image => {
                const img = new Image();
                img.src = getImageUrl(image.imageId);
                img.onload = () => {
                    ctx.drawImage(img, image.x, image.y, image.width, image.height);
                };
            });
        }

        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        if (currentDrawingData && currentDrawingData.length > 0) {
            currentDrawingData.forEach(path => {
                if (path.points && path.points.length > 0) {
                    ctx.beginPath();
                    ctx.strokeStyle = path.color || "#000000";
                    ctx.lineWidth = path.width || 2;

                    for (let i = 0; i < path.points.length; i++) {
                        const point = path.points[i];
                        if (i === 0) {
                            ctx.moveTo(point.x, point.y);
                        } else {
                            ctx.lineTo(point.x, point.y);
                        }
                    }
                    ctx.stroke();
                }
            });
        }
        if (currentTextData && currentTextData.length > 0) {
            currentTextData.forEach(text => {
                ctx.fillStyle = text.color;
                ctx.font = `${text.fontSize}px ${text.fontFamily}`;
                ctx.fillText(text.content, text.x, text.y);
            });
        }
    }
    reloadCanvas();
}

// INIT CANVAS DRAWING END