import { createClient } from '@supabase/supabase-js';


// TODO: Ersetze diese Werte mit deinen tatsächlichen Supabase-Anmeldedaten
const supabaseUrl = 'https://aumhffgfcmvfottklytp.supabase.co';
const supabaseAnonKey = 'sb_publishable_PnpuVzjpx0Wy8uAE4_486Q_kbSzug3f';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


export interface Folder {
    folderId: string;
    folderUserId: string;
    parentFolderId: string;
    folderName: string;
}
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface NoteFile {
    fileId: string;
    fileUserId: string;
    parentFolderId: string;
    fileName: string;
    fileContent: Json;
}


// Folder Functions
export async function getFolders(authUser: string) {
    const { data, error } = await supabase
        .from('folder')
        .select('*')
        .eq('folderUserId', authUser);

    if (error) {
        console.error('Fehler beim Laden der Ordner:', error.message);
        throw error;
    }

    return data as Folder[];
}

export async function insertFolder(folder: Folder) {
    const { data, error } = await supabase
        .from('folder')
        .insert([folder])
        .select();

    if (error) {
        console.error('Fehler beim Erstellen des Ordners:', error.message);
        throw error;
    }

    return data ? data[0] as Folder : null;
}

export async function deleteFolder(folderId: string) {
    const { error } = await supabase
        .from('folder')
        .delete()
        .eq('folderId', folderId);

    if (error) {
        console.error('Fehler beim Löschen des Ordners:', error.message);
        throw error;
    }

    return true;
}

export async function updateFolder(folder: Folder) {
    const { data, error } = await supabase
        .from('folder')
        .update(folder)
        .eq('folderId', folder.folderId)
        .select();

    if (error) {
        console.error('Fehler beim Aktualisieren des Ordners:', error.message);
        throw error;
    }

    return data ? data[0] as Folder : null;
}
// Folder Functions End

// File Functions
export async function getFiles(authUser: string) {
    const { data, error } = await supabase
        .from('noteFile')
        .select('*')
        .eq('fileUserId', authUser);

    if (error) {
        console.error('Fehler beim Laden der Dateien:', error.message);
        throw error;
    }

    return data as NoteFile[];
}

export async function insertFile(file: NoteFile) {
    const { data, error } = await supabase
        .from('noteFile')
        .insert([file])
        .select();

    if (error) {
        console.error('Fehler beim Erstellen der Datei:', error.message);
        throw error;
    }

    return data ? data[0] as NoteFile : null;
}

export async function deleteFile(fileId: string) {
    const { error } = await supabase
        .from('noteFile')
        .delete()
        .eq('fileId', fileId);

    if (error) {
        console.error('Fehler beim Löschen der Datei:', error.message);
        throw error;
    }

    return true;
}

export async function updateFile(file: NoteFile) {
    const { data, error } = await supabase
        .from('noteFile')
        .update(file)
        .eq('fileId', file.fileId)
        .select();

    if (error) {
        console.error('Fehler beim Aktualisieren der Datei:', error.message);
        throw error;
    }

    return data ? data[0] as NoteFile : null;
}
// File Functions End

// Image Functions

export function getImageUrl(imagePath: string) {
    const { data } = supabase
        .storage
        .from('filePictures') // z.B. 'images'
        .getPublicUrl(imagePath); // imagePath ist der Pfad, unter dem das Bild im Bucket liegt
    return data.publicUrl;
}
export async function downloadImage(imagePath: string) {
    const { data, error } = await supabase
        .storage
        .from('filePictures')
        .download(imagePath);
    if (error) {
        console.error('Fehler beim Herunterladen des Bildes:', error.message);
        throw error;
    }
    // data ist hier ein 'Blob', aus dem du z.B. eine ObjectURL machen kannst:
    // const url = URL.createObjectURL(data);
    return data;
}

export async function insertImage(file: File | Blob, imagePath: string) {
    const { data, error } = await supabase
        .storage
        .from('filePictures')
        .upload(imagePath, file, {
            cacheControl: '3600',
            upsert: true // Setze auf true, falls du ein existierendes Bild mit gleichem Namen überschreiben willst
        });

    if (error) {
        console.error('Fehler beim Hochladen des Bildes:', error.message);
        throw error;
    }

    return data;
}


export async function deleteImage(imageId: string) { }

// Image Functions End