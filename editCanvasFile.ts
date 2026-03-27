import { closePopup, openPopup } from "./backend";
import { addSelectedFileContent, editSelectedFileCanvasDrawing, editSelectedFileCanvasImage, editSelectedFileCanvasText } from "./editFile";
import { getImageUrl, insertImage } from "./supabaseApi";


// obsidian, excalidraw, onenote
export interface Point {
    x: number;
    y: number;
}

export interface Path {
    canvasPathId: string;
    color: string;
    width: number;
    points: Point[];
}
export interface DrawingText {
    canvasTextId: string;
    color: string;
    content: string; // Der eigentliche Text
    fontSize: number;
    fontFamily: string;
    x: number; // Startposition
    y: number;
}
export interface DrawingImage {
    imageId: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

// ========== STATES ==========

// ========== STATES END ==========

// ========== CANVAS LOGIC ==========

export function initCanvasDrawing(
    pencilButton: HTMLButtonElement,
    pencilSettingsButton: HTMLButtonElement,
    selectCanvasButton: HTMLButtonElement,
    addImageCanvasInput: HTMLInputElement,
    editTextCanvasButton: HTMLButtonElement,
    addTextCanvasButton: HTMLButtonElement,
    canvas: HTMLCanvasElement,
    moduleIndex: number,
    drawingData: Path[],
    imageData: DrawingImage[],
    textData: DrawingText[],
    width: number,
    height: number,
) {

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let isTransforming = false;
    let transformingCorner = 1;
    let isDrawing = false;
    let tappedX = 0;
    let tappedY = 0;
    let lastX = 0;
    let lastY = 0;
    let currentPencilColor = "#000000";
    let currentPencilWidth = 2;


    let currentCanvasMode = ""; // pencil, select, transform, text
    let selectedImages: DrawingImage[] = [];
    let selectedTexts: DrawingText[] = [];
    let currentPath: Path | null = null;

    let canvasTextState = "edit"; // edit, add
    let canvasTextIndex = 0;

    let currentDrawingData = drawingData;
    let currentImageData = imageData;
    let currentTextData = textData;

    let currentWidth = width;
    let currentHeight = height;



    pencilButton.onclick = () => {
        if (currentCanvasMode !== "pencil") {
            chooseCanvasMode("pencil");
        } else {
            chooseCanvasMode("");
        }
    }
    pencilSettingsButton.onclick = () => {
        const colorInput = document.getElementById('editPencilColor') as HTMLInputElement;
        const widthInput = document.getElementById('editPencilWidth') as HTMLInputElement;
        const widthText = document.getElementById('editPencilWidthText') as HTMLSpanElement;

        // Setze die aktuellen Werte in die Input-Felder ein
        if (colorInput && widthInput) {
            colorInput.value = currentPencilColor;
            widthInput.value = currentPencilWidth.toString();

            if (widthText) {
                colorInput.style.backgroundColor = currentPencilColor;
                widthText.textContent = "Stiftbreite: " + currentPencilWidth;
            }
            colorInput.oninput = () => {
                colorInput.style.backgroundColor = colorInput.value;
            }
            widthInput.oninput = () => {
                if (widthText) {
                    widthText.textContent = "Stiftbreite: " + widthInput.value;
                }
            };
        }

        const confirmBtn = document.getElementById('editPencilConfirm');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (colorInput && widthInput) {
                    currentPencilColor = colorInput.value;
                    currentPencilWidth = parseInt(widthInput.value);

                    ctx.strokeStyle = currentPencilColor;
                    ctx.lineWidth = currentPencilWidth;
                }
                closePopup('editPencil-modal');
            };
        }

        openPopup('editPencil-modal');
    }
    addImageCanvasInput.onchange = async () => {
        if (addImageCanvasInput.files && addImageCanvasInput.files.length > 0) {
            const file = addImageCanvasInput.files[0];
            const fileExtension = file.name.split('.').pop();
            const imageId = `${crypto.randomUUID()}.${fileExtension}`;

            const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    resolve({ width: img.naturalWidth, height: img.naturalHeight });
                    URL.revokeObjectURL(img.src);
                };
            });

            let imgWidthSize = dimensions.width * (currentWidth * 0.5 / dimensions.width);
            let imgWidthScale = imgWidthSize / dimensions.width;
            let imgHeightSize = dimensions.height * imgWidthScale;

            const newImage: DrawingImage = {
                imageId: imageId,
                x: currentWidth * 0.25,
                y: currentHeight * 0.25,
                width: imgWidthSize,
                height: imgHeightSize,
            };
            currentImageData.push(newImage);
            try {
                await insertImage(file, imageId);

                await editSelectedFileCanvasImage(moduleIndex, currentImageData);
            } catch (error) {
                console.error("Fehler beim Hochladen:", error);
            }

            reloadCanvas();
            addImageCanvasInput.value = "";
        }
    }
    addTextCanvasButton.onclick = () => {
        canvasTextState = "add";
        const editTextTextField = document.getElementById('editTextTextField') as HTMLTextAreaElement;
        editTextTextField.value = "";
        openPopup('editText-modal');
    };
    editTextCanvasButton.onclick = () => {
        if (currentCanvasMode !== "text") {
            chooseCanvasMode("text");
            selectedTexts = [];
        } else {
            chooseCanvasMode("");
        }
    };
    selectCanvasButton.onclick = () => {
        if (currentCanvasMode !== "select") {
            chooseCanvasMode("select");
            selectedImages = [];
        } else {
            chooseCanvasMode("");
        }
    }


    function isNear(x1: number, y1: number, x2: number, y2: number, threshold: number = 10): boolean {
        return Math.abs(x1 - x2) < threshold && Math.abs(y1 - y2) < threshold;
    }
    function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;

        ctx.beginPath();
        // Erste Linie (von oben links nach unten rechts)
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y + size);
        // Zweite Linie (von oben rechts nach unten links)
        ctx.moveTo(x + size, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.stroke();

        ctx.strokeStyle = currentPencilColor;
        ctx.lineWidth = currentPencilWidth;
    }
    function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = currentPencilColor;
        ctx.lineWidth = currentPencilWidth;
    }
    function markSelectedImage() {
        if (!ctx) return;
        if (currentCanvasMode === "transform") {
            let selectedImage = selectedImages[selectedImages.length - 1];
            drawCross(ctx, selectedImage.x, selectedImage.y, 10);
            drawCross(ctx, selectedImage.x + selectedImage.width, selectedImage.y, 10);
            drawCross(ctx, selectedImage.x, selectedImage.y + selectedImage.height, 10);
            drawCross(ctx, selectedImage.x + selectedImage.width, selectedImage.y + selectedImage.height, 10);
            drawCircle(ctx, selectedImage.x + (selectedImage.width / 2), selectedImage.y + (selectedImage.height / 2), 10);
        }
    }
    function chooseCanvasMode(canvasMode: string) {
        pencilButton.classList.remove('active');
        selectCanvasButton.classList.remove('active');
        editTextCanvasButton.classList.remove('active');

        if (canvasMode === "") {
            currentCanvasMode = "";
        } else if (canvasMode === "pencil") {
            currentCanvasMode = "pencil";
            pencilButton.classList.add('active');
        } else if (canvasMode === "select") {
            currentCanvasMode = "select";
            selectCanvasButton.classList.add('active');
        } else if (canvasMode === "transform") {
            currentCanvasMode = "transform";
        } else if (canvasMode === "text") {
            currentCanvasMode = "text";
            editTextCanvasButton.classList.add('active');
        }
    }
    function reloadCanvas() {
        if (!ctx) return;
        ctx.clearRect(0, 0, currentWidth, currentHeight);

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


    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = currentPencilColor;
    ctx.lineWidth = currentPencilWidth;
    canvas.style.touchAction = "none";


    canvas.addEventListener('pointerdown', (e) => {
        if (currentCanvasMode === "pencil") {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];

            currentPath = {
                canvasPathId: crypto.randomUUID(),
                color: ctx.strokeStyle as string,
                width: ctx.lineWidth,
                points: [{ x: e.offsetX, y: e.offsetY }],
            };
        } else if (currentCanvasMode === "select") {
            tappedX = e.offsetX;
            tappedY = e.offsetY;
            [lastX, lastY] = [e.offsetX, e.offsetY];
            currentImageData.forEach(image => {
                if (
                    tappedX >= image.x &&
                    tappedX <= image.x + image.width &&
                    tappedY >= image.y &&
                    tappedY <= image.y + image.height
                ) {
                    selectedImages.push(image);
                }
            });
        } else if (currentCanvasMode === "transform") {
            let selectedImage = selectedImages[selectedImages.length - 1];
            tappedX = e.offsetX;
            tappedY = e.offsetY;
            [lastX, lastY] = [e.offsetX, e.offsetY];

            if (isNear(e.offsetX, e.offsetY, selectedImage.x, selectedImage.y)) {
                transformingCorner = 1;
                isTransforming = true;
            } else if (isNear(e.offsetX, e.offsetY, selectedImage.x + selectedImage.width, selectedImage.y)) {
                transformingCorner = 2;
                isTransforming = true;
            } else if (isNear(e.offsetX, e.offsetY, selectedImage.x + selectedImage.width, selectedImage.y + selectedImage.height)) {
                transformingCorner = 3;
                isTransforming = true;
            } else if (isNear(e.offsetX, e.offsetY, selectedImage.x, selectedImage.y + selectedImage.height)) {
                transformingCorner = 4;
                isTransforming = true;
            } else if (isNear(e.offsetX, e.offsetY, selectedImage.x + selectedImage.width / 2, selectedImage.y + selectedImage.height / 2)) {
                transformingCorner = 5;
                isTransforming = true;
            }
        } else if (currentCanvasMode === "text") {
            tappedX = e.offsetX;
            tappedY = e.offsetY;
            [lastX, lastY] = [e.offsetX, e.offsetY];
            currentTextData.forEach(text => {
                // Setze die Schriftart, damit measureText das korrekte Ergebnis liefert
                ctx.font = `${text.fontSize}px ${text.fontFamily}`;
                let textWidth = ctx.measureText(text.content).width;
                let textHeight = text.fontSize; // ungefähre Höhe basierend auf der Schriftgröße

                // WICHTIG: standardmäßig ist textBaseline "alphabetic",
                // was bedeutet, dass text.y die untere Linie des Textes ist.
                // Der Text befindet sich also auf der Y-Achse zwischen (y - Höhe) und y.
                if (
                    tappedX >= text.x &&
                    tappedX <= text.x + textWidth &&
                    tappedY >= text.y - textHeight &&
                    tappedY <= text.y
                ) {
                    selectedTexts.push(text);
                }
            });
        }
    });
    canvas.addEventListener('pointermove', (e) => {
        if (currentCanvasMode === "pencil") {
            if (!isDrawing) return;

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();

            [lastX, lastY] = [e.offsetX, e.offsetY];

            if (currentPath) {
                currentPath.points.push({ x: e.offsetX, y: e.offsetY });
            }
        } else if (currentCanvasMode === "select") {
            let xDiff = e.offsetX - lastX;
            let yDiff = e.offsetY - lastY;
            if (selectedImages.length > 0) {
                const lastImage = selectedImages[selectedImages.length - 1];
                lastImage.x += xDiff;
                lastImage.y += yDiff;
            }
            [lastX, lastY] = [e.offsetX, e.offsetY];
            reloadCanvas();
        } else if (currentCanvasMode === "transform") {
            if (!isTransforming) return;
            let selectedImage = selectedImages[selectedImages.length - 1];
            const aspectRatio = selectedImage.width / selectedImage.height;
            let xDiff = e.offsetX - lastX;

            if (transformingCorner === 1) { // Oben links
                const oldWidth = selectedImage.width;
                const oldHeight = selectedImage.height;
                selectedImage.width -= xDiff;
                selectedImage.height = selectedImage.width / aspectRatio;
                selectedImage.x += (oldWidth - selectedImage.width);
                selectedImage.y += (oldHeight - selectedImage.height);
            } else if (transformingCorner === 2) { // Oben rechts
                const oldHeight = selectedImage.height;
                selectedImage.width += xDiff;
                selectedImage.height = selectedImage.width / aspectRatio;
                selectedImage.y -= (selectedImage.height - oldHeight);
            } else if (transformingCorner === 3) { // Unten rechts
                selectedImage.width += xDiff;
                selectedImage.height = selectedImage.width / aspectRatio;
            } else if (transformingCorner === 4) { // Unten links
                const oldWidth = selectedImage.width;
                selectedImage.width -= xDiff;
                selectedImage.height = selectedImage.width / aspectRatio;
                selectedImage.x += (oldWidth - selectedImage.width);
            } else if (transformingCorner === 5) { // Mitte
                // CAN BE CHANGED TO SELECT PICTURE AND MOVE AND SCALE IN ONE MODE
            }

            [lastX, lastY] = [e.offsetX, e.offsetY];
            reloadCanvas();
        } else if (currentCanvasMode === "text") {
            let xDiff = e.offsetX - lastX;
            let yDiff = e.offsetY - lastY;
            if (selectedTexts.length > 0) {
                const lastText = selectedTexts[selectedTexts.length - 1];
                lastText.x += xDiff;
                lastText.y += yDiff;
            }
            [lastX, lastY] = [e.offsetX, e.offsetY];
            reloadCanvas();
        }
    });

    canvas.addEventListener('pointerup', () => {
        pointerUp();
    });
    canvas.addEventListener('pointerleave', () => {
        pointerUp();
    });
    canvas.addEventListener('pointercancel', () => {
        pointerUp();
    });
    function pointerUp() {
        if (currentCanvasMode === "pencil") {
            if (isDrawing) {
                isDrawing = false;

                if (currentPath) {
                    currentDrawingData.push(currentPath);
                    editSelectedFileCanvasDrawing(moduleIndex, currentDrawingData);

                    currentPath = null;
                }
            }
        } else if (currentCanvasMode === "select") {
            if (selectedImages.length > 0) {
                let selectedImage = selectedImages[selectedImages.length - 1]; // FAKE; NOT NECESSARY

                const index = currentImageData.findIndex(img => img.imageId === selectedImage.imageId);
                if (index !== -1) {
                    currentImageData[index] = selectedImage;
                } // FAKE; NOT NECESSARY

                editSelectedFileCanvasImage(moduleIndex, currentImageData);
                chooseCanvasMode("transform");
                markSelectedImage();
            }
        } else if (currentCanvasMode === "transform") {
            if (selectedImages.length > 0) {
                let selectedImage = selectedImages[selectedImages.length - 1];

                const index = currentImageData.findIndex(img => img.imageId === selectedImage.imageId);
                if (index !== -1) {
                    currentImageData[index] = selectedImage;
                }
                if (transformingCorner == 5) {
                    currentImageData.splice(index, 1);
                }

                editSelectedFileCanvasImage(moduleIndex, currentImageData);
                chooseCanvasMode("");
                isTransforming = false;
                reloadCanvas();
            }
        } else if (currentCanvasMode === "text") {
            if (selectedTexts.length > 0) {
                let selectedText = selectedTexts[selectedTexts.length - 1];

                const index = currentTextData.findIndex(text => text.canvasTextId === selectedText.canvasTextId);
                if (index !== -1) {
                    currentTextData[index] = selectedText;
                }

                editSelectedFileCanvasText(moduleIndex, currentTextData);
                chooseCanvasMode("");

                if (selectedTexts.length > 0 && Math.abs(tappedX - lastX) < 10 && Math.abs(tappedY - lastY) < 10) {
                    const editTextTextField = document.getElementById('editTextTextField') as HTMLTextAreaElement;
                    const fontFamily = document.getElementById('editTextFontFamily') as HTMLSelectElement;
                    const fontSize = document.getElementById('editTextFontSize') as HTMLInputElement;
                    const color = document.getElementById('editTextFontColor') as HTMLInputElement;
                    editTextTextField.value = selectedText.content;
                    fontFamily.value = selectedText.fontFamily;
                    fontSize.value = selectedText.fontSize.toString();
                    color.value = selectedText.color;
                    canvasTextState = "edit";
                    canvasTextIndex = index;
                    openPopup('editText-modal');
                }
            }
        }
    }


    const editTextConfirmBtn = document.getElementById('editTextConfirm');
    if (editTextConfirmBtn) {
        editTextConfirmBtn.onclick = () => {
            if (canvasTextState === "add") {
                const editTextTextField = document.getElementById('editTextTextField') as HTMLTextAreaElement;
                const fontFamily = document.getElementById('editTextFontFamily') as HTMLSelectElement;
                const fontSize = document.getElementById('editTextFontSize') as HTMLInputElement;
                const color = document.getElementById('editTextFontColor') as HTMLInputElement;
                closePopup('editText-modal');
                currentTextData.push({
                    canvasTextId: crypto.randomUUID(),
                    color: color.value,
                    content: editTextTextField.value,
                    fontSize: parseInt(fontSize.value),
                    fontFamily: fontFamily.value,
                    x: 100,
                    y: 100,
                });
                editSelectedFileCanvasText(moduleIndex, currentTextData);
                reloadCanvas();
            } else if (canvasTextState === "edit") {
                const editTextTextField = document.getElementById('editTextTextField') as HTMLTextAreaElement;
                const fontFamily = document.getElementById('editTextFontFamily') as HTMLSelectElement;
                const fontSize = document.getElementById('editTextFontSize') as HTMLInputElement;
                const color = document.getElementById('editTextFontColor') as HTMLInputElement;
                closePopup('editText-modal');
                currentTextData[canvasTextIndex].color = color.value;
                currentTextData[canvasTextIndex].content = editTextTextField.value;
                currentTextData[canvasTextIndex].fontSize = parseInt(fontSize.value);
                currentTextData[canvasTextIndex].fontFamily = fontFamily.value;
                editSelectedFileCanvasText(moduleIndex, currentTextData);
                reloadCanvas();
            }
        };
    }
    const editTextDeclineBtn = document.getElementById('editTextDecline');
    if (editTextDeclineBtn) {
        editTextDeclineBtn.onclick = () => {
            closePopup('editText-modal');
        }
    }
    const editTextDeleteBtn = document.getElementById('editTextDelete');
    if (editTextDeleteBtn) {
        editTextDeleteBtn.onclick = () => {
            if (canvasTextState === "edit") {
                closePopup('editText-modal');
                currentTextData.splice(canvasTextIndex, 1);
                editSelectedFileCanvasText(moduleIndex, currentTextData);
                reloadCanvas();
            }
        }
    }
}

// ========== CANVAS LOGIC END ==========

// ========== BUTTON LISTENER (for nonlist Buttons) ==========

const addDrawingModuleConfirmBtn = document.getElementById('addDrawingModuleConfirm');
if (addDrawingModuleConfirmBtn) {
    addDrawingModuleConfirmBtn.onclick = () => {
        const addDrawingWidthModuleTextField = document.getElementById('addDrawingWidthModuleTextField') as HTMLTextAreaElement;
        const addDrawingHeightModuleTextField = document.getElementById('addDrawingHeightModuleTextField') as HTMLTextAreaElement;
        closePopup('addModuleDrawing-modal');
        addSelectedFileContent({
            type: "drawing",
            content: JSON.stringify({
                width: addDrawingWidthModuleTextField.value,
                height: addDrawingHeightModuleTextField.value,
                drawingData: [],
                imageData: [],
                textData: [],
            })
        });
    };
}
const addDrawingModuleDeclineBtn = document.getElementById('addDrawingModuleDecline');
if (addDrawingModuleDeclineBtn) {
    addDrawingModuleDeclineBtn.onclick = () => {
        closePopup('addModuleDrawing-modal');
    };
}

// ========== BUTTON LISTENER END (for nonlist Buttons) ==========